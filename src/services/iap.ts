import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';

// Product IDs must match what's registered in App Store Connect
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

export async function purchasePlan(productId: string): Promise<string> {
  if (Platform.OS !== 'ios') {
    throw new Error('IAP only available on iOS');
  }
  await initIAP();

  return new Promise((resolve, reject) => {
    InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        if (!results || results.length === 0) return;
        for (const purchase of results) {
          if (!purchase.acknowledged) {
            try {
              await InAppPurchases.finishTransactionAsync(purchase, true);
              resolve(purchase.transactionReceipt || '');
            } catch (e) {
              reject(e);
            }
            return;
          }
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        reject(new Error('Purchase cancelled'));
      } else if (responseCode === InAppPurchases.IAPResponseCode.DEFERRED) {
        // Purchase is deferred (e.g., Ask to Buy). Not an error.
        reject(new Error('Purchase deferred — awaiting approval'));
      } else {
        reject(new Error(`Purchase failed (code: ${responseCode}, error: ${errorCode})`));
      }
    });

    InAppPurchases.purchaseItemAsync(productId).catch(reject);
  });
}

export async function disconnectIAP(): Promise<void> {
  if (!iapConnected) return;
  try {
    await InAppPurchases.disconnectAsync();
    iapConnected = false;
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
