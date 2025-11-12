export type User = {
  user_id: string;
  email: string;
  display_name: string | null;
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
  created_at: string;
  checkin_count?: number;
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
