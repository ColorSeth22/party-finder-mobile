import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/utils/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { themeMode, colorScheme } = useSettings();
  const theme = useTheme(themeMode, colorScheme);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>PartyFinder</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Discover the best campus events and parties happening near you
          </Text>
        </View>

        {isAuthenticated && user && (
          <View style={[styles.welcomeCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}>
            <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
              Welcome back, {user.display_name || user.email}!
            </Text>
            <Text style={[styles.reputationText, { color: theme.colors.textSecondary }]}>
              ⭐ Reputation: {user.reputation_score}
            </Text>
          </View>
        )}

        <View style={styles.features}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>Features</Text>

          <View style={[styles.feature, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>🗺️</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Interactive Map</Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                View all active events on a map with your current location
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>📋</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Events List</Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                Browse upcoming events sorted by time with distance info
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>👤</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>User Profile</Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                Login to favorite events and track your party history
              </Text>
            </View>
          </View>

          <View style={[styles.feature, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>📍</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Location-Based</Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                See how far events are from your current location
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cta}>
          <Text style={[styles.ctaTitle, { color: theme.colors.text }]}>Get Started</Text>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/(tabs)/map')}>
            <Text style={styles.ctaButtonText}>View Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaButtonSecondary, { backgroundColor: 'transparent', borderColor: theme.colors.primary }]}
            onPress={() => router.push('/(tabs)/events')}>
            <Text style={[styles.ctaButtonText, styles.ctaButtonTextSecondary, { color: theme.colors.primary }]}>
              Browse Events
            </Text>
          </TouchableOpacity>
          {!isAuthenticated && (
            <TouchableOpacity
              style={[styles.ctaButton, styles.ctaButtonSecondary, { backgroundColor: 'transparent', borderColor: theme.colors.primary }]}
              onPress={() => router.push('/(tabs)/profile')}>
              <Text style={[styles.ctaButtonText, styles.ctaButtonTextSecondary, { color: theme.colors.primary }]}>
                Login / Register
              </Text>
            </TouchableOpacity>
          )}
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
  content: {
    padding: 20,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  welcomeCard: {
    backgroundColor: '#dbeafe',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  reputationText: {
    fontSize: 14,
    color: '#1e40af',
  },
  features: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  feature: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  cta: {
    marginBottom: 40,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  ctaButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaButtonTextSecondary: {
    color: '#3b82f6',
  },
});
