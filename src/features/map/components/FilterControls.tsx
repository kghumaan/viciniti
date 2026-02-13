import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Text, 
  TextInput,
  FlatList,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { useBeaconsStore } from '../../../shared/store/beacons';
import { BeaconCategory } from '../../../shared/types/beacon';
import { theme } from '../../../core/theme';
import { CATEGORIES, SUBCATEGORIES, CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS } from '../../../shared/constants/categories';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface FilterControlsProps {
  compact?: boolean;
  noModal?: boolean;
}

interface FilterSection {
  id: string;
  title: string;
  icon: string;
  priority: number;
  expanded: boolean;
}

interface FilterOption {
  id: string;
  label: string;
  emoji?: string;
  resultCount?: number;
  category?: BeaconCategory;
}

export function FilterControls({ compact = false, noModal = false }: FilterControlsProps) {
  const { filters, setFilters, beacons, getFilteredBeacons } = useBeaconsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    price: true,
    date: false,
    location: false
  });
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showMoreSubcategories, setShowMoreSubcategories] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Filter sections configuration
  const filterSections: FilterSection[] = [
    { id: 'categories', title: 'Categories', icon: 'grid-outline', priority: 1, expanded: true },
    { id: 'price', title: 'Price & Rewards', icon: 'card-outline', priority: 2, expanded: true },
    { id: 'subcategories', title: 'Specific Activities', icon: 'list-outline', priority: 3, expanded: false },
    { id: 'date', title: 'Date & Time', icon: 'calendar-outline', priority: 4, expanded: false },
    { id: 'location', title: 'Distance', icon: 'location-outline', priority: 5, expanded: false }
  ];

  // Price filter options
  const priceOptions = [
    { id: 'all', label: 'All Beacons', emoji: '🌟', description: 'Show all beacons' },
    { id: 'free', label: 'Free', emoji: '🎟️', description: 'No cost to join' },
    { id: 'rewards', label: 'Earn Rewards', emoji: '💰', description: 'Earn $BOND tokens' },
    { id: 'costs', label: 'Premium', emoji: '💎', description: 'Requires $BOND tokens' }
  ];

  // Calculate result counts for each filter option
  const getResultCount = (filterType: string, filterValue: string): number => {
    // This would be implemented based on your filtering logic
    return Math.floor(Math.random() * 50) + 1; // Mock data for now
  };

  // Returns active filter count
  const getActiveFilterCount = (): number => {
    let count = filters.categories.length + filters.subcategories.length;
    if (filters.tokenFilter !== 'all') count += 1;
    if (filters.searchQuery) count += 1;
    return count;
  };

  // Check if any filters are active
  const hasActiveFilters = (): boolean => {
    return getActiveFilterCount() > 0;
  };

  // Toggle category filter
  const toggleCategory = (category: BeaconCategory) => {
    setIsLoading(true);
    Animated.timing(fadeAnim, {
      toValue: 0.7,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      const newCategories = filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category];
      setFilters({ categories: newCategories });
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
      setIsLoading(false);
    });
  };

  // Toggle subcategory filter
  const toggleSubcategory = (subcategory: string) => {
    setIsLoading(true);
    const newSubcategories = filters.subcategories.includes(subcategory)
      ? filters.subcategories.filter((s) => s !== subcategory)
      : [...filters.subcategories, subcategory];
    setFilters({ subcategories: newSubcategories });
    setTimeout(() => setIsLoading(false), 200);
  };

  // Set price filter
  const setPriceFilter = (tokenFilter: 'all' | 'rewards' | 'costs' | 'free') => {
    setIsLoading(true);
    setFilters({ tokenFilter });
    setTimeout(() => setIsLoading(false), 200);
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setIsLoading(true);
    Animated.timing(fadeAnim, {
      toValue: 0.5,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setFilters({ 
        categories: [], 
        subcategories: [], 
        tokenFilter: 'all',
        searchQuery: undefined
      });
      setSearchQuery('');
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setIsLoading(false);
    });
  };

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ searchQuery: query.trim() || undefined });
  };

  // Get filtered categories for display
  const getDisplayCategories = () => {
    let displayCategories = CATEGORIES;
    
    if (searchQuery) {
      displayCategories = CATEGORIES.filter(cat => 
        cat.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (!showMoreCategories) {
      displayCategories = displayCategories.slice(0, 6);
    }
    
    return displayCategories;
  };

  // Get filtered subcategories for display
  const getDisplaySubcategories = () => {
    const categoriesToShow = filters.categories.length > 0 ? filters.categories : CATEGORIES;
    
    let allSubcategories: { category: BeaconCategory, subcategory: string }[] = [];
    
    categoriesToShow.forEach(category => {
      const subs = SUBCATEGORIES[category] || [];
      subs.forEach(sub => {
        if (!searchQuery || sub.toLowerCase().includes(searchQuery.toLowerCase())) {
          allSubcategories.push({ category, subcategory: sub });
        }
      });
    });

    if (!showMoreSubcategories) {
      allSubcategories = allSubcategories.slice(0, 8);
    }
    
    return allSubcategories;
  };

  // Render search bar
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories or activities..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => handleSearch('')}
            style={styles.clearSearchButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render active filters summary
  const renderActiveFiltersSummary = () => {
    if (!hasActiveFilters()) return null;

    const activeFilters = [];
    
    if (filters.categories.length > 0) {
      activeFilters.push(`${filters.categories.length} categor${filters.categories.length === 1 ? 'y' : 'ies'}`);
    }
    
    if (filters.subcategories.length > 0) {
      activeFilters.push(`${filters.subcategories.length} activit${filters.subcategories.length === 1 ? 'y' : 'ies'}`);
    }
    
    if (filters.tokenFilter !== 'all') {
      const option = priceOptions.find(opt => opt.id === filters.tokenFilter);
      if (option) activeFilters.push(option.label.toLowerCase());
    }

    return (
      <View style={styles.activeFiltersContainer}>
        <View style={styles.activeFiltersContent}>
                     <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
          <Text style={styles.activeFiltersText}>
            Filtering by {activeFilters.join(', ')}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={clearAllFilters}
          style={styles.clearAllButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    );
  };

     // Render filter section header
   const renderSectionHeader = (section: FilterSection) => (
     <TouchableOpacity
       style={styles.sectionHeader}
       onPress={() => toggleSection(section.id)}
       activeOpacity={0.7}
     >
       <View style={styles.sectionHeaderLeft}>
         <Ionicons name={section.icon as any} size={20} color={theme.colors.primary} />
         <Text style={styles.sectionTitle}>{section.title}</Text>
       </View>
       <Ionicons 
         name={expandedSections[section.id] ? "chevron-up" : "chevron-down"} 
         size={18} 
         color="#8E8E93" 
       />
     </TouchableOpacity>
   );

  // Render pill-shaped filter tag
  const renderFilterPill = (
    label: string, 
    isActive: boolean, 
    onPress: () => void, 
    emoji?: string, 
    resultCount?: number,
    disabled?: boolean
  ) => (
    <TouchableOpacity
      style={[
        styles.filterPill,
        isActive && styles.filterPillActive,
        disabled && styles.filterPillDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.filterPillContent}>
        {emoji && <Text style={styles.filterPillEmoji}>{emoji}</Text>}
        <Text style={[
          styles.filterPillText,
          isActive && styles.filterPillTextActive,
          disabled && styles.filterPillTextDisabled
        ]}>
          {label}
        </Text>
        {resultCount !== undefined && (
          <View style={[styles.resultBadge, isActive && styles.resultBadgeActive]}>
            <Text style={[styles.resultBadgeText, isActive && styles.resultBadgeTextActive]}>
              {resultCount}
            </Text>
          </View>
        )}
      </View>
      {isActive && (
        <View style={styles.activeIndicator}>
          <Ionicons name="checkmark" size={12} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  // Render categories section
  const renderCategoriesSection = () => {
    if (!expandedSections.categories) return null;

    const displayCategories = getDisplayCategories();
    const hasMore = CATEGORIES.length > 6 && !showMoreCategories;

    return (
      <View style={styles.sectionContent}>
        <View style={styles.pillContainer}>
          {displayCategories.map((category) => 
            renderFilterPill(
              category,
              filters.categories.includes(category),
              () => toggleCategory(category),
              CATEGORY_EMOJIS[category],
              getResultCount('category', category)
            )
          )}
        </View>
                 {hasMore && (
           <TouchableOpacity 
             style={styles.showMoreButton}
             onPress={() => setShowMoreCategories(true)}
           >
             <Text style={styles.showMoreText}>Show {CATEGORIES.length - 6} more categories</Text>
             <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
           </TouchableOpacity>
         )}
      </View>
    );
  };

  // Render price section
  const renderPriceSection = () => {
    if (!expandedSections.price) return null;

    return (
      <View style={styles.sectionContent}>
        <View style={styles.priceOptionsContainer}>
          {priceOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.priceOption,
                filters.tokenFilter === option.id && styles.priceOptionActive
              ]}
              onPress={() => setPriceFilter(option.id as any)}
              activeOpacity={0.7}
            >
              <View style={styles.priceOptionLeft}>
                <Text style={styles.priceOptionEmoji}>{option.emoji}</Text>
                <View style={styles.priceOptionText}>
                  <Text style={[
                    styles.priceOptionLabel,
                    filters.tokenFilter === option.id && styles.priceOptionLabelActive
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.priceOptionDescription}>{option.description}</Text>
                </View>
              </View>
              <View style={[
                styles.priceOptionRadio,
                filters.tokenFilter === option.id && styles.priceOptionRadioActive
              ]}>
                {filters.tokenFilter === option.id && (
                  <View style={styles.priceOptionRadioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render subcategories section
  const renderSubcategoriesSection = () => {
    if (!expandedSections.subcategories) return null;

    const displaySubcategories = getDisplaySubcategories();
    const hasMore = getDisplaySubcategories().length < getAllSubcategoriesCount();

    return (
      <View style={styles.sectionContent}>
        <View style={styles.pillContainer}>
          {displaySubcategories.map((item) => 
            renderFilterPill(
              item.subcategory,
              filters.subcategories.includes(item.subcategory),
              () => toggleSubcategory(item.subcategory),
              SUBCATEGORY_EMOJIS[item.category][item.subcategory] || CATEGORY_EMOJIS[item.category],
              getResultCount('subcategory', item.subcategory)
            )
          )}
        </View>
                 {hasMore && (
           <TouchableOpacity 
             style={styles.showMoreButton}
             onPress={() => setShowMoreSubcategories(true)}
           >
             <Text style={styles.showMoreText}>Show more activities</Text>
             <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
           </TouchableOpacity>
         )}
        {displaySubcategories.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="apps-outline" size={32} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>
              {filters.categories.length > 0 
                ? "No specific activities for selected categories" 
                : "Select categories to see specific activities"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Helper function to get total subcategories count
  const getAllSubcategoriesCount = (): number => {
    const categoriesToShow = filters.categories.length > 0 ? filters.categories : CATEGORIES;
    let count = 0;
    categoriesToShow.forEach(category => {
      count += SUBCATEGORIES[category]?.length || 0;
    });
    return count;
  };

  // Render loading overlay
  const renderLoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Applying filters...</Text>
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderSearchBar()}
      {renderActiveFiltersSummary()}
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Categories Section */}
        <View style={styles.section}>
          {renderSectionHeader(filterSections[0])}
          {renderCategoriesSection()}
        </View>

        {/* Price Section */}
        <View style={styles.section}>
          {renderSectionHeader(filterSections[1])}
          {renderPriceSection()}
        </View>

        {/* Subcategories Section */}
        <View style={styles.section}>
          {renderSectionHeader(filterSections[2])}
          {renderSubcategoriesSection()}
        </View>

        {/* Spacer for bottom padding */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderLoadingOverlay()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E7',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    height: 44,
    ...Platform.select({
      ios: {
        paddingVertical: 0,
      },
    }),
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#E8F5E8',
    borderBottomWidth: 0.5,
    borderBottomColor: '#D1F2D1',
  },
  activeFiltersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#1D7A1D',
    marginLeft: 6,
    fontWeight: '500',
  },
  clearAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
     clearAllText: {
     fontSize: 14,
     color: theme.colors.primary,
     fontWeight: '600',
   },
  scrollContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E7',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
     filterPillActive: {
     backgroundColor: theme.colors.primary,
     borderColor: theme.colors.primary,
     paddingRight: 30,
   },
  filterPillDisabled: {
    opacity: 0.5,
  },
  filterPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPillEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  filterPillText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextDisabled: {
    color: '#8E8E93',
  },
  resultBadge: {
    backgroundColor: '#E5E5E7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  resultBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  resultBadgeTextActive: {
    color: '#FFFFFF',
  },
  activeIndicator: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
     showMoreText: {
     fontSize: 15,
     color: theme.colors.primary,
     fontWeight: '500',
     marginRight: 4,
   },
  priceOptionsContainer: {
    gap: 1,
    backgroundColor: '#E5E5E7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  priceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  priceOptionActive: {
    backgroundColor: '#F0F8FF',
  },
  priceOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priceOptionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  priceOptionText: {
    flex: 1,
  },
  priceOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
     priceOptionLabelActive: {
     color: theme.colors.primary,
   },
  priceOptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  priceOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
     priceOptionRadioActive: {
     borderColor: theme.colors.primary,
   },
   priceOptionRadioInner: {
     width: 10,
     height: 10,
     borderRadius: 5,
     backgroundColor: theme.colors.primary,
   },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
     loadingSpinner: {
     width: 24,
     height: 24,
     borderRadius: 12,
     borderWidth: 2,
     borderColor: '#E5E5E7',
     borderTopColor: theme.colors.primary,
     marginBottom: 8,
   },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 24,
  },
}); 