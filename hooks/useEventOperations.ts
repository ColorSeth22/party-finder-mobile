import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import type { Event } from '@/types';
import { useEventsContext } from '@/contexts/EventsContext';
import { useAuth } from '@/contexts/AuthContext';

interface UseEventOperationsResult {
  showAddEditModal: boolean;
  eventToEdit: Event | null;
  handleAddEvent: () => void;
  handleEditEvent: (event: Event) => void;
  handleEndEvent: (event: Event) => Promise<void>;
  handleEventCreated: () => void;
  setShowAddEditModal: (show: boolean) => void;
}

export function useEventOperations(): UseEventOperationsResult {
  const { isAuthenticated, user } = useAuth();
  const { archiveEvent, invalidateEvents, invalidateArchived } = useEventsContext();
  
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  const handleAddEvent = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to create events');
      return;
    }
    setEventToEdit(null);
    setShowAddEditModal(true);
  }, [isAuthenticated]);

  const handleEditEvent = useCallback((event: Event) => {
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
  }, [isAuthenticated, user?.user_id]);

  const handleEndEvent = useCallback(async (event: Event) => {
    if (!isAuthenticated) {
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
              await archiveEvent(event.id);
              Alert.alert('Success', 'Event ended and archived successfully');
              invalidateEvents();
              invalidateArchived();
            } catch {
              Alert.alert('Error', 'Failed to end event');
            }
          },
        },
      ]
    );
  }, [isAuthenticated, user?.user_id, archiveEvent, invalidateEvents, invalidateArchived]);

  const handleEventCreated = useCallback(() => {
    setShowAddEditModal(false);
    setEventToEdit(null);
    invalidateEvents();
  }, [invalidateEvents]);

  return {
    showAddEditModal,
    eventToEdit,
    handleAddEvent,
    handleEditEvent,
    handleEndEvent,
    handleEventCreated,
    setShowAddEditModal
  };
}
