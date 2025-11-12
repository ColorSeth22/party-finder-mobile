import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import FriendsScreen from '@/components/FriendsScreen';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/utils/theme';

export default function FriendsTab() {
  const { themeMode, colorScheme } = useSettings();
  const theme = useTheme(themeMode, colorScheme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FriendsScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
