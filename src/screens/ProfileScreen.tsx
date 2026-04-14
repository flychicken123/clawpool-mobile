import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Linking } from 'react-native';
import { getMe, getUsage, deleteAccount, type UsageInfo, type User } from '../services/api';
import { removeToken } from '../services/auth';

const PRIVACY_POLICY_URL = 'https://clawpool.hihired.org/privacy';
const TERMS_URL = 'https://clawpool.hihired.org/terms';
import TokenProgress from '../components/TokenProgress';

type Props = {
  navigation: StackNavigationProp<any>;
  onLogout: () => void;
};

export default function ProfileScreen({ navigation, onLogout }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, usageRes] = await Promise.all([getMe(), getUsage()]);
        setUser(meRes.user);
        setUsage(usageRes);
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAIDataSharing = () => navigation.navigate('AIDataSharing');
  const handlePrivacy = () => Linking.openURL(PRIVACY_POLICY_URL);

  const handleLogout = async () => {
    await removeToken();
    onLogout();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your account, data, and cancel any active subscriptions.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                      await removeToken();
                      onLogout();
                    } catch (e: any) {
                      Alert.alert('Error', e.message || 'Failed to delete account');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
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

        <Text style={styles.title}>Profile</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {user && (
          <View style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user.name}</Text>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
            <Text style={styles.label}>Current Plan</Text>
            <Text style={styles.planBadge}>{user.plan || 'Free'}</Text>
          </View>
        )}

        {usage && (
          <View style={styles.card}>
            <TokenProgress
              used={usage.tokens_used}
              quota={usage.tokens_quota}
              percentage={usage.percentage}
            />
            <Text style={styles.daysRemaining}>
              {usage.days_remaining} days remaining in billing cycle
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Plans')}
        >
          <Text style={styles.upgradeText}>Upgrade Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.aiDataButton} onPress={handleAIDataSharing}>
          <Text style={styles.aiDataText}>AI Data Sharing</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.privacyButton} onPress={handlePrivacy}>
          <Text style={styles.privacyText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  loader: { marginTop: 100 },
  scroll: { padding: 24 },
  back: { color: '#7C3AED', fontSize: 16, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 24 },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    borderRadius: 10,
  },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  label: { color: '#A0A0B8', fontSize: 13, marginBottom: 2, marginTop: 12 },
  value: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  planBadge: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  daysRemaining: { color: '#6B6B80', fontSize: 13, marginTop: 8 },
  upgradeButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  aiDataButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#7C3AED',
    marginBottom: 12,
  },
  aiDataText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
  privacyButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3C',
    marginBottom: 12,
  },
  privacyText: { color: '#A0A0B8', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  deleteButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});
