import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
        <ScrollView
          contentContainerStyle={styles.loginScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>N</Text>
          </View>
          <Text style={styles.eyebrow}>NIGHTWRAPUP</Text>
          <Text style={styles.title}>Your night,{"\n"}your sound.</Text>
          <Text style={styles.subtitle}>
            Sign in to continue listening to your private library.
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
            <View style={styles.helpDot} />
            <Text style={styles.helpText}>Use the mobile key from your profile</Text>
          </View>
        </ScrollView>
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
    backgroundColor: '#050816',
  },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
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
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
  },
  eyebrow: {
    color: '#9cc6ff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    color: '#f8fbff',
    fontWeight: '800',
    marginTop: 10,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
    color: '#b4bdd3',
  },
  inputGroup: {
    marginTop: 18,
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
    borderRadius: 12,
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
    marginTop: 22,
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
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
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34d399',
    marginRight: 8,
  },
  helpText: {
    color: '#7f8fb4',
    fontSize: 12,
    fontWeight: '600',
  },
});
