import { useState, useEffect, useCallback, useRef } from 'react';
import type { Event } from '../types';

type UseEventsReturn = {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useEvents(apiBaseUrl: string, autoRefresh = true): UseEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRefreshingRef = useRef(false);

  const fetchEvents = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${apiBaseUrl}/api/events`);
      if (!res.ok) {
        throw new Error('Failed to load events');
      }

      const data = (await res.json()) as Event[];
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchEvents();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchEvents, autoRefresh]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
}
