import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type AppTab = 'libraries' | 'tracks' | 'offline' | 'settings';

type BottomNavigationProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

export function BottomNavigation({ activeTab, onChange }: BottomNavigationProps) {
  const items: { tab: AppTab; icon: string; label: string }[] = [
    { tab: 'libraries', icon: '♫', label: 'Libraries' },
    { tab: 'tracks', icon: '☷', label: 'Tracks' },
    { tab: 'offline', icon: '↓', label: 'Offline' },
    { tab: 'settings', icon: '⚙', label: 'Settings' },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <Pressable key={item.tab} style={styles.item} onPress={() => onChange(item.tab)}>
          <Text style={[styles.icon, activeTab === item.tab && styles.active]}>{item.icon}</Text>
          <Text style={[styles.label, activeTab === item.tab && styles.active]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#040d18',
    borderTopColor: 'rgba(0, 229, 255, 0.15)',
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: 8,
    paddingTop: 8,
  },
  item: { alignItems: 'center', flex: 1 },
  icon: { color: '#59748f', fontSize: 20, height: 25 },
  label: { color: '#59748f', fontSize: 11, marginTop: 2, fontWeight: '600' },
  active: { color: '#00e5ff', textShadowColor: 'rgba(0, 229, 255, 0.6)', textShadowRadius: 8, fontWeight: '700' },
});
