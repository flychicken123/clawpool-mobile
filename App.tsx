import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootNavigator from './src/navigation';
import ConsentScreen from './src/screens/ConsentScreen';
import { getToken, removeToken } from './src/services/auth';
import { getMe, getConsentStatus, acceptConsent } from './src/services/api';

const CONSENT_KEY = 'clawpool_privacy_consent_v3';

const darkTheme = {
  dark: true,
  colors: {
    primary: '#7C3AED',
    background: '#0F0F1A',
    card: '#1E1E2E',
    text: '#FFFFFF',
    border: '#2A2A3C',
    notification: '#7C3AED',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const [aiConsented, setAiConsented] = useState(false);

  useEffect(() => {
    (async () => {
      const [consent, token] = await Promise.all([
        AsyncStorage.getItem(CONSENT_KEY),
        getToken(),
      ]);

      // Local consent gate (pre-login)
      setConsentGiven(consent === 'true');

      if (token) {
        try {
          const { user } = await getMe();
          setContainerReady(user.container_status === 'running');

          // Check server-side AI consent
          try {
            const consentStatus = await getConsentStatus();
            setAiConsented(consentStatus.consented);
          } catch (_) {
            // If consent endpoint fails, default to false
            setAiConsented(false);
          }
        } catch (_) {}
        setAuthenticated(true);
      }
      setReady(true);
    })();
  }, []);

  const handleAcceptConsent = async () => {
    await AsyncStorage.setItem(CONSENT_KEY, 'true');

    // If the user is already authenticated, also record server-side consent
    const token = await getToken();
    if (token) {
      try {
        await acceptConsent();
        setAiConsented(true);
      } catch (_) {
        // Server consent will be prompted again when they try to chat
      }
    }

    setConsentGiven(true);
  };

  const handleDeclineConsent = () => {
    Alert.alert(
      'Cannot Continue',
      'ClawPool requires your consent to share data with our AI service in order to function. You can review our Privacy Policy at any time from the app settings.',
      [{ text: 'OK' }]
    );
  };

  const handleAuth = async (isContainerReady = false) => {
    setContainerReady(isContainerReady);
    setAuthenticated(true);

    // Record server-side consent on first auth if local consent was already given
    try {
      const consentStatus = await getConsentStatus();
      if (!consentStatus.consented) {
        await acceptConsent();
        setAiConsented(true);
      } else {
        setAiConsented(true);
      }
    } catch (_) {
      // Will be handled when user tries to use chat
    }
  };

  const handleLogout = () => {
    removeToken();
    setAuthenticated(false);
    setContainerReady(false);
    setAiConsented(false);
  };

  const handleConsentChanged = (consented: boolean) => {
    setAiConsented(consented);
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#7C3AED" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  if (!consentGiven) {
    return (
      <SafeAreaProvider>
        <ConsentScreen onAccept={handleAcceptConsent} onDecline={handleDeclineConsent} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={darkTheme}>
        <RootNavigator
          isAuthenticated={authenticated}
          containerReady={containerReady}
          aiConsented={aiConsented}
          onContainerReady={() => setContainerReady(true)}
          onAuth={handleAuth}
          onLogout={handleLogout}
          onConsentChanged={handleConsentChanged}
        />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
