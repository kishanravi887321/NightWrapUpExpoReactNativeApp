import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoginScreenProps = {
  email: string;
  secretKey: string;
  error: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onSecretKeyChange: (value: string) => void;
  onLogin: () => void;
};

export function LoginScreen({
  email,
  secretKey,
  error,
  isLoading,
  onEmailChange,
  onSecretKeyChange,
  onLogin,
}: LoginScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.loginShell}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.loginGlow} />
        <View style={styles.loginCard}>
          <Text style={styles.eyebrow}>NightWrapUp mobile</Text>
          <Text style={styles.title}>Night mode listening</Text>
          <Text style={styles.subtitle}>
            Sign in with your website email and the 8-digit mobile key you saved in your profile.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={onEmailChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="user@example.com"
              placeholderTextColor="#78839d"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile key</Text>
            <TextInput
              value={secretKey}
              onChangeText={onSecretKeyChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              maxLength={8}
              placeholder="48291637"
              placeholderTextColor="#78839d"
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={onLogin} disabled={isLoading}>
            <Text style={styles.primaryButtonText}>{isLoading ? 'Signing in…' : 'Unlock library'}</Text>
          </Pressable>

          <View style={styles.helpRow}>
            <Text style={styles.helpText}>Website flow</Text>
            <Text style={styles.helpText}>Profile → Mobile listening</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050816',
  },
  loginShell: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#050816',
    paddingHorizontal: 24,
  },
  loginGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#8b5cf6',
    opacity: 0.18,
    alignSelf: 'center',
    top: 80,
  },
  loginCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  eyebrow: {
    color: '#9cc6ff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    color: '#f8fbff',
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#b4bdd3',
  },
  inputGroup: {
    marginTop: 20,
  },
  label: {
    color: '#dfe7ff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(96, 112, 160, 0.5)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#f5f7ff',
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  helpRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpText: {
    color: '#7f8fb4',
    fontSize: 12,
    fontWeight: '600',
  },
});
