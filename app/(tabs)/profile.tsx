import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import * as Clipboard from 'expo-clipboard';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, COLOR_SCHEMES } from '@/utils/theme';

export default function ProfileScreen() {
  const { user, isAuthenticated, login, register, logout, isLoading, error } = useAuth();
  const {
    distanceUnit,
    setDistanceUnit,
    showDistanceLabels,
    setShowDistanceLabels,
    autoRefresh,
    setAutoRefresh,
    themeMode,
    setThemeMode,
    colorScheme,
    setColorScheme,
  } = useSettings();

  const theme = useTheme(themeMode, colorScheme);

  const [showLogin, setShowLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleAuth = async () => {
    try {
      if (showLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, display_name: displayName || undefined });
      }
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch {
      Alert.alert('Error', error || 'Authentication failed');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  if (isAuthenticated && user) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>{user.email}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Display Name</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>{user.display_name || 'Not set'}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Friend Code</Text>
            <View style={styles.rowBetween}>
              <Text style={[styles.valueMono, { color: theme.colors.text }]}>{user.friend_code || 'Generating…'}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={async () => {
                  if (!user.friend_code) return;
                  try {
                    await Clipboard.setStringAsync(user.friend_code);
                    Alert.alert('Copied', 'Friend code copied to clipboard');
                  } catch (e) {
                    Alert.alert('Error', 'Failed to copy the code');
                  }
                }}
                style={[styles.copyButton, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>Share this code so friends can add you.</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Reputation</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>{user.reputation_score}</Text>
          </View>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.colors.error }]} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Settings</Text>

          <View style={[styles.settingRow, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Distance Unit</Text>
            <View style={styles.segmentControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  distanceUnit === 'miles' && [styles.segmentButtonActive, { backgroundColor: theme.colors.primary }],
                ]}
                onPress={() => setDistanceUnit('miles')}>
                <Text
                  style={[
                    styles.segmentText,
                    distanceUnit === 'miles' && styles.segmentTextActive,
                  ]}>
                  Miles
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  distanceUnit === 'km' && [styles.segmentButtonActive, { backgroundColor: theme.colors.primary }],
                ]}
                onPress={() => setDistanceUnit('km')}>
                <Text
                  style={[
                    styles.segmentText,
                    distanceUnit === 'km' && styles.segmentTextActive,
                  ]}>
                  Km
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.settingRow, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Show Distance Labels</Text>
            <Switch
              value={showDistanceLabels}
              onValueChange={setShowDistanceLabels}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={showDistanceLabels ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <View style={[styles.settingRow, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Auto Refresh Events</Text>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={autoRefresh ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <View style={[styles.settingRow, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Theme Mode</Text>
            <View style={styles.segmentControl}>
              <TouchableOpacity
                style={[styles.segmentButton, themeMode === 'light' && [styles.segmentButtonActive, { backgroundColor: theme.colors.primary }]]}
                onPress={() => setThemeMode('light')}>
                <Text
                  style={[styles.segmentText, themeMode === 'light' && styles.segmentTextActive]}>
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, themeMode === 'dark' && [styles.segmentButtonActive, { backgroundColor: theme.colors.primary }]]}
                onPress={() => setThemeMode('dark')}>
                <Text style={[styles.segmentText, themeMode === 'dark' && styles.segmentTextActive]}>
                  Dark
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, themeMode === 'system' && [styles.segmentButtonActive, { backgroundColor: theme.colors.primary }]]}
                onPress={() => setThemeMode('system')}>
                <Text
                  style={[styles.segmentText, themeMode === 'system' && styles.segmentTextActive]}>
                  Auto
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.settingRow, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Color Scheme</Text>
            <View style={styles.colorGrid}>
              {(['orange', 'pink', 'purple', 'blue', 'green', 'red'] as const).map((color) => {
                const colors = COLOR_SCHEMES[color];
                if (!colors) return null;
                const bgColor = theme.isDark ? colors.dark : colors.light;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorBox,
                      { backgroundColor: bgColor },
                      colorScheme === color && styles.colorBoxSelected,
                    ]}
                    onPress={() => setColorScheme(color)}>
                    <Text style={styles.colorName}>{color}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Login/Register Screen
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.authContainer}>
        <Text style={[styles.authTitle, { color: theme.colors.text }]}>PartyFinder</Text>
        <Text style={[styles.authSubtitle, { color: theme.colors.textSecondary }]}>
          {showLogin ? 'Login to your account' : 'Create a new account'}
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Email"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Password"
            placeholderTextColor={theme.colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {!showLogin && (
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Display Name (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
            />
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.authButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAuth}
          disabled={isLoading || !email || !password}>
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.authButtonText}>{showLogin ? 'Login' : 'Register'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowLogin(!showLogin)}>
          <Text style={[styles.switchText, { color: theme.colors.primary }]}>
            {showLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>

        <View style={styles.guestSection}>
          <Text style={[styles.guestText, { color: theme.colors.textSecondary }]}>
            Or continue as guest (limited features)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  valueMono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 16,
    letterSpacing: 0.5,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#3b82f6',
  },
  segmentText: {
    fontSize: 14,
    color: '#6b7280',
  },
  segmentTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: 200,
  },
  colorBox: {
    width: 60,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorBoxSelected: {
    borderColor: '#000',
    borderWidth: 3,
  },
  colorName: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  authContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#111827',
  },
  authSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  authButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    textAlign: 'center',
    color: '#3b82f6',
    fontSize: 14,
  },
  guestSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  guestText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
