import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  Image, 
  Modal, 
  Alert, 
  ActivityIndicator, 
  Animated, 
  Dimensions,
  KeyboardAvoidingView,
  Pressable 
} from 'react-native';
import { Text } from '../../../shared/components/Text';
import { useEventsStore } from '../../../shared/store/events';
import { EventCategory, EventSubcategory } from '../../../shared/types/event';
import { CATEGORIES, SUBCATEGORIES, CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS, CATEGORY_COLORS } from '../../../shared/constants/categories';
import { theme } from '../../../core/theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CreateEventScreenRouteProp = RouteProp<RootStackParamList, 'CreateEvent'>;

interface FormStep {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  completed: boolean;
}

export function CreateEventScreen() {
  const navigation = useNavigation();
  const route = useRoute<CreateEventScreenRouteProp>();
  const { addEvent } = useEventsStore();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [subcategory, setSubcategory] = useState<EventSubcategory[EventCategory] | null>(null);
  const [date, setDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour from now
  const [maxAttendees, setMaxAttendees] = useState(10);
  const [tokenCost, setTokenCost] = useState<number | null>(null);
  const [tokenReward, setTokenReward] = useState<number | null>(null);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [viewingRadius, setViewingRadius] = useState(1);
  const [isOpenEnded, setIsOpenEnded] = useState(false);
  
  // Use a hardcoded location for testing
  const testLocation = {
    latitude: 34.0280465,
    longitude: -118.4323049 
  };
  
  const [location, setLocation] = useState(testLocation);
  const [address, setAddress] = useState('');
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAttendeePicker, setShowAttendeePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isMockDataGenerating, setIsMockDataGenerating] = useState(false);
  
  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Form steps configuration
  const formSteps: FormStep[] = [
    {
      id: 'basics',
      title: 'Event Basics',
      subtitle: 'Give your beacon a name and description',
      icon: 'create-outline',
      completed: title.length > 0 && description.length > 0
    },
    {
      id: 'category',
      title: 'Choose Category',
      subtitle: 'Help people find your beacon',
      icon: 'grid-outline',
      completed: category !== null && subcategory !== null
    },
    {
      id: 'location',
      title: 'Set Location',
      subtitle: 'Where will your event happen?',
      icon: 'location-outline',
      completed: address.length > 0
    },
    {
      id: 'schedule',
      title: 'Schedule',
      subtitle: 'When does your event start?',
      icon: 'time-outline',
      completed: true
    },
    {
      id: 'details',
      title: 'Final Details',
      subtitle: 'Customize your beacon settings',
      icon: 'settings-outline',
      completed: true
    }
  ];

  useEffect(() => {
    setAddress("3420 S Sepulveda Blvd, Los Angeles, CA, 90034");
  }, [location]);

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / formSteps.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < formSteps.length - 1) {
      Animated.timing(slideAnim, {
        toValue: -(currentStep + 1) * screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Animated.timing(slideAnim, {
        toValue: -(currentStep - 1) * screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    if (!category || !subcategory) return;

    setIsCreating(true);
    try {
      await addEvent({
        title,
        description,
        category,
        subcategory,
        date: date.toISOString(),
        location: {
          ...location,
          address,
        },
        createdBy: 'user123',
        attendees: [],
        maxAttendees,
        eventImage,
        viewingRadius,
        tokenCost,
        tokenReward,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(currentDate);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setEventImage(manipResult.uri);
      } catch (error) {
        console.error('Error manipulating image:', error);
        setEventImage(result.assets[0].uri);
      }
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View 
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]} 
        />
      </View>
      <Text size="sm" color={theme.colors.textSecondary} style={styles.stepCounter}>
        Step {currentStep + 1} of {formSteps.length}
      </Text>
    </View>
  );

  const renderStepHeader = () => {
    const currentStepData = formSteps[currentStep];
    return (
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons 
            name={currentStepData.icon} 
            size={24} 
            color={theme.colors.primary} 
          />
        </View>
        <Text variant="bold" size="xl" style={styles.stepTitle}>
          {currentStepData.title}
        </Text>
        <Text size="md" color={theme.colors.textSecondary} style={styles.stepSubtitle}>
          {currentStepData.subtitle}
        </Text>
      </View>
    );
  };

  const renderBasicsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text variant="semibold" size="md" style={styles.inputLabel}>
            Event Title
          </Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="What's your beacon about?"
            placeholderTextColor={theme.colors.placeholder}
            maxLength={60}
          />
          <Text size="xs" color={theme.colors.textMuted} style={styles.inputHelper}>
            {title.length}/60 characters
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text variant="semibold" size="md" style={styles.inputLabel}>
            Description
          </Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell people what to expect..."
            placeholderTextColor={theme.colors.placeholder}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
          <Text size="xs" color={theme.colors.textMuted} style={styles.inputHelper}>
            {description.length}/300 characters
          </Text>
        </View>

        <TouchableOpacity style={styles.imageUploadCard} onPress={pickImage}>
          {eventImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: eventImage }} style={styles.eventImage} />
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={20} color="white" />
                <Text size="sm" color="white" style={styles.imageOverlayText}>
                  Change Photo
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={32} color={theme.colors.primary} />
              <Text variant="medium" size="md" color={theme.colors.primary} style={styles.imagePlaceholderText}>
                Add Event Photo
              </Text>
              <Text size="sm" color={theme.colors.textSecondary}>
                Help your beacon stand out
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryStep = () => (
    <View style={styles.stepContent}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardActive,
                ]}
                onPress={() => {
                  setCategory(cat);
                  setSubcategory(null);
                }}
              >
                <View style={[
                  styles.categoryIcon,
                  { backgroundColor: CATEGORY_COLORS[cat] + '20' }
                ]}>
                  <Text size="xl">{CATEGORY_EMOJIS[cat]}</Text>
                </View>
                <Text 
                  variant={isSelected ? "semibold" : "medium"} 
                  size="sm" 
                  color={isSelected ? theme.colors.primary : theme.colors.text}
                  style={styles.categoryText}
                >
                  {cat}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {category && (
          <View style={styles.subcategorySection}>
            <Text variant="semibold" size="md" style={styles.subcategoryTitle}>
              Choose Specific Activity
            </Text>
            <View style={styles.subcategoryGrid}>
              {SUBCATEGORIES[category]?.map((sub) => {
                const isSelected = subcategory === sub;
                return (
                  <TouchableOpacity
                    key={sub}
                    style={[
                      styles.subcategoryChip,
                      isSelected && styles.subcategoryChipActive,
                    ]}
                    onPress={() => setSubcategory(sub as EventSubcategory[EventCategory])}
                  >
                    <Text size="lg" style={styles.subcategoryEmoji}>
                      {SUBCATEGORY_EMOJIS[category]?.[sub]}
                    </Text>
                    <Text 
                      variant={isSelected ? "semibold" : "regular"} 
                      size="sm"
                      color={isSelected ? theme.colors.primary : theme.colors.text}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.card}>
        <View style={styles.locationHeader}>
          <Ionicons name="location" size={24} color={theme.colors.primary} />
          <View style={styles.locationInfo}>
            <Text variant="semibold" size="md">Current Location</Text>
            <Text size="sm" color={theme.colors.textSecondary}>{address}</Text>
          </View>
        </View>
        
        <View style={styles.radiusControl}>
          <Text variant="semibold" size="md" style={styles.inputLabel}>
            Viewing Radius: {viewingRadius} mile{viewingRadius !== 1 ? 's' : ''}
          </Text>
          <Text size="sm" color={theme.colors.textSecondary} style={styles.radiusHelper}>
            How far away can people see your beacon?
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={5}
            step={0.5}
            value={viewingRadius}
            onValueChange={setViewingRadius}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbStyle={styles.sliderThumb}
          />
          <View style={styles.radiusLabels}>
            <Text size="xs" color={theme.colors.textMuted}>0.5 mi</Text>
            <Text size="xs" color={theme.colors.textMuted}>5 mi</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderScheduleStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.dateTimeIcon}>
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.dateTimeInfo}>
            <Text variant="semibold" size="md">Event Date & Time</Text>
            <Text size="sm" color={theme.colors.textSecondary}>
              {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.toggleSection}>
          <TouchableOpacity 
            style={styles.toggleRow}
            onPress={() => setIsOpenEnded(!isOpenEnded)}
          >
            <View>
              <Text variant="semibold" size="md">Open-ended Event</Text>
              <Text size="sm" color={theme.colors.textSecondary}>
                No specific end time
              </Text>
            </View>
            <View style={[styles.toggle, isOpenEnded && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isOpenEnded && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          is24Hour={false}
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text variant="semibold" size="md" style={styles.inputLabel}>
              Maximum Attendees
            </Text>
            <View style={styles.attendeeControl}>
              <TouchableOpacity 
                style={styles.attendeeButton}
                onPress={() => setMaxAttendees(Math.max(1, maxAttendees - 1))}
              >
                <Ionicons name="remove" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text variant="semibold" size="lg" style={styles.attendeeValue}>
                {maxAttendees}
              </Text>
              <TouchableOpacity 
                style={styles.attendeeButton}
                onPress={() => setMaxAttendees(maxAttendees + 1)}
              >
                <Ionicons name="add" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text variant="semibold" size="md" style={styles.sectionTitle}>
            Token Economics (Optional)
          </Text>
          
          <View style={styles.tokenRow}>
            <TouchableOpacity 
              style={[styles.tokenOption, tokenCost !== null && styles.tokenOptionActive]}
              onPress={() => setTokenCost(tokenCost !== null ? null : 5)}
            >
              <Text size="lg">💎</Text>
              <Text variant="medium" size="sm">Entry Cost</Text>
              {tokenCost !== null && (
                <Text size="xs" color={theme.colors.primary}>{tokenCost} $BOND</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tokenOption, tokenReward !== null && styles.tokenOptionActive]}
              onPress={() => setTokenReward(tokenReward !== null ? null : 10)}
            >
              <Text size="lg">💰</Text>
              <Text variant="medium" size="sm">Reward</Text>
              {tokenReward !== null && (
                <Text size="xs" color={theme.colors.primary}>{tokenReward} $BOND</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderNavigationButtons = () => (
    <View style={styles.navigationContainer}>
      {currentStep > 0 && (
        <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.textSecondary} />
          <Text color={theme.colors.textSecondary}>Back</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.navigationSpacer} />
      
      {currentStep < formSteps.length - 1 ? (
        <TouchableOpacity 
          style={[
            styles.nextButton,
            !formSteps[currentStep].completed && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!formSteps[currentStep].completed}
        >
          <Text variant="semibold" color="white">Next</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text variant="semibold" color="white">Create Beacon</Text>
              <Ionicons name="rocket" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderBasicsStep();
      case 1: return renderCategoryStep();
      case 2: return renderLocationStep();
      case 3: return renderScheduleStep();
      case 4: return renderDetailsStep();
      default: return renderBasicsStep();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="semibold" size="lg" style={styles.headerTitle}>
          Create Beacon
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {renderProgressBar()}
      {renderStepHeader()}

      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        {renderStepContent()}
      </Animated.View>

      {renderNavigationButtons()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: theme.colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  stepCounter: {
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  stepTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
  },
  stepSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  contentContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    borderWidth: 1,
    borderColor: theme.colors.input,
  },
  textArea: {
    height: 100,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top',
  },
  inputHelper: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  imageUploadCard: {
    width: '100%',
    height: 200,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.input,
    borderRadius: theme.borderRadius.md,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    marginBottom: theme.spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  categoryCard: {
    width: '50%',
    padding: theme.spacing.sm,
  },
  categoryCardActive: {
    backgroundColor: theme.colors.pictonBlue[300],
  },
  categoryIcon: {
    width: '100%',
    height: 100,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
  },
  checkmark: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcategorySection: {
    marginBottom: theme.spacing.md,
  },
  subcategoryTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    marginBottom: theme.spacing.sm,
  },
  subcategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subcategoryChip: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  subcategoryChipActive: {
    backgroundColor: theme.colors.pictonBlue[300],
  },
  subcategoryEmoji: {
    fontSize: theme.typography.sizes.lg,
    marginRight: theme.spacing.xs,
  },
  dateTimeButton: {
    backgroundColor: theme.colors.inputBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.input,
  },
  dateTimeIcon: {
    marginRight: theme.spacing.md,
  },
  dateTimeInfo: {
    flex: 1,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  toggle: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  toggleThumbActive: {
    left: 20,
  },
  attendeeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  attendeeButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.pictonBlue[300],
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeValue: {
    fontSize: 18,
    color: theme.colors.text,
    marginHorizontal: theme.spacing.md,
    minWidth: 40,
    textAlign: 'center',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    marginBottom: theme.spacing.sm,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tokenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
  },
  tokenOptionActive: {
    backgroundColor: theme.colors.pictonBlue[300],
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.md,
  },
  nextButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.pictonBlue[300],
  },
  nextButtonDisabled: {
    backgroundColor: theme.colors.pictonBlue[100],
    opacity: 0.5,
  },
     createButton: {
     padding: theme.spacing.md,
     borderRadius: theme.borderRadius.md,
     backgroundColor: theme.colors.pictonBlue[300],
   },
   stepContent: {
     flex: 1,
   },
   locationHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: theme.spacing.md,
   },
   locationInfo: {
     flex: 1,
     marginLeft: theme.spacing.sm,
   },
   radiusControl: {
     marginTop: theme.spacing.md,
   },
   radiusHelper: {
     marginBottom: theme.spacing.sm,
   },
   slider: {
     flex: 1,
     height: 40,
   },
   sliderThumb: {
     backgroundColor: theme.colors.primary,
     width: 20,
     height: 20,
   },
   radiusLabels: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginTop: theme.spacing.xs,
   },
   navigationSpacer: {
     flex: 1,
   },
 }); 