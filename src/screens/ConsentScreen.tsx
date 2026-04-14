import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIVACY_POLICY_URL = 'https://clawpool.hihired.org/privacy';
const TERMS_URL = 'https://clawpool.hihired.org/terms';

type Props = {
  onAccept: () => void | Promise<void>;
  onDecline: () => void;
};

export default function ConsentScreen({ onAccept, onDecline }: Props) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!checked || submitting) return;
    setSubmitting(true);
    try {
      await onAccept();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>AI Data Sharing Disclosure</Text>
        <Text style={styles.subtitle}>
          ClawPool uses a third-party AI service to power its chat feature.
          Before you can use AI chat, please review the details below and give your explicit permission.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What data is sent</Text>
          <Text style={styles.body}>
            Each time you use the AI chat feature, the following personal data is sent to a third-party AI service to generate a response:
          </Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>{'\u2022'} The text messages you type</Text>
            <Text style={styles.bullet}>{'\u2022'} Any photos or images you attach (from your camera or photo library)</Text>
            <Text style={styles.bullet}>{'\u2022'} Your internal user ID (used to manage your session)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who receives your data</Text>
          <Text style={styles.body}>
            Your messages and images are sent from ClawPool's backend server to{' '}
            <Text style={styles.bold}>Google's Gemini AI</Text>, a service provided by{' '}
            <Text style={styles.bold}>Google LLC</Text> (Mountain View, CA, USA).
            Google processes this data solely to generate AI responses for you.
          </Text>
          <Text style={[styles.body, { marginTop: 8 }]}>
            Google maintains industry-standard security certifications and encrypts data in transit and at rest.
            Google's use of your data is governed by their{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://ai.google.dev/gemini-api/terms')}>
              Gemini API Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://policies.google.com/privacy')}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How your data is used and retained</Text>
          <Text style={styles.body}>
            Your chat messages and images are transmitted to Google Gemini in real time and are{' '}
            <Text style={styles.bold}>not stored</Text> by ClawPool after the AI response is returned.
            Your name and email are stored on ClawPool's servers to manage your account. Your email is
            also shared with <Text style={styles.bold}>Stripe</Text> to process payments.
          </Text>
          <Text style={[styles.body, { marginTop: 8 }]}>
            ClawPool does not sell, rent, or trade your personal data to any third party.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your rights</Text>
          <Text style={styles.body}>
            You can <Text style={styles.bold}>revoke this consent at any time</Text> from the
            "AI Data Sharing" screen in the app's Profile section. Revoking consent will immediately
            stop all data sharing with Google Gemini and disable the AI chat feature until you
            re-consent. You may also delete your account entirely from the Profile screen.
          </Text>
        </View>

        {/* Explicit checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setChecked((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkmark}>{'\u2713'}</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and understand the above. I consent to ClawPool sharing my messages,
            images, and user ID with <Text style={styles.bold}>Google LLC (Gemini AI)</Text> as
            described above and in the{' '}
            <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              Privacy Policy
            </Text>
            .
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.acceptButton, !checked && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={!checked || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptText}>Accept &amp; Continue</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
        <Text style={styles.legalLinks}>
          <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            Privacy Policy
          </Text>
          {'  ·  '}
          <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms of Service
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  scroll: { padding: 28, paddingBottom: 8 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#A0A0B8',
    marginBottom: 28,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 15,
    color: '#C0C0D4',
    lineHeight: 22,
  },
  bullets: { marginTop: 8, paddingLeft: 4 },
  bullet: { fontSize: 15, color: '#C0C0D4', lineHeight: 26 },
  bold: { fontWeight: '700', color: '#FFFFFF' },
  link: { color: '#7C3AED', textDecorationLine: 'underline' },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#7C3AED',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#7C3AED',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#C0C0D4',
    lineHeight: 21,
  },
  actions: {
    padding: 28,
    paddingTop: 12,
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#3A3A4E',
  },
  acceptText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  declineButton: {
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: { color: '#6B6B80', fontSize: 16 },
  legalLinks: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6B6B80',
    marginTop: 4,
  },
});
