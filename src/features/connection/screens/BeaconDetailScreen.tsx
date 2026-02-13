import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  Image,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { theme } from '../../../core/theme';
import { useBeaconsStore } from '../../../shared/store/beacons';
import { Beacon } from '../../../shared/types/beacon';
import { format } from 'date-fns';
import { CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS } from '../../../shared/constants/categories';

type BeaconDetailScreenRouteProp = RouteProp<RootStackParamList, 'BeaconDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BeaconDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BeaconDetailScreenRouteProp>();
  const { beaconId, isEditable = false } = route.params || {};
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);
  
  const { 
    beacons, 
    updateBeacon,
    deleteBeacon,
    fetchBeacons
  } = useBeaconsStore();
  
  // State for beacon data
  const [beacon, setBeacon] = useState<Beacon | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch beacon data
  useEffect(() => {
    console.log('BeaconDetailScreen mounted, beaconId:', beaconId);
    
    const fetchBeaconData = async () => {
      if (!beaconId) {
        console.error('No beaconId provided');
        setError('Beacon ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching beacon data for ID:', beaconId);
        await fetchBeacons();
        
        console.log('Beacons fetched, total:', beacons.length);
        
        // Find the beacon directly from the store
        const foundBeacon = beacons.find(b => b.id === beaconId);
        
        if (foundBeacon) {
          console.log('Beacon found:', foundBeacon.title);
          if (mountedRef.current) {
            setBeacon(foundBeacon);
            setTitle(foundBeacon.title);
            setDescription(foundBeacon.description);
            setLoading(false);
          }
        } else {
          console.error('Beacon not found with ID:', beaconId);
          setError('Beacon not found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching beacon:', error);
        setError('Failed to load beacon details');
        setLoading(false);
      }
    };
    
    // Start fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    fetchBeaconData();
    
    // Cleanup on unmount
    return () => {
      console.log('BeaconDetailScreen unmounting');
      mountedRef.current = false;
      fadeAnim.setValue(0);
    };
  }, [beaconId]);
  
  const handleGoBack = useCallback(() => {
    // Fade out animation before navigating back
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  }, [fadeAnim, navigation]);
  
  const toggleEditMode = useCallback(() => {
    if (isEditing) {
      // Save changes
      if (beacon) {
        try {
          updateBeacon({
            ...beacon,
            title,
            description,
            updatedAt: new Date().toISOString()
          });
          
          // Update local state
          setBeacon({
            ...beacon,
            title,
            description,
            updatedAt: new Date().toISOString()
          });
          
          Alert.alert('Success', 'Beacon updated successfully!');
        } catch (error) {
          console.error('Error updating beacon:', error);
          Alert.alert('Error', 'Failed to update beacon');
        }
      }
    }
    
    setIsEditing(prevState => !prevState);
  }, [isEditing, beacon, title, description, updateBeacon]);
  
  const handleDeleteBeacon = useCallback(() => {
    Alert.alert(
      'Delete Beacon',
      'Are you sure you want to delete this beacon? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (beacon) {
              try {
                deleteBeacon(beacon.id);
                Alert.alert('Success', 'Beacon deleted successfully');
                navigation.goBack();
              } catch (error) {
                console.error('Error deleting beacon:', error);
                Alert.alert('Error', 'Failed to delete beacon');
              }
            }
          } 
        }
      ]
    );
  }, [beacon, deleteBeacon, navigation]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageLoadStart = useCallback(() => {
    setImageLoading(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
  }, []);
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading beacon details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.loadingText, { color: theme.colors.error }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.tryAgainButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              navigation.goBack();
            }}
          >
            <Text style={styles.tryAgainButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!beacon) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.loadingText, { color: theme.colors.error }]}>Beacon not found</Text>
          <TouchableOpacity 
            style={styles.tryAgainButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.tryAgainButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Content container with fade animation */}
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Beacon Details</Text>
          
          {isEditable && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={toggleEditMode} 
              activeOpacity={0.7}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons 
                name={isEditing ? "checkmark" : "create-outline"} 
                size={24} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Beacon Image */}
          {beacon.beaconImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: beacon.beaconImage }}
                style={styles.beaconImage}
                resizeMode="cover"
                onLoadStart={handleImageLoadStart}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              )}
            </View>
          )}
          
          {/* Beacon Info Card */}
          <View style={styles.beaconInfoCard}>
            <View style={styles.beaconHeader}>
              <View style={styles.beaconIcon}>
                <Text style={styles.categoryEmoji}>
                  {beacon.subcategory && SUBCATEGORY_EMOJIS[beacon.category as keyof typeof SUBCATEGORY_EMOJIS]?.[beacon.subcategory]
                    ? SUBCATEGORY_EMOJIS[beacon.category as keyof typeof SUBCATEGORY_EMOJIS][beacon.subcategory]
                    : CATEGORY_EMOJIS[beacon.category as keyof typeof CATEGORY_EMOJIS] || '📍'}
                </Text>
              </View>
              
              <View style={styles.beaconTitleContainer}>
                {isEditing ? (
                  <TextInput
                    style={[styles.beaconTitle, styles.editInput]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Beacon Title"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                ) : (
                  <Text style={styles.beaconTitle}>{beacon.title}</Text>
                )}
                
                <Text style={styles.beaconCategory}>{beacon.category}</Text>
                {beacon.subcategory && (
                  <Text style={styles.beaconSubcategory}>{beacon.subcategory}</Text>
                )}
              </View>
            </View>
            
            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.description, styles.editInput]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Beacon Description"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              ) : (
                <Text style={styles.description}>{beacon.description}</Text>
              )}
            </View>
            
            {/* Time & Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.detailText}>
                  {format(new Date(beacon.startTime), 'EEEE, MMMM d, yyyy')}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.detailText}>
                  {format(new Date(beacon.startTime), 'h:mm a')} - 
                  {beacon.endTime && ` ${format(new Date(beacon.endTime), 'h:mm a')}`}
                </Text>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.detailText}>
                  {beacon.location.address || 'Address not available'}
                </Text>
              </View>
            </View>
            
            {/* Token information */}
            {beacon.tokenCost !== undefined && beacon.tokenCost !== null && beacon.tokenCost !== 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Token Information</Text>
                <View style={styles.detailRow}>
                  <Ionicons 
                    name={beacon.tokenCost < 0 ? "arrow-down" : "arrow-up"} 
                    size={20} 
                    color={beacon.tokenCost < 0 ? theme.colors.success : theme.colors.error} 
                  />
                  <Text style={[
                    styles.detailText, 
                    {color: beacon.tokenCost < 0 ? theme.colors.success : theme.colors.error}
                  ]}>
                    {Math.abs(beacon.tokenCost)} $BOND 
                    {beacon.tokenCost < 0 ? ' (Rewards attendees)' : ' (Required to join)'}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Delete Button (only visible for editable beacons) */}
            {isEditable && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDeleteBeacon}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="white" />
                <Text style={styles.deleteButtonText}>Delete Beacon</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 12,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
    zIndex: 10,
    height: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  beaconImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  beaconInfoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  beaconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  beaconIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  beaconTitleContainer: {
    flex: 1,
  },
  beaconTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  beaconCategory: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  beaconSubcategory: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 4,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  editInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  tryAgainButton: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tryAgainButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default BeaconDetailScreen; 