import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TokenProgressProps {
  used: number;
  quota: number;
  percentage: number;
}

export default function TokenProgress({
  used,
  quota,
  percentage,
}: TokenProgressProps) {
  const barColor = percentage > 90 ? '#EF4444' : percentage > 70 ? '#F59E0B' : '#7C3AED';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Tokens Used</Text>
        <Text style={styles.value}>
          {used.toLocaleString()} / {quota.toLocaleString()}
        </Text>
      </View>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      <Text style={styles.percentage}>{percentage.toFixed(1)}% used</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#A0A0B8',
    fontSize: 14,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  barBackground: {
    height: 8,
    backgroundColor: '#2A2A3C',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    color: '#A0A0B8',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
});
