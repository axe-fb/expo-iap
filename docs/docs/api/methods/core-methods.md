---
title: Core Methods
sidebar_label: Core Methods
sidebar_position: 1
---

import AdFitTopFixed from "@site/src/uis/AdFitTopFixed"; 

# Core Methods

<AdFitTopFixed />

This section covers the core methods available in expo-iap for managing in-app purchases.

## 🚨 Important Platform Differences

> **Critical for Cross-Platform Development:** iOS and Android have fundamental differences in their purchase APIs.

### Key Differences:
- **iOS**: Can only purchase **one product at a time** (single SKU)
- **Android**: Can purchase **multiple products at once** (array of SKUs)

This difference exists because:
- iOS App Store processes purchases individually
- Google Play Store supports batch purchases

| Method | iOS | Android | Cross-Platform Solution |
| --- | --- | --- | --- |
| `requestPurchase()` | Uses `sku: string` | Uses `skus: string[]` | Platform-specific handling required |
| `requestSubscription()` | Uses `sku: string` | Uses `skus: string[]` + `subscriptionOffers` | Platform-specific handling required |

**💡 Best Practice:** Always check the platform before calling purchase methods:

```tsx
import {Platform} from 'react-native';

if (Platform.OS === 'ios') {
  // iOS: single product
  await requestPurchase({
    request: {sku: productId}
  });
} else if (Platform.OS === 'android') {
  // Android: array of products
  await requestPurchase({
    request: {skus: [productId]}
  });
}
```

**🎯 Recommended Approach:** For the best developer experience, use the [ `useIAP` hook](/docs/api/use-iap) which handles platform differences automatically and provides a cleaner callback-based API.

## initConnection()

Initializes the connection to the store. This method must be called before any other store operations.

```tsx
import {initConnection} from 'expo-iap';

const initialize = async () => {
  try {
    await initConnection();
    console.log('Store connection initialized');
  } catch (error) {
    console.error('Failed to initialize connection:', error);
  }
};
```

**Returns:** `Promise<boolean>`

**Note:** When using the `useIAP` hook, connection is automatically managed.

## endConnection()

Ends the connection to the store and cleans up resources.

```tsx
import {endConnection} from 'expo-iap';

const cleanup = async () => {
  try {
    await endConnection();
    console.log('Store connection ended');
  } catch (error) {
    console.error('Failed to end connection:', error);
  }
};
```

**Returns:** `Promise<void>`

**Note:** When using the `useIAP` hook, connection cleanup is automatic.

## getStorefront()

Gets the current storefront (country code) for the user's App Store account (iOS only).

```tsx
import {getStorefront} from 'expo-iap';

const fetchStorefront = async () => {
  try {
    const countryCode = await getStorefront();
    console.log('User storefront:', countryCode); // e.g., 'US', 'GB', 'JP'
    return countryCode;
  } catch (error) {
    console.error('Failed to get storefront:', error);
  }
};
```

**Returns:** `Promise<string | null>` - Returns the ISO country code of the user's App Store account, or null if unavailable.

**Platform:** iOS only

**Note:** This is useful for region-specific pricing, content, or features.

## getAppTransaction()

Gets app transaction information for iOS apps (iOS 16.0+). AppTransaction represents the initial purchase that unlocked the app, useful for premium apps or apps that were previously paid.

```tsx
import {getAppTransaction} from 'expo-iap';

const fetchAppTransaction = async () => {
  try {
    const appTransaction = await getAppTransaction();
    if (appTransaction) {
      console.log('App Transaction ID:', appTransaction.appTransactionID);
      console.log('Original Purchase Date:', new Date(appTransaction.originalPurchaseDate));
      console.log('Device Verification:', appTransaction.deviceVerification);
    } else {
      console.log('No app transaction found (app may be free)');
    }
  } catch (error) {
    console.error('Failed to get app transaction:', error);
  }
};
```

**Returns:** `Promise<AppTransactionIOS | null>` - Returns the app transaction information or null if not available.

**Platform:** iOS 16.0+ only

**AppTransactionIOS Interface:**
```typescript
interface AppTransactionIOS {
  appTransactionID: string;
  originalAppAccountToken?: string;
  originalPurchaseDate: number; // milliseconds since epoch
  deviceVerification: string;
  deviceVerificationNonce: string;
}
```

**Note:** This is useful for verifying that a user legitimately purchased your app. The device verification data can be sent to your server for validation.

## getProducts()

Fetches product information from the store.

```tsx
import {getProducts} from 'expo-iap';

const fetchProducts = async () => {
  try {
    const products = await getProducts([
      'com.example.product1',
      'com.example.product2',
    ]);

    console.log('Products:', products);
    return products;
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }
};
```

**Parameters:**

* `skus` (string[]): Array of product IDs to fetch

**Returns:** `Promise<Product[]>`

[**Product Interface**](../types.md#Product)

## getSubscriptions()

Fetches subscription product information from the store.

```tsx
import {getSubscriptions} from 'expo-iap';

const fetchSubscriptions = async () => {
  try {
    const subscriptions = await getSubscriptions([
      'com.example.premium_monthly',
      'com.example.premium_yearly',
    ]);

    console.log('Subscriptions:', subscriptions);
    return subscriptions;
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
  }
};
```

**Parameters:**

* `skus` (string[]): Array of subscription IDs to fetch

**Returns:** `Promise<SubscriptionProduct[]>`

## requestPurchase()

Initiates a purchase request for a product.

> **⚠️ Platform Differences:** 
> - **iOS**: Can only purchase one product at a time (uses `sku: string`)
> - **Android**: Can purchase multiple products at once (uses `skus: string[]`)

### Platform-Specific Usage (Recommended)

```tsx
import {requestPurchase, Platform} from 'expo-iap';

const buyProduct = async (productId: string) => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: single product purchase
      await requestPurchase({
        request: {
          sku: productId,
        },
        type: 'inapp',
      });
    } else if (Platform.OS === 'android') {
      // Android: array of products (even for single purchase)
      await requestPurchase({
        request: {
          skus: [productId],
        },
        type: 'inapp',
      });
    }
    // Purchase result will be delivered via purchase listeners
  } catch (error) {
    console.error('Purchase request failed:', error);
  }
};
```

### Detailed Platform Examples

#### iOS Only

```tsx
await requestPurchase({
  request: {
    sku: productId,
    quantity: 1,
    appAccountToken: 'user-account-token',
  },
  type: 'inapp',
});
```

#### Android Only

```tsx
await requestPurchase({
  request: {
    skus: [productId],
    obfuscatedAccountIdAndroid: 'user-account-id',
    obfuscatedProfileIdAndroid: 'user-profile-id',
  },
  type: 'inapp',
});
```

**Parameters:**

* `params` (object):
  + `request` (object): Purchase request configuration
    - **iOS**: `sku` (string) - Product ID to purchase
    - **Android**: `skus` (string[]) - Array of product IDs to purchase
    - **Cross-platform**: Include both `sku` and `skus` for compatibility
    - `quantity?` (number, iOS only): Purchase quantity
    - `appAccountToken?` (string, iOS only): User identifier for receipt validation
    - `obfuscatedAccountIdAndroid?` (string, Android only): Obfuscated account ID
    - `obfuscatedProfileIdAndroid?` (string, Android only): Obfuscated profile ID
    - `isOfferPersonalized?` (boolean, Android only): Whether offer is personalized
  + `type?` ('inapp' | 'subs'): Purchase type, defaults to 'inapp'

**Returns:** `Promise<ProductPurchase | ProductPurchase[] | SubscriptionPurchase | SubscriptionPurchase[] | void>`

**Note:** The actual purchase result is delivered through purchase listeners or the `useIAP` hook callbacks, not as a return value.

## requestSubscription()

Initiates a subscription purchase request.

> **⚠️ Platform Differences:** 
> - **iOS**: Can only purchase one subscription at a time (uses `sku: string`)
> - **Android**: Can purchase multiple subscriptions at once (uses `skus: string[]` with `subscriptionOffers`)

### Platform-Specific Usage (Recommended)

```tsx
import {requestPurchase, Platform} from 'expo-iap';

const buySubscription = async (subscriptionId: string, subscription?: any) => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: single subscription purchase
      await requestPurchase({
        request: {
          sku: subscriptionId,
        },
        type: 'subs',
      });
    } else if (Platform.OS === 'android') {
      // Android: handle subscription offers
      const subscriptionOffers = subscription?.subscriptionOfferDetails?.map(
        (offer: any) => ({
          sku: subscriptionId,
          offerToken: offer.offerToken,
        })
      ) || [{sku: subscriptionId, offerToken: ''}];

      await requestPurchase({
        request: {
          skus: [subscriptionId],
          subscriptionOffers,
        },
        type: 'subs',
      });
    }
    // Purchase result will be delivered via purchase listeners
  } catch (error) {
    console.error('Subscription request failed:', error);
  }
};
```

### Legacy API (Deprecated)

```tsx
import {requestSubscription} from 'expo-iap';

const buySubscription = async (subscriptionId: string) => {
  try {
    await requestSubscription({
      request: {
        sku: subscriptionId,
        skus: [subscriptionId],
        subscriptionOffers: [
          {
            sku: subscriptionId,
            offerToken: 'offer_token_from_product',
          },
        ],
      },
    });
  } catch (error) {
    console.error('Subscription request failed:', error);
  }
};
```

**Parameters:**

* `params` (object):
  + `request` (object): Subscription request configuration
    - **iOS**: `sku` (string) - Subscription ID to purchase
    - **Android**: `skus` (string[]) - Array of subscription IDs to purchase
    - **Android**: `subscriptionOffers` (array) - Android subscription offers (required, can be empty)
    - **Cross-platform**: Include both `sku` and `skus` for compatibility
    - `appAccountToken?` (string, iOS only): User identifier
    - `obfuscatedAccountIdAndroid?` (string, Android only): Obfuscated account ID
    - `obfuscatedProfileIdAndroid?` (string, Android only): Obfuscated profile ID
    - `purchaseTokenAndroid?` (string, Android only): Token for subscription replacement
    - `replacementModeAndroid?` (number, Android only): Replacement mode for subscription updates

**Returns:** `Promise<SubscriptionPurchase | SubscriptionPurchase[] | null | void>`

> **💡 Recommendation:** Use `requestPurchase()` with `type: 'subs'` instead of `requestSubscription()` for new code.

## finishTransaction()

Completes a purchase transaction. Must be called after successful receipt validation.

```tsx
import {finishTransaction} from 'expo-iap';

const completePurchase = async (purchase) => {
  try {
    // Validate receipt on your server first
    const isValid = await validateReceiptOnServer(purchase);

    if (isValid) {
      // Grant purchase to user
      await grantPurchaseToUser(purchase);

      // Finish the transaction
      await finishTransaction({
        purchase,
        isConsumable: true, // Set to true for consumable products
      });

      console.log('Transaction completed');
    }
  } catch (error) {
    console.error('Failed to finish transaction:', error);
  }
};
```

**Parameters:**

* `params` (object):
  + `purchase` (Purchase): The purchase object to finish
  + `isConsumable?` (boolean): Whether the product is consumable (Android)

**Returns:** `Promise<PurchaseResult | boolean>`

## getAvailablePurchases()

Retrieves available purchases for restoration (non-consumable products and subscriptions).

```tsx
import {getAvailablePurchases} from 'expo-iap';

const restorePurchases = async () => {
  try {
    const purchases = await getAvailablePurchases();

    for (const purchase of purchases) {
      // Validate and restore each purchase
      const isValid = await validateReceiptOnServer(purchase);
      if (isValid) {
        await grantPurchaseToUser(purchase);
      }
    }

    console.log('Purchases restored');
  } catch (error) {
    console.error('Failed to restore purchases:', error);
  }
};
```

**Returns:** `Promise<Purchase[]>`

## getPurchaseHistory()

Retrieves purchase history for the user.

```tsx
import {getPurchaseHistory} from 'expo-iap';

const fetchPurchaseHistory = async () => {
  try {
    const history = await getPurchaseHistory();
    console.log('Purchase history:', history);
    return history;
  } catch (error) {
    console.error('Failed to fetch purchase history:', error);
  }
};
```

**Returns:** `Promise<Purchase[]>`

## deepLinkToSubscriptions()

Opens the platform-specific subscription management UI.

```tsx
import {deepLinkToSubscriptions} from 'expo-iap';

const openSubscriptionSettings = () => {
  try {
    deepLinkToSubscriptions();
  } catch (error) {
    console.error('Failed to open subscription settings:', error);
  }
};
```

**Returns:** `Promise<void>`

## getStorefront()

Return the storefront in ISO 3166-1 alpha-2 or ISO 3166-1 alpha-3 format

```tsx
import {getStorefront} from 'expo-iap';

const storeFront = await getStorefront()
```

**Returns:** `Promise<string>`

## Purchase Interface

```tsx
interface Purchase {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  purchaseToken?: string;
  
  // iOS-specific properties
  originalTransactionDateIos?: number;
  originalTransactionIdentifierIos?: string;
  expirationDateIos?: number; // Subscription expiration date (milliseconds)
  environmentIos?: 'Production' | 'Sandbox';
  
  // Android-specific properties
  dataAndroid?: string;
  signatureAndroid?: string;
  purchaseStateAndroid?: number; // 0 = purchased, 1 = canceled
  isAcknowledgedAndroid?: boolean;
  packageNameAndroid?: string;
  developerPayloadAndroid?: string;
  obfuscatedAccountIdAndroid?: string;
  obfuscatedProfileIdAndroid?: string;
  autoRenewingAndroid?: boolean; // Subscription auto-renewal status
  purchaseTokenAndroid?: string;
}
```

### Important Subscription Properties

For subscription status checking:
- **iOS**: Check `expirationDateIos` to determine if the subscription is still active
- **Android**: Check `autoRenewingAndroid` to see if the user has canceled auto-renewal

## Error Handling

All methods can throw errors that should be handled appropriately:

```tsx
import {IAPError} from 'expo-iap';

try {
  await requestPurchase({sku: 'product_id'});
} catch (error) {
  if (error instanceof IAPError) {
    switch (error.code) {
      case 'E_USER_CANCELLED':
        console.log('User cancelled purchase');
        break;
      case 'E_NETWORK_ERROR':
        console.log('Network error, please try again');
        break;
      default:
        console.error('Purchase failed:', error.message);
    }
  }
}
```

For a complete list of error codes, see the [Error Codes](../error-codes) documentation.
