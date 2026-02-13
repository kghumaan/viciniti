import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { theme } from '../../core/theme';
import { UserRole } from '../../features/connection/services/BLEService';
import { CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS } from '../../shared/constants/categories';
import { BeaconCategory } from '../../shared/types/beacon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Connection'>;

interface ProximityAlertProps {
  visible: boolean;
  onClose: () => void;
  beaconId?: string;
  beaconCategory?: string;
  beaconSubcategory?: string;
}

const ProximityAlert: React.FC<ProximityAlertProps> = ({ 
  visible, 
  onClose, 
  beaconId,
  beaconCategory = 'Sports & Recreation', // Default fallback category
  beaconSubcategory
}) => {
  const navigation = useNavigation<NavigationProp>();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Get the emoji based on the beacon category and subcategory
  const getEmoji = () => {
    if (beaconSubcategory && beaconCategory) {
      // Type assertion needed since we're using dynamic keys
      const categoryEmojis = SUBCATEGORY_EMOJIS[beaconCategory as BeaconCategory];
      if (categoryEmojis && categoryEmojis[beaconSubcategory]) {
        return categoryEmojis[beaconSubcategory];
      }
    }
    
    // Fallback to category emoji if subcategory emoji not found
    if (beaconCategory) {
      return CATEGORY_EMOJIS[beaconCategory as BeaconCategory] || '📍';
    }
    
    // Default emoji if no category/subcategory information
    return '📍';
  };
  
  // Get the emoji for display
  const emoji = getEmoji();
  
  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Start continuous bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.bounce),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.in(Easing.bounce),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Fade out animation
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Stop bounce animation
      bounceAnim.stopAnimation();
    }
  }, [visible]);
  
  if (!visible) return null;

  const handlePress = () => {
    // First handle the closing of the alert
    onClose();
    
    // Generate a random event ID using the beacon ID or a random string
    const eventId = beaconId || Math.random().toString(36).substring(2, 15);
    
    // Navigate to the connection screen with the event ID
    setTimeout(() => {
      navigation.navigate('Connection', {
        eventId,
        initialRole: UserRole.PARTICIPANT, // Default as participant
        beaconId: beaconId
      });
    }, 300);
  };
  
  // Calculate the bounce transform based on the animation value
  const bounceTransform = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15] // Move up to 15 pixels on bounce
  });
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: opacityAnim,
          transform: [{ translateY: bounceTransform }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.alertButton}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.alertText}>{emoji} in viciniti</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Moved down from 10 to 50 to avoid conflict with time display
    left: 10,
    zIndex: 999,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000', // Changed to black background
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginRight: 8,
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProximityAlert; 