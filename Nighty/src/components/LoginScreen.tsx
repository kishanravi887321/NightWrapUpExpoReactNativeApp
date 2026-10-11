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
    backgroundColor: '#030914',
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
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 8,
  },
  iconNote: {
    fontSize: 34,
    color: '#030914',
    fontWeight: '900',
  },
  appName: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tagline: {
    textAlign: 'center',
    color: '#7b95b0',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 32,
    letterSpacing: 0.3,
  },
  form: {
    backgroundColor: '#051120',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: 0.4,
  },
  label: {
    color: '#95adc7',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#07172b',
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: '#ffffff',
    fontSize: 16,
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 80, 80, 0.12)',
    borderColor: 'rgba(255, 80, 80, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: 24,
    backgroundColor: '#00e5ff',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtnPressed: {
    backgroundColor: '#33ebff',
    opacity: 0.9,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginBtnText: {
    color: '#030914',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  hint: {
    marginTop: 22,
    textAlign: 'center',
    color: '#607994',
    fontSize: 12,
    lineHeight: 18,
  },
  websiteLink: {
    marginTop: 12,
    textAlign: 'center',
    color: '#00e5ff',
    fontSize: 13,
    fontWeight: '700',
  },
});
