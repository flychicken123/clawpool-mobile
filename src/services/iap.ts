import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';

// App Store sandbox/review can take noticeably longer than production to
// deliver StoreKit purchase callbacks. Do not surface a timeout immediately
// after Apple's success sheet; first recover the receipt from purchase history.
const PURCHASE_TIMEOUT_MS = 10 * 60 * 1000;

// Product IDs must match what's registered in App Store Connect
// Bundle ID is com.clawpool.app, so product IDs follow the same prefix
export const PRODUCT_IDS = {
  basic: 'org.hihired.clawpool.basic',
  pro: 'org.hihired.clawpool.pro',
} as const;

export type IAPProduct = {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
};

export function normalizePlanName(planName: string | null | undefined): 'free' | 'basic' | 'pro' | '' {
  const normalized = String(planName || '').trim().toLowerCase();
  if (normalized === 'free' || normalized === 'basic' || normalized === 'pro') {
    return normalized;
  }
  return '';
}

let iapConnected = false;
let purchaseListenerRegistered = false;
let pendingPurchase:
  | {
      productId: string;
      resolve: (receipt: string) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout> | null;
    }
  | null = null;

const pendingTransactionsByProduct: Record<string, any> = {};

export async function initIAP(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  if (iapConnected) {
    ensurePurchaseListener();
    return;
  }
  try {
    await InAppPurchases.connectAsync();
    iapConnected = true;
    ensurePurchaseListener();
  } catch (e: any) {
    // Already connected or unavailable
    if (e?.message?.includes('already connected')) {
      iapConnected = true;
      ensurePurchaseListener();
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

function getReceiptFromPurchase(purchase: any): string {
  return purchase?.transactionReceipt || '';
}

function resolveCompletedPurchase(current: NonNullable<typeof pendingPurchase>, purchase: any): boolean {
  const receipt = getReceiptFromPurchase(purchase);
  if (!receipt) return false;
  pendingTransactionsByProduct[current.productId] = purchase;
  clearPendingPurchase();
  current.resolve(receipt);
  return true;
}

async function recoverReceiptFromPurchaseHistory(productId: string): Promise<boolean> {
  const current = pendingPurchase;
  if (!current || current.productId !== productId) return false;

  try {
    const { results, responseCode } = await InAppPurchases.getPurchaseHistoryAsync();
    if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results?.length) return false;

    const matchedPurchase = [...results]
      .filter((purchase) => purchase.productId === productId && getReceiptFromPurchase(purchase))
      .sort((a, b) => (b.purchaseTime || 0) - (a.purchaseTime || 0))[0];

    if (!matchedPurchase) return false;
    return resolveCompletedPurchase(current, matchedPurchase);
  } catch (e: any) {
    console.warn('[IAP] Failed to recover receipt from purchase history:', e?.message);
    return false;
  }
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

      if (!resolveCompletedPurchase(current, matchedPurchase)) {
        clearPendingPurchase();
        current.reject(new Error('Purchase completed but no receipt was returned'));
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
    const timeout = setTimeout(async () => {
      if (pendingPurchase?.productId !== productId) return;
      const recovered = await recoverReceiptFromPurchaseHistory(productId);
      if (recovered) return;
      if (pendingPurchase?.productId === productId) {
        clearPendingPurchase();
        reject(new Error('Purchase is still processing with the App Store. Please wait a moment, then reopen Plans if your subscription does not update.'));
      }
    }, PURCHASE_TIMEOUT_MS);

    pendingPurchase = { productId, resolve, reject, timeout };

    InAppPurchases.purchaseItemAsync(productId)
      .then(() => {
        if (pendingPurchase?.productId === productId) {
          recoverReceiptFromPurchaseHistory(productId);
        }
      })
      .catch((err: any) => {
        if (pendingPurchase?.productId === productId) {
          clearPendingPurchase();
        }
        reject(err instanceof Error ? err : new Error(err?.message || 'Failed to start purchase'));
      });
  });
}

export async function finishPurchasedTransaction(productId: string): Promise<void> {
  const purchase = pendingTransactionsByProduct[productId];
  if (!purchase) return;

  await InAppPurchases.finishTransactionAsync(purchase, false);
  delete pendingTransactionsByProduct[productId];
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
