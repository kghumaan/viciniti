import { Beacon, JoinRequest } from '../shared/types/beacon';
import { getValidDate } from './dateUtils';

/**
 * Removes any undefined or null values from a beacon object to avoid Firestore errors
 * @param data The beacon data to sanitize
 * @returns A cleaned beacon object
 */
export const sanitizeBeaconData = (data: Partial<Beacon>): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  // Process the main fields
  Object.entries(data).forEach(([key, value]) => {
    // Skip undefined or null values
    if (value === undefined || value === null) {
      return;
    }
    
    // Handle nested objects like location
    if (key === 'location' && typeof value === 'object') {
      const locationObj = value as {
        latitude?: number;
        longitude?: number;
        address?: string;
      };
      
      const location: Record<string, any> = {};
      
      // Ensure latitude and longitude exist and are numbers
      if (typeof locationObj.latitude === 'number') {
        location.latitude = locationObj.latitude;
      }
      
      if (typeof locationObj.longitude === 'number') {
        location.longitude = locationObj.longitude;
      }
      
      // Only include address if it exists and isn't empty
      if (locationObj.address && typeof locationObj.address === 'string' && locationObj.address.trim() !== '') {
        location.address = locationObj.address.trim();
      }
      
      // Only add location if it has valid coordinates
      if ('latitude' in location && 'longitude' in location) {
        sanitized.location = location;
      }
      return;
    }
    
    // Handle attendees array
    if (key === 'attendees' && Array.isArray(value)) {
      sanitized.attendees = value.filter(attendee => 
        attendee && typeof attendee === 'object'
      ).map(attendee => {
        // Handle different attendee formats
        if ('id' in attendee && typeof attendee.id === 'string') {
          return {
            id: attendee.id,
            name: 'name' in attendee && typeof attendee.name === 'string' ? attendee.name : 'User',
            ...('avatar' in attendee && attendee.avatar ? { avatar: attendee.avatar } : {})
          };
        } else if (typeof attendee === 'string') {
          // Handle old format where attendees were just strings
          return {
            id: attendee,
            name: 'User'
          };
        } else {
          // Default fallback
          return {
            id: 'unknown',
            name: 'User'
          };
        }
      });
      return;
    }
    
    // Handle join requests
    if (key === 'joinRequests') {
      sanitized.joinRequests = Array.isArray(value) ? value : [];
      return;
    }
    
    // Direct value assignment for other fields
    sanitized[key] = value;
  });
  
  // Ensure required fields are present
  if (!sanitized.createdAt) {
    sanitized.createdAt = new Date().toISOString();
  }
  
  if (!sanitized.updatedAt) {
    sanitized.updatedAt = new Date().toISOString();
  }
  
  // Ensure attendees is initialized as an array
  if (!sanitized.attendees || !Array.isArray(sanitized.attendees)) {
    sanitized.attendees = [];
  }
  
  return sanitized;
}; 