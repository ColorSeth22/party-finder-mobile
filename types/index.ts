export type User = {
  user_id: string;
  email: string;
  display_name: string | null;
  friend_code?: string;
  reputation_score: number;
  created_at: string;
};

export type Event = {
  id: string;
  title: string;
  description: string | null;
  host_type: 'fraternity' | 'house' | 'club';
  location_lat: number;
  location_lng: number;
  start_time: string;
  end_time: string | null;
  tags: string[] | null;
  theme: string | null;
  music_type: string | null;
  cover_charge: string | null;
  is_byob: boolean;
  is_active: boolean;
  created_by: string;
  user_id: string;
  created_at: string;
  checkin_count?: number;
  visibility?: 'everyone' | 'friends';
  is_archived?: boolean;
  archived_at?: string | null;
};

export type EventMedia = {
  media_id: string;
  event_id: string;
  user_id: string | null;
  media_type: 'image' | 'video';
  media_url: string; // relative URL served from /uploads
  caption: string | null;
  created_at: string;
};

export type Friend = {
  user_id: string;
  email: string;
  display_name: string | null;
  reputation_score: number;
  friendship_id: string;
  created_at: string;
};

export type FriendRequest = {
  request_id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  from_user?: {
    email: string;
    display_name: string | null;
  };
  to_user?: {
    email: string;
    display_name: string | null;
  };
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  email: string;
  password: string;
  display_name?: string;
};

export type DistanceUnit = 'km' | 'miles';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ColorScheme = 'orange' | 'pink' | 'purple' | 'blue' | 'green' | 'red';

export type SettingsState = {
  distanceUnit: DistanceUnit;
  showDistanceLabels: boolean;
  autoRefresh: boolean;
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
};
