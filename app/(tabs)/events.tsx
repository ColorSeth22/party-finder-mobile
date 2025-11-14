import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/contexts/FriendsContext';
import { useEventsContext } from '@/contexts/EventsContext';
import { useArchivedEvents } from '@/hooks/useArchivedEvents';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useEventOperations } from '@/hooks/useEventOperations';
import { getDistanceKm } from '@/utils/distance';
import { filterAndDecorateEvents, decorateArchivedEvents } from '@/utils/eventFilters';
import AddEditEventForm from '@/components/AddEditEventForm';
import EventCard from '@/components/EventCard';
import MediaModal from '@/components/MediaModal';
import { useTheme } from '@/utils/theme';
import { layoutStyles } from '@/styles/layout';
import { buttonStyles } from '@/styles/buttons';
import { eventCardStyles } from '@/styles/eventCard';
import type { Event } from '@/types';

type EventWithDistance = Event & {
  distanceKm: number | null;
};

export default function EventsListScreen() {
  const { events, eventsLoading, refetchEvents } = useEventsContext();
  const { coords } = useGeolocation();
  const { distanceUnit, themeMode, colorScheme } = useSettings();
  const { user, isAuthenticated, token } = useAuth();
  const { friends } = useFriends();
  const theme = useTheme(themeMode, colorScheme);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaEvent, setMediaEvent] = useState<Event | null>(null);

  // Custom hooks for modular logic
  const { archivedEvents, loadingArchived, archivedAttendedIds, fetchArchived } = useArchivedEvents();

  const { checkedInIds, checkingIn, handleCheckIn } = useCheckIn({
    coords,
    distanceUnit,
    onSuccess: refetchEvents
  });

  const {
    showAddEditModal,
    eventToEdit,
    handleAddEvent,
    handleEditEvent,
    handleEndEvent,
    handleEventCreated,
    setShowAddEditModal
  } = useEventOperations();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchEvents();
    setRefreshing(false);
  }, [refetchEvents]);

  const liveDecoratedEvents = useMemo<EventWithDistance[]>(() => {
    return filterAndDecorateEvents({
      events,
      coords,
      friends,
      getDistanceKm
    });
  }, [events, coords, friends]);

  const archivedDecoratedEvents = useMemo<EventWithDistance[]>(() => {
    return decorateArchivedEvents(archivedEvents);
  }, [archivedEvents]);

  if (!showArchived && eventsLoading && events.length === 0) {
    return (
      <View style={[layoutStyles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[layoutStyles.loadingText, { color: theme.colors.text }]}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={[layoutStyles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[layoutStyles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[layoutStyles.title, { color: theme.colors.text }]}>{showArchived ? 'Archived Events (Hosted or Attended)' : 'Upcoming Events'}</Text>
        <Text style={[layoutStyles.subtitle, { color: theme.colors.textSecondary }]}> {showArchived ? archivedEvents.length : liveDecoratedEvents.length} events</Text>
      </View>
      {isAuthenticated && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            style={[buttonStyles.checkInButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              if (!showArchived) {
                fetchArchived();
              }
              setShowArchived(prev => !prev);
            }}
          >
            <Text style={[buttonStyles.checkInButtonText, { color: '#fff' }]}>{showArchived ? 'Show Live' : 'Show Archived'}</Text>
          </TouchableOpacity>
          {showArchived && (
            <TouchableOpacity
              style={[buttonStyles.checkInButton, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}
              onPress={fetchArchived}
              disabled={loadingArchived}
            >
              <Text style={[buttonStyles.checkInButtonText, { color: theme.colors.text }]}>{loadingArchived ? 'Refreshing…' : 'Refresh'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <ScrollView
        style={layoutStyles.scrollView}
        contentContainerStyle={eventCardStyles.eventScrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}>
        {(showArchived ? archivedDecoratedEvents : liveDecoratedEvents).length === 0 ? (
          <View style={layoutStyles.emptyState}>
            <Text style={[layoutStyles.emptyText, { color: theme.colors.text }]}>{showArchived ? 'No archived events yet' : 'No upcoming events'}</Text>
            <Text style={[layoutStyles.emptySubtext, { color: theme.colors.textSecondary }]}>{showArchived ? 'Archive events you host to see them here.' : 'Check back later!'}</Text>
          </View>
        ) : (
          (showArchived ? archivedDecoratedEvents : liveDecoratedEvents).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isExpanded={expandedId === event.id}
              isOwner={user?.user_id === event.created_by}
              distanceKm={event.distanceKm}
              distanceUnit={distanceUnit}
              theme={theme}
              showCheckIn={isAuthenticated && user?.user_id !== event.created_by && !event.is_archived}
              isCheckedIn={checkedInIds.has(event.id)}
              isCheckingIn={checkingIn === event.id}
              onToggleExpand={() => {
                if (event.is_archived) {
                  setMediaEvent(event);
                  setShowMediaModal(true);
                } else {
                  setExpandedId(expandedId === event.id ? null : event.id);
                }
              }}
              onEdit={() => handleEditEvent(event)}
              onEnd={() => handleEndEvent(event)}
              onCheckIn={() => handleCheckIn(event)}
              ReplaySlot={null}
            />
          ))
        )}
      </ScrollView>

      {/* Add Event FAB */}
      {isAuthenticated && !showArchived && (
        <TouchableOpacity style={[buttonStyles.fab, { backgroundColor: theme.colors.primary }]} onPress={handleAddEvent}>
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

      {/* Archived Media Modal */}
      <MediaModal
        visible={showMediaModal}
        event={mediaEvent}
        token={token || null}
        isHost={user?.user_id === mediaEvent?.created_by}
        isAttendee={archivedAttendedIds.has(mediaEvent?.id || '')}
        theme={theme}
        onClose={() => { setShowMediaModal(false); setMediaEvent(null); }}
      />
    </View>
  );
}
