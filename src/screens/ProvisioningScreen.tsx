import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getContainerStatus } from '../services/api';

type Props = {
  navigation: StackNavigationProp<any>;
  onContainerReady?: () => void;
};

export default function ProvisioningScreen({ navigation, onContainerReady }: Props) {
  const [status, setStatus] = useState<string>('pending');
  const [error, setError] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spin]);

  useEffect(() => {
    // Show timeout message after 60 seconds
    const timeoutId = setTimeout(() => setTimedOut(true), 60000);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      while (active) {
        try {
          const res = await getContainerStatus();
          if (!active) return;
          setStatus(res.container_status);
          if (res.container_status === 'running') {
            onContainerReady?.();
            navigation.replace('Chat');
            return;
          }
          if (res.container_status === 'deleted') {
            // Trial expired — stop polling, show subscribe message
            return;
          }
          if (res.container_status === 'error') {
            setError('Failed to set up your AI container.');
            return;
          }
        } catch (e: any) {
          if (!active) return;
          setError(e.message || 'Connection error');
          return;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    };

    poll();
    return () => {
      active = false;
    };
  }, [navigation]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleSkip = () => {
    navigation.replace('Chat');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'deleted' ? (
          <>
            <Text style={styles.errorIcon}>{'\u231B'}</Text>
            <Text style={styles.errorText}>Your trial has expired.</Text>
            <Text style={styles.errorSub}>
              Subscribe to reactivate your AI.
            </Text>
            <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('Plans')}>
              <Text style={styles.skipButtonText}>Subscribe →</Text>
            </TouchableOpacity>
          </>
        ) : error ? (
          <>
            <Text style={styles.errorIcon}>{'\u26A0'}</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSub}>
              The AI proxy is available — you can still chat without a dedicated container.
            </Text>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Continue to Chat →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Animated.View
              style={[styles.spinner, { transform: [{ rotate: rotation }] }]}
            >
              <View style={styles.spinnerArc} />
            </Animated.View>
            <Text style={styles.title}>Setting up your AI...</Text>
            <Text style={styles.subtitle}>
              {timedOut
                ? 'This is taking longer than expected.'
                : 'Your personal AI container is starting up.\nThis takes 10–20 seconds.'}
            </Text>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => {
                Alert.alert(
                  'Report Issue',
                  'Sorry it\'s taking too long!\n\nYou can try:\n• Close and reopen the app\n• Contact support@clawpool.app',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={[styles.reportText, timedOut && { color: '#EF4444' }]}>
                {timedOut ? '⚠️ Taking too long? Report issue' : 'Taking too long? Report issue'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#2A2A3C',
    marginBottom: 32,
  },
  spinnerArc: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#7C3AED',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#A0A0B8', marginBottom: 32 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center', marginBottom: 8 },
  errorSub: { fontSize: 13, color: '#A0A0B8', textAlign: 'center', marginBottom: 32 },
  skipButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  skipButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  skipButtonOutline: {
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  skipButtonOutlineText: { color: '#7C3AED', fontSize: 15, fontWeight: '600' },
  reportButton: { marginTop: 24, paddingVertical: 8 },
  reportText: { color: '#6B6B80', fontSize: 13, textDecorationLine: 'underline' },
});
