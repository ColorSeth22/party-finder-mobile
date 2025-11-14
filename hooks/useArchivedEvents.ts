import { useEventsContext } from '@/contexts/EventsContext';

/**
 * Hook to access archived events from context
 * @deprecated Use useEventsContext directly for better performance
 */
export function useArchivedEvents() {
  const { archivedEvents, archivedLoading, archivedAttendedIds, fetchArchivedEvents } = useEventsContext();
  
  return {
    archivedEvents,
    loadingArchived: archivedLoading,
    archivedAttendedIds,
    fetchArchived: fetchArchivedEvents
  };
}
