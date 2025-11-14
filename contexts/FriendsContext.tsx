import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Friend, FriendRequest } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

type FriendsContextType = {
  friends: Friend[];
  friendRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  isLoading: boolean;
  addFriend: (email: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  refetch: () => Promise<void>;
};

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function FriendsProvider({ children }: Props) {
  const { user, isAuthenticated, token } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFromAPI = useCallback(async () => {
    if (!token || !API_BASE_URL) return;

    try {
      // Fetch friends
      const friendsRes = await fetch(`${API_BASE_URL}/api/friends`, {
        headers: {
          'authorization': `Bearer ${token}`,
        },
      });

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(friendsData);
      }

      // Fetch friend requests
      const requestsRes = await fetch(`${API_BASE_URL}/api/friends/requests`, {
        headers: {
          'authorization': `Bearer ${token}`,
        },
      });

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setFriendRequests(requestsData.incoming || []);
        setOutgoingRequests(requestsData.outgoing || []);
      }
    } catch (err) {
      console.error('Error loading friends data from API:', err);
    }
  }, [token]);

  // Load from API on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated && user && token) {
      loadFromAPI();
    } else {
      // Clear when logged out
      setFriends([]);
      setFriendRequests([]);
      setOutgoingRequests([]);
    }
  }, [isAuthenticated, user, token, loadFromAPI]);

  const addFriend = async (identifier: string) => {
    if (!user || !token) throw new Error('Must be logged in to add friends');
    
    setIsLoading(true);
    try {
      const looksLikeEmail = /@/.test(identifier);
      const res = await fetch(`${API_BASE_URL}/api/friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(looksLikeEmail ? { email: identifier } : { code: identifier }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send friend request');
      }

      await loadFromAPI();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    if (!user || !token) throw new Error('Must be logged in');
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action: 'accept' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to accept request');
      }

      await loadFromAPI();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!token) throw new Error('Must be logged in');
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action: 'reject' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reject request');
      }

      await loadFromAPI();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!token) throw new Error('Must be logged in');
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: {
          'authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove friend');
      }

      await loadFromAPI();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    if (!token) throw new Error('Must be logged in');
    
    setIsLoading(true);
    try {
      // For now, rejecting your own outgoing request
      const res = await fetch(`${API_BASE_URL}/api/friends/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action: 'reject' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel request');
      }

      await loadFromAPI();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    await loadFromAPI();
  };

  const value: FriendsContextType = {
    friends,
    friendRequests,
    outgoingRequests,
    isLoading,
    addFriend,
    acceptRequest,
    rejectRequest,
    removeFriend,
    cancelRequest,
    refetch,
  };

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
}
