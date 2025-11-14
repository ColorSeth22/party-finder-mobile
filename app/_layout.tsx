import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { FriendsProvider } from '@/contexts/FriendsContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { CheckInsProvider } from '@/contexts/CheckInsContext';
import { API_BASE_URL } from '@/config';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider apiBaseUrl={API_BASE_URL}>
      <SettingsProvider>
        <FriendsProvider>
          <EventsProvider apiBaseUrl={API_BASE_URL}>
            <CheckInsProvider apiBaseUrl={API_BASE_URL}>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                </Stack>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
              </ThemeProvider>
            </CheckInsProvider>
          </EventsProvider>
        </FriendsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
