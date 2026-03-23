import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation';
import { getToken, removeToken } from './src/services/auth';
import { getMe } from './src/services/api';

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
  const [authenticated, setAuthenticated] = useState(false);
  const [containerReady, setContainerReady] = useState(false);

  useEffect(() => {
    getToken().then(async (token) => {
      if (token) {
        try {
          const { user } = await getMe();
          setContainerReady(user.container_status === 'running');
        } catch (_) {}
        setAuthenticated(true);
      }
      setReady(true);
    });
  }, []);

  const handleAuth = (isContainerReady = false) => {
    setContainerReady(isContainerReady);
    setAuthenticated(true);
  };
  const handleLogout = () => {
    removeToken();
    setAuthenticated(false);
    setContainerReady(false);
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#7C3AED" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={darkTheme}>
        <RootNavigator
          isAuthenticated={authenticated}
          containerReady={containerReady}
          onContainerReady={() => setContainerReady(true)}
          onAuth={handleAuth}
          onLogout={handleLogout}
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
