import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';

type Props = {
  navigation: StackNavigationProp<any>;
  onAuth: () => void;
};

export default function WelcomeScreen({ navigation }: Props) {
  const handleGoogleSignIn = () => {
    // For Expo Go testing, direct to login screen
    // Google OAuth works in production build
    Alert.alert(
      'Google Sign-In',
      'Google sign-in requires a production build. Please use email login for now.',
      [
        { text: 'Use Email', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>ClawPool</Text>
        <Text style={styles.tagline}>Your personal AI, in one tap</Text>
      </View>

      <View style={styles.actions}>
        {/* Google Sign In */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.primaryButtonText}>Get Started with Email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: { fontSize: 48, fontWeight: '800', color: '#7C3AED', marginBottom: 12 },
  tagline: { fontSize: 18, color: '#A0A0B8', textAlign: 'center' },
  actions: { paddingHorizontal: 32, paddingBottom: 32 },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4', marginRight: 10 },
  googleButtonText: { color: '#3c4043', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A3C' },
  dividerText: { color: '#6B6B80', marginHorizontal: 12, fontSize: 13 },
  primaryButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  secondaryButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#7C3AED', fontSize: 17, fontWeight: '600' },
});
