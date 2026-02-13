import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Beacon } from '../../../shared/types/beacon';
import { Text } from '../../../shared/components';
import { theme } from '../../../core/theme';
import { formatSafeDate } from '../../../utils/dateUtils';
import { CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS } from '../../../shared/constants/categories';
import { BeaconCategory } from '../../../shared/types/beacon';

interface BeaconCalloutProps {
  beacon: Beacon;
}

export function BeaconCallout({ beacon }: BeaconCalloutProps) {
  // Get subcategory emoji if available, otherwise fallback to category emoji
  const emoji = beacon.subcategory && 
    SUBCATEGORY_EMOJIS[beacon.category as BeaconCategory]?.[beacon.subcategory] 
      ? SUBCATEGORY_EMOJIS[beacon.category as BeaconCategory][beacon.subcategory] 
      : CATEGORY_EMOJIS[beacon.category as BeaconCategory];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text size="lg" style={styles.emoji}>{emoji}</Text>
        <Text variant="semibold" size="md" style={styles.title} numberOfLines={1}>
          {beacon.title}
        </Text>
      </View>
      <Text variant="medium" size="sm" style={styles.category}>
        {beacon.category.charAt(0).toUpperCase() + beacon.category.slice(1)}
        {beacon.subcategory && ` • ${beacon.subcategory}`}
      </Text>
      <Text variant="regular" size="sm" style={styles.date}>
        {formatSafeDate(beacon.startTime)}
      </Text>
      <Text variant="regular" size="sm" style={styles.attendees}>
        {beacon.attendees.length} attending
        {beacon.maxAttendees ? ` / ${beacon.maxAttendees} max` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    minWidth: 160,
    maxWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  emoji: {
    color: '#1A1A1A',
  },
  title: {
    color: '#1A1A1A',
    flex: 1,
  },
  category: {
    color: theme.colors.primary,
    marginBottom: 6,
  },
  date: {
    color: '#666666',
    marginBottom: 4,
  },
  attendees: {
    color: '#666666',
  },
}); 