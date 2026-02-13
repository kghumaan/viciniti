import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Event } from '../../../shared/types/event';
import { Text } from '../../../shared/components';
import { theme } from '../../../core/theme';

interface EventCalloutProps {
  event: Event;
}

export function EventCallout({ event }: EventCalloutProps) {
  return (
    <View style={styles.container}>
      <Text variant="semibold" size="md" style={styles.title} numberOfLines={1}>
        {event.title}
      </Text>
      <Text variant="medium" size="sm" style={styles.category}>
        {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
      </Text>
      <Text variant="regular" size="sm" style={styles.date}>
        {new Date(event.date).toLocaleDateString()}
      </Text>
      <Text variant="regular" size="sm" style={styles.attendees}>
        {event.attendees.length} attending
        {event.maxAttendees ? ` / ${event.maxAttendees} max` : ''}
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
  title: {
    color: '#1A1A1A',
    marginBottom: 4,
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