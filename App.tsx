import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';
import { useAppStore } from './src/shared/store/app';
import { useAuthStore } from './src/shared/store/auth';
import { theme } from './src/core/theme';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MapScreen } from './src/features/map/screens/MapScreen';
import { BeaconsListScreen } from './src/features/beacons/screens/BeaconsListScreen';
import { AccountScreen } from './src/features/auth/screens/AccountScreen';
import { OnboardingScreen } from './src/features/auth/screens/OnboardingScreen';
import { CreateBeaconScreen } from './src/features/beacons/screens/CreateBeaconScreen';
import ConnectionScreen from './src/features/connection/screens/ConnectionScreen';
import BeaconDetailScreen from './src/features/connection/screens/BeaconDetailScreen';
import { RootStackParamList, TabParamList } from './src/navigation/types';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/utils/toastConfig';

// Suppress Firebase auth errors from the default error handler
LogBox.ignoreLogs([
  'Firebase: Error (auth/',
  'Error signing in:',
  '[FirebaseError:',
  'FirebaseError:',
]);

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily.regular,
        },
      }}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Beacons" 
        component={BeaconsListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Account" 
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const { isDarkMode } = useAppStore();
  const { isAuthenticated, initialize, loading } = useAuthStore();

  // Load IBM Plex Mono fonts
  const [fontsLoaded] = useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
  });

  const screenOptions = {
    headerStyle: {
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    headerTintColor: theme.colors.primary,
    headerTitleStyle: {
      fontWeight: '600' as const,
      fontFamily: theme.typography.fontFamily.semibold,
      color: isDarkMode ? '#FFFFFF' : '#000000',
    },
    headerBackTitle: undefined,
    headerBackTitleVisible: false,
  };

  useEffect(() => {
    // Initialize Firebase authentication
    initialize();
  }, []);

  // Show a blank screen while auth is being initialized or fonts are loading
  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]} />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
            <Stack.Navigator screenOptions={screenOptions}>
              {!isAuthenticated ? (
                <Stack.Screen 
                  name="Onboarding" 
                  component={OnboardingScreen}
                  options={{ headerShown: false }}
                />
              ) : (
                <>
                  <Stack.Screen 
                    name="Tabs" 
                    component={TabNavigator}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="CreateBeacon"
                    component={CreateBeaconScreen}
                    options={{ 
                      headerShown: true,
                      title: 'Create Beacon',
                    }}
                  />
                  <Stack.Screen
                    name="Connection"
                    component={ConnectionScreen}
                    options={{ 
                      headerShown: false,
                      presentation: 'fullScreenModal'
                    }}
                  />
                  <Stack.Screen
                    name="BeaconDetail"
                    component={BeaconDetailScreen}
                    options={{ 
                      headerShown: false,
                      presentation: 'fullScreenModal'
                    }}
                  />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
          <Toast config={toastConfig} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

registerRootComponent(App);

export default App; 