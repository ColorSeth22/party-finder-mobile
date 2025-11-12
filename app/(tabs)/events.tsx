import { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useEvents } from '@/hooks/useEvents';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDistanceKm, formatDistance } from '@/utils/distance';
import { API_BASE_URL } from '@/config';
import AddEditEventForm from '@/components/AddEditEventForm';
import { useTheme } from '@/utils/theme';
import type { Event } from '@/types';

const HOST_LABELS: Record<Event['host_type'], string> = {
  fraternity: 'Fraternity/Greek',
  house: 'House Party',
  club: 'Campus Club',
};

type EventWithDistance = Event & {
  distanceKm: number | null;
};

export default function EventsListScreen() {
  const { events, loading, refetch } = useEvents(API_BASE_URL, true);
  const { coords } = useGeolocation();
  const { distanceUnit, themeMode, colorScheme } = useSettings();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme(themeMode, colorScheme);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAddEvent = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to create events');
      return;
    }
    setEventToEdit(null);
    setShowAddEditModal(true);
  };

  const handleEditEvent = (event: Event) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to edit events');
      return;
    }
    if (user?.user_id !== event.created_by) {
      Alert.alert('Permission Denied', 'You can only edit your own events');
      return;
    }
    setEventToEdit(event);
    setShowAddEditModal(true);
  };

  const handleEventCreated = () => {
    setShowAddEditModal(false);
    setEventToEdit(null);
    refetch();
  };

  const decoratedEvents = useMemo<EventWithDistance[]>(() => {
    const now = new Date();

    // Filter to only show events that haven't ended yet
    const upcoming = events.filter((event) => {
      if (!event.is_active) return false;

      // If there's an end_time, check if it's in the future
      if (event.end_time) {
        const endTime = new Date(event.end_time);
        return endTime > now;
      }

      // If no end_time, always show active events
      return true;
    });

    return upcoming
      .map((event) => {
        const distanceKm = coords
          ? getDistanceKm(coords.latitude, coords.longitude, event.location_lat, event.location_lng)
          : null;
        return { ...event, distanceKm };
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [events, coords]);

  if (loading && events.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Upcoming Events</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{decoratedEvents.length} events</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}>
        {decoratedEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No upcoming events</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Check back later!</Text>
          </View>
        ) : (
          decoratedEvents.map((event) => {
            const isExpanded = expandedId === event.id;
            return (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => setExpandedId(isExpanded ? null : event.id)}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, { color: theme.colors.text }]}>{event.title}</Text>
                  {event.distanceKm !== null && (
                    <Text style={[styles.distance, { color: theme.colors.primary }]}>
                      {formatDistance(event.distanceKm, distanceUnit)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.eventHost, { color: theme.colors.textSecondary }]}>{HOST_LABELS[event.host_type]}</Text>
                <Text style={[styles.eventTime, { color: theme.colors.text }]}>
                  🎉 {new Date(event.start_time).toLocaleString()}
                </Text>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {event.description && (
                      <Text style={[styles.eventDescription, { color: theme.colors.text }]}>{event.description}</Text>
                    )}
                    <View style={styles.eventDetails}>
                      {event.end_time && (
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                          ⏰ Ends: {new Date(event.end_time).toLocaleString()}
                        </Text>
                      )}
                      {event.theme && <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>🎭 Theme: {event.theme}</Text>}
                      {event.music_type && (
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>🎵 Music: {event.music_type}</Text>
                      )}
                      {event.cover_charge && (
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>💵 Cover: {event.cover_charge}</Text>
                      )}
                      {event.is_byob && <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>🍺 BYOB</Text>}
                      {event.checkin_count !== undefined && (
                        <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                          👥 {event.checkin_count} checked in
                        </Text>
                      )}
                    </View>
                    {event.tags && event.tags.length > 0 && (
                      <View style={styles.tags}>
                        {event.tags.map((tag) => (
                          <View key={tag} style={[styles.tag, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
                            <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {user?.user_id === event.created_by && (
                      <TouchableOpacity
                        style={[styles.editEventButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleEditEvent(event)}>
                        <Text style={styles.editEventButtonText}>✏️ Edit This Event</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Event FAB */}
      {isAuthenticated && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={handleAddEvent}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add/Edit Event Modal */}
      <Modal
        visible={showAddEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddEditModal(false)}>
        <AddEditEventForm
          onClose={() => setShowAddEditModal(false)}
          onEventCreated={handleEventCreated}
          existingEvent={eventToEdit}
          userLocation={coords}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  eventCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  distance: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  eventHost: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  eventDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  editEventButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  editEventButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
