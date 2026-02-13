import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Beacon, BeaconCategory } from '@shared/types/beacon';
import { theme } from '@core/theme';
import { CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS } from '@shared/constants/categories';
import { calculateDistance } from '@services/firebase';

interface NearbyPlacesPanelProps {
  beacons: Beacon[];
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  onBeaconPress: (beacon: Beacon) => void;
  onClose: () => void;
}

export const NearbyPlacesPanel: React.FC<NearbyPlacesPanelProps> = ({
  beacons,
  currentLocation,
  onBeaconPress,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Places</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        {beacons.map((beacon) => {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            beacon.location.latitude,
            beacon.location.longitude
          );
          
          // Get subcategory emoji if available, otherwise fallback to category emoji
          const emoji = beacon.subcategory && SUBCATEGORY_EMOJIS[beacon.category as BeaconCategory]?.[beacon.subcategory] 
            ? SUBCATEGORY_EMOJIS[beacon.category as BeaconCategory][beacon.subcategory] 
            : CATEGORY_EMOJIS[beacon.category as BeaconCategory];
            
          return (
            <TouchableOpacity
              key={beacon.id}
              style={styles.beaconItem}
              onPress={() => onBeaconPress(beacon)}
            >
              <View style={styles.beaconContent}>
                <Text style={styles.beaconTitle}>{beacon.title}</Text>
                <Text style={styles.beaconCategory}>
                  {emoji} {beacon.category}
                  {beacon.subcategory && ` - ${beacon.subcategory}`}
                </Text>
                <Text style={styles.beaconDistance}>
                  {distance.toFixed(1)} mi away
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 80, // Leave space for tab bar
    right: 0,
    width: '80%',
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  beaconItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  beaconContent: {
    flex: 1,
  },
  beaconTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  beaconCategory: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  beaconDistance: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
}); 