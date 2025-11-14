import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/utils/theme';

export default function DiagnosticsScreen() {
  const { user, token, isAuthenticated } = useAuth();
  const { themeMode, colorScheme } = useSettings();
  const theme = useTheme(themeMode, colorScheme);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const testAuth = async () => {
    if (!API_BASE_URL) {
      Alert.alert('Config', 'API base URL is not set');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      if (!token) {
        setResult('Error: No token present. Please log in.');
        return;
      }

      // 1) Create a minimal event
      const start = new Date();
      start.setMinutes(start.getMinutes() + 5);
      const createPayload = {
        title: 'Diagnostics Ping',
        host_type: 'house',
        location_lat: 42.0267,
        location_lng: -93.6465,
        start_time: start.toISOString(),
        visibility: 'everyone',
      };
      const createRes = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(createPayload),
      });
      const createText = await createRes.text();

      if (!createRes.ok) {
        setResult(`Create failed: HTTP ${createRes.status}\n${createText.slice(0, 800)}`);
        return;
      }

      let createdId: string | null = null;
      try {
        const parsed = JSON.parse(createText);
        createdId = parsed?.id || parsed?.event_id || null;
      } catch {}

      // 2) If created, attempt to delete it
      let deleteStatus = '';
      if (createdId) {
        const deleteRes = await fetch(`${API_BASE_URL}/api/events/${createdId}`, {
          method: 'DELETE',
          headers: { 'authorization': `Bearer ${token}` },
        });
        const deleteText = await deleteRes.text();
        deleteStatus = `Delete: HTTP ${deleteRes.status}\n${deleteText.slice(0, 400)}`;
      } else {
        deleteStatus = 'Delete: Skipped (could not parse created event id)';
      }

      setResult(`Create: HTTP ${createRes.status}\n${createText.slice(0, 400)}\n\n${deleteStatus}`);
    } catch (e: any) {
      setResult(`Error: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    user?.email === process.env.EXPO_PUBLIC_DIAGNOSTICS_USER_EMAIL && <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
        <Text style={[styles.title, { color: theme.colors.text }]}>Diagnostics</Text>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>API Base URL</Text>
        <Text style={[styles.value, { color: theme.colors.text }]} selectable>{API_BASE_URL || '(not set)'}</Text>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Authenticated</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{isAuthenticated ? 'Yes' : 'No'}</Text>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>User</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{user?.email || '(none)'}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={testAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create + Delete Test Event</Text>}
        </TouchableOpacity>
        {result && (
          <View style={[styles.resultBox, { borderColor: theme.colors.border }]}> 
            <Text style={[styles.resultText, { color: theme.colors.text }]} selectable>{result}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: 16, padding: 16, borderRadius: 8, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  label: { marginTop: 8, fontSize: 12 },
  value: { fontSize: 14, marginTop: 2 },
  button: { marginTop: 16, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  resultBox: { marginTop: 16, borderWidth: 1, borderRadius: 8, padding: 12 },
  resultText: { fontFamily: 'monospace', fontSize: 12 },
});
