import { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useEvents } from '@/hooks/useEvents';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/contexts/FriendsContext';
import { getDistanceKm, formatDistance } from '@/utils/distance';
import { API_BASE_URL, DEFAULT_MAP_REGION, USER_LOCATION_RADIUS } from '@/config';
import AddEditEventForm from '@/components/AddEditEventForm';
import MapEventCard from '@/components/MapEventCard';
import { layoutStyles } from '@/styles/layout';
import { buttonStyles } from '@/styles/buttons';
import { mapStyles } from '@/styles/map';
import type { Event } from '@/types';

const CHECK_IN_RADIUS_KM = 0.1; // 100 meters

export default function MapScreen() {
  const { coords, refetch: refetchLocation } = useGeolocation();
  const { events, loading: eventsLoading, refetch: refetchEvents } = useEvents(API_BASE_URL, true);
  const { distanceUnit, showDistanceLabels } = useSettings();
  const { user, isAuthenticated, token } = useAuth();
  const { friends } = useFriends();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

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
            } catch {
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

  const handleEndEvent = async (event: Event) => {
    if (!isAuthenticated || !token) {
      Alert.alert('Login Required', 'Please login to end events');
      return;
    }

    if (user?.user_id !== event.created_by) {
      Alert.alert('Permission Denied', 'You can only end your own events');
      return;
    }

    Alert.alert(
      'End Event',
      'Are you sure you want to end this event and archive it?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Event',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/events/${event.id}/archive`, {
                method: 'POST',
                headers: {
                  'authorization': `Bearer ${token}`,
                },
              });

              if (!res.ok) {
                throw new Error('Failed to end event');
              }

              Alert.alert('Success', 'Event ended and archived successfully');
              setSelectedEvent(null);
              refetchEvents();
            } catch {
              Alert.alert('Error', 'Failed to end event');
            }
          },
        },
      ]
    );
  };

  const handleCheckIn = async (event: Event) => {
    if (!isAuthenticated || !token) {
      Alert.alert('Login Required', 'Please login to check in');
      return;
    }

    if (!coords) {
      Alert.alert('Location Required', 'Enable location services to check in');
      return;
    }

    // Check if event has started
    const now = new Date();
    const startTime = new Date(event.start_time);
    if (now < startTime) {
      Alert.alert('Too Early', 'This event hasn\'t started yet!');
      return;
    }

    // Check proximity (100m radius)
    const distance = getDistanceKm(
      coords.latitude,
      coords.longitude,
      event.location_lat,
      event.location_lng
    );

    if (distance > CHECK_IN_RADIUS_KM) {
      const distanceText = formatDistance(distance, distanceUnit);
      Alert.alert(
        'Too Far Away',
        `You must be within 100m of the event to check in. You are currently ${distanceText} away.`
      );
      return;
    }

    setCheckingIn(event.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: event.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to check in');
      }

      setCheckedInIds(prev => new Set(prev).add(event.id));
      Alert.alert('Success', 'Checked in! Have fun 🎉');
      refetchEvents(); // Refresh to get updated check-in count
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to check in');
    } finally {
      setCheckingIn(null);
    }
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
    <View style={layoutStyles.container}>
      <MapView
        style={mapStyles.map}
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
        <MapEventCard
          event={selectedEvent}
          isOwner={user?.user_id === selectedEvent.created_by}
          coords={coords}
          distanceUnit={distanceUnit}
          showDistanceLabels={showDistanceLabels}
          refreshing={refreshing}
          isCheckedIn={checkedInIds.has(selectedEvent.id)}
          isCheckingIn={checkingIn === selectedEvent.id}
          onRefresh={onRefresh}
          onEdit={() => handleEditEvent(selectedEvent)}
          onEnd={() => handleEndEvent(selectedEvent)}
          onDelete={() => handleDeleteEvent(selectedEvent)}
          onCheckIn={() => handleCheckIn(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Add Event FAB */}
      {isAuthenticated && (
        <TouchableOpacity style={[buttonStyles.fab, { backgroundColor: '#3b82f6' }]} onPress={handleAddEvent}>
          <Text style={buttonStyles.fabText}>+</Text>
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
        <View style={layoutStyles.loadingOverlay}>
          <Text style={[layoutStyles.loadingText, { color: '#374151' }]}>Loading events...</Text>
        </View>
      )}
    </View>
  );
}
