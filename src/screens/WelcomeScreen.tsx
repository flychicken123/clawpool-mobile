import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import { appleSignIn } from '../services/api';
import { saveToken } from '../services/auth';

type Props = {
  navigation: StackNavigationProp<any>;
  onAuth: (isContainerReady?: boolean) => void;
};

export default function WelcomeScreen({ navigation, onAuth }: Props) {
  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign-In',
      'Google sign-in requires a production build. Please use email login for now.',
      [
        { text: 'Use Email', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ');

      const res = await appleSignIn(credential.identityToken!, fullName);
      await saveToken(res.token);
      onAuth(res.user.container_status === 'running');
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In Failed', e.message || 'Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>ClawPool</Text>
        <Text style={styles.tagline}>Your personal AI, in one tap</Text>
      </View>

      <View style={styles.actions}>
        {/* Google Sign In */}
        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Apple Sign In — same height/style as other buttons */}
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={14}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}

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
  // Social buttons (Google & Apple) share same height and margin
  socialButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  appleButton: {
    width: '100%' as any,
    height: 54,
    marginBottom: 12,
  },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4', marginRight: 10 },
  socialButtonText: { color: '#3c4043', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A3C' },
  dividerText: { color: '#6B6B80', marginHorizontal: 12, fontSize: 13 },
  primaryButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  secondaryButton: { borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#7C3AED', fontSize: 17, fontWeight: '600' },
});
