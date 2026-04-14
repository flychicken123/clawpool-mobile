import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  getConsentStatus,
  acceptConsent,
  revokeConsent,
  type ConsentStatus,
} from '../services/api';

const PRIVACY_POLICY_URL = 'https://clawpool.hihired.org/privacy';

type Props = {
  navigation: StackNavigationProp<any>;
  onConsentChanged?: (consented: boolean) => void;
};

export default function AIDataSharingScreen({ navigation, onConsentChanged }: Props) {
  const [consent, setConsent] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const status = await getConsentStatus();
      setConsent(status);
    } catch (e: any) {
      setError(e.message || 'Failed to load consent status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = () => {
    Alert.alert(
      'Revoke AI Data Sharing',
      'This will immediately disable the AI chat feature. You can re-enable it at any time by giving consent again.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Consent',
          style: 'destructive',
          onPress: async () => {
            setActing(true);
            try {
              await revokeConsent();
              const updated = await getConsentStatus();
              setConsent(updated);
              onConsentChanged?.(false);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to revoke consent');
            } finally {
              setActing(false);
            }
          },
        },
      ],
    );
  };

  const handleAccept = async () => {
    setActing(true);
    try {
      await acceptConsent();
      const updated = await getConsentStatus();
      setConsent(updated);
      onConsentChanged?.(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to accept consent');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#7C3AED" style={styles.loader} />
      </SafeAreaView>
    );
  }

  const isConsented = consent?.consented === true;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>AI Data Sharing</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Status badge */}
        <View style={[styles.statusCard, isConsented ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={[styles.statusValue, isConsented ? styles.statusActiveText : styles.statusInactiveText]}>
            {isConsented ? 'Consent Active' : 'Consent Not Active'}
          </Text>
          {consent?.accepted_at && (
            <Text style={styles.statusDate}>
              {isConsented ? 'Accepted' : 'Last accepted'}: {new Date(consent.accepted_at).toLocaleDateString()}
            </Text>
          )}
          {consent?.revoked_at && (
            <Text style={styles.statusDate}>
              Revoked: {new Date(consent.revoked_at).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* What is shared */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What data is shared</Text>
          <Text style={styles.cardBody}>When you use AI chat, the following is sent to Google's Gemini AI (Google LLC):</Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>{'\u2022'} Your text messages</Text>
            <Text style={styles.bullet}>{'\u2022'} Any images you attach</Text>
            <Text style={styles.bullet}>{'\u2022'} Your internal user ID</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How data is handled</Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>{'\u2022'} Messages and images are <Text style={styles.bold}>not stored</Text> by ClawPool after the AI responds</Text>
            <Text style={styles.bullet}>{'\u2022'} Data is encrypted in transit (HTTPS/TLS)</Text>
            <Text style={styles.bullet}>{'\u2022'} Google processes data solely to generate your AI response</Text>
            <Text style={styles.bullet}>{'\u2022'} ClawPool does not sell your data</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.policyLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          <Text style={styles.policyLinkText}>View Full Privacy Policy</Text>
        </TouchableOpacity>

        {/* Action button */}
        {isConsented ? (
          <TouchableOpacity
            style={styles.revokeButton}
            onPress={handleRevoke}
            disabled={acting}
          >
            {acting ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text style={styles.revokeText}>Revoke AI Data Sharing Consent</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            disabled={acting}
          >
            {acting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptText}>Give Consent &amp; Enable AI Chat</Text>
            )}
          </TouchableOpacity>
        )}

        {!isConsented && (
          <Text style={styles.disabledNote}>
            AI chat is currently disabled because you have not consented to data sharing.
          </Text>
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
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 24 },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    borderRadius: 10,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderColor: '#7C3AED',
  },
  statusInactive: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: '#EF4444',
  },
  statusLabel: { color: '#A0A0B8', fontSize: 13, marginBottom: 4 },
  statusValue: { fontSize: 18, fontWeight: '700' },
  statusActiveText: { color: '#7C3AED' },
  statusInactiveText: { color: '#EF4444' },
  statusDate: { color: '#6B6B80', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: { fontSize: 15, color: '#C0C0D4', lineHeight: 22 },
  bullets: { marginTop: 8, paddingLeft: 4 },
  bullet: { fontSize: 15, color: '#C0C0D4', lineHeight: 26 },
  bold: { fontWeight: '700', color: '#FFFFFF' },
  policyLink: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3C',
    marginBottom: 16,
  },
  policyLinkText: { color: '#A0A0B8', fontSize: 16, fontWeight: '600' },
  revokeButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 12,
  },
  revokeText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  acceptButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  disabledNote: {
    color: '#6B6B80',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
