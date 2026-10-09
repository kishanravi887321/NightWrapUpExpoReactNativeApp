import React from 'react';
import {
  KeyboardAvoidingView,
  Linking,
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
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* App Icon */}
          <View style={styles.iconWrap}>
            <View style={styles.icon}>
              <Text style={styles.iconNote}>♫</Text>
            </View>
          </View>

          <Text style={styles.appName}>NightWrapUp</Text>
          <Text style={styles.tagline}>Your personal music player</Text>

          {/* Login Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Sign In</Text>

            <Text style={styles.label}>Email address</Text>
            <TextInput
              value={email}
              onChangeText={onEmailChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#555"
              style={styles.input}
            />

            <Text style={styles.label}>Mobile key (8 digits)</Text>
            <TextInput
              value={secretKey}
              onChangeText={onSecretKeyChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              maxLength={8}
              placeholder="• • • • • • • •"
              placeholderTextColor="#555"
              style={styles.input}
              secureTextEntry
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && styles.loginBtnPressed,
                isLoading && styles.loginBtnDisabled,
              ]}
              onPress={onLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginBtnText}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Find your mobile key in your NightWrapUp profile settings.
          </Text>
          <Pressable
            onPress={() => {
              void Linking.openURL('https://nightwrapup.ziax.online/');
            }}
            accessibilityRole="link"
          >
            <Text style={styles.websiteLink}>Create or manage your mobile key</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121212',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1db954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconNote: {
    fontSize: 30,
    color: '#fff',
  },
  appName: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  tagline: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#0d0d0d',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  errorBox: {
    marginTop: 14,
    backgroundColor: 'rgba(220, 50, 50, 0.15)',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: 22,
    backgroundColor: '#1db954',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginBtnPressed: {
    backgroundColor: '#18a34a',
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  hint: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
  websiteLink: {
    marginTop: 12,
    textAlign: 'center',
    color: '#1db954',
    fontSize: 13,
    fontWeight: '700',
  },
});
