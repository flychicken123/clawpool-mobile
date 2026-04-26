import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';

const PURCHASE_TIMEOUT_MS = 45000;

// Product IDs must match what's registered in App Store Connect
// Bundle ID is com.clawpool.app, so product IDs follow the same prefix
export const PRODUCT_IDS = {
  basic: 'org.hihired.clawpool.basic',
  pro: 'org.hihired.clawpool.pro',
};

export type IAPProduct = {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
};

let iapConnected = false;
let purchaseListenerRegistered = false;
let pendingPurchase:
  | {
      productId: string;
      resolve: (receipt: string) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  | null = null;

export async function initIAP(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  if (iapConnected) return;
  try {
    await InAppPurchases.connectAsync();
    iapConnected = true;
  } catch (e: any) {
    // Already connected or unavailable
    if (e?.message?.includes('already connected')) {
      iapConnected = true;
    } else {
      throw e;
    }
  }
}

export async function getProducts(): Promise<InAppPurchases.IAPItemDetails[]> {
  if (Platform.OS !== 'ios') return [];
  await initIAP();
  const { results, responseCode } = await InAppPurchases.getProductsAsync(
    Object.values(PRODUCT_IDS)
  );
  if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
    throw new Error(`Failed to get products: ${responseCode}`);
  }
  return results ?? [];
}

function clearPendingPurchase() {
  if (pendingPurchase?.timeout) {
    clearTimeout(pendingPurchase.timeout);
  }
  pendingPurchase = null;
}

function ensurePurchaseListener() {
  if (purchaseListenerRegistered || Platform.OS !== 'ios') return;

  InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
    const current = pendingPurchase;
    if (!current) return;

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      if (!results || results.length === 0) return;

      const matchedPurchase = results.find((purchase) => purchase.productId === current.productId);

      if (!matchedPurchase) {
        return;
      }

      try {
        await InAppPurchases.finishTransactionAsync(matchedPurchase, false);
        const receipt = matchedPurchase.transactionReceipt || '';
        clearPendingPurchase();
        if (!receipt) {
          current.reject(new Error('Purchase completed but no receipt was returned'));
          return;
        }
        current.resolve(receipt);
      } catch (e: any) {
        clearPendingPurchase();
        current.reject(e instanceof Error ? e : new Error(e?.message || 'Failed to finish transaction'));
      }
      return;
    }

    if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      clearPendingPurchase();
      current.reject(new Error('Purchase cancelled'));
      return;
    }

    if (responseCode === InAppPurchases.IAPResponseCode.DEFERRED) {
      clearPendingPurchase();
      current.reject(new Error('Purchase deferred, awaiting approval'));
      return;
    }

    clearPendingPurchase();
    current.reject(new Error(`Purchase failed (code: ${responseCode}, error: ${errorCode ?? 'unknown'})`));
  });

  purchaseListenerRegistered = true;
}

export async function purchasePlan(productId: string): Promise<string> {
  if (Platform.OS !== 'ios') {
    throw new Error('IAP only available on iOS');
  }
  await initIAP();
  ensurePurchaseListener();

  if (pendingPurchase) {
    throw new Error('Another purchase is already in progress');
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingPurchase?.productId === productId) {
        clearPendingPurchase();
        reject(new Error('Purchase timed out. Please try again.'));
      }
    }, PURCHASE_TIMEOUT_MS);

    pendingPurchase = { productId, resolve, reject, timeout };

    InAppPurchases.purchaseItemAsync(productId).catch((err: any) => {
      if (pendingPurchase?.productId === productId) {
        clearPendingPurchase();
      }
      reject(err instanceof Error ? err : new Error(err?.message || 'Failed to start purchase'));
    });
  });
}

export async function disconnectIAP(): Promise<void> {
  clearPendingPurchase();
  if (!iapConnected) return;
  try {
    await InAppPurchases.disconnectAsync();
    iapConnected = false;
    purchaseListenerRegistered = false;
  } catch {
    // Ignore disconnect errors
  }
}

/** Map a productId back to a plan name */
export function productIdToPlan(productId: string): string | null {
  const map: Record<string, string> = {
    [PRODUCT_IDS.basic]: 'basic',
    [PRODUCT_IDS.pro]: 'pro',
  };
  return map[productId] ?? null;
}
