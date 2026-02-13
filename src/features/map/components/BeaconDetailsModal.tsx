import React from 'react';
import { Modal, View, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
import { Beacon, BeaconCategory } from '@shared/types/beacon';
import { theme } from '@core/theme';
import { Text } from '../../../shared/components';
import { CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS } from '@shared/constants/categories';
import { format, isValid, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface BeaconDetailsModalProps {
  beacon: Beacon | null;
  visible: boolean;
  onClose: () => void;
  onJoinRequest: (beaconId: string) => void;
  isJoined: boolean;
}

export const BeaconDetailsModal: React.FC<BeaconDetailsModalProps> = ({
  beacon,
  visible,
  onClose,
  onJoinRequest,
  isJoined,
}) => {
  if (!beacon) return null;

  // Get subcategory emoji if available, otherwise fallback to category emoji
  const emoji = beacon.subcategory && SUBCATEGORY_EMOJIS[beacon.category as BeaconCategory]?.[beacon.subcategory] 
    ? SUBCATEGORY_EMOJIS[beacon.category as BeaconCategory][beacon.subcategory] 
    : CATEGORY_EMOJIS[beacon.category as BeaconCategory];

  const formatEventDate = () => {
    if (!beacon.startTime) return 'Date not available';
    try {
      const date = parseISO(beacon.startTime);
      return isValid(date) 
        ? format(date, 'EEEE, MMMM d • h:mm a')
        : 'Date not available';
    } catch (e) {
      return 'Date not available';
    }
  };

  const handleJoinPress = () => {
    onJoinRequest(beacon.id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Blur Background */}
        <TouchableOpacity 
          style={styles.blurBackground} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <View style={styles.blurBackdrop} />
        </TouchableOpacity>

        {/* Main Content Container */}
        <View style={styles.contentContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Hero Section */}
          <View style={styles.heroSection}>
            {beacon.beaconImage ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: beacon.beaconImage }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <View style={styles.categoryBadge}>
                    <Text variant="medium" size="sm" style={styles.categoryBadgeText}>
                      {emoji} {beacon.category}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.heroPlaceholder}>
                <Text size="xl" style={styles.heroEmoji}>{emoji}</Text>
                <View style={styles.categoryBadge}>
                  <Text variant="medium" size="sm" style={styles.categoryBadgeText}>
                    {beacon.category}
                  </Text>
                </View>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text variant="bold" size="xl" style={styles.title}>
                {beacon.title}
              </Text>
              {beacon.subcategory && (
                <Text variant="medium" size="md" style={styles.subcategory}>
                  {beacon.subcategory}
                </Text>
              )}
            </View>

            {/* Quick Info Cards */}
            <View style={styles.quickInfoContainer}>
              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text variant="medium" size="sm" style={styles.infoLabel}>When</Text>
                  <Text variant="regular" size="sm" style={styles.infoValue}>
                    {formatEventDate()}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text variant="medium" size="sm" style={styles.infoLabel}>Where</Text>
                  <Text variant="regular" size="sm" style={styles.infoValue} numberOfLines={2}>
                    {beacon.location.address || 'Address not available'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text variant="medium" size="sm" style={styles.infoLabel}>Attendees</Text>
                  <Text variant="regular" size="sm" style={styles.infoValue}>
                    {beacon.attendees?.length || 0} people joining
                  </Text>
                </View>
              </View>
            </View>

            {/* Description Section */}
            <View style={styles.descriptionSection}>
              <Text variant="semibold" size="lg" style={styles.sectionTitle}>
                About this event
              </Text>
              <Text variant="regular" size="md" style={styles.description}>
                {beacon.description}
              </Text>
            </View>

            {/* Additional spacing for bottom button */}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Fixed Bottom Action */}
          <View style={styles.bottomActionContainer}>
            <View style={styles.bottomGradient} />
            {!isJoined ? (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoinPress}
                activeOpacity={0.8}
              >
                <Text variant="semibold" size="md" style={styles.joinButtonText}>
                  Request to Join
                </Text>
                <Ionicons name="arrow-forward" size={18} color="white" style={styles.joinButtonIcon} />
              </TouchableOpacity>
            ) : (
              <View style={styles.joinedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text variant="medium" size="md" style={styles.joinedText}>
                  You're joining this event
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  blurBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.95,
    minHeight: screenHeight * 0.85,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  heroSection: {
    position: 'relative',
    height: 200,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroPlaceholder: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: '#333333',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Extra space for fixed bottom button
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    color: '#1A1A1A',
    lineHeight: 32,
    marginBottom: 4,
  },
  subcategory: {
    color: '#666666',
    marginTop: 4,
  },
  quickInfoContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(121, 184, 196, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: '#1A1A1A',
    lineHeight: 18,
  },
  descriptionSection: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  sectionTitle: {
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    color: '#333333',
    lineHeight: 24,
  },
  bottomSpacer: {
    height: 40,
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
  },
  bottomGradient: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  joinButton: {
    backgroundColor: '#79B8C4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#79B8C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinButtonText: {
    color: '#FFFFFF',
  },
  joinButtonIcon: {
    marginLeft: 4,
  },
  joinedIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0F2F1',
  },
  joinedText: {
    color: '#2E7D32',
  },
}); 