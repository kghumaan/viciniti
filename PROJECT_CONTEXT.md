# PROJECT_CONTEXT.md

## Project Overview

**Viciniti** is a location-based social networking mobile application built with React Native and Expo. The app helps users connect with their community by discovering and participating in local events and activities called "beacons." It combines social networking, geolocation services, and event management into a unified platform.

### Core Purpose
- **Community Connection**: Enable users to find and connect with like-minded people in their vicinity
- **Event Discovery**: Help users discover activities and events happening around them
- **Social Coordination**: Facilitate group activities and meetups through location-based beacons

## Key Features

### 1. **Beacon System** (Core Feature)
- **Beacon Creation**: Users can create location-based "beacons" representing events, activities, or meetups
- **Categorization**: 8 main categories with detailed subcategories:
  - Sports & Recreation (Golf, Tennis, Basketball, etc.)
  - Arts & Creative (Painting, Photography, Music, etc.)
  - Food & Drink (Restaurant Dining, Coffee Meetups, etc.)
  - Professional & Learning (Networking, Tech Talks, etc.)
  - Entertainment & Social (Board Games, Trivia, etc.)
  - Outdoor Adventure (Camping, Hiking, etc.)
  - Wellness & Mindfulness (Meditation, Yoga, etc.)
  - Cultural & Community (Festivals, Volunteer Work, etc.)

### 2. **Interactive Mapping**
- **Real-time Map View**: Displays beacons on an interactive map using Mapbox
- **Proximity-based Discovery**: Shows nearby beacons within customizable viewing radii
- **Location Services**: GPS integration for user positioning and beacon discovery
- **Vicinity Mode**: Special mode showing only beacons within 0.5 miles

### 3. **Advanced Filtering System** (In Development)
- **Category/Subcategory Filters**: Filter beacons by activity type
- **Token-based Filtering**: Filter by reward/cost structure
- **Distance-based Filtering**: Control visibility radius
- **Search Functionality**: Text-based beacon search

### 4. **Social Features**
- **Join Requests**: Request to join beacon activities with approval system
- **User Profiles**: Account management with authentication
- **Attendee Management**: Track event participants
- **Proximity Alerts**: Notifications when near interesting beacons

### 5. **Bluetooth Low Energy (BLE) Integration**
- **Peer-to-peer Discovery**: Device-to-device beacon discovery
- **Role-based Connection**: Participant/Organizer role system
- **Event Synchronization**: Share event details via BLE

### 6. **Token Economy System**
- **$BOND Token Integration**: Cryptocurrency-based rewards/costs
- **Reward Beacons**: Beacons that reward participants with tokens
- **Paid Beacons**: Premium beacons requiring token payment
- **Web3 Integration**: Ethereum-based authentication and token management

## Technical Architecture

### **Frontend Stack**
- **Framework**: React Native 0.76.6 with Expo 52.0.27
- **Language**: TypeScript with strict type checking
- **Navigation**: React Navigation v6 (Stack + Bottom Tabs)
- **State Management**: Zustand for global state
- **UI Components**: Custom components with consistent theming

### **Backend Services**
- **Database**: Firebase Firestore for real-time data
- **Authentication**: Firebase Auth with Web3Auth integration
- **Storage**: Firebase Storage for image uploads
- **Maps**: Mapbox for mapping and geocoding services

### **Key Dependencies**
```json
{
  "mapping": ["@rnmapbox/maps", "react-native-maps"],
  "bluetooth": ["react-native-ble-plx"],
  "crypto": ["ethers", "@web3auth/react-native-sdk"],
  "location": ["expo-location"],
  "authentication": ["@react-native-google-signin/google-signin"],
  "state": ["zustand"],
  "ui": ["@expo/vector-icons", "react-native-toast-message"]
}
```

### **Project Structure**
```
src/
├── core/                 # Core application logic
│   ├── navigation/       # Navigation types
│   └── theme/           # Theme configuration
├── features/            # Feature-based modules
│   ├── auth/            # Authentication screens
│   ├── beacons/         # Beacon management
│   ├── connection/      # BLE connection features
│   ├── events/          # Event management (new)
│   ├── map/             # Map and location features
│   └── search/          # Search functionality
├── shared/              # Shared utilities and stores
│   ├── components/      # Reusable UI components
│   ├── constants/       # App constants (categories, etc.)
│   ├── store/           # Zustand stores
│   └── types/           # TypeScript type definitions
├── services/            # External service integrations
│   ├── firebase.ts      # Firebase configuration
│   └── mockData.ts      # Mock data generation
└── utils/               # Utility functions
```

## Data Models

### **Beacon Model**
```typescript
interface Beacon {
  id: string;
  title: string;
  description: string;
  category: BeaconCategory;
  subcategory?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  startTime: string;
  endTime?: string;
  maxAttendees?: number;
  attendees: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  beaconImage?: string;
  viewingRadius?: number;
  tokenCost?: number | null;
  joinRequests?: JoinRequest[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

### **User Model**
```typescript
interface User {
  email: string;
  name: string;
  publicAddress: string;
  privKey: string;
  tokenBalance: number;
  avatar?: string;
}
```

## Configuration & Setup

### **Environment Variables**
```env
# Firebase Configuration
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...

# Mapbox Configuration
MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNrdjdsZGo0ZTlrbGszMWs2bnpndnlldjQifQ.XDaBKrhWFiLYxg_5OgGvDA
MAPBOX_DOWNLOAD_TOKEN=sk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNtOGZla2h5cDBhb2MyaW92YWd2dDY3ZnEifQ.qVRe6SQGEl8wbwb7jV5ceg

# Web3Auth
WEB3AUTH_CLIENT_ID=...
```

### **Development Setup**
1. **Quick Setup**: Run `./setup.sh` for automated configuration
2. **Manual Setup**: Install dependencies, configure tokens, run prebuild
3. **Platform-specific**: Different commands for iOS vs Android development

### **Build Configuration**
- **EAS Build**: Configured for development, preview, and production builds
- **Native Modules**: Requires development builds due to native dependencies
- **Platform Support**: iOS and Android with simulator support

## Current Development Status

### **Active Feature Branch**: `feature/filtering`
- **Modified Files**:
  - `src/features/map/components/FilterControls.tsx` - Advanced filtering UI
  - `src/features/map/screens/MapScreen.tsx` - Map integration with filters
  - `src/features/map/styles/map.styles.ts` - Styling updates
- **New Files**:
  - `src/features/events/screens/CreateEventScreen.tsx` - Event creation feature

### **Recent Developments**
1. **Advanced Filtering System**: Multi-level filtering with categories, subcategories, and token-based filters
2. **Event Management**: Expanding beyond beacons to include structured events
3. **UI/UX Improvements**: Enhanced map interface with better user interactions
4. **Mock Data Generation**: Tools for testing with realistic data

## Key Architectural Decisions

### **State Management**
- **Zustand**: Chosen for its simplicity and TypeScript support
- **Store Separation**: Separate stores for auth, beacons, events, and app state
- **Reactive Updates**: Real-time UI updates based on state changes

### **Navigation**
- **Hybrid Navigation**: Stack navigator for screens, tab navigator for main sections
- **Modal Presentations**: Full-screen modals for immersive experiences
- **Type Safety**: Comprehensive TypeScript typing for navigation

### **Location Services**
- **Dual Approach**: GPS for user location, hardcoded test locations for development
- **Distance Calculations**: Haversine formula for accurate distance calculations
- **Radius-based Filtering**: Configurable viewing radii for different use cases

### **Authentication**
- **Multi-provider**: Firebase Auth + Web3Auth for Web3 integration
- **Token Management**: Secure storage of authentication tokens
- **Profile Management**: User profile creation and management

## Security Considerations

### **API Keys & Tokens**
- **Environment Variables**: Sensitive data stored in environment variables
- **Gitignore**: Private configuration files excluded from version control
- **Token Rotation**: Regular rotation of API keys and tokens

### **Data Privacy**
- **Firebase Rules**: Firestore security rules for data access control
- **Location Privacy**: User location data handled with appropriate permissions
- **Minimal Data**: Collect only necessary user information

## Testing Strategy

### **Development Testing**
- **Mock Data**: Comprehensive mock data generation for testing
- **Simulator Support**: BLE functionality gracefully handles simulator limitations
- **Test Locations**: Hardcoded test locations for consistent development

### **User Experience Testing**
- **Proximity Alerts**: Testing location-based notifications
- **Cross-platform**: iOS and Android compatibility testing
- **Network Conditions**: Offline/online behavior testing

## Future Roadmap

### **Planned Features**
1. **Enhanced Event Management**: Full event lifecycle management
2. **Advanced Social Features**: Chat, user ratings, activity history
3. **Improved Token Economy**: More sophisticated reward mechanisms
4. **Analytics Dashboard**: User engagement and beacon performance metrics
5. **Push Notifications**: Real-time event notifications
6. **AR Integration**: Augmented reality beacon discovery

### **Technical Improvements**
1. **Performance Optimization**: Map rendering and data loading improvements
2. **Offline Support**: Core functionality without internet connectivity
3. **Advanced Search**: Full-text search with fuzzy matching
4. **Accessibility**: Enhanced accessibility features
5. **Internationalization**: Multi-language support

## Dependencies & Integrations

### **Core Dependencies**
- **React Native**: 0.76.6 (Mobile framework)
- **Expo**: 52.0.27 (Development platform)
- **TypeScript**: 5.1.3 (Type safety)
- **Firebase**: 11.4.0 (Backend services)

### **Feature Dependencies**
- **Mapbox**: 10.1.37 (Mapping services)
- **Web3Auth**: 6.0.0 (Web3 authentication)
- **BLE**: 3.5.0 (Bluetooth Low Energy)
- **Zustand**: 4.4.7 (State management)

### **Development Tools**
- **EAS CLI**: Build and deployment
- **Expo CLI**: Development workflow
- **Metro**: JavaScript bundler
- **CocoaPods**: iOS dependency management

## Conclusion

Viciniti represents a comprehensive social networking platform that combines location-based services, event management, and Web3 integration. The project is well-structured with a clear separation of concerns, comprehensive TypeScript typing, and modern React Native development practices. The current focus on filtering and event management features shows active development toward a more robust and user-friendly platform.

The project's architecture supports scalability and maintainability, with proper separation between features, services, and shared utilities. The integration of multiple technologies (Firebase, Mapbox, BLE, Web3) demonstrates a sophisticated approach to building a modern mobile application. 