import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Animated, Easing, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from '../../../navigation/types';
import ParticleBackground from '../components/ParticleBackground';
import BLEConnectionStatus from '../components/BLEConnectionStatus';
import useBLEConnection from '../hooks/useBLEConnection';
import { UserRole, ConnectionStatus } from '../services/BLEService';

// Check if we're running in a simulator
// In iOS we check Platform.constants to determine if it's a simulator
const isSimulator = Platform.OS === 'ios' && 
  // @ts-ignore: isDevice is not in type definitions but exists at runtime
  !(Platform.constants && Platform.constants.isDevice);

type ConnectionScreenRouteProp = RouteProp<RootStackParamList, 'Connection'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ConnectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ConnectionScreenRouteProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const pulseAnim4 = useRef(new Animated.Value(1)).current;
  const pulseAnim5 = useRef(new Animated.Value(1)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Get parameters from navigation
  const initialEventId = route.params?.eventId;
  const initialRole = route.params?.initialRole ?? UserRole.PARTICIPANT;
  const beaconId = route.params?.beaconId;
  
  // BLE connection state
  // We're no longer allowing manual role selection, using the initialRole
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [longPressActive, setLongPressActive] = useState<boolean>(false);
  const [connectionComplete, setConnectionComplete] = useState<boolean>(false);
  const { status, nearbyDevices, startConnection, stopConnection, error } = useBLEConnection();
  
  // Generate a test event ID (in a real app, this would come from your event data)
  const [eventId] = useState(() => {
    // Use the initialEventId if provided, otherwise generate a random one
    return initialEventId || Math.random().toString(36).substring(2, 15);
  });
  
  useEffect(() => {
    // Fade in animation for the screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Fade in text after a delay
    Animated.timing(textOpacityAnim, {
      toValue: 1,
      duration: 1500,
      delay: 800,
      useNativeDriver: true,
    }).start();
    
    // Start pulsing animations for each ring with different timings
    startPulseAnimation(pulseAnim, 0);
    startPulseAnimation(pulseAnim2, 200);
    startPulseAnimation(pulseAnim3, 400);
    startPulseAnimation(pulseAnim4, 600);
    startPulseAnimation(pulseAnim5, 800);
    
    // Clean up BLE resources when component unmounts
    return () => {
      stopConnection();
    };
  }, []);
  
  // Handle when connection status changes
  useEffect(() => {
    if (status === ConnectionStatus.CONNECTED) {
      // When connected, navigate to the beacon detail screen
      setConnectionComplete(true);
      
      // Navigate to beacon detail page
      setTimeout(() => {
        navigation.replace('BeaconDetail', {
          beaconId: beaconId || 'unknown',
          eventId: eventId,
          userRole: initialRole,
          isEditable: false
        });
      }, 500);
    } else if (status === ConnectionStatus.ERROR && error) {
      // Show error message
      Alert.alert('Connection Error', error, [{ text: 'OK' }]);
      setLongPressActive(false);
    }
    
    // Update connecting state
    setIsConnecting(
      status === ConnectionStatus.SCANNING || 
      status === ConnectionStatus.ADVERTISING
    );
  }, [status, error, navigation, beaconId, eventId, initialRole]);
  
  // Add a simulator notice when running in simulator
  useEffect(() => {
    if (isSimulator) {
      // Show a simulator notice explaining the limited functionality
      setTimeout(() => {
        Alert.alert(
          'Simulator Detected',
          'You are running in a simulator where BLE functionality is limited. The connection experience is being simulated.',
          [{ text: 'OK' }]
        );
      }, 1000);
    }
  }, []);
  
  const startPulseAnimation = (animation: Animated.Value, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1.3,
          duration: 1200,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleGoBack = () => {
    // Stop BLE operations
    stopConnection();
    
    // Fade out animation before navigating back
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };
  
  // Handle long press start
  const handlePressIn = useCallback(() => {
    setLongPressActive(true);
    
    // Start a timeout to initiate connection after holding for a moment
    const timer = setTimeout(async () => {
      if (isConnecting) {
        // If already connecting, stop
        stopConnection();
        setLongPressActive(false);
        return;
      }
      
      try {
        await startConnection(eventId, initialRole);
        
        // In simulator mode, simulate a successful connection after a delay
        if (isSimulator) {
          setTimeout(() => {
            // First stop the current connection
            if (stopConnection) {
              stopConnection();
            }
            
            // Navigate to beacon detail after simulated connection
            setConnectionComplete(true);
            setTimeout(() => {
              navigation.replace('BeaconDetail', {
                beaconId: beaconId || 'unknown',
                eventId: eventId,
                userRole: initialRole,
                isEditable: false
              });
            }, 500);
            
            // After a small delay, alert the user about the simulated connection
            setTimeout(() => {
              Alert.alert(
                'Connection Simulated',
                'Since you are in a simulator, we are simulating a successful connection.',
                [{ text: 'OK' }]
              );
            }, 100);
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to start connection:', err);
        Alert.alert('Error', 'Failed to start connection. Please try again.');
        setLongPressActive(false);
      }
    }, 800); // Wait 800ms before starting connection
    
    // Store the timer in a ref so we can clear it on press out
    return () => clearTimeout(timer);
  }, [eventId, initialRole, isConnecting, startConnection, stopConnection, navigation, beaconId]);
  
  // Handle press out (released before connection)
  const handlePressOut = useCallback(() => {
    // If we were in the process of connecting, stop
    if (longPressActive && !connectionComplete) {
      setLongPressActive(false);
      stopConnection();
    }
  }, [longPressActive, connectionComplete, stopConnection]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />
      
      {/* Cool background effect */}
      <ParticleBackground />
      
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleGoBack}
      >
        <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Header section with status text */}
      <View style={styles.headerContainer}>
        {/* <Text style={styles.readyText}>Ready to connect</Text> */}
        <BLEConnectionStatus 
          status={status} 
          deviceCount={nearbyDevices.length} 
        />
        {isSimulator && (
          <View style={styles.simulatorBadge}>
            <Text style={styles.simulatorBadgeText}>SIMULATOR MODE</Text>
          </View>
        )}
      </View>
      
      {/* Central connecting visualization with multiple rings */}
      <View style={styles.centerContainer}>
        {/* Outer rings */}
        <Animated.View 
          style={[
            styles.ringFive,
            { 
              transform: [{ scale: pulseAnim5 }],
              opacity: 0.1
            }
          ]}
        />
        
        <Animated.View 
          style={[
            styles.ringFour,
            { 
              transform: [{ scale: pulseAnim4 }],
              opacity: 0.2
            }
          ]}
        />
        
        <Animated.View 
          style={[
            styles.ringThree,
            { 
              transform: [{ scale: pulseAnim3 }],
              opacity: 0.3
            }
          ]}
        />
        
        <Animated.View 
          style={[
            styles.ringTwo,
            { 
              transform: [{ scale: pulseAnim2 }],
              opacity: 0.5
            }
          ]}
        />
        
        {/* Main ring (original) */}
        <Animated.View 
          style={[
            styles.connectionVisual,
            { 
              transform: [{ scale: pulseAnim }],
              opacity: 0.7
            }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.innerCircleButton,
              longPressActive && styles.innerCircleButtonActive
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
            <View style={styles.innerCircle}>
              <Ionicons 
                name={isConnecting ? "stop-circle" : "bluetooth"} 
                size={28} 
                color="#000000" 
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.Text style={[styles.connectionText, { opacity: textOpacityAnim }]}>
          {isConnecting ? 'CONNECTING...' : 'HOLD TO CONNECT'}
        </Animated.Text>
      </View>
      
      {/* Event ID for debugging */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Event ID: {eventId}</Text>
        <Text style={styles.debugText}>Role: {initialRole === UserRole.ORGANIZER ? 'Organizer' : 'Participant'}</Text>
        {beaconId && <Text style={styles.debugText}>Beacon ID: {beaconId}</Text>}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContainer: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  readyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 320, // Set a fixed width to properly contain all rings
    height: 350, // Set a fixed height to properly contain all rings and text
  },
  connectionVisual: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(29, 185, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    top: 100,  // Position from top to center the ring
    left: 100, // Position from left to center the ring
  },
  ringTwo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(29, 185, 255, 0.4)',
    top: 75,  // Adjust based on ring size (320-170)/2
    left: 75, // Adjust based on ring size (320-170)/2
  },
  ringThree: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(29, 185, 255, 0.3)',
    top: 50,  // Adjust based on ring size (320-220)/2
    left: 50, // Adjust based on ring size (320-220)/2
  },
  ringFour: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: 'rgba(29, 185, 255, 0.2)',
    top: 25,  // Adjust based on ring size (320-270)/2
    left: 25, // Adjust based on ring size (320-270)/2
  },
  ringFive: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(29, 185, 255, 0.1)',
    top: 0,  // Positioned at the top of the container
    left: 0, // Positioned at the left of the container
  },
  innerCircleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircleButtonActive: {
    backgroundColor: 'rgba(29, 185, 255, 0.3)', // Visual feedback when pressed
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionText: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    bottom: 0, // Position at the bottom of the container
    width: '100%', // Take full width for text centering
    letterSpacing: 1.5,
  },
  debugContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  debugText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },
  simulatorBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.5)',
  },
  simulatorBadgeText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ConnectionScreen; 