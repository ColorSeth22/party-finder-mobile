import { useCallback } from 'react';
import { Alert } from 'react-native';
import type { Event } from '@/types';
import { getDistanceKm, formatDistance } from '@/utils/distance';
import { useCheckInsContext } from '@/contexts/CheckInsContext';
import { useEventsContext } from '@/contexts/EventsContext';

const CHECK_IN_RADIUS_KM = 0.1; // 100 meters

interface UseCheckInResult {
  checkedInIds: Set<string>;
  checkingIn: string | null;
  handleCheckIn: (event: Event) => Promise<void>;
}

interface UseCheckInOptions {
  coords: { latitude: number; longitude: number } | null;
  distanceUnit: 'km' | 'miles';
  onSuccess?: () => void;
}

export function useCheckIn(options: UseCheckInOptions): UseCheckInResult {
  const { coords, distanceUnit, onSuccess } = options;
  const { checkedInEventIds, isCheckingIn, checkIn } = useCheckInsContext();
  const { invalidateEvents } = useEventsContext();

  const handleCheckIn = useCallback(async (event: Event) => {
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

    try {
      await checkIn(event.id);
      Alert.alert('Success', 'Checked in! Have fun 🎉');
      invalidateEvents(); // Refresh to get updated check-in count
      onSuccess?.();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to check in');
    }
  }, [coords, distanceUnit, checkIn, invalidateEvents, onSuccess]);

  return {
    checkedInIds: checkedInEventIds,
    checkingIn: isCheckingIn,
    handleCheckIn
  };
}
