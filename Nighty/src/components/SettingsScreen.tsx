import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

type SettingsScreenProps = {
  onLogout: () => void;
};

export function SettingsScreen({ onLogout }: SettingsScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Pressable style={styles.link} onPress={() => void Linking.openURL('https://nightwrapup.ziax.online/')}>
        <Text style={styles.linkText}>Manage mobile key</Text>
      </Pressable>
      <Pressable style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 20 },
  link: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 16 },
  linkText: { color: '#1db954', fontSize: 16, fontWeight: '600' },
  logout: { borderColor: '#7f2d2d', borderRadius: 10, borderWidth: 1, marginTop: 16, padding: 16 },
  logoutText: { color: '#ff7777', fontSize: 16, fontWeight: '600' },
});
