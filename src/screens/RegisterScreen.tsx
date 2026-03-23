import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { register } from '../services/api';
import { saveToken } from '../services/auth';

type Props = {
  navigation: StackNavigationProp<any>;
  onAuth: () => void;
};

export default function RegisterScreen({ navigation, onAuth }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await register(name, email, password);
      await saveToken(res.token);
      onAuth();
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create Your AI</Text>
          <Text style={styles.subtitle}>
            Set up your account and we'll spin up your personal AI assistant.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#6B6B80"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#6B6B80"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6B6B80"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Create My AI</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  flex: { flex: 1 },
  scroll: { padding: 32, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#A0A0B8', marginBottom: 24, lineHeight: 22 },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  link: { color: '#7C3AED', fontSize: 15, textAlign: 'center' },
});
