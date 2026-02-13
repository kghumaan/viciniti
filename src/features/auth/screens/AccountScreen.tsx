import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Image,
  FlatList,
  Alert,
  ImageStyle
} from 'react-native';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../shared/store/auth';
import { useBeaconsStore } from '../../../shared/store/beacons';
import { theme } from '../../../core/theme';
import { Beacon, JoinRequest, BeaconCategory } from '../../../shared/types/beacon';
import { formatSafeDate } from '../../../utils/dateUtils';
import { CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS } from '../../../shared/constants/categories';

export function AccountScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { userInfo, logout, loading: authLoading } = useAuthStore();
  const { 
    getUserCreatedBeacons, 
    getUserJoinRequests, 
    approveJoinRequest, 
    rejectJoinRequest 
  } = useBeaconsStore();

  const [activeTab, setActiveTab] = useState('beacons');
  const [loading, setLoading] = useState(false);

  // Get user's created beacons
  const userCreatedBeacons = userInfo ? getUserCreatedBeacons(userInfo.publicAddress) : [];
  
  // Get user's join requests
  const pendingRequests = userInfo ? getUserJoinRequests(userInfo.publicAddress) : [];

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      // Navigation is handled by the auth state listener in App.tsx
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = (beaconId: string, userId: string) => {
    approveJoinRequest(beaconId, userId);
  };

  const handleRejectRequest = (beaconId: string, userId: string) => {
    rejectJoinRequest(beaconId, userId);
  };

  const handleEditBeacon = (beacon: Beacon) => {
    // Use simple navigation to avoid any potential issues with reset
    console.log('Navigating to beacon details for ID:', beacon.id);
    navigation.navigate('BeaconDetail', { 
      beaconId: beacon.id,
      isEditable: true 
    });
  };

  const getRequestCount = (beacon: Beacon) => {
    return (beacon.joinRequests as JoinRequest[] | undefined)?.filter(req => req.status === 'pending').length || 0;
  };

  const renderBeaconItem = ({ item }: { item: Beacon }) => {
    const formattedDate = formatSafeDate(item.startTime);
    
    // Get subcategory emoji if available, otherwise fallback to category emoji
    const emoji = item.subcategory && SUBCATEGORY_EMOJIS[item.category as BeaconCategory]?.[item.subcategory] 
      ? SUBCATEGORY_EMOJIS[item.category as BeaconCategory][item.subcategory] 
      : CATEGORY_EMOJIS[item.category as BeaconCategory];
    
    return (
      <TouchableOpacity 
        style={styles.beaconCard}
        onPress={() => handleEditBeacon(item)}
        activeOpacity={0.7}
      >
        <View style={styles.beaconCardHeader}>
          <View style={styles.beaconHeaderContent}>
            <Text style={styles.categoryEmoji}>{emoji}</Text>
            <Text style={styles.beaconTitle} numberOfLines={1}>{item.title}</Text>
          </View>
          <View style={styles.beaconCategoryBadge}>
            <Text style={styles.beaconCategoryText}>{item.category}</Text>
          </View>
        </View>
        
        <Text style={styles.beaconDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.beaconCardFooter}>
          <View style={styles.beaconMeta}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.beaconMetaText}>
              {formattedDate}
            </Text>
          </View>
          
          <View style={styles.beaconMeta}>
            <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.beaconMetaText}>
              {item.attendees.length} attending
            </Text>
          </View>
          
          {/* Display token information if applicable */}
          {item.tokenCost !== undefined && item.tokenCost !== null && item.tokenCost !== 0 && (
            <View style={styles.beaconMeta}>
              <Ionicons 
                name={item.tokenCost < 0 ? "arrow-down" : "arrow-up"} 
                size={16} 
                color={item.tokenCost < 0 ? theme.colors.success : theme.colors.error} 
              />
              <Text style={[
                styles.beaconMetaText, 
                {color: item.tokenCost < 0 ? theme.colors.success : theme.colors.error}
              ]}>
                {Math.abs(item.tokenCost)} $BOND 
                {item.tokenCost < 0 ? ' (reward)' : ' (cost)'}
              </Text>
            </View>
          )}
          
          {getRequestCount(item) > 0 && (
            <View style={styles.pendingRequestsBadge}>
              <Text style={styles.pendingRequestsText}>
                {getRequestCount(item)} pending
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRequestItem = ({ item }: { item: { beacon: Beacon, request: JoinRequest } }) => {
    const requestDate = formatSafeDate(item.request.timestamp);
    
    return (
      <View style={styles.requestCard}>
        <View style={styles.requestCardHeader}>
          <Text style={styles.requestBeaconTitle} numberOfLines={1}>
            {item.beacon.title}
          </Text>
          <Text style={styles.requestStatus}>
            Status: <Text style={styles.statusValue}>{item.request.status}</Text>
          </Text>
        </View>
        
        <Text style={styles.requestTimestamp}>
          Requested on {requestDate}
        </Text>
        
        {item.request.status === 'pending' && (
          <View style={styles.requestCardActions}>
            <Text style={styles.requestActionLabel}>Waiting for approval</Text>
          </View>
        )}
      </View>
    );
  };

  // Render beacon requests to be reviewed by the user (creator of the beacon)
  const renderPendingApprovalItem = ({ item }: { item: Beacon }) => {
    const pendingRequests = item.joinRequests?.filter(req => req.status === 'pending') || [];
    
    if (pendingRequests.length === 0) return null;
    
    return (
      <View style={styles.pendingApprovalCard}>
        <Text style={styles.pendingApprovalTitle}>{item.title}</Text>
        
        {pendingRequests.map((request) => (
          <View key={request.userId} style={styles.approvalRequest}>
            <View style={styles.approvalRequestUser}>
              <View style={styles.approvalUserAvatar}>
                {request.userAvatar ? (
                  <Image source={{ uri: request.userAvatar }} style={styles.avatarImage as ImageStyle} />
                ) : (
                  <MaterialCommunityIcons name="account" size={24} color={theme.colors.textSecondary} />
                )}
              </View>
              <Text style={styles.approvalUserName}>{request.userName}</Text>
            </View>
            
            <View style={styles.approvalActions}>
              <TouchableOpacity 
                style={styles.approveButton}
                onPress={() => handleApproveRequest(item.id, request.userId)}
              >
                <Ionicons name="checkmark" size={18} color={theme.colors.success} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.rejectButton}
                onPress={() => handleRejectRequest(item.id, request.userId)}
              >
                <Ionicons name="close" size={18} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.userCard}>
            <View style={styles.userAvatarContainer}>
              <View style={styles.userAvatar}>
                {userInfo?.avatar ? (
                  <Image source={{ uri: userInfo.avatar }} style={styles.avatarImage as ImageStyle} />
                ) : (
                  <MaterialCommunityIcons name="account" size={48} color={theme.colors.textSecondary} />
                )}
              </View>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userInfo?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{userInfo?.email || 'email@example.com'}</Text>
              
              <View style={styles.walletContainer}>
                <Ionicons name="wallet-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.walletAddress} numberOfLines={1}>
                  {userInfo?.publicAddress 
                    ? `${userInfo.publicAddress.slice(0, 6)}...${userInfo.publicAddress.slice(-4)}`
                    : '0x0000...0000'}
                </Text>
              </View>

              <View style={styles.tokenBalanceContainer}>
                <Ionicons name="logo-bitcoin" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.tokenBalance} numberOfLines={1}>
                  {userInfo?.tokenBalance || 0} TAP
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'beacons' && styles.activeTab]}
            onPress={() => setActiveTab('beacons')}
          >
            <Text style={[styles.tabText, activeTab === 'beacons' && styles.activeTabText]}>
              My Beacons
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              My Requests
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'approvals' && styles.activeTab]}
            onPress={() => setActiveTab('approvals')}
          >
            <Text style={[styles.tabText, activeTab === 'approvals' && styles.activeTabText]}>
              Pending Approvals
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'beacons' && (
            <>
              {userCreatedBeacons.length > 0 ? (
                <FlatList
                  data={userCreatedBeacons}
                  renderItem={renderBeaconItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons 
                    name="lighthouse-on" 
                    size={48} 
                    color={theme.colors.textSecondary} 
                  />
                  <Text style={styles.emptyStateText}>
                    You haven't created any beacons yet
                  </Text>
                  <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => navigation.navigate('CreateBeacon')}
                  >
                    <Text style={styles.createButtonText}>Create Beacon</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              {pendingRequests.length > 0 ? (
                <FlatList
                  data={pendingRequests}
                  renderItem={renderRequestItem}
                  keyExtractor={(item) => `${item.beacon.id}-${item.request.userId}`}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons 
                    name="mail-open-outline" 
                    size={48} 
                    color={theme.colors.textSecondary} 
                  />
                  <Text style={styles.emptyStateText}>
                    You don't have any join requests
                  </Text>
                  <TouchableOpacity 
                    style={styles.exploreButton}
                    onPress={() => navigation.navigate('Map')}
                  >
                    <Text style={styles.exploreButtonText}>Explore Beacons</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {activeTab === 'approvals' && (
            <>
              {userCreatedBeacons.some(beacon => (beacon.joinRequests?.some(req => req.status === 'pending'))) ? (
                <FlatList
                  data={userCreatedBeacons.filter(beacon => 
                    beacon.joinRequests?.some(req => req.status === 'pending')
                  )}
                  renderItem={renderPendingApprovalItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons 
                    name="checkmark-circle-outline" 
                    size={48} 
                    color={theme.colors.textSecondary} 
                  />
                  <Text style={styles.emptyStateText}>
                    No pending approvals
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bottomSpacer: {
    height: 140,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  userAvatarContainer: {
    marginRight: theme.spacing.md,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletAddress: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.xs,
  },
  tokenBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  tokenBalance: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  beaconCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  beaconCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  beaconHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  beaconTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  beaconCategoryBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  beaconCategoryText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '500',
    color: theme.colors.text,
  },
  beaconDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  beaconCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  beaconMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  beaconMetaText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  pendingRequestsBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingRequestsText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '500',
    color: theme.colors.indigoDye[500],
  },
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  requestBeaconTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  requestStatus: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statusValue: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  requestTimestamp: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  requestCardActions: {
    alignItems: 'center',
  },
  requestActionLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warning,
    fontWeight: '500',
  },
  pendingApprovalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  pendingApprovalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  approvalRequest: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.indigoDye[400],
  },
  approvalRequestUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  approvalUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.indigoDye[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  approvalUserName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: '500',
  },
  approvalActions: {
    flexDirection: 'row',
  },
  approveButton: {
    backgroundColor: theme.colors.primary,
  },
  rejectButton: {
    backgroundColor: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  createButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  logoutButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
}); 