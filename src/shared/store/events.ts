import { create } from 'zustand';
import { Event, EventCategory } from '../types/event';
import { eventService } from '../../services/firebase';

interface EventFilters {
  categories: EventCategory[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

interface EventsState {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  filters: EventFilters;
  addEvent: (event: Omit<Event, 'id'>) => Promise<string | undefined>;
  updateEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;
  joinEvent: (eventId: string, userId: string) => void;
  leaveEvent: (eventId: string, userId: string) => void;
  setFilters: (filters: Partial<EventFilters>) => void;
  getFilteredEvents: () => Event[];
  fetchEvents: () => Promise<void>;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  filters: {
    categories: [],
  },

  // Fetch events from Firebase
  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const events = await eventService.getEvents();
      set({ events, isLoading: false });
    } catch (error) {
      console.error("Error fetching events:", error);
      set({ 
        error: error instanceof Error ? error.message : "Unknown error occurred", 
        isLoading: false 
      });
    }
  },

  // Add a new event to Firebase
  addEvent: async (eventData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Add to Firebase with local image URI
      const id = await eventService.addEvent(eventData);
      
      // Update local state with the new event
      if (id) {
        set((state) => ({
          events: [...state.events, { ...eventData, id }],
          isLoading: false
        }));

        return id;
      } else {
        set({ 
          error: "Failed to create event", 
          isLoading: false 
        });
        return undefined;
      }
    } catch (error) {
      console.error("Error adding event:", error);
      
      set({ 
        error: error instanceof Error ? error.message : "Unknown error occurred", 
        isLoading: false 
      });
      return undefined;
    }
  },

  updateEvent: (updatedEvent) => set((state) => ({
    events: state.events.map((event) => 
      event.id === updatedEvent.id ? updatedEvent : event
    ),
  })),

  deleteEvent: (eventId) => set((state) => ({
    events: state.events.filter((event) => event.id !== eventId),
  })),

  joinEvent: (eventId, userId) => set((state) => ({
    events: state.events.map((event) => 
      event.id === eventId && !event.attendees.includes(userId)
        ? { ...event, attendees: [...event.attendees, userId] }
        : event
    ),
  })),

  leaveEvent: (eventId, userId) => set((state) => ({
    events: state.events.map((event) => 
      event.id === eventId
        ? { ...event, attendees: event.attendees.filter((id) => id !== userId) }
        : event
    ),
  })),

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),

  getFilteredEvents: () => {
    const { events, filters } = get();
    return events.filter((event) => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const eventDate = new Date(event.date);
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        if (eventDate < start || eventDate > end) {
          return false;
        }
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  },
})); 