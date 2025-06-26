import {useEffect, useState} from 'react';
import {
  Alert,
  Button,
  InteractionManager,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
// eslint-disable-next-line import/no-unresolved
import {useIAP} from 'expo-iap';

const productSkus = [
  'cpk.points.1000',
  'cpk.points.5000',
  'cpk.points.10000',
  'cpk.points.30000',
];

const subscriptionSkus = [
  'cpk.membership.monthly.bronze',
  'cpk.membership.monthly.silver',
];

const operations = ['getProducts', 'getSubscriptions', 'validateReceipt'] as const;
type Operation = (typeof operations)[number];

export default function App() {
  const [syncError, setSyncError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const {
    connected,
    products,
    subscriptions,
    currentPurchase,
    currentPurchaseError,
    getProducts,
    getSubscriptions,
    requestPurchase,
    validateReceipt,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      InteractionManager.runAfterInteractions(() => {
        Alert.alert('Purchase successful', JSON.stringify(purchase));
      });
    },
    onPurchaseError: (error) => {
      InteractionManager.runAfterInteractions(() => {
        Alert.alert('Purchase failed', JSON.stringify(error));
      });
    },
    onSyncError: (error) => {
      console.log('Sync error occurred:', error);
      setSyncError(error);
      InteractionManager.runAfterInteractions(() => {
        Alert.alert(
          'Sync Error',
          'Failed to synchronize with App Store. You may need to enter your password to verify subscriptions.',
          [{text: 'OK', onPress: () => setSyncError(null)}],
        );
      });
    },
  });

  // Fetch products and subscriptions only when connected
  useEffect(() => {
    if (!connected) return;

    const initializeIAP = async () => {
      try {
        await Promise.all([
          getProducts(productSkus),
          getSubscriptions(subscriptionSkus),
        ]);
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing IAP:', error);
      }
    };
    initializeIAP();
  }, [connected, getProducts, getSubscriptions]);

  // Handle purchase updates and errors
  useEffect(() => {
    if (currentPurchase) {
      InteractionManager.runAfterInteractions(() => {
        Alert.alert('Purchase updated', JSON.stringify(currentPurchase));
      });
    }

    if (currentPurchaseError) {
      InteractionManager.runAfterInteractions(() => {
        Alert.alert('Purchase error', JSON.stringify(currentPurchaseError));
      });
    }
  }, [currentPurchase, currentPurchaseError]);

  const handleOperation = async (operation: Operation) => {
    if (!connected) {
      Alert.alert('Not Connected', 'Please wait for IAP to connect.');
      return;
    }

    try {
      switch (operation) {
        case 'getProducts':
          await getProducts(productSkus);
          break;
        case 'getSubscriptions':
          await getSubscriptions(subscriptionSkus);
          break;
        case 'validateReceipt':
          // Choose the first product for validation as an example
          const productToValidate = products.length > 0 ? products[0].id : 
            (subscriptions.length > 0 ? subscriptions[0].id : null);
          
          if (!productToValidate) {
            Alert.alert('No Products', 'Please fetch products first');
            return;
          }

          setValidationResult(null);

          if (Platform.OS === 'ios') {
            const result = await validateReceipt(productToValidate);
            setValidationResult(result);
            Alert.alert(
              'iOS Receipt Validation', 
              `Result: ${result.isValid ? 'Valid' : 'Invalid'}\n` +
              `Receipt data available: ${result.receiptData ? 'Yes' : 'No'}\n` +
              `JWS data available: ${result.jwsRepresentation ? 'Yes' : 'No'}`
            );
          } else if (Platform.OS === 'android') {
            Alert.alert(
              'Android Receipt Validation',
              'Android receipt validation requires additional server parameters.\n\n' +
              'For a real app, you would need:\n' +
              '- packageName\n' +
              '- productToken\n' +
              '- accessToken'
            );
          }
          break;
      }
    } catch (error) {
      console.error(`Error in ${operation}:`, error);
      Alert.alert(`Error in ${operation}`, String(error));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Expo IAP Example with useIAP</Text>

      {/* Display sync error banner if there's an error */}
      {syncError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            Sync error: Please verify your App Store credentials
          </Text>
        </View>
      )}

      <View style={styles.buttons}>
        <ScrollView contentContainerStyle={styles.buttonsWrapper} horizontal>
          {operations.map((operation) => (
            <Pressable
              key={operation}
              onPress={() => handleOperation(operation)}
            >
              <View style={styles.buttonView}>
                <Text>{operation}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {validationResult && (
        <View style={styles.validationResult}>
          <Text style={styles.validationTitle}>Receipt Validation Result:</Text>
          <Text>Valid: {validationResult.isValid ? 'Yes' : 'No'}</Text>
          <Text>Receipt data: {validationResult.receiptData ? 'Available' : 'Not available'}</Text>
          <Text>JWS data: {validationResult.jwsRepresentation ? 'Available' : 'Not available'}</Text>
        </View>
      )}

      <View style={styles.content}>
        {!connected ? (
          <Text>Not connected</Text>
        ) : !isReady ? (
          <Text>Loading...</Text>
        ) : (
          <View style={{gap: 12}}>
            <Text style={{fontSize: 20}}>Products</Text>
            {products.map((item) => {
              if (item.platform === 'android') {
                return (
                  <View key={item.title} style={{gap: 12}}>
                    <Text>
                      {item.title} -{' '}
                      {item.oneTimePurchaseOfferDetails?.formattedPrice}
                    </Text>
                    <Button
                      title="Buy"
                      onPress={() => {
                        requestPurchase({
                          request: {
                            skus: [item.id],
                          },
                        });
                      }}
                    />
                  </View>
                );
              }

              if (item.platform === 'ios') {
                return (
                  <View key={item.id} style={{gap: 12}}>
                    <Text>
                      {item.title} - {item.displayPrice}
                    </Text>
                    <Button
                      title="Buy"
                      onPress={() => {
                        requestPurchase({
                          request: {sku: item.id},
                        });
                      }}
                    />
                  </View>
                );
              }
            })}

            <Text style={{fontSize: 20}}>Subscriptions</Text>
            {subscriptions.map((item) => {
              if (item.platform === 'android') {
                return item.subscriptionOfferDetails?.map((offer) => (
                  <View key={offer.offerId} style={{gap: 12}}>
                    <Text>
                      {item.title} -{' '}
                      {offer.pricingPhases.pricingPhaseList
                        .map((ppl) => ppl.billingPeriod)
                        .join(',')}
                    </Text>
                    <Button
                      title="Subscribe"
                      onPress={() => {
                        requestPurchase({
                          request: {
                            skus: [item.id],
                            subscriptionOffers: offer.offerToken
                              ? [
                                  {
                                    sku: item.id,
                                    offerToken: offer.offerToken,
                                  },
                                ]
                              : [],
                          },
                          type: 'subs',
                        });
                      }}
                    />
                  </View>
                ));
              }

              if (item.platform === 'ios') {
                return (
                  <View key={item.id} style={{gap: 12}}>
                    <Text>
                      {item.displayName} - {item.displayPrice}
                    </Text>
                    <Button
                      title="Subscribe"
                      onPress={() => {
                        requestPurchase({
                          request: {sku: item.id},
                          type: 'subs',
                        });
                      }}
                    />
                  </View>
                );
              }
            })}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttons: {
    height: 90,
  },
  buttonsWrapper: {
    padding: 24,
    gap: 8,
  },
  buttonView: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    padding: 8,
  },
  content: {
    flex: 1,
    alignSelf: 'stretch',
    padding: 24,
    gap: 12,
  },
  errorBanner: {
    backgroundColor: '#ffcccc',
    padding: 8,
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  errorText: {
    color: '#cc0000',
    fontWeight: '600',
  },
  validationResult: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    width: '90%',
    marginVertical: 10,
  },
  validationTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
