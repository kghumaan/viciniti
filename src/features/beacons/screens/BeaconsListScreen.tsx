import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image,
  ViewStyle,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBeaconsStore } from '../../../shared/store/beacons';
import { useAuthStore } from '../../../shared/store/auth';
import { Beacon, BeaconCategory } from '../../../shared/types/beacon';
import { theme } from '../../../core/theme';
import { format } from 'date-fns';
import { generateInitialMockData } from '../../../services/mockData';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS } from '../../../shared/constants/categories';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { formatSafeDate, isBeaconActive } from '../../../utils/dateUtils';
import { hasTokenCost, isTokenReward, getTokenAmount, formatTokenAmount } from '../../../utils/tokenUtils';
import { SearchBar } from '../../../shared/components/SearchBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function BeaconsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { beacons, isLoading, error, fetchBeacons, requestToJoinBeacon, setFilters, getFilteredBeacons } = useBeaconsStore();
  const { userInfo, updateTokenBalance } = useAuthStore();
  const [expandedBeaconId, setExpandedBeaconId] = useState<string | null>(null);
  const [isGeneratingMockData, setIsGeneratingMockData] = useState(false);
  const [joinedBeaconIds, setJoinedBeaconIds] = useState<string[]>([]);
  const [filteredBeacons, setFilteredBeacons] = useState<Beacon[]>([]);

  useEffect(() => {
    fetchBeacons();
  }, []);

  useEffect(() => {
    // Update filtered beacons whenever the main beacon list or filters change
    setFilteredBeacons(getFilteredBeacons());
  }, [beacons, getFilteredBeacons]);

  const toggleBeaconExpand = (beaconId: string) => {
    setExpandedBeaconId(prevId => prevId === beaconId ? null : beaconId);
  };

  const handleSearch = (query: string) => {
    setFilters({ searchQuery: query });
    setFilteredBeacons(getFilteredBeacons());
  };

  const handleViewBeaconDetails = (beacon: Beacon) => {
    const isCreatedByUser = userInfo ? beacon.createdBy === userInfo.publicAddress : false;
    
    navigation.navigate('BeaconDetail', {
      beaconId: beacon.id,
      isEditable: isCreatedByUser // Only allow editing if the user created the beacon
    });
  };

  const handleRequestJoin = (beaconId: string) => {
    if (!userInfo) {
      Alert.alert(
        "Authentication Required",
        "Please log in to request to join beacons.",
        [{ text: "OK" }]
      );
      return;
    }

    // Find the beacon
    const beacon = beacons.find(b => b.id === beaconId);
    if (!beacon) {
      console.error("Beacon not found:", beaconId);
      return;
    }

    // Check if the user has requested to join already
    if (joinedBeaconIds.includes(beaconId)) {
      Alert.alert(
        "Already Requested",
        "You have already requested to join this beacon.",
        [{ text: "OK" }]
      );
      return;
    }

    // Check if the user has enough $BOND balance for paid beacons
    if (hasTokenCost(beacon.tokenCost) && !isTokenReward(beacon.tokenCost)) {
      // This beacon requires $BOND payment
      const tokenAmount = getTokenAmount(beacon.tokenCost);
      
      if (userInfo.tokenBalance < tokenAmount) {
        Alert.alert(
          "Insufficient $BOND",
          `You need ${tokenAmount} $BOND to join this beacon, but your balance is ${userInfo.tokenBalance} $BOND.`,
          [{ text: "OK" }]
        );
        return;
      }

      // Confirm $BOND payment
      Alert.alert(
        "$BOND Payment Required",
        `This beacon requires ${tokenAmount} $BOND. Do you want to proceed?`,
        [
          { 
            text: "Cancel", 
            style: "cancel" 
          },
          {
            text: "Pay & Join",
            onPress: () => {
              try {
                // Deduct $BOND from user balance - this is safe because we've already checked it's a number above
                updateTokenBalance(-tokenAmount);
                
                // Continue with join request
                processJoinRequest(beaconId);
              } catch (error) {
                console.error("Error processing $BOND payment:", error);
                Alert.alert(
                  "Transaction Failed",
                  "There was an error processing your $BOND payment. Please try again.",
                  [{ text: "OK" }]
                );
              }
            }
          }
        ]
      );
    } else if (isTokenReward(beacon.tokenCost)) {
      // This beacon rewards $BOND
      const rewardAmount = getTokenAmount(beacon.tokenCost);
      
      Alert.alert(
        "$BOND Reward",
        `You will receive ${rewardAmount} $BOND for joining this beacon.`,
        [
          { 
            text: "Cancel", 
            style: "cancel" 
          },
          {
            text: "Join & Receive $BOND",
            onPress: () => {
              try {
                // Add $BOND to user balance - this is safe because we've already checked it's a number above
                updateTokenBalance(rewardAmount);
                
                // Continue with join request
                processJoinRequest(beaconId);
              } catch (error) {
                console.error("Error processing $BOND reward:", error);
                Alert.alert(
                  "Transaction Failed", 
                  "There was an error processing your $BOND reward. Please try again.",
                  [{ text: "OK" }]
                );
              }
            }
          }
        ]
      );
    } else {
      // No $BOND requirements, proceed normally
      processJoinRequest(beaconId);
    }
  };

  const processJoinRequest = (beaconId: string) => {
    if (!userInfo) {
      Alert.alert("Error", "User information not available.");
      return;
    }
    
    // Update the state to mark this beacon as joined
    setJoinedBeaconIds(prevIds => [...prevIds, beaconId]);
    
    // Sanitize user data to ensure no undefined values
    const sanitizedUserData = {
      id: userInfo.publicAddress || "",
      name: userInfo.name || "User",
      // Only include avatar if it exists and is not undefined/null
      ...(userInfo.avatar ? { avatar: userInfo.avatar } : {})
    };
    
    // Use the new requestToJoinBeacon functionality from the store
    requestToJoinBeacon(beaconId, sanitizedUserData);
    
    Alert.alert(
      "Join Request",
      "Your request to join this beacon has been sent!",
      [{ text: "OK" }]
    );
  };

  const handleGenerateMockData = async () => {
    setIsGeneratingMockData(true);
    try {
      const results = await generateInitialMockData();
      Alert.alert(
        "Mock Data Generated",
        `Successfully created ${results.length} mock beacons in the Los Angeles area. They include a mix of free beacons, fee-based beacons, and reward-based beacons.`,
        [{ 
          text: "OK", 
          onPress: () => fetchBeacons() // Refresh the beacons list after generating
        }]
      );
    } catch (error) {
      console.error("Error generating mock data:", error);
      Alert.alert(
        "Error",
        "Failed to generate mock data. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGeneratingMockData(false);
    }
  };

  const renderBeaconItem = ({ item }: { item: Beacon }) => {
    const isUserAttendee = userInfo && item.attendees.some(attendee => 
      typeof attendee === 'object' && attendee.id === userInfo.publicAddress
    );
    const hasRequestedToJoin = joinedBeaconIds.includes(item.id);
    const isExpanded = item.id === expandedBeaconId;
    
    // Use our safe date formatting utility
    const formattedDate = formatSafeDate(item.startTime, 'MMMM d, yyyy h:mm a');
    
    // Check if beacon is active
    const isActive = isBeaconActive(item.startTime, item.endTime);
    
    // Create a style array with proper typing
    const cardStyles: ViewStyle[] = [styles.beaconCard];
    if (isActive) {
      cardStyles.push({
        backgroundColor: theme.colors.cardActive
      });
    }

    // Get subcategory emoji if available, otherwise fallback to category emoji
    const emoji = item.subcategory && SUBCATEGORY_EMOJIS[item.category as BeaconCategory]?.[item.subcategory] 
      ? SUBCATEGORY_EMOJIS[item.category as BeaconCategory][item.subcategory] 
      : CATEGORY_EMOJIS[item.category as BeaconCategory];

    return (
      <TouchableOpacity 
        style={cardStyles}
        onPress={() => toggleBeaconExpand(item.id)}
        onLongPress={() => handleViewBeaconDetails(item)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={styles.beaconHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.categoryEmoji}>{emoji}</Text>
            <Text style={styles.beaconTitle}>{item.title}</Text>
          </View>
          <Text style={styles.beaconDate}>{formattedDate}</Text>
        </View>
        
        <View style={styles.beaconBasicInfo}>
          <Text style={styles.categoryLabel}>{item.category}</Text>
          <View style={styles.attendeesContainer}>
            <Ionicons name="people" size={18} color={theme.colors.textSecondary} style={styles.attendeesIcon} />
            <Text style={styles.attendeesCount}>
              {item.attendees.length}/{item.maxAttendees || '∞'}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedDetails}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
            
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{item.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subcategory:</Text>
              <Text style={styles.detailValue}>{item.subcategory}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{item.location.address}</Text>
            </View>
            
            <Text style={styles.sectionTitle}>Attendees</Text>
            <View style={styles.attendeesSection}>
              <View style={styles.attendeesInfo}>
                <Ionicons name="people" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.detailValue, styles.attendeesExpanded]}>
                  {item.attendees.length} / {item.maxAttendees || '∞'}
                </Text>
              </View>
            </View>
            
            {hasTokenCost(item.tokenCost) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {isTokenReward(item.tokenCost) ? 'Reward:' : 'Cost:'}
                </Text>
                <Text style={[
                  styles.detailValue, 
                  {
                    color: isTokenReward(item.tokenCost) ? theme.colors.success : theme.colors.warning
                  }
                ]}>
                  {formatTokenAmount(item.tokenCost)}
                </Text>
              </View>
            )}
            
            {!isUserAttendee && !hasRequestedToJoin && (
              <TouchableOpacity 
                style={[
                  styles.fullWidthJoinButton, 
                  hasRequestedToJoin && styles.joinButtonSuccess
                ]}
                onPress={() => !hasRequestedToJoin && handleRequestJoin(item.id)}
                disabled={hasRequestedToJoin}
                activeOpacity={hasRequestedToJoin ? 1 : 0.7}
              >
                <View style={[styles.addIconCircle, hasRequestedToJoin && styles.successIconCircle]}>
                  {hasRequestedToJoin ? (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.fullWidthJoinButtonText}>
                  {hasRequestedToJoin ? "Request Sent" : "Request to Join"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBeacons}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Beacons</Text>
      </View>
      
      <SearchBar onSearch={handleSearch} />

      {filteredBeacons.length === 0 ? (
        <View style={styles.emptyContainer}>
          {beacons.length === 0 && !isLoading ? (
            <>
              <Text style={styles.emptyText}>No beacons found</Text>
              <TouchableOpacity 
                style={[styles.mockDataButton, isGeneratingMockData && styles.mockDataButtonDisabled]}
                onPress={handleGenerateMockData}
                disabled={isGeneratingMockData}
              >
                {isGeneratingMockData ? (
                  <View style={styles.mockButtonContentLoading}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.mockDataButtonText}>Generating...</Text>
                  </View>
                ) : (
                  <Text style={styles.mockDataButtonText}>Generate Mock Beacons</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyText}>No beacons found</Text>
              <Text style={styles.emptySubtext}>Try changing your filters or search query</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBeacons}
          renderItem={renderBeaconItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  beaconCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  beaconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  beaconTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  beaconDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  beaconBasicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  categoryLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  attendeesIcon: {
    marginRight: 4,
  },
  attendeesCount: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  expandedDetails: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: 'bold',
    color: theme.colors.text,
    width: 100,
  },
  detailValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    flex: 1,
  },
  attendeesExpanded: {
    marginLeft: theme.spacing.sm,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  mockDataButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mockDataButtonDisabled: {
    backgroundColor: `${theme.colors.primary}80`,
  },
  mockDataButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  mockButtonContentLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockButtonIcon: {
    marginRight: theme.spacing.sm,
  },
  attendeesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  joinButtonIcon: {
    marginRight: theme.spacing.sm,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.sm,
    fontWeight: 'bold',
  },
  fullWidthJoinButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: theme.spacing.md,
  },
  fullWidthJoinButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  successIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeBeacon: {
    backgroundColor: theme.colors.cardActive,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: theme.colors.background,
  },
  searchInputContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: theme.colors.text,
  },
  clearButton: {
    padding: 6,
  },
  emptySubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
}); 