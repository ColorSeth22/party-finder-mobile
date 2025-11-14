import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Event } from '@/types';

type EventsContextType = {
  // Live events
  events: Event[];
  eventsLoading: boolean;
  eventsError: string | null;
  
  // Archived events
  archivedEvents: Event[];
  archivedLoading: boolean;
  archivedAttendedIds: Set<string>;
  
  // Operations
  refetchEvents: () => Promise<void>;
  fetchArchivedEvents: () => Promise<void>;
  createEvent: (eventData: Partial<Event>) => Promise<Event>;
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<Event>;
  archiveEvent: (eventId: string) => Promise<void>;
  
  // Local state helpers
  invalidateEvents: () => void;
  invalidateArchived: () => void;
};

const EventsContext = createContext<EventsContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
  apiBaseUrl: string;
};

export function EventsProvider({ children, apiBaseUrl }: Props) {
  const { token, isAuthenticated } = useAuth();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  
  const [archivedEvents, setArchivedEvents] = useState<Event[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedAttendedIds, setArchivedAttendedIds] = useState<Set<string>>(new Set());
  
  // Fetch live events
  const refetchEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    
    try {
      const res = await fetch(`${apiBaseUrl}/api/events`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch events: ${res.status}`);
      }
      
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load events';
      setEventsError(message);
      console.error('Error fetching events:', err);
    } finally {
      setEventsLoading(false);
    }
  }, [apiBaseUrl]);
  
  // Fetch archived events (requires auth)
  const fetchArchivedEvents = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setArchivedEvents([]);
      setArchivedAttendedIds(new Set());
      return;
    }
    
    setArchivedLoading(true);
    
    try {
      const headers = { 'authorization': `Bearer ${token}` } as const;
      const [hostRes, attendedRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/events/archived?role=host`, { headers }),
        fetch(`${apiBaseUrl}/api/events/archived?role=attended`, { headers })
      ]);
      
      const hostData = hostRes.ok ? await hostRes.json() : [];
      const attendedData = attendedRes.ok ? await attendedRes.json() : [];
      
      // Track attended events for permissions
      setArchivedAttendedIds(new Set(attendedData.map((e: any) => e.id)));
      
      // Deduplicate and merge
      const combined = [...hostData, ...attendedData];
      const dedupMap = new Map<string, any>();
      for (const e of combined) {
        if (!dedupMap.has(e.id)) dedupMap.set(e.id, e);
      }
      
      const mapped: Event[] = Array.from(dedupMap.values()).map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? null,
        host_type: e.host_type || 'house',
        location_lat: e.location_lat ?? 0,
        location_lng: e.location_lng ?? 0,
        start_time: e.start_time,
        end_time: e.end_time || null,
        tags: e.tags || [],
        theme: e.theme || null,
        music_type: e.music_type || null,
        cover_charge: e.cover_charge || null,
        is_byob: !!e.is_byob,
        is_active: !!e.is_active,
        created_by: e.created_by,
        user_id: e.user_id || e.created_by,
        created_at: e.created_at,
        checkin_count: e.checkin_count,
        visibility: e.visibility || 'everyone',
        is_archived: e.is_archived,
        archived_at: e.archived_at || null
      }));
      
      setArchivedEvents(
        mapped.sort((a, b) => 
          (b.archived_at ? new Date(b.archived_at).getTime() : 0) - 
          (a.archived_at ? new Date(a.archived_at).getTime() : 0)
        )
      );
    } catch (err) {
      console.error('Error fetching archived events:', err);
    } finally {
      setArchivedLoading(false);
    }
  }, [apiBaseUrl, token, isAuthenticated]);
  
  // Create event
  const createEvent = useCallback(async (eventData: Partial<Event>): Promise<Event> => {
    if (!token) throw new Error('Authentication required');
    
    const res = await fetch(`${apiBaseUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to create event' }));
      throw new Error(error.error || 'Failed to create event');
    }
    
    const newEvent = await res.json();
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, [apiBaseUrl, token]);
  
  // Update event
  const updateEvent = useCallback(async (eventId: string, eventData: Partial<Event>): Promise<Event> => {
    if (!token) throw new Error('Authentication required');
    
    const res = await fetch(`${apiBaseUrl}/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to update event' }));
      throw new Error(error.error || 'Failed to update event');
    }
    
    const updatedEvent = await res.json();
    setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
    return updatedEvent;
  }, [apiBaseUrl, token]);
  
  // Archive event
  const archiveEvent = useCallback(async (eventId: string): Promise<void> => {
    if (!token) throw new Error('Authentication required');
    
    const res = await fetch(`${apiBaseUrl}/api/events/${eventId}/archive`, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      throw new Error('Failed to archive event');
    }
    
    // Remove from live events, will appear in archived after refetch
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, [apiBaseUrl, token]);
  
  // Cache invalidation helpers
  const invalidateEvents = useCallback(() => {
    refetchEvents();
  }, [refetchEvents]);
  
  const invalidateArchived = useCallback(() => {
    fetchArchivedEvents();
  }, [fetchArchivedEvents]);
  
  // Initial load
  useEffect(() => {
    refetchEvents();
  }, [refetchEvents]);
  
  const value: EventsContextType = {
    events,
    eventsLoading,
    eventsError,
    archivedEvents,
    archivedLoading,
    archivedAttendedIds,
    refetchEvents,
    fetchArchivedEvents,
    createEvent,
    updateEvent,
    archiveEvent,
    invalidateEvents,
    invalidateArchived
  };
  
  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEventsContext() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEventsContext must be used within EventsProvider');
  }
  return context;
}
