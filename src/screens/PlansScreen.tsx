import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking } from 'react-native';

const PRIVACY_POLICY_URL = 'https://clawpool.hihired.org/privacy';
const TERMS_URL = 'https://clawpool.hihired.org/terms';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { IAPItemDetails } from 'expo-in-app-purchases';
import {
  getPlans,
  getMe,
  subscribeToPlan,
  verifyIAPReceipt,
  type Plan,
} from '../services/api';
import {
  initIAP,
  getProducts,
  purchasePlan,
  disconnectIAP,
  PRODUCT_IDS,
  productIdToPlan,
} from '../services/iap';
import PlanCard from '../components/PlanCard';

type Props = {
  navigation: StackNavigationProp<any>;
};

export default function PlansScreen({ navigation }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [iapProducts, setIapProducts] = useState<IAPItemDetails[]>([]);
  const [iapAvailable, setIapAvailable] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [plansData, meData] = await Promise.all([getPlans(), getMe()]);
        setPlans(plansData);
        setCurrentPlan(meData.user.plan || 'Free');
      } catch (e: any) {
        setError(e.message || 'Failed to load plans');
      } finally {
        setLoading(false);
      }

      // Try to load Apple IAP products (iOS only)
      if (Platform.OS === 'ios') {
        try {
          await initIAP();
          const products = await getProducts();
          setIapProducts(products ?? []);
          setIapAvailable((products ?? []).length > 0);
        } catch (iapErr: any) {
          console.warn('[IAP] Init failed:', iapErr?.message);
          // IAP unavailable — still show plans, purchases will surface Apple's own error
          setIapAvailable(false);
        }
      }
    };

    load();

    return () => {
      // Disconnect IAP on unmount
      disconnectIAP().catch(() => {});
    };
  }, []);

  /** Get the localized Apple price string for a plan, if available */
  const getApplePrice = (planName: string): string | null => {
    if (!iapAvailable) return null;
    const productId = PRODUCT_IDS[planName as keyof typeof PRODUCT_IDS];
    if (!productId) return null;
    const product = iapProducts.find((p) => p.productId === productId);
    return product?.price ?? null;
  };

  const handleSubscribe = async (planName: string) => {
    if (planName === 'free') return;
    setSubscribing(planName);
    setError('');

    try {
      // iOS: always use Apple IAP, never Stripe
      if (Platform.OS === 'ios') {
        const productId = PRODUCT_IDS[planName as keyof typeof PRODUCT_IDS];
        if (!productId) throw new Error('Unknown plan');

        // If products not loaded yet, attempt IAP init inline
        if (!iapAvailable) {
          try {
            await initIAP();
            const products = await getProducts();
            setIapProducts(products ?? []);
            setIapAvailable((products ?? []).length > 0);
          } catch (iapErr: any) {
            console.warn('[IAP] Retry init failed:', iapErr?.message);
          }
        }

        const receipt = await purchasePlan(productId);

        // Verify receipt with backend to update plan in DB
        await verifyIAPReceipt(receipt, productId);

        setCurrentPlan(planName);
        Alert.alert('Success', `You're now on the ${planName} plan!`);
        return;
      }

      // Android/web: Stripe web checkout
      const res = await subscribeToPlan(planName);
      const url = res?.checkout_url || (res as any)?.data?.checkout_url;
      if (!url) {
        Alert.alert('Error', 'Could not get checkout link. Please try again.');
        return;
      }
      await Linking.openURL(url);
    } catch (e: any) {
      if (e?.message === 'Purchase cancelled') {
        // User cancelled — no alert needed
      } else {
        Alert.alert('Error', e.message || 'Failed to start checkout');
      }
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#7C3AED" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Choose a Plan</Text>
        <Text style={styles.subtitle}>
          Unlock more tokens and features for your AI.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {plans.map((plan) => {
          const applePrice = getApplePrice(plan.name);
          const displayPrice =
            applePrice !== null
              ? parseFloat(applePrice.replace(/[^0-9.]/g, ''))
              : (plan.price ?? plan.price_usd ?? 0);

          return (
            <PlanCard
              key={plan.name}
              plan={{
                ...plan,
                price: displayPrice,
                features: plan.features || [
                  `${((plan.tokens_quota ?? plan.tokens_per_month ?? 0) / 1000).toFixed(0)}K tokens/month`,
                  plan.name === 'free' ? 'Basic AI access' : 'Priority support',
                ],
              }}
              isCurrent={plan.name === currentPlan}
              onSelect={() => handleSubscribe(plan.name)}
              loading={subscribing === plan.name}
            />
          );
        })}

        {Platform.OS === 'ios' && (
          <>
            <Text style={styles.iapNote}>
              Subscriptions auto-renew monthly unless cancelled at least 24 hours before the end of the current period.
              Manage or cancel in Settings → Apple ID → Subscriptions.
              Payment will be charged to your Apple ID account at confirmation of purchase.
            </Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalSep}> · </Text>
              <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
                <Text style={styles.legalLink}>Terms of Use</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  loader: { marginTop: 100 },
  scroll: { padding: 24 },
  back: { color: '#7C3AED', fontSize: 16, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#A0A0B8', marginBottom: 24 },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    borderRadius: 10,
  },
  iapNote: {
    fontSize: 11,
    color: '#666680',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
    marginBottom: 12,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  legalLink: {
    fontSize: 12,
    color: '#7C3AED',
    textDecorationLine: 'underline',
  },
  legalSep: {
    fontSize: 12,
    color: '#666680',
  },
});
