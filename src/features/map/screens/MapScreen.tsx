import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, Alert, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../../shared/store/app';
import { useBeaconsStore } from '../../../shared/store/beacons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { RootStackParamList, TabParamList } from '../../../navigation/types';
import * as Location from 'expo-location';
import { Beacon } from '../../../shared/types/beacon';
import { calculateDistance } from '../../../services/firebase';
import { useAuthStore } from '../../../shared/store/auth';
import { Ionicons } from '@expo/vector-icons';
import ProximityAlert from '../../../shared/components/ProximityAlert';

import { MapView } from '../components/MapView';
import { NearbyPlacesPanel } from '../components/NearbyPlacesPanel';
import { BeaconDetailsModal } from '../components/BeaconDetailsModal';
import { SearchBar } from '../../../shared/components/SearchBar';
import { FilterControls } from '../../map/components/FilterControls';
import { mapStyles } from '../styles/map.styles';
import { theme } from '../../../core/theme';

export function MapScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppStore();
  const { userInfo } = useAuthStore();
  const { 
    beacons, 
    fetchBeacons, 
    isLoading, 
    error,
    requestToJoinBeacon,
    getFilteredBeacons,
    setFilters,
    filters
  } = useBeaconsStore();
   
  const [nearbyBeacons, setNearbyBeacons] = useState<Beacon[]>([]);
  const [selectedBeacon, setSelectedBeacon] = useState<Beacon | null>(null);
  const [showBeaconDetails, setShowBeaconDetails] = useState(false);
  const [joinedBeaconIds, setJoinedBeaconIds] = useState<string[]>([]);
  const [showProximityAlert, setShowProximityAlert] = useState(false);
  const [extremelyCloseBeacon, setExtremelyCloseBeacon] = useState<Beacon | null>(null);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const slideAnimation = useRef(new Animated.Value(-350)).current;
   
  // Use a hardcoded location for testing - Los Angeles (3420 S Sepulveda Blvd)
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 34.0280465,
    longitude: -118.4323049, 
  });

  useEffect(() => {
    fetchBeacons();
  }, []);

  // This effect will run whenever filters change or the modal closes
  useEffect(() => {
    updateNearbyBeacons();
  }, [filters, location, beacons]);

  // Create a separate function to update nearby beacons
  const updateNearbyBeacons = useCallback(() => {
    if (beacons.length > 0) {
      // First apply our global filters to get filtered beacons
      const filteredBeacons = getFilteredBeacons();
      
      // Then apply distance-based filtering
      const nearby = filteredBeacons.filter(beacon => {
        if (!beacon.location || !location) return false;
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          beacon.location.latitude,
          beacon.location.longitude
        );
        
        // Show beacons within standard radius
        return (
          distance <= 20 || 
          (beacon.viewingRadius && distance <= beacon.viewingRadius)
        );
      }).sort((a, b) => {
        // Sort beacons by distance (nearest first)
        const distanceA = calculateDistance(
          location.latitude,
          location.longitude,
          a.location.latitude,
          a.location.longitude
        );
        const distanceB = calculateDistance(
          location.latitude,
          location.longitude,
          b.location.latitude,
          b.location.longitude
        );
        return distanceA - distanceB;
      });
      
      setNearbyBeacons(nearby);
      
      // Check if any beacon is extremely close (within 0.05 miles or about 80 meters)
      const extremelyClose = nearby.find(beacon => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          beacon.location.latitude,
          beacon.location.longitude
        );
        return distance <= 0.05; // 0.05 miles is about 80 meters
      });
      
      // Update state based on proximity
      if (extremelyClose) {
        setExtremelyCloseBeacon(extremelyClose);
        setShowProximityAlert(true);
      } else {
        setExtremelyCloseBeacon(null);
        setShowProximityAlert(false);
      }
    }
  }, [beacons, getFilteredBeacons, location]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      // Skip getting the current location since we're using a hardcoded location for testing
      if (false && status === 'granted') {
        try {
          const position = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } catch (error) {
          console.error("Error getting location:", error);
        }
      }
    })();
  }, []);

  const handleCreateBeacon = () => {
    navigation.navigate('CreateBeacon', {
      initialLocation: location,
    });
  };

  const handleBeaconPress = (beacon: Beacon) => {
    // Check if this is a new beacon prompt
    if (beacon.isNewBeaconPrompt) {
      // Navigate to create beacon screen with the location
      navigation.navigate('CreateBeacon', {
        initialLocation: beacon.location,
        fromMapPress: true
      });
      return;
    }
    
    setSelectedBeacon(beacon);
    setShowBeaconDetails(true);
  };

  const handleJoinRequest = async (beaconId: string) => {
    try {
      if (!userInfo) {
        Alert.alert(
          "Authentication Required",
          "Please log in to request to join a beacon.",
          [{ text: "OK" }]
        );
        return;
      }
      
      await requestToJoinBeacon(beaconId, {
        id: userInfo.publicAddress,
        name: userInfo.name || 'User',
        avatar: userInfo.avatar
      });
      setJoinedBeaconIds([...joinedBeaconIds, beaconId]);
    } catch (error) {
      console.error('Error joining beacon:', error);
    }
  };

  const handleCloseProximityAlert = () => {
    setShowProximityAlert(false);
  };



  const handleSearch = (query: string) => {
    setFilters({ searchQuery: query });
  };

  // Animation functions for the filter modal
  const showFilterModalAnimated = () => {
    setShowFilterModal(true);
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideFilterModalAnimated = () => {
    Animated.timing(slideAnimation, {
      toValue: -350,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowFilterModal(false);
      updateNearbyBeacons(); // Explicitly update beacons when modal closes
    });
  };

  // Update the filter modal close handler to use animation
  const handleCloseFilterModal = () => {
    hideFilterModalAnimated();
  };

  // Add a function to clear all filters
  const handleClearFilters = () => {
    setFilters({ 
      categories: [], 
      subcategories: [], 
      tokenFilter: 'all',
      searchQuery: undefined
    });
  };

  return (
    <SafeAreaView style={mapStyles.container} edges={['top']}>
      {/* Map Container */}
      <View style={mapStyles.mapContainer}>
        <MapView
          location={location}
          beacons={nearbyBeacons}
          isDarkMode={isDarkMode}
          onBeaconPress={handleBeaconPress}
          allowPinDrop={false}
        />
        
        {/* Add proximity alert component */}
        <ProximityAlert 
          visible={showProximityAlert} 
          onClose={handleCloseProximityAlert}
          beaconId={extremelyCloseBeacon?.id}
          beaconCategory={extremelyCloseBeacon?.category}
          beaconSubcategory={extremelyCloseBeacon?.subcategory}
        />
        
        {/* Secondary actions - grouped together */}
        <View style={mapStyles.secondaryActionsContainer}>
          <View style={mapStyles.secondaryActionGroup}>
            <TouchableOpacity
              style={mapStyles.secondaryActionButton}
              onPress={showFilterModalAnimated}
            >
              <Ionicons
                name="filter"
                size={18}
                color="#666"
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                mapStyles.secondaryActionButton,
                showNearbyPlaces && mapStyles.secondaryActionButtonActive
              ]}
              onPress={() => setShowNearbyPlaces(!showNearbyPlaces)}
            >
              <Ionicons
                name={showNearbyPlaces ? 'close' : 'locate-outline'} 
                size={18}
                color={showNearbyPlaces ? theme.colors.primary : "#666"}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Main action button */}
        <View style={mapStyles.mainActionContainer}>
          <TouchableOpacity
            style={mapStyles.mainActionButton}
            onPress={handleCreateBeacon}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {showNearbyPlaces && (
        <NearbyPlacesPanel
          beacons={nearbyBeacons}
          currentLocation={location}
          onBeaconPress={handleBeaconPress}
          onClose={() => setShowNearbyPlaces(false)}
        />
      )}

      <BeaconDetailsModal
        beacon={selectedBeacon}
        visible={showBeaconDetails}
        onClose={() => setShowBeaconDetails(false)}
        onJoinRequest={handleJoinRequest}
        isJoined={!!selectedBeacon && joinedBeaconIds.includes(selectedBeacon.id)}
      />
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="none"
        transparent={true}
        onRequestClose={handleCloseFilterModal}
      >
        <View style={modalStyles.modalOverlay}>
          {/* Background overlay */}
          <TouchableOpacity 
            style={modalStyles.overlayBackground}
            onPress={handleCloseFilterModal}
            activeOpacity={1}
          />
          
          {/* Left sliding panel */}
          <Animated.View style={[
            modalStyles.modalPanel,
            { transform: [{ translateX: slideAnimation }] }
          ]}>
            {/* Header */}
            <View style={modalStyles.modalHeader}>
              <View style={modalStyles.headerContent}>
                <Ionicons name="filter" size={20} color={theme.colors.primary} />
                <Text style={modalStyles.modalTitle}>Filters</Text>
              </View>
              <TouchableOpacity
                style={modalStyles.closeButton}
                onPress={handleCloseFilterModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Content */}
            <View style={modalStyles.modalContent}>
              <FilterControls noModal={true} />
            </View>
            
            {/* Footer */}
            <View style={modalStyles.modalFooter}>
              <TouchableOpacity 
                style={modalStyles.clearButton} 
                onPress={handleClearFilters}
              >
                <Text style={modalStyles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.applyButton}
                onPress={handleCloseFilterModal}
              >
                <Text style={modalStyles.applyButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalPanel: {
    width: 350,
    backgroundColor: '#F8F9FA',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E7',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E7',
    gap: 12,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    minWidth: 80,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
