import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  getPlans,
  getMe,
  subscribeToPlan,
  type Plan,
} from '../services/api';
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
    };
    load();
  }, []);

  const handleSubscribe = async (planName: string) => {
    if (planName === 'free') return; // free plan has no checkout
    setSubscribing(planName);
    try {
      const res = await subscribeToPlan(planName);
      const url = res?.checkout_url || (res as any)?.data?.checkout_url;
      if (!url) {
        Alert.alert('Error', 'Could not get checkout link. Please try again.');
        return;
      }
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start checkout');
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

        {plans.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={{
              ...plan,
              price: plan.price ?? plan.price_usd ?? 0,
              features: plan.features || [
                `${((plan.tokens_quota ?? plan.tokens_per_month ?? 0) / 1000).toFixed(0)}K tokens/month`,
                plan.name === 'free' ? 'Basic AI access' : 'Priority support',
              ],
            }}
            isCurrent={plan.name === currentPlan}
            onSelect={() => handleSubscribe(plan.name)}
            loading={subscribing === plan.name}
          />
        ))}
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
});
