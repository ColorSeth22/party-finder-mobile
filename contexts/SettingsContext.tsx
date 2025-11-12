import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SettingsState, DistanceUnit, ThemeMode, ColorScheme } from '../types';

const SETTINGS_KEY = '@partyfinder_settings';

type SettingsContextType = SettingsState & {
  setDistanceUnit: (unit: DistanceUnit) => void;
  setShowDistanceLabels: (show: boolean) => void;
  setAutoRefresh: (auto: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
};

const defaultSettings: SettingsState = {
  distanceUnit: 'miles',
  showDistanceLabels: true,
  autoRefresh: true,
  themeMode: 'system',
  colorScheme: 'orange',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function SettingsProvider({ children }: Props) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge with defaults to handle missing properties from old versions
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };

    loadSettings();
  }, []);

  // Save settings whenever they change
  const updateSettings = async (newSettings: SettingsState) => {
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const setDistanceUnit = (unit: DistanceUnit) => {
    updateSettings({ ...settings, distanceUnit: unit });
  };

  const setShowDistanceLabels = (show: boolean) => {
    updateSettings({ ...settings, showDistanceLabels: show });
  };

  const setAutoRefresh = (auto: boolean) => {
    updateSettings({ ...settings, autoRefresh: auto });
  };

  const setThemeMode = (themeMode: ThemeMode) => {
    updateSettings({ ...settings, themeMode });
  };

  const setColorScheme = (colorScheme: ColorScheme) => {
    updateSettings({ ...settings, colorScheme });
  };

  const value: SettingsContextType = {
    ...settings,
    setDistanceUnit,
    setShowDistanceLabels,
    setAutoRefresh,
    setThemeMode,
    setColorScheme,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
