# PartyFinder Mobile 🎉

A mobile app for finding and tracking campus parties and events, built with React Native and Expo.

## Features

- 📍 **Interactive Map** - View all active events on a map with your current location
- 📋 **Events List** - Browse upcoming events sorted by time with distance information
- 👤 **User Profiles** - Login, register, and manage your account
- ⚙️ **Settings** - Customize distance units, auto-refresh, and theme preferences
- 🎯 **Location-Based** - See how far events are from your current location

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo Go app on your iOS or Android device

## Setup

1. **Install dependencies**

   ```powershell
   npm install
   ```

2. **Configure API endpoint**

   Open `app/_layout.tsx` and update the `apiBaseUrl` prop in the `AuthProvider`:
   
   ```tsx
   <AuthProvider apiBaseUrl="https://your-api-url.com">
   ```

3. **Configure Google Maps (Android only)**

   If using Android, add your Google Maps API key to `app.json`:
   
   ```json
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
       }
     }
   }
   ```

## Running the App

1. **Start the Expo development server**

   ```powershell
   npm start
   ```

   Or with specific options:

   ```powershell
   # Start with tunnel (recommended for testing on physical device)
   npm start -- --tunnel

   # Start for Android
   npm run android

   # Start for iOS  
   npm run ios

   # Start for web
   npm run web
   ```

2. **Open in Expo Go**

   - Install Expo Go on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
   - Scan the QR code shown in the terminal
   - The app will load on your device

## Project Structure

```
PartyFinderMobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Welcome screen
│   │   ├── map.tsx        # Map view
│   │   ├── events.tsx     # Events list
│   │   └── profile.tsx    # Profile & settings
│   └── _layout.tsx        # Root layout with providers
├── contexts/              # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   └── SettingsContext.tsx # App settings
├── hooks/                 # Custom hooks
│   ├── useGeolocation.ts  # Location tracking
│   └── useEvents.ts       # Events data fetching
├── types/                 # TypeScript definitions
│   └── index.ts
├── utils/                 # Utility functions
│   └── distance.ts        # Distance calculations
└── components/            # Reusable components
```

## Key Dependencies

- **expo** - React Native framework
- **expo-router** - File-based routing
- **expo-location** - Location services
- **react-native-maps** - Map component
- **@react-native-async-storage/async-storage** - Persistent storage
- **react-navigation** - Navigation library

## Features

### Map Screen
- Shows all active events as markers
- Displays your current location with a radius circle
- Tap markers to view event details
- Pull to refresh events

### Events List Screen  
- Browse all upcoming events
- Sort by start time
- See distance from your location
- Tap to expand and view full details
- Filter to only show active events

### Profile Screen
- Login/Register with email and password
- View account information
- Manage settings:
  - Distance unit (miles/km)
  - Show distance labels
  - Auto refresh events
  - Theme (light/dark/system)

## Development

Run linting:
```powershell
npm run lint
```

## Notes

- The app requires location permissions to show nearby events
- Map requires Google Maps API key for Android (iOS uses Apple Maps)
- Events auto-refresh every 30 seconds when enabled in settings
- Guest mode available with limited features

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

