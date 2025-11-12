/**
 * Configuration for the PartyFinder mobile app
 */

// Get API base URL from environment variable or use empty string as default
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

// Google Maps API key for Android
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Default map region (Iowa State University area)
export const DEFAULT_MAP_REGION = {
  latitude: 42.0267,
  longitude: -93.6465,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Auto-refresh interval in milliseconds (30 seconds)
export const AUTO_REFRESH_INTERVAL = 30000;

// Location tracking accuracy
export const LOCATION_ACCURACY = 'balanced'; // 'low' | 'balanced' | 'high' | 'best'

// User location radius circle (in meters)
export const USER_LOCATION_RADIUS = 500;
