import { parseISO, isValid, format, formatDistance } from 'date-fns';

/**
 * Gets a date from a beacon object, handling both old (date) and new (startTime) field names
 * @param object The object containing date fields
 * @returns A valid Date object or current date if invalid
 */
export const getValidDate = (object: any): Date => {
  try {
    // Try startTime first
    if (object.startTime) {
      const date = parseISO(object.startTime);
      if (isValid(date)) return date;
    }
    
    // Fall back to date field
    if (object.date) {
      const date = parseISO(object.date);
      if (isValid(date)) return date;
    }
    
    // If neither are valid, return current date
    return new Date();
  } catch (error) {
    console.warn('Invalid date value:', error);
    return new Date();
  }
};

/**
 * Format a date with error handling
 * @param date The date string or Date object
 * @param formatString Format string for date-fns
 * @returns Formatted date string or fallback message
 */
export const formatSafeDate = (date: string | Date | undefined | null, formatString: string = 'MMMM d, yyyy h:mm a'): string => {
  try {
    if (!date) return 'Date not available';
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (isValid(dateObj)) {
      return format(dateObj, formatString);
    }
    return 'Date not available';
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Date not available';
  }
};

/**
 * Format a date relative to now (e.g., "2 days ago")
 * @param date The date string or Date object
 * @returns Formatted relative date string or fallback message
 */
export const formatRelativeDate = (date: string | Date | undefined | null): string => {
  try {
    if (!date) return 'Date not available';
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (isValid(dateObj)) {
      return formatDistance(dateObj, new Date(), { addSuffix: true });
    }
    return 'Date not available';
  } catch (error) {
    console.warn('Error formatting relative date:', error);
    return 'Date not available';
  }
};

/**
 * Determine if a beacon is active (ongoing)
 * @param startTime The start time of the beacon
 * @param endTime The end time of the beacon
 * @returns True if the beacon is currently active, false otherwise
 */
export const isBeaconActive = (startTime: string | Date | undefined | null, endTime?: string | Date | undefined | null): boolean => {
  try {
    if (!startTime) return false;
    
    const now = new Date();
    const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
    
    if (!isValid(start)) return false;
    
    // If no valid end time, consider active if start time is in the past
    if (!endTime) return start <= now;
    
    const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
    if (!isValid(end)) return start <= now;
    
    // Active if current time is between start and end times
    return start <= now && now <= end;
  } catch (error) {
    console.warn('Error checking if beacon is active:', error);
    return false;
  }
}; 