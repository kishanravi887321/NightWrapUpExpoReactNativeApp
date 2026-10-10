import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type AppTab = 'libraries' | 'offline' | 'settings';

type BottomNavigationProps = {
  activeTab: AppTab;
  offlineCount: number;
  onChange: (tab: AppTab) => void;
};

export function BottomNavigation({ activeTab, offlineCount, onChange }: BottomNavigationProps) {
  const items: { tab: AppTab; icon: string; label: string }[] = [
    { tab: 'libraries', icon: '♫', label: 'Libraries' },
    { tab: 'offline', icon: '↓', label: 'Offline' },
    { tab: 'settings', icon: '⚙', label: 'Settings' },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <Pressable key={item.tab} style={styles.item} onPress={() => onChange(item.tab)}>
          <Text style={[styles.icon, activeTab === item.tab && styles.active]}>{item.icon}</Text>
          <Text style={[styles.label, activeTab === item.tab && styles.active]}>{item.label}</Text>
          {item.tab === 'offline' && offlineCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{offlineCount}</Text></View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181818',
    borderTopColor: '#2a2a2a',
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: 8,
    paddingTop: 8,
  },
  item: { alignItems: 'center', flex: 1, position: 'relative' },
  icon: { color: '#777', fontSize: 20, height: 25 },
  label: { color: '#777', fontSize: 11, marginTop: 2 },
  active: { color: '#1db954' },
  badge: {
    backgroundColor: '#1db954',
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 32,
    top: -2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },
});
