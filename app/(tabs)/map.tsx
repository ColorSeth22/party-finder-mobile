import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, Modal, Alert } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useEvents } from '@/hooks/useEvents';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/contexts/FriendsContext';
import { getDistanceKm, formatDistance } from '@/utils/distance';
import { API_BASE_URL, DEFAULT_MAP_REGION, USER_LOCATION_RADIUS } from '@/config';
import AddEditEventForm from '@/components/AddEditEventForm';
import type { Event } from '@/types';

const HOST_LABELS: Record<Event['host_type'], string> = {
  fraternity: 'Fraternity/Greek',
  house: 'House Party',
  club: 'Campus Club',
};

export default function MapScreen() {
  const { coords, refetch: refetchLocation } = useGeolocation();
  const { events, loading: eventsLoading, refetch: refetchEvents } = useEvents(API_BASE_URL, true);
  const { distanceUnit, showDistanceLabels } = useSettings();
  const { user, isAuthenticated } = useAuth();
  const { friends } = useFriends();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchEvents(), refetchLocation()]);
    setRefreshing(false);
  }, [refetchEvents, refetchLocation]);

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

  const handleDeleteEvent = async (event: Event) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to delete events');
      return;
    }
    if (user?.user_id !== event.created_by) {
      Alert.alert('Permission Denied', 'You can only delete your own events');
      return;
    }

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/events/${event.id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${user?.user_id}`,
                },
              });

              if (!res.ok) {
                throw new Error('Failed to delete event');
              }

              Alert.alert('Success', 'Event deleted successfully');
              setSelectedEvent(null);
              refetchEvents();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const handleEventCreated = () => {
    setShowAddEditModal(false);
    setEventToEdit(null);
    refetchEvents();
  };

  const initialRegion = coords
    ? {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : DEFAULT_MAP_REGION;

  const activeEvents = useMemo(() => {
    const friendUserIds = new Set(friends.map(f => f.user_id));
    
    return events.filter((e) => {
      if (!e.is_active) return false;
      
      // Show all 'everyone' events
      if (!e.visibility || e.visibility === 'everyone') return true;
      
      // For 'friends' events, only show if user is friends with the creator
      if (e.visibility === 'friends') {
        return friendUserIds.has(e.user_id);
      }
      
      return false;
    });
  }, [events, friends]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton>
        {coords && (
          <Circle
            center={{ latitude: coords.latitude, longitude: coords.longitude }}
            radius={USER_LOCATION_RADIUS}
            fillColor="rgba(59, 130, 246, 0.2)"
            strokeColor="rgba(59, 130, 246, 0.5)"
            strokeWidth={2}
          />
        )}
        {activeEvents.map((event) => (
          <Marker
            key={event.id}
            coordinate={{
              latitude: event.location_lat,
              longitude: event.location_lng,
            }}
            title={event.title}
            description={event.description || undefined}
            onPress={() => setSelectedEvent(event)}
            pinColor="#ef4444"
          />
        ))}
      </MapView>

      {selectedEvent && (
        <View style={styles.eventCard}>
          <ScrollView
            style={styles.eventScrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
            <Text style={styles.eventHost}>{HOST_LABELS[selectedEvent.host_type]}</Text>
            {selectedEvent.description && (
              <Text style={styles.eventDescription}>{selectedEvent.description}</Text>
            )}
            <View style={styles.eventDetails}>
              <Text style={styles.eventDetailText}>
                🎉 Starts: {new Date(selectedEvent.start_time).toLocaleString()}
              </Text>
              {selectedEvent.end_time && (
                <Text style={styles.eventDetailText}>
                  ⏰ Ends: {new Date(selectedEvent.end_time).toLocaleString()}
                </Text>
              )}
              {selectedEvent.theme && (
                <Text style={styles.eventDetailText}>🎭 Theme: {selectedEvent.theme}</Text>
              )}
              {selectedEvent.music_type && (
                <Text style={styles.eventDetailText}>🎵 Music: {selectedEvent.music_type}</Text>
              )}
              {selectedEvent.cover_charge && (
                <Text style={styles.eventDetailText}>💵 Cover: {selectedEvent.cover_charge}</Text>
              )}
              {selectedEvent.is_byob && <Text style={styles.eventDetailText}>🍺 BYOB</Text>}
              {coords && showDistanceLabels && (
                <Text style={styles.eventDetailText}>
                  📍{' '}
                  {formatDistance(
                    getDistanceKm(
                      coords.latitude,
                      coords.longitude,
                      selectedEvent.location_lat,
                      selectedEvent.location_lng
                    ),
                    distanceUnit
                  )}
                </Text>
              )}
            </View>
            {user?.user_id === selectedEvent.created_by && (
              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditEvent(selectedEvent)}>
                  <Text style={styles.editButtonText}>✏️ Edit Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteEvent(selectedEvent)}>
                  <Text style={styles.deleteButtonText}>🗑️ Delete Event</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedEvent(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Add Event FAB */}
      {isAuthenticated && (
        <TouchableOpacity style={styles.fab} onPress={handleAddEvent}>
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

      {eventsLoading && !selectedEvent && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  eventCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventScrollView: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventHost: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  eventDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
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
  loadingOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#374151',
  },
});
