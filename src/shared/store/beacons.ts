import { create } from 'zustand';
import { Beacon, BeaconCategory, JoinRequest, JoinRequestStatus } from '../types/beacon';
import { beaconService } from '../../services/firebase';
import { hasTokenCost, isTokenReward } from '../../utils/tokenUtils';

interface BeaconFilters {
  categories: BeaconCategory[];
  subcategories: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
  tokenFilter: 'all' | 'rewards' | 'costs' | 'free';
}

interface BeaconsState {
  beacons: Beacon[];
  isLoading: boolean;
  error: string | null;
  filters: BeaconFilters;
  addBeacon: (beacon: Omit<Beacon, 'id'>) => Promise<string | undefined>;
  updateBeacon: (beacon: Beacon) => void;
  deleteBeacon: (beaconId: string) => void;
  joinBeacon: (beaconId: string, userId: string) => void;
  leaveBeacon: (beaconId: string, userId: string) => void;
  requestToJoinBeacon: (beaconId: string, user: { id: string, name: string, avatar?: string }) => void;
  approveJoinRequest: (beaconId: string, userId: string) => void;
  rejectJoinRequest: (beaconId: string, userId: string) => void;
  getUserCreatedBeacons: (userId: string) => Beacon[];
  getUserJoinRequests: (userId: string) => { beacon: Beacon, request: JoinRequest }[];
  getPendingRequestsCount: (beaconId: string) => number;
  setFilters: (filters: Partial<BeaconFilters>) => void;
  getFilteredBeacons: () => Beacon[];
  fetchBeacons: () => Promise<void>;
}

export const useBeaconsStore = create<BeaconsState>((set, get) => ({
  beacons: [],
  isLoading: false,
  error: null,
  filters: {
    categories: [],
    subcategories: [],
    tokenFilter: 'all',
  },

  // Fetch beacons from Firebase
  fetchBeacons: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const beacons = await beaconService.getBeacons();
      set({ beacons, isLoading: false });
    } catch (error) {
      console.error("Error fetching beacons:", error);
      set({ 
        error: error instanceof Error ? error.message : "Unknown error occurred", 
        isLoading: false 
      });
    }
  },

  // Add a new beacon to Firebase
  addBeacon: async (beaconData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Add to Firebase with local image URI
      const id = await beaconService.addBeacon(beaconData);
      
      // Update local state with the new beacon
      if (id) {
        set((state) => ({
          beacons: [...state.beacons, { ...beaconData, id }],
          isLoading: false
        }));

        return id;
      } else {
        set({ 
          error: "Failed to create beacon", 
          isLoading: false 
        });
        return undefined;
      }
    } catch (error) {
      console.error("Error adding beacon:", error);
      
      set({ 
        error: error instanceof Error ? error.message : "Unknown error occurred", 
        isLoading: false 
      });
      return undefined;
    }
  },

  updateBeacon: (updatedBeacon) => set((state) => ({
    beacons: state.beacons.map((beacon) => 
      beacon.id === updatedBeacon.id ? updatedBeacon : beacon
    ),
  })),

  deleteBeacon: (beaconId) => set((state) => ({
    beacons: state.beacons.filter((beacon) => beacon.id !== beaconId),
  })),

  joinBeacon: (beaconId, userId) => set((state) => ({
    beacons: state.beacons.map((beacon) => {
      if (beacon.id === beaconId) {
        // Check if user is already in attendees
        const attendeeExists = beacon.attendees.some(attendee => 
          typeof attendee === 'object' && 'id' in attendee && attendee.id === userId
        );
        
        if (!attendeeExists) {
          // Add user as an attendee with required format
          return {
            ...beacon,
            attendees: [
              ...beacon.attendees,
              { id: userId, name: 'User' } // Minimal required format
            ]
          };
        }
      }
      return beacon;
    }),
  })),

  leaveBeacon: (beaconId, userId) => set((state) => ({
    beacons: state.beacons.map((beacon) => {
      if (beacon.id === beaconId) {
        // Filter out the user from attendees
        return {
          ...beacon,
          attendees: beacon.attendees.filter(attendee => 
            !(typeof attendee === 'object' && 'id' in attendee && attendee.id === userId)
          )
        };
      }
      return beacon;
    }),
  })),

  requestToJoinBeacon: (beaconId, user) => set((state) => ({
    beacons: state.beacons.map((beacon) => {
      if (beacon.id === beaconId) {
        // Make sure joinRequests exists
        const existingJoinRequests = beacon.joinRequests || [];
        
        // Check if user already has a request
        const existingRequest = existingJoinRequests.find(req => req.userId === user.id);
        if (existingRequest) {
          return beacon;
        }
        
        // Create a new request - ensure no undefined values
        const newRequest: JoinRequest = {
          userId: user.id || "",
          userName: user.name || "User",
          // Only include avatar if it exists and is not null/undefined
          ...(user.avatar ? { userAvatar: user.avatar } : {}),
          status: 'pending',
          timestamp: new Date().toISOString(),
        };
        
        // Update Firebase
        beaconService.addJoinRequest(beaconId, newRequest)
          .catch(error => console.error("Error adding join request to Firebase:", error));
        
        return {
          ...beacon,
          joinRequests: [...existingJoinRequests, newRequest],
        };
      }
      return beacon;
    }),
  })),

  approveJoinRequest: (beaconId, userId) => set((state) => {
    const beacons = state.beacons.map((beacon) => {
      if (beacon.id === beaconId) {
        // Find the join request
        const joinRequests = beacon.joinRequests || [];
        const requestIndex = joinRequests.findIndex(req => req.userId === userId);
        
        if (requestIndex !== -1) {
          // Update the status of the request
          const updatedJoinRequests = [...joinRequests];
          updatedJoinRequests[requestIndex] = {
            ...updatedJoinRequests[requestIndex],
            status: 'approved'
          };
          
          // Check if user is already in attendees
          const isAlreadyAttendee = beacon.attendees.some(attendee => 
            typeof attendee === 'object' && 'id' in attendee && attendee.id === userId
          );
          
          if (!isAlreadyAttendee) {
            // Add the user to attendees with the proper format
            const newAttendee = {
              id: userId,
              name: updatedJoinRequests[requestIndex].userName || 'User',
              ...(updatedJoinRequests[requestIndex].userAvatar ? 
                  { avatar: updatedJoinRequests[requestIndex].userAvatar } : {})
            };
            
            return {
              ...beacon,
              joinRequests: updatedJoinRequests,
              attendees: [...beacon.attendees, newAttendee]
            };
          }
          
          return {
            ...beacon,
            joinRequests: updatedJoinRequests
          };
        }
      }
      return beacon;
    });
    
    return { beacons };
  }),

  rejectJoinRequest: (beaconId, userId) => set((state) => {
    const beacons = state.beacons.map((beacon) => {
      if (beacon.id === beaconId) {
        // Find the join request
        const joinRequests = beacon.joinRequests || [];
        const requestIndex = joinRequests.findIndex(req => req.userId === userId);
        
        if (requestIndex !== -1) {
          // Update the status of the request
          const updatedJoinRequests = [...joinRequests];
          updatedJoinRequests[requestIndex] = {
            ...updatedJoinRequests[requestIndex],
            status: 'rejected'
          };
          
          return {
            ...beacon,
            joinRequests: updatedJoinRequests
          };
        }
      }
      return beacon;
    });
    
    return { beacons };
  }),

  getUserCreatedBeacons: (userId) => {
    const { beacons } = get();
    return beacons.filter(beacon => beacon.createdBy === userId);
  },

  getUserJoinRequests: (userId) => {
    const { beacons } = get();
    const requests: { beacon: Beacon, request: JoinRequest }[] = [];
    
    beacons.forEach(beacon => {
      const userRequest = beacon.joinRequests?.find(req => req.userId === userId);
      if (userRequest) {
        requests.push({ beacon, request: userRequest });
      }
    });
    
    return requests;
  },

  getPendingRequestsCount: (beaconId) => {
    const { beacons } = get();
    const beacon = beacons.find(b => b.id === beaconId);
    if (!beacon) return 0;
    
    return beacon.joinRequests?.filter(req => req.status === 'pending').length || 0;
  },

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),

  getFilteredBeacons: () => {
    const { beacons, filters } = get();
    return beacons.filter((beacon) => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(beacon.category as BeaconCategory)) {
        return false;
      }

      // Subcategory filter
      if (filters.subcategories.length > 0 && (!beacon.subcategory || !filters.subcategories.includes(beacon.subcategory))) {
        return false;
      }

      // Token filter
      if (filters.tokenFilter !== 'all') {
        if (filters.tokenFilter === 'rewards' && !isTokenReward(beacon.tokenCost)) {
          return false;
        }
        if (filters.tokenFilter === 'costs' && (!hasTokenCost(beacon.tokenCost) || isTokenReward(beacon.tokenCost))) {
          return false;
        }
        if (filters.tokenFilter === 'free' && hasTokenCost(beacon.tokenCost)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const beaconDate = new Date(beacon.startTime);
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        if (beaconDate < start || beaconDate > end) {
          return false;
        }
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          beacon.title.toLowerCase().includes(query) ||
          beacon.description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  },
})); 