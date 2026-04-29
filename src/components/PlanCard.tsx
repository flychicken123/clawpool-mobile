import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { Plan } from '../services/api';

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  onSelect: () => void;
  loading: boolean;
  disabled?: boolean;
  buttonLabel?: string;
}

export default function PlanCard({
  plan,
  isCurrent,
  onSelect,
  loading,
  disabled = false,
  buttonLabel,
}: PlanCardProps) {
  return (
    <View style={[styles.card, isCurrent && styles.currentCard]}>
      <Text style={styles.name}>{plan.name}</Text>
      <Text style={styles.price}>
        {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
      </Text>
      <View style={styles.features}>
        {(plan.features || []).map((f, i) => (
          <Text key={i} style={styles.feature}>
            {'\u2713'} {f}
          </Text>
        ))}
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          isCurrent && styles.currentButton,
          disabled && !isCurrent && styles.disabledButton,
        ]}
        onPress={onSelect}
        disabled={isCurrent || loading || disabled}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>
            {isCurrent ? 'Current Plan' : buttonLabel || 'Subscribe'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  currentCard: {
    borderColor: '#7C3AED',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  price: {
    color: '#7C3AED',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  features: {
    marginTop: 12,
    marginBottom: 16,
  },
  feature: {
    color: '#A0A0B8',
    fontSize: 14,
    marginBottom: 6,
  },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  currentButton: {
    backgroundColor: '#3A3A4E',
  },
  disabledButton: {
    backgroundColor: '#4B5563',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
