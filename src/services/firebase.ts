import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, Firestore, CollectionReference, DocumentReference, DocumentData } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged as firebaseAuthStateChanged, User as FirebaseUser, updateProfile, Auth } from "firebase/auth";
import { Beacon, JoinRequest, JoinRequestStatus } from "../shared/types/beacon";
import { User } from "../shared/types/user";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
} from '@env';
import { showInfoToast } from "../utils/errorHandlers";
import { sanitizeBeaconData } from '../utils/beaconUtils';
import { randomUUID } from 'expo-crypto';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

// Debug log for Firebase configuration
console.log("Firebase Configuration Status:", {
  apiKeyProvided: !!FIREBASE_API_KEY,
  authDomainProvided: !!FIREBASE_AUTH_DOMAIN,
  projectIdProvided: !!FIREBASE_PROJECT_ID,
  storageBucketProvided: !!FIREBASE_STORAGE_BUCKET,
  messagingSenderIdProvided: !!FIREBASE_MESSAGING_SENDER_ID,
  appIdProvided: !!FIREBASE_APP_ID
});

// Initialize Firebase with error handling
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let auth: Auth | undefined;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Show user-friendly error message
  setTimeout(() => {
    showInfoToast(
      "There was a problem connecting to the authentication service. Please check your internet connection and try again.",
      "Connection Error"
    );
  }, 1000);
}

// Collection references - only create if db is initialized
let beaconsCollection: CollectionReference;
let usersCollection: CollectionReference;

if (db) {
  beaconsCollection = collection(db, "beacons");
  usersCollection = collection(db, "users");
} else {
  // Create dummy collections to avoid TypeScript errors
  // These will never be used if db is undefined
  beaconsCollection = {} as CollectionReference;
  usersCollection = {} as CollectionReference;
}

// Utility function to safely get a document reference
const safeDoc = (collection: string, id: string): DocumentReference => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }
  return doc(db, collection, id);
};

// Beacon services
export const beaconService = {
  // Add a new beacon
  addBeacon: async (beacon: Omit<Beacon, 'id'>): Promise<string> => {
    try {
      // Use our comprehensive sanitization function to prepare the data
      const beaconData = sanitizeBeaconData(beacon);

      if (!db) {
        throw new Error("Firestore is not initialized");
      }

      const docRef = await addDoc(beaconsCollection, beaconData);
      return docRef.id;
    } catch (error) {
      console.error("Error adding beacon: ", error);
      throw error;
    }
  },

  // Get all beacons
  getBeacons: async (): Promise<Beacon[]> => {
    try {
      const querySnapshot = await getDocs(beaconsCollection);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Beacon));
    } catch (error) {
      console.error("Error getting beacons: ", error);
      throw error;
    }
  },

  // Get beacons within a certain radius from a location
  getBeaconsNearby: async (latitude: number, longitude: number, radiusMiles: number): Promise<Beacon[]> => {
    try {
      // For simplicity, we'll get all beacons and filter client-side
      // In a production app, you might want to use a more efficient solution like Geohashing or a GeoQuery
      const beacons = await beaconService.getBeacons();
      
      return beacons.filter(beacon => {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          beacon.location.latitude, 
          beacon.location.longitude
        );
        
        // Check if the beacon is within the viewing radius OR if the beacon's viewing radius includes the user
        return (
          distance <= radiusMiles || 
          (beacon.viewingRadius && distance <= beacon.viewingRadius)
        );
      });
    } catch (error) {
      console.error("Error getting nearby beacons: ", error);
      throw error;
    }
  },

  // Get a single beacon by ID
  getBeacon: async (id: string): Promise<Beacon | null> => {
    try {
      const docRef = safeDoc("beacons", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Beacon;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting beacon: ", error);
      throw error;
    }
  },

  // Update a beacon
  updateBeacon: async (id: string, data: Partial<Beacon>): Promise<void> => {
    try {
      const beaconRef = safeDoc("beacons", id);
      await updateDoc(beaconRef, data);
    } catch (error) {
      console.error("Error updating beacon: ", error);
      throw error;
    }
  },

  // Delete a beacon
  deleteBeacon: async (id: string): Promise<void> => {
    try {
      const beaconRef = safeDoc("beacons", id);
      await deleteDoc(beaconRef);
    } catch (error) {
      console.error("Error deleting beacon: ", error);
      throw error;
    }
  },

  // Add a join request to a beacon
  addJoinRequest: async (beaconId: string, joinRequest: JoinRequest): Promise<void> => {
    try {
      const beaconRef = safeDoc("beacons", beaconId);
      const beaconSnap = await getDoc(beaconRef);
      
      if (!beaconSnap.exists()) {
        throw new Error(`Beacon with ID ${beaconId} not found`);
      }
      
      const beaconData = beaconSnap.data() as Beacon;
      
      // Ensure joinRequests is an array
      const joinRequests = Array.isArray(beaconData.joinRequests) ? beaconData.joinRequests : [];
      
      // Check if the user already has a request
      const existingRequestIndex = joinRequests.findIndex(
        req => req.userId === joinRequest.userId
      );
      
      // Sanitize the join request to ensure no undefined values
      const sanitizedRequest: JoinRequest = {
        userId: joinRequest.userId || "",
        userName: joinRequest.userName || "User",
        status: joinRequest.status || "pending",
        timestamp: joinRequest.timestamp || new Date().toISOString(),
      };
      
      // Only include userAvatar if it exists and is not null/undefined
      if (joinRequest.userAvatar) {
        sanitizedRequest.userAvatar = joinRequest.userAvatar;
      }
      
      if (existingRequestIndex >= 0) {
        // Update existing request
        joinRequests[existingRequestIndex] = sanitizedRequest;
      } else {
        // Add new request
        joinRequests.push(sanitizedRequest);
      }
      
      // Update the beacon document with the updated joinRequests array
      await updateDoc(beaconRef, { joinRequests });
    } catch (error) {
      console.error("Error adding join request: ", error);
      throw error;
    }
  },

  // Update a join request's status
  updateJoinRequestStatus: async (beaconId: string, userId: string, status: JoinRequestStatus): Promise<void> => {
    try {
      // Get the beacon document reference
      const beaconRef = safeDoc("beacons", beaconId);
      
      // Get current beacon data
      const beaconSnapshot = await getDoc(beaconRef);
      if (!beaconSnapshot.exists()) {
        throw new Error(`Beacon with ID ${beaconId} not found`);
      }
      
      const beaconData = beaconSnapshot.data() as Beacon;
      
      // Find and update the request
      const joinRequests = beaconData.joinRequests || [];
      const requestIndex = joinRequests.findIndex(req => req.userId === userId);
      
      if (requestIndex === -1) {
        throw new Error(`Join request for user ${userId} not found`);
      }
      
      joinRequests[requestIndex] = {
        ...joinRequests[requestIndex],
        status
      };
      
      // If approving, also add to attendees if not already present
      if (status === 'approved') {
        const existingAttendeeIndex = beaconData.attendees.findIndex(att => 
          typeof att === 'object' && 'id' in att && att.id === userId
        );
        
        if (existingAttendeeIndex === -1) {
          // Get user data from the request
          const request = joinRequests[requestIndex];
          
          // Create a proper attendee object
          const newAttendee = {
            id: request.userId,
            name: request.userName || 'User',
            ...(request.userAvatar ? { avatar: request.userAvatar } : {})
          };
          
          // Update the beacon with the new attendee
          await updateDoc(beaconRef, { 
            joinRequests,
            attendees: [...beaconData.attendees, newAttendee]
          });
        } else {
          await updateDoc(beaconRef, { joinRequests });
        }
      } else {
        // Just update the join requests
        await updateDoc(beaconRef, { joinRequests });
      }
      
    } catch (error) {
      console.error("Error updating join request status:", error);
      throw error;
    }
  },

  // Get user's created beacons
  getUserCreatedBeacons: async (userId: string): Promise<Beacon[]> => {
    try {
      const q = query(beaconsCollection, where("createdBy", "==", userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Beacon));
    } catch (error) {
      console.error("Error getting user created beacons: ", error);
      throw error;
    }
  },

  // Get beacons with pending requests for a user
  getUserPendingRequests: async (userId: string): Promise<Beacon[]> => {
    try {
      // This is inefficient but works for small data sets
      // A better approach would be to have a separate collection for requests
      const beacons = await beaconService.getBeacons();
      
      return beacons.filter(beacon => 
        beacon.joinRequests?.some(req => 
          req.userId === userId && req.status === 'pending'
        )
      );
    } catch (error) {
      console.error("Error getting user pending requests: ", error);
      throw error;
    }
  }
};

// User services
export const userService = {
  // Add a new user
  addUser: async (user: Omit<User, 'id'>): Promise<string> => {
    try {
      if (!db) {
        throw new Error("Firestore is not initialized");
      }
      
      const docRef = await addDoc(usersCollection, {
        ...user,
        createdAt: new Date().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error adding user: ", error);
      throw error;
    }
  },
  
  // Get a user by their wallet address
  getUserByAddress: async (address: string): Promise<User | null> => {
    try {
      if (!db) {
        throw new Error("Firestore is not initialized");
      }
      
      const q = query(usersCollection, where("uid", "==", address));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          email: userDoc.data().email || '',
          name: userDoc.data().name || '',
          publicAddress: userDoc.data().publicAddress || address,
          privKey: userDoc.data().privKey || '',
          tokenBalance: userDoc.data().tokenBalance || 0,
          avatar: userDoc.data().avatar
        } as User;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting user by address: ", error);
      throw error;
    }
  },
  
  // Update user token balance
  updateTokenBalance: async (address: string, amount: number): Promise<void> => {
    try {
      if (!db) {
        throw new Error("Firestore is not initialized");
      }
      
      // Get user by address
      const q = query(usersCollection, where("publicAddress", "==", address));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error(`User with address ${address} not found`);
      }
      
      const userDoc = querySnapshot.docs[0];
      const currentBalance = userDoc.data().tokenBalance || 0;
      
      // Update the balance
      const userRef = safeDoc("users", userDoc.id);
      await updateDoc(userRef, {
        tokenBalance: currentBalance + amount
      });
    } catch (error) {
      console.error("Error updating token balance: ", error);
      throw error;
    }
  },
  
  // Update user profile
  updateUserProfile: async (userId: string, data: Partial<User>): Promise<void> => {
    try {
      const userRef = safeDoc("users", userId);
      await updateDoc(userRef, data);
    } catch (error) {
      console.error("Error updating user profile: ", error);
      throw error;
    }
  },

  // Get a user's token balance
  getTokenBalance: async (publicAddress: string): Promise<number> => {
    try {
      const user = await userService.getUserByAddress(publicAddress);
      return user?.tokenBalance || 0;
    } catch (error) {
      console.error("Error getting token balance:", error);
      throw error;
    }
  }
};

// Authentication services
export const authService = {
  // Sign up with email/password
  signUp: async (email: string, password: string, name: string): Promise<User> => {
    try {
      if (!auth) {
        throw new Error("Firebase Auth is not initialized");
      }
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile with name
      await updateProfile(firebaseUser, { displayName: name });
      
      // Create default user data
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email || email,
        name: name,
        publicAddress: firebaseUser.uid,
        privKey: '', // Generate or handle private key appropriately
        tokenBalance: 100 // Default starting balance
      };
      
      // Save to Firestore
      await addDoc(usersCollection, {
        ...userData,
        uid: firebaseUser.uid,
        createdAt: new Date().toISOString()
      });
      
      return userData;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  },
  
  // Sign in with email/password
  signIn: async (email: string, password: string): Promise<User> => {
    try {
      if (!auth) {
        throw new Error("Firebase Auth is not initialized");
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const q = query(usersCollection, where("uid", "==", firebaseUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // User exists in Auth but not in Firestore - create a record
        const userData: Omit<User, 'id'> = {
          email: firebaseUser.email || email,
          name: firebaseUser.displayName || 'User',
          publicAddress: firebaseUser.uid,
          privKey: '',
          tokenBalance: 100
        };
        
        await addDoc(usersCollection, {
          ...userData,
          uid: firebaseUser.uid,
          createdAt: new Date().toISOString()
        });
        
        return userData;
      }
      
      // Return existing user data
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      return {
        email: userData.email || firebaseUser.email || '',
        name: userData.name || firebaseUser.displayName || '',
        publicAddress: userData.publicAddress || firebaseUser.uid,
        privKey: userData.privKey || '',
        avatar: userData.avatar,
        tokenBalance: userData.tokenBalance || 0
      } as User;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  },
  
  // Sign out
  signOut: async (): Promise<void> => {
    try {
      if (!auth) {
        throw new Error("Firebase Auth is not initialized");
      }
      
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: (): FirebaseUser | null => {
    if (!auth) {
      console.error("Firebase Auth is not initialized");
      return null;
    }
    
    return auth.currentUser;
  },
  
  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void): (() => void) => {
    if (!auth) {
      console.error("Firebase Auth is not initialized");
      return () => {}; // Return a no-op function if auth is not initialized
    }
    
    return firebaseAuthStateChanged(auth, callback);
  }
};

// Helper function to upload beacon image to Firebase Storage
const uploadBeaconImage = async (uri: string): Promise<string | null> => {
  try {
    if (!uri || !uri.startsWith('file://')) {
      return null;
    }
    
    if (!storage) {
      throw new Error("Firebase Storage is not initialized");
    }
    
    // Generate a unique filename
    const filename = `beacons/${randomUUID()}.jpg`;
    const storageRef = ref(storage, filename);
    
    // Convert URI to a Blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload the image
    const snapshot = await uploadBytes(storageRef, blob);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (uploadError) {
    console.error("Error uploading beacon image:", uploadError);
    
    // Add more detailed error info - with safe type checking
    if (uploadError && typeof uploadError === 'object' && 'serverResponse' in uploadError) {
      console.error('Server response:', uploadError.serverResponse);
    }
    
    throw uploadError;
  }
};

// Helper function to calculate distance between two points in miles using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper to convert degrees to radians
const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

export default { beaconService, userService, authService }; 