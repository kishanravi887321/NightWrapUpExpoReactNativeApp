import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

type SettingsScreenProps = {
  onLogout: () => void;
  onShowSplash?: () => void;
};

export function SettingsScreen({ onLogout, onShowSplash }: SettingsScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* ── Top Bar matching LibraryScreen ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>♫</Text>
          </View>
          <Text style={styles.topBarTitle}>NightWrapUp</Text>
        </View>
        <View style={styles.settingsBadge}>
          <Text style={styles.settingsBadgeIcon}>⚙</Text>
          <Text style={styles.settingsBadgeText}>SETTINGS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Account & Key Management ── */}
        <Text style={styles.sectionHeader}>ACCOUNT & SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.sessionStatusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.sessionStatusText}>Active Mobile Session</Text>
          </View>
          <Text style={styles.sessionDescription}>
            Logged in securely with your 8-digit mobile authentication key.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            onPress={() => void Linking.openURL('https://nightwrapup.ziax.online/')}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrap}>
                <Text style={styles.actionIcon}>🔑</Text>
              </View>
              <View>
                <Text style={styles.actionTitle}>Manage Mobile Key</Text>
                <Text style={styles.actionSubtitle}>Open online web dashboard</Text>
              </View>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>
        </View>

        {/* ── Audio Engine & Playback ── */}
        <Text style={styles.sectionHeader}>PLAYBACK & AUDIO</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Audio Engine</Text>
              <Text style={styles.infoValue}>ExoPlayer / CoreAudio Low-Latency</Text>
            </View>
            <View style={styles.cyanBadge}>
              <Text style={styles.cyanBadgeText}>Active</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Background Audio</Text>
              <Text style={styles.infoValue}>Lockscreen controls & ducking</Text>
            </View>
            <View style={styles.cyanBadge}>
              <Text style={styles.cyanBadgeText}>On</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Waveform Visualizer</Text>
              <Text style={styles.infoValue}>Dynamic deterministic song fingerprinting</Text>
            </View>
            <View style={styles.cyanBadge}>
              <Text style={styles.cyanBadgeText}>Active</Text>
            </View>
          </View>
        </View>

        {/* ── App Info ── */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>NightWrapUp Mobile</Text>
              <Text style={styles.infoValue}>Version 1.0.0 (Cyberpunk Edition)</Text>
            </View>
          </View>

          {onShowSplash && (
            <>
              <View style={styles.divider} />
              <Pressable
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                onPress={onShowSplash}
              >
                <View style={styles.actionLeft}>
                  <View style={styles.actionIconWrap}>
                    <Text style={styles.actionIcon}>✨</Text>
                  </View>
                  <View>
                    <Text style={styles.actionTitle}>Replay Animated Splash</Text>
                    <Text style={styles.actionSubtitle}>Preview startup animation sequence</Text>
                  </View>
                </View>
                <Text style={styles.actionChevron}>›</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* ── Sign Out ── */}
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          onPress={onLogout}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sign Out from Device</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#030914',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.12)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBarIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  topBarIconText: {
    color: '#030914',
    fontSize: 20,
    fontWeight: '900',
  },
  topBarTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  settingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  settingsBadgeIcon: {
    color: '#00e5ff',
    fontSize: 12,
  },
  settingsBadgeText: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#051120',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    padding: 16,
    marginBottom: 16,
  },
  sessionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  sessionStatusText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  sessionDescription: {
    color: '#7b95b0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#07172b',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: '#00e5ff',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 15,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: '#00e5ff',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  actionChevron: {
    color: '#00e5ff',
    fontSize: 20,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLeft: {
    flex: 1,
  },
  infoLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: '#7b95b0',
    fontSize: 12,
    marginTop: 2,
  },
  cyanBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cyanBadgeText: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16080e',
    borderWidth: 1,
    borderColor: 'rgba(255, 80, 80, 0.35)',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(255, 80, 80, 0.2)',
  },
  logoutIcon: {
    fontSize: 16,
  },
  logoutText: {
    color: '#ff6b6b',
    fontSize: 15,
    fontWeight: '700',
  },
});
