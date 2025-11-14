import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type CheckInsContextType = {
  checkedInEventIds: Set<string>;
  isCheckingIn: string | null;
  checkIn: (eventId: string) => Promise<void>;
  refetchCheckIns: () => Promise<void>;
  isCheckedIn: (eventId: string) => boolean;
};

const CheckInsContext = createContext<CheckInsContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
  apiBaseUrl: string;
};

export function CheckInsProvider({ children, apiBaseUrl }: Props) {
  const { token, isAuthenticated } = useAuth();
  
  const [checkedInEventIds, setCheckedInEventIds] = useState<Set<string>>(new Set());
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null);
  
  // Fetch user's check-ins
  const refetchCheckIns = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setCheckedInEventIds(new Set());
      return;
    }
    
    try {
      const res = await fetch(`${apiBaseUrl}/api/checkins`, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        console.error('Failed to fetch check-ins:', res.status);
        return;
      }
      
      const data = await res.json() as { event_id: string }[];
      const eventIds = new Set(data.map((checkIn: any) => checkIn.event_id as string));
      setCheckedInEventIds(eventIds);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
    }
  }, [apiBaseUrl, token, isAuthenticated]);
  
  // Check in to an event
  const checkIn = useCallback(async (eventId: string): Promise<void> => {
    if (!token) throw new Error('Authentication required');
    
    setIsCheckingIn(eventId);
    
    try {
      const res = await fetch(`${apiBaseUrl}/api/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ event_id: eventId })
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to check in' }));
        throw new Error(error.error || 'Failed to check in');
      }
      
      // Optimistically update local state
      setCheckedInEventIds(prev => new Set(prev).add(eventId));
    } finally {
      setIsCheckingIn(null);
    }
  }, [apiBaseUrl, token]);
  
  // Helper to check if user is checked in to an event
  const isCheckedIn = useCallback((eventId: string): boolean => {
    return checkedInEventIds.has(eventId);
  }, [checkedInEventIds]);
  
  // Load check-ins on mount/auth change
  useEffect(() => {
    refetchCheckIns();
  }, [refetchCheckIns]);
  
  const value: CheckInsContextType = {
    checkedInEventIds,
    isCheckingIn,
    checkIn,
    refetchCheckIns,
    isCheckedIn
  };
  
  return (
    <CheckInsContext.Provider value={value}>
      {children}
    </CheckInsContext.Provider>
  );
}

export function useCheckInsContext() {
  const context = useContext(CheckInsContext);
  if (!context) {
    throw new Error('useCheckInsContext must be used within CheckInsProvider');
  }
  return context;
}
