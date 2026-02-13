import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEventsStore } from '../../../shared/store/events';
import { Event } from '../../../shared/types/event';
import { theme } from '../../../core/theme';
import { format } from 'date-fns';
import { generateInitialMockData } from '../../../services/mockData';

export function EventsListScreen() {
  const { events, isLoading, error, fetchEvents } = useEventsStore();
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isGeneratingMockData, setIsGeneratingMockData] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const toggleEventExpand = (eventId: string) => {
    setExpandedEventId(prevId => prevId === eventId ? null : eventId);
  };

  const handleGenerateMockData = async () => {
    setIsGeneratingMockData(true);
    try {
      const results = await generateInitialMockData();
      Alert.alert(
        "Mock Data Generated",
        `Successfully created ${results.length} mock events in the Los Angeles area.`,
        [{ 
          text: "OK", 
          onPress: () => fetchEvents() // Refresh the events list after generating
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

  const renderEventItem = ({ item }: { item: Event }) => {
    const isExpanded = expandedEventId === item.id;
    
    // Format date
    const formattedDate = format(new Date(item.startTime), 'MMMM d, yyyy h:mm a');

    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => toggleEventExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDate}>{formattedDate}</Text>
        </View>
        
        <View style={styles.eventBasicInfo}>
          <Text style={styles.categoryLabel}>{item.category}</Text>
          <Text style={styles.attendeesCount}>
            {item.attendees.length} {item.attendees.length === 1 ? 'attendee' : 'attendees'}
          </Text>
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
            <Text style={styles.detailValue}>
              {item.attendees.length} / {item.maxAttendees || '∞'}
            </Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Events</Text>
      </View>
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No events found</Text>
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
              <Text style={styles.mockDataButtonText}>Generate Mock Events</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
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
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  eventCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  eventDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  eventBasicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  categoryLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  attendeesCount: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
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
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    width: 100,
  },
  detailValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  mockDataButton: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    minWidth: 200,
  },
  mockDataButtonDisabled: {
    opacity: 0.7,
  },
  mockDataButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  mockButtonContentLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
}); 