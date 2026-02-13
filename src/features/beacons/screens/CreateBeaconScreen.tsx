import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, ScrollView, TouchableOpacity, Text, Platform, Image, Modal, Alert, ActivityIndicator, Switch, Linking, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import { useBeaconsStore } from '../../../shared/store/beacons';
import { useAuthStore } from '../../../shared/store/auth';
import { BeaconCategory, BeaconSubcategory, Beacon } from '../../../shared/types/beacon';
import { CATEGORIES, SUBCATEGORIES, CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS } from '../../../shared/constants/categories';
import { theme } from '../../../core/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { MapView } from '../../../features/map/components/MapView';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { generateMockBeacons } from '../../../services/mockData';
import { sanitizeBeaconData } from '../../../utils/beaconUtils';

type CreateBeaconScreenProps = any; // Temporarily use any until we update the navigation types

export function CreateBeaconScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { addBeacon } = useBeaconsStore();
  const { userInfo } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BeaconCategory | null>(null);
  const [subcategory, setSubcategory] = useState<BeaconSubcategory[BeaconCategory] | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000)); // Default to 2 hours later
  const [maxAttendees, setMaxAttendees] = useState(10);
  
  // Get initialLocation from route params if coming from map press
  const initialLocation = route.params?.initialLocation;
  
  // Use initialLocation if provided, otherwise use default
  const [location, setLocation] = useState(initialLocation || {
    latitude: 34.0522,  // LA coordinates
    longitude: -118.2437
  });
  const [address, setAddress] = useState('');
  const [pickerMode, setPickerMode] = useState<'date' | 'startTime' | 'endTime' | null>(null);
  const [beaconImage, setBeaconImage] = useState<string | undefined>(undefined); // Fixed: Changed from null to undefined
  const [viewingRadius, setViewingRadius] = useState(1); // Default to 1 mile
  const [isMockDataGenerating, setIsMockDataGenerating] = useState(false);
  
  // Token payment related states
  const [hasTokenFee, setHasTokenFee] = useState(false);
  const [tokenCost, setTokenCost] = useState(0); // Default to no cost
  const [isTokenReward, setIsTokenReward] = useState(false); // If true, beacon provides $BOND instead of charging

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedBeacon, setSelectedBeacon] = useState<Beacon | null>(null);

  // Add this reference to the WebView
  const webViewRef = useRef(null);

  useEffect(() => {
    // If location is from map, try to get address
    if (initialLocation) {
      // Try to get address for the location
      (async () => {
        try {
          const result = await Location.reverseGeocodeAsync({
            latitude: location.latitude,
            longitude: location.longitude,
          });
          if (result[0]) {
            const { street, name, city, region, postalCode, country } = result[0];
            const formattedAddress = `${street || name || ''}, ${city || ''}, ${region || ''} ${postalCode || ''}, ${country || ''}`;
            setAddress(formattedAddress.replace(/, ,/g, ',').replace(/^, /, '').replace(/, $/, ''));
          }
        } catch (error) {
          console.error('Error getting address:', error);
          // Fallback to hardcoded address for testing
          setAddress("3420 S Sepulveda Blvd, Los Angeles, CA, 90034");
        }
      })();
    } else {
      // Original behavior - hardcoded address for testing
      setAddress("3420 S Sepulveda Blvd, Los Angeles, CA, 90034");
    }
  }, [initialLocation]);

  const handleCreate = async () => {
    try {
      if (!category || !subcategory) {
        Alert.alert('Required Fields', 'Please select a category and subcategory for your beacon.');
        return;
      }

      if (!title || title.trim() === '') {
        Alert.alert('Required Fields', 'Please enter a title for your beacon.');
        return;
      }

      // Prepare date objects
      const combinedStartTime = new Date(date);
      combinedStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

      // Default end time to 2 hours after start if not set
      const combinedEndTime = new Date(date);
      combinedEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      
      console.log('Start time:', combinedStartTime.toISOString());
      console.log('End time:', combinedEndTime.toISOString());
      
      // Validate dates are valid
      if (isNaN(combinedStartTime.getTime()) || isNaN(combinedEndTime.getTime())) {
        Alert.alert('Invalid Date', 'Please select valid date and time values.');
        return;
      }

      // Ensure location is valid
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        Alert.alert('Invalid Location', 'Please select a valid location on the map.');
        return;
      }

      // Ensure we have a user
      if (!userInfo) {
        Alert.alert('Authentication Required', 'You must be logged in to create a beacon.');
        return;
      }

      console.log('Location:', location);

      // Calculate the actual token cost (positive for charging, negative for rewarding)
      const finalTokenCost = isTokenReward ? -tokenCost : tokenCost;
      console.log('Token cost:', finalTokenCost);

      // Create a beacon object that matches the interface
      const beaconData = {
        title: title || '',
        description: description || '',
        category,
        subcategory,
        startTime: combinedStartTime.toISOString(),
        endTime: combinedEndTime.toISOString(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          // Only include address if it exists and is not empty
          ...(address && address.trim() !== '' ? { address } : {})
        },
        // Format attendees according to the Beacon interface
        attendees: [{
          id: userInfo.publicAddress || '',
          name: userInfo.name || 'User',
          // Only include avatar if it exists
          ...(userInfo.avatar ? { avatar: userInfo.avatar } : {})
        }],
        maxAttendees: maxAttendees || 10,
        // Only include beaconImage if it exists
        ...(beaconImage ? { beaconImage } : {}),
        viewingRadius: viewingRadius || 1,
        // Only include tokenCost if it's not zero
        ...(finalTokenCost !== 0 ? { tokenCost: finalTokenCost } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add any additional fields for the service
      const extraFields = {
        createdBy: userInfo.publicAddress || '', // Use publicAddress as the user ID
        joinRequests: [],
      };

      console.log('Creating beacon with data:', { ...beaconData, ...extraFields });

      // Use our sanitization utility to ensure clean data
      const sanitizedData = sanitizeBeaconData({
        ...beaconData,
        ...extraFields,
      });
      
      // Send to the addBeacon function - cast back to proper type to satisfy TS
      const beaconId = await addBeacon(sanitizedData as Omit<Beacon, 'id'>);
      
      console.log('Beacon created with ID:', beaconId);
      
      if (beaconId) {
        Alert.alert('Success', 'Beacon created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to create beacon. Please try again.');
      }
    } catch (error) {
      console.error('Error creating beacon:', error);
      Alert.alert('Error', 'Failed to create beacon. Please try again.');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setPickerMode(null);
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setStartTime(selectedTime);
    }
    setPickerMode(null);
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setEndTime(selectedTime);
    }
    setPickerMode(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      // Use the string format which is the recommended approach in newer versions
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        // Crop and resize image if needed
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        console.log('Image manipulated successfully:', manipResult.uri);
        setBeaconImage(manipResult.uri);
      } catch (error) {
        console.error('Error manipulating image:', error);
        // Fallback to original image if manipulation fails
        setBeaconImage(result.assets[0].uri);
      }
    }
  };

  const incrementAttendees = () => {
    setMaxAttendees(prev => prev + 1);
  };

  const decrementAttendees = () => {
    setMaxAttendees(prev => (prev > 1 ? prev - 1 : 1));
  };

  const handleGenerateMockData = async () => {
    setIsMockDataGenerating(true);
    try {
      const results = await generateMockBeacons(5);
      Alert.alert(
        "Mock Data Generated",
        `Successfully created ${results.length} mock beacons in the Los Angeles area. Some beacons include $BOND fees or rewards.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error generating mock data:", error);
      Alert.alert(
        "Error",
        "Failed to generate mock data. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsMockDataGenerating(false);
    }
  };

  const handleSelectCategory = (cat: BeaconCategory) => {
    setCategory(cat);
    setShowSubcategories(true);
    setSubcategory(null);
  };

  const handleBackToCategories = () => {
    setShowSubcategories(false);
  };

  const handleSelectSubcategory = (sub: any) => {
    setSubcategory(sub as BeaconSubcategory[BeaconCategory]);
  };

  // Render category items with full text display
  const renderCategoryItem = (cat: BeaconCategory) => (
    <TouchableOpacity
      key={cat}
      style={[
        styles.categoryItem,
        category === cat && styles.categoryItemActive,
      ]}
      onPress={() => handleSelectCategory(cat)}
    >
      <View style={styles.categoryContent}>
        <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
        <Text style={[styles.categoryLabel, category === cat && styles.categoryLabelActive]} numberOfLines={1}>
          {cat}
        </Text>
      </View>
      {category === cat && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={18} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  // Render subcategory items with full text display
  const renderSubcategoryItem = (sub: string) => (
    <TouchableOpacity
      key={sub}
      style={[
        styles.subcategoryItem,
        subcategory === sub && styles.subcategoryItemActive,
      ]}
      onPress={() => handleSelectSubcategory(sub)}
    >
      <View style={styles.categoryContent}>
        <Text style={styles.categoryEmoji}>
          {category && SUBCATEGORY_EMOJIS[category][sub]}
        </Text>
        <Text style={[styles.categoryLabel, subcategory === sub && styles.categoryLabelActive]} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      {subcategory === sub && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={18} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSelectedCategory = () => (
    <View style={styles.selectedCategoryContainer}>
      <View style={styles.selectedCategoryInfo}>
        <Text style={styles.selectedCategoryEmoji}>
          {CATEGORY_EMOJIS[category as BeaconCategory]}
        </Text>
        <View style={styles.selectedCategoryTextContainer}>
          <Text style={styles.selectedCategoryText}>{category}</Text>
          <View style={styles.selectedSubcategoryContainer}>
            <Text style={styles.selectedSubcategoryEmoji}>
              {SUBCATEGORY_EMOJIS[category as BeaconCategory][subcategory as string]}
            </Text>
            <Text style={styles.selectedSubcategoryText}>{subcategory}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.editCategoryButton}
        onPress={() => setShowSubcategories(false)}
      >
        <Ionicons name="pencil" size={18} color={theme.colors.primary} />
        <Text style={styles.editCategoryText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  const handleAddressChange = (text: string) => {
    setAddress(text);
  };

  const handleSelectLocation = (beacon: any) => {
    try {
      if (beacon && beacon.location) {
        setLocation({
          latitude: beacon.location.latitude,
          longitude: beacon.location.longitude,
        });
        
        if (beacon.location.address) {
          setAddress(beacon.location.address);
        } else {
          // Perform reverse geocoding
          (async () => {
            try {
              const result = await Location.reverseGeocodeAsync({
                latitude: beacon.location.latitude,
                longitude: beacon.location.longitude,
              });
              
              if (result[0]) {
                const { street, name, city, region, postalCode, country } = result[0];
                const formattedAddress = `${street || name || ''}, ${city || ''}, ${region || ''} ${postalCode || ''}, ${country || ''}`;
                setAddress(formattedAddress.replace(/, ,/g, ',').replace(/^, /, '').replace(/, $/, ''));
              }
            } catch (error) {
              console.error('Error getting address:', error);
            }
          })();
        }
      }
      
      setShowMapModal(false);
    } catch (error) {
      console.error('Error selecting location:', error);
      Alert.alert(
        'Error',
        'Failed to get the address for the selected location. Please try again or enter the address manually.',
        [{ text: 'OK' }]
      );
    }
  };

  // Update the beacon press handler to handle map clicks
  const handleBeaconPress = (beacon: Beacon) => {
    // Set the selected beacon
    setSelectedBeacon(beacon);
    
    // If this is a map click (temporary beacon)
    if (beacon.id === 'map-click') {
      // Update the location state with the clicked coordinates
      setLocation({
        latitude: beacon.location.latitude,
        longitude: beacon.location.longitude,
      });
      
      // Get address from coordinates using reverse geocoding (if available)
      handleSelectLocation(beacon.location);
    }
  };

  const openLocationPicker = async () => {
    try {
      // First check if we have location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow location access to select a location on the map.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Reset selected beacon
      setSelectedBeacon(null);
      
      // Open the map modal
      setShowMapModal(true);
    } catch (error) {
      console.error('Error opening map:', error);
      Alert.alert(
        'Error',
        'Failed to open the map. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleConfirmLocation = () => {
    if (selectedBeacon) {
      setLocation(selectedBeacon.location);
      setShowLocationPicker(false);
      
      // Try to get address from the coordinates
      reverseGeocode(selectedBeacon.location);
    }
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (coords: { latitude: number, longitude: number }) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      
      if (result && result.length > 0) {
        const { street, city, region, postalCode, country } = result[0];
        const addressParts = [street, city, region, postalCode, country].filter(Boolean);
        setAddress(addressParts.join(', '));
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaViewRN style={styles.mapModalContainer}>
          <View style={styles.mapWrapper}>
            <MapView
              location={location}
              beacons={[{
                id: 'temp-marker',
                title: 'Current Location',
                description: 'Your selected location',
                category: 'Food & Drink',
                location: location,
                startTime: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                attendees: []
              }]}
              isDarkMode={true}
              onBeaconPress={handleBeaconPress}
              allowPinDrop={true}
            />
          </View>
          
          <TouchableOpacity
            style={styles.closeMapButton}
            onPress={() => setShowMapModal(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.floatingMapInstructions}>
            Tap anywhere on the map to drop a pin
          </Text>
          
          <View style={styles.bottomConfirmContainer}>
            <TouchableOpacity
              style={[
                styles.bottomConfirmButton,
                !selectedBeacon && { opacity: 0.5 },
              ]}
              onPress={handleConfirmLocation}
              disabled={!selectedBeacon}
            >
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaViewRN>
      </Modal>

      <View style={styles.form}>
        {/* Image Upload Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Beacon Image (Optional)</Text>
          <TouchableOpacity style={styles.imageUploadContainer} onPress={pickImage}>
            {beaconImage ? (
              <Image source={{ uri: beaconImage }} style={styles.imageStyle} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>Upload Image</Text>
                <Ionicons name="camera-outline" size={30} color={theme.colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Category Selection Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Category</Text>
          {category && subcategory ? (
            renderSelectedCategory()
          ) : showSubcategories && category ? (
            <>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBackToCategories}
              >
                <Ionicons name="chevron-back" size={16} color={theme.colors.text} />
                <Text style={styles.backButtonText}>
                  <Text>{CATEGORY_EMOJIS[category]}</Text> {category}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.categoryGrid}>
                {SUBCATEGORIES[category].map(renderSubcategoryItem)}
              </View>
            </>
          ) : (
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(renderCategoryItem)}
            </View>
          )}
        </View>

        {/* Basic Info Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={theme.colors.textSecondary}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
        
        {/* Location Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          {/* Map Preview */}
          <TouchableOpacity 
            style={styles.mapPreview} 
            onPress={() => setShowLocationPicker(true)}
          >
            {address ? (
              <Text style={styles.mapPreviewText}>{address}</Text>
            ) : (
              <Text style={styles.mapPreviewTextPlaceholder}>Tap to select location</Text>
            )}
            <Ionicons name="location-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* The Location Picker Modal */}
          <Modal
            visible={showLocationPicker}
            animationType="slide"
            onRequestClose={() => setShowLocationPicker(false)}
          >
            <SafeAreaViewRN style={{ flex: 1, backgroundColor: theme.colors.background }}>
              <View style={{ flex: 1 }}>
                <MapView
                  location={location}
                  beacons={[]}
                  isDarkMode={true}
                  onBeaconPress={handleBeaconPress}
                  allowPinDrop={true}
                />
                
                <TouchableOpacity
                  style={styles.closeMapButton}
                  onPress={() => setShowLocationPicker(false)}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                
                <Text style={styles.floatingMapInstructions}>
                  Tap anywhere on the map to drop a pin
                </Text>
                
                <View style={styles.bottomConfirmContainer}>
                  <TouchableOpacity
                    onPress={handleConfirmLocation}
                    style={[
                      styles.bottomConfirmButton,
                      { opacity: selectedBeacon ? 1 : 0.5 },
                    ]}
                    disabled={!selectedBeacon}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaViewRN>
          </Modal>
        </View>

        {/* Date & Time Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
          {/* Date Picker */}
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeColumn}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setPickerMode('date')}
              >
                <Text style={styles.pickerButtonText}>
                  {formatDate(date)}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Time Picker Row */}
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeColumn}>
              <Text style={styles.label}>Start Time</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setPickerMode('startTime')}
              >
                <Text style={styles.pickerButtonText}>
                  {formatTime(startTime)}
                </Text>
                <Ionicons name="time-outline" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateTimeColumn}>
              <Text style={styles.label}>End Time</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setPickerMode('endTime')}
              >
                <Text style={styles.pickerButtonText}>
                  {formatTime(endTime)}
                </Text>
                <Ionicons name="time-outline" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Time Pickers */}
          {pickerMode === 'date' && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.picker}
                themeVariant="dark"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={() => setPickerMode(null)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {pickerMode === 'startTime' && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={startTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartTimeChange}
                style={styles.picker}
                themeVariant="dark"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={() => setPickerMode(null)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {pickerMode === 'endTime' && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={endTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndTimeChange}
                style={styles.picker}
                themeVariant="dark"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={() => setPickerMode(null)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Attendees & Visibility Section */}
        <View style={styles.formSection}>
          {/* <Text style={styles.sectionTitle}>Attendees & Visibility</Text> */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Max Attendees</Text>
              {/* <Text style={styles.settingDescription}>Set the maximum number of people who can join</Text> */}
            </View>
            <View style={styles.numberPickerContainer}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={decrementAttendees}
              >
                <Text style={styles.buttonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.numberValue}>{maxAttendees}</Text>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={incrementAttendees}
              >
                <Text style={styles.buttonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Viewing Radius (miles)</Text>
              <Text style={styles.settingDescription}>How far away can others see this beacon</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={10}
              step={0.5}
              value={viewingRadius}
              onValueChange={setViewingRadius}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor="rgba(100, 100, 100, 0.5)"
              thumbTintColor="white"
            />
            <View style={styles.sliderValues}>
              <Text style={styles.sliderMinValue}>0.5</Text>
              <View style={styles.sliderCurrentValue}>
                <Text style={styles.sliderCurrentValueText}>{viewingRadius.toFixed(1)} mi</Text>
              </View>
              <Text style={styles.sliderMaxValue}>10</Text>
            </View>
          </View>
        </View>

        {/* Token Settings Section */}
        <View style={styles.formSection}>
          {/* <Text style={styles.sectionTitle}>Token Settings</Text> */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Charge Attendees</Text>
              {/* <Text style={styles.settingDescription}>
                {isTokenReward ? 'Give $BOND tokens to people who join' : 'Require $BOND tokens to join'}
              </Text> */}
            </View>
            <Switch
              value={isTokenReward}
              onValueChange={setIsTokenReward}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
            />
          </View>

          {isTokenReward && (
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>
                 Amount
                </Text>
                {/* <Text style={styles.settingDescription}>
                  {isTokenReward ? 'Tokens to give per attendee' : 'Tokens required to join'}
                </Text> */}
              </View>
              <View style={styles.numberPickerContainer}>
                <TouchableOpacity 
                  style={styles.numberButton}
                  onPress={() => setTokenCost(Math.max(0, tokenCost - 1))}
                >
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
                
                <Text style={styles.numberValue}>{tokenCost} $BOND</Text>
                
                <TouchableOpacity 
                  style={styles.numberButton}
                  onPress={() => setTokenCost(tokenCost + 1)}
                >
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {userInfo && isTokenReward && (
            <Text style={styles.balanceText}>
              Your Balance: {userInfo.tokenBalance} $BOND
            </Text>
          )}
        </View>

        {/* Submit Buttons */}
        <View style={styles.formSection}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!category || !subcategory) && styles.buttonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!category || !subcategory}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.createButtonText}>Create Beacon</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </View>
          </TouchableOpacity>

          {process.env.NODE_ENV === 'development' && (
            <TouchableOpacity
              style={[styles.mockDataButton, isMockDataGenerating && styles.buttonDisabled]}
              onPress={handleGenerateMockData}
              disabled={isMockDataGenerating}
            >
              <Text style={styles.createButtonText}>
                {isMockDataGenerating ? "Generating Mock Data..." : "Generate 5 Mock Beacons"}
              </Text>
              {isMockDataGenerating && (
                <ActivityIndicator size="small" color="white" style={styles.loadingIndicator} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing.lg,
  },
  form: {
    padding: theme.spacing.sm,
  },
  formSection: {
    backgroundColor: 'rgba(20, 20, 20, 0.4)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    width: '48%',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryItemActive: {
    backgroundColor: theme.colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    width: '48%',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subcategoryItemActive: {
    backgroundColor: theme.colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 22,
    marginRight: theme.spacing.sm,
  },
  categoryLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    flex: 1,
  },
  categoryLabelActive: {
    color: 'white',
    fontWeight: '600',
  },
  checkmarkContainer: {
    marginLeft: theme.spacing.xs,
  },
  imageUploadContainer: {
    width: '100%',
    height: 120,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.7)',
  },
  imagePlaceholderText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    marginBottom: theme.spacing.md,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '500',
    marginLeft: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  dateTimeColumn: {
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  pickerButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  pickerButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
  },
  pickerContainer: {
    marginTop: theme.spacing.sm,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  picker: {
    width: '100%',
    marginVertical: theme.spacing.xs,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  doneButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.sm,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  numberPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberButton: {
    backgroundColor: theme.colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  numberValue: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  sliderContainer: {
    marginBottom: theme.spacing.md,
  },
  slider: {
    marginVertical: theme.spacing.sm,
  },
  sliderValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderMinValue: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  sliderMaxValue: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  sliderCurrentValue: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sliderCurrentValueText: {
    color: 'white',
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    marginRight: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  mockDataButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginLeft: theme.spacing.sm,
  },
  balanceText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  selectedCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedCategoryEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  selectedCategoryTextContainer: {
    flex: 1,
  },
  selectedCategoryText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  selectedSubcategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  selectedSubcategoryEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  selectedSubcategoryText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  editCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xs,
  },
  editCategoryText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  locationInput: {
    flex: 1,
    marginBottom: 0,
    textAlignVertical: 'top',
  },
  mapButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    width: 50,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  locationHelp: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  mapWrapper: {
    flex: 1,
  },
  bottomConfirmContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  bottomConfirmButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
  },
  mapPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  mapPreviewText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    flex: 1,
  },
  mapPreviewTextPlaceholder: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    flex: 1,
  },
  closeMapButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 24,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  floatingMapInstructions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 88 : 70,
    left: 16,
    right: 16,
    textAlign: 'center',
    color: 'white',
    fontSize: theme.typography.sizes.sm,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 1000,
  },
}); 