import type { Event } from '@/types';

type EventWithDistance = Event & {
  distanceKm: number | null;
};

interface FilterEventsOptions {
  events: Event[];
  coords: { latitude: number; longitude: number } | null;
  friends: { user_id: string }[];
  getDistanceKm: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
}

/**
 * Filters and decorates live events with distance calculations
 */
export function filterAndDecorateEvents({
  events,
  coords,
  friends,
  getDistanceKm
}: FilterEventsOptions): EventWithDistance[] {
  const now = new Date();
  const friendUserIds = new Set(friends.map(f => f.user_id));

  // Filter to only show events that haven't ended yet and match visibility rules
  const upcoming = events.filter((event) => {
    if (!event.is_active) return false;

    // If there's an end_time, check if it's in the future
    if (event.end_time) {
      const endTime = new Date(event.end_time);
      if (endTime <= now) return false;
    }

    // Apply visibility filtering
    if (!event.visibility || event.visibility === 'everyone') return true;
    
    // For 'friends' events, only show if user is friends with the creator
    if (event.visibility === 'friends') {
      return friendUserIds.has(event.user_id);
    }

    return false;
  });

  return upcoming
    .map((event) => {
      const distanceKm = coords
        ? getDistanceKm(coords.latitude, coords.longitude, event.location_lat, event.location_lng)
        : null;
      return { ...event, distanceKm };
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

/**
 * Decorates archived events (no filtering needed, just add distance placeholder)
 */
export function decorateArchivedEvents(events: Event[]): EventWithDistance[] {
  return events.map(ev => ({ ...ev, distanceKm: null }));
}
