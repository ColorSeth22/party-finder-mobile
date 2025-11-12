import { useColorScheme as useRNColorScheme } from 'react-native';
import type { ColorScheme, ThemeMode } from '../types';

export const COLOR_SCHEMES: Record<
  ColorScheme,
  { light: string; dark: string; secondary: string }
> = {
  orange: {
    light: '#ff6b35',
    dark: '#ff9d6c',
    secondary: '#f7931e',
  },
  pink: {
    light: '#e91e63',
    dark: '#f48fb1',
    secondary: '#ff4081',
  },
  purple: {
    light: '#9c27b0',
    dark: '#ce93d8',
    secondary: '#ab47bc',
  },
  blue: {
    light: '#2196f3',
    dark: '#64b5f6',
    secondary: '#42a5f5',
  },
  green: {
    light: '#4caf50',
    dark: '#81c784',
    secondary: '#66bb6a',
  },
  red: {
    light: '#f44336',
    dark: '#e57373',
    secondary: '#ef5350',
  },
};

export type Theme = {
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
};

export function useTheme(themeMode: ThemeMode = 'system', colorScheme: ColorScheme = 'orange'): Theme {
  const systemColorScheme = useRNColorScheme();

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const schemeColors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.orange;

  return {
    isDark,
    colors: {
      primary: isDark ? schemeColors.dark : schemeColors.light,
      secondary: schemeColors.secondary,
      background: isDark ? '#121212' : '#fafafa',
      card: isDark ? '#1e1e1e' : '#ffffff',
      text: isDark ? '#ffffff' : '#000000',
      textSecondary: isDark ? '#b0b0b0' : '#666666',
      border: isDark ? '#333333' : '#e0e0e0',
      error: '#f44336',
      success: '#4caf50',
      warning: '#ff9800',
    },
  };
}
