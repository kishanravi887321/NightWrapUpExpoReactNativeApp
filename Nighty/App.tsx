import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppInner from './src/App';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}
