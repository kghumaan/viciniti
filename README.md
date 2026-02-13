# Viciniti

A React Native application built with Expo that helps users connect with their community and discover nearby places.

## Project Overview

Viciniti is a location-based mobile application that displays a map with nearby places, allows users to explore their surroundings, and provides functionality to create events.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or later)
- **npm** (v8 or later) or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Xcode** (for iOS development, macOS only)
- **Android Studio** (for Android development)
- **Cocoapods**: `sudo gem install cocoapods` (for iOS)

## Getting Started

### Quick Setup (Recommended)

We provide a setup script that automates most of the installation process:

```bash
# Clone the repository
git clone <repository-url>
cd viciniti

# Make the setup script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

The script will:
- Install all dependencies
- Check for missing Mapbox tokens
- Install and configure the WebView module
- Prepare the project for native development
- Run pod install for iOS

After running the script, you'll still need to configure your Mapbox tokens as described in step 3 below.

### Manual Setup

#### 1. Clone the repository

```bash
git clone <repository-url>
cd viciniti
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure Mapbox

This app uses Mapbox for maps. You need to:

1. Create a Mapbox account at [https://account.mapbox.com/](https://account.mapbox.com/)
2. Generate an access token with appropriate scopes
3. Add your token to the project:

**Recommended approach (for local development):**

Copy the example private file to create your local token file:

```bash
cp src/utils/mapbox.private.example.ts src/utils/mapbox.private.ts
```

Edit `src/utils/mapbox.private.ts` to add your tokens:
```typescript
export const MAPBOX_PUBLIC_TOKEN = 'your_mapbox_public_token_here';
export const MAPBOX_DOWNLOAD_TOKEN = 'your_mapbox_download_token_here';
```

Then, update the build configurations:

Open `app.json` and replace the Mapbox download token:

```json
"@rnmapbox/maps",
{
  "RNMapboxMapsImpl": "mapbox",
  "RNMapboxMapsDownloadToken": "YOUR_MAPBOX_DOWNLOAD_TOKEN_HERE"
}
```

Also update the token in `ios/Podfile`:

```ruby
$RNMapboxMapsDownloadToken = 'YOUR_MAPBOX_DOWNLOAD_TOKEN_HERE'
```

> **Important**: 
> - Make sure your Mapbox download token has the `DOWNLOADS:READ` scope.
> - The `mapbox.private.ts` file is gitignored to prevent accidentally committing tokens.
> - Never commit your tokens to the repository.

#### 4. Create Development Build

Since the app uses native modules, you'll need to create a development build:

```bash
npx expo prebuild
```

#### 5. Run the App

##### For iOS:

```bash
npx expo run:ios
```

This will open the app in an iOS simulator.

##### For Android:

```bash
npx expo run:android
```

This will open the app in an Android emulator.

##### Using Expo Go (limited functionality):

```bash
npx expo start
```

Then scan the QR code with the Expo Go app on your device.

## Configuring Mapbox

This application uses Mapbox for mapping features. You'll need to configure your Mapbox tokens properly for the app to work.

### Environment Variables Approach (Recommended)

1. The app reads Mapbox tokens from environment variables. These are set in the `.env` file:

```
MAPBOX_PUBLIC_TOKEN=your_mapbox_public_token_here
MAPBOX_DOWNLOAD_TOKEN=your_mapbox_download_token_here
```

2. The `setup.sh` script will create this file for you with default values if it doesn't exist.

3. These tokens are also automatically added to the build configuration files:
   - `app.json` for Expo configuration
   - `ios/Podfile` for iOS native modules
   - `android/gradle.properties` for Android

### Obtaining Mapbox Tokens

If you need to get your own Mapbox tokens:

1. **Public Token**: 
   - Sign in to your Mapbox account
   - Go to Account → Tokens
   - Copy your default public token or create a new one

2. **Download Token**:
   - Go to Account → Tokens
   - Create a new secret token 
   - Set the scope to include `DOWNLOADS:READ`
   - Use this token for native SDK installation

### Troubleshooting

If you encounter map-related issues:

1. Check that your tokens are correctly set in `.env`
2. Run `./setup.sh` to ensure the tokens are propagated to all configuration files
3. For native builds, you may need to clean and rebuild:
   ```
   npx expo prebuild --clean
   cd ios && pod install && cd ..
   ```

## Project Structure

- `/src`: Source code
  - `/features`: Feature-based modules
  - `/core`: Core components and theme
  - `/shared`: Shared utilities and stores
  - `/utils`: Utility functions
- `/assets`: Static assets
- `/ios`: iOS-specific code
- `/android`: Android-specific code

## Dependencies

Key libraries used in this project:

- **React Native**: Mobile app framework
- **Expo**: Development platform
- **Mapbox**: Map provider (via WebView)
- **React Navigation**: Navigation library
- **Zustand**: State management
- **Expo Location**: Location services

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
WEB3AUTH_CLIENT_ID=your_web3auth_client_id
```

## Known Issues

- The native Mapbox SDK implementation may not work properly due to configuration issues. We've implemented a WebView-based solution as a workaround.
- WebView module may need manual linking on some setups.

## License

[Add license information here]

## Enhanced Filtering System for Beacons

The app now includes an intuitive filtering system that allows users to filter beacons based on:

- Categories (e.g., Sports & Recreation, Food & Drink)
- Subcategories (e.g., Tennis, Coffee Meetups)
- Token status:
  - Beacons with rewards ($BOND rewards for attendees)
  - Beacons with costs (require $BOND payment to join)
  - Free beacons (no $BOND requirements)

### How to Use Filtering

1. **Quick Category Filters**: Tap category buttons at the top of the screen to quickly filter by main categories
2. **Advanced Filtering**: Tap the "Filters" button to access the full filtering modal
3. **Search**: Use the search bar to find beacons by keyword in title or description
4. **Multiple Filters**: Combine different filter types to narrow down results

### Examples

- Filter to find beacons that offer rewards for participating
- Find free classes or events in specific categories
- Discover paid services like lessons or guided experiences

The filtering system works across both the map view and list view for consistent experience.
