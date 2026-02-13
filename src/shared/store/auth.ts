import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { userService, authService } from '../../services/firebase';
import { showFirebaseError, showSuccessToast } from '../../utils/errorHandlers';
import Toast from 'react-native-toast-message';

interface AuthState {
  isAuthenticated: boolean;
  userInfo: User | null;
  loading: boolean;
  error: string | null;
  lastErrorCode: string | null;
  setAuthenticated: (status: boolean) => void;
  setUserInfo: (info: User) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateTokenBalance: (amount: number) => void;
  clearError: () => void;
  isUnregisteredEmailError: () => boolean;
}

// Helper function to handle non-existent account
const handleNonExistentAccount = (email: string) => {
  console.log('Showing non-existent account toast for:', email);
  
  // Use a direct timeout to ensure this runs after any other operations
  setTimeout(() => {
    Toast.show({
      type: 'error',
      text1: 'Account Not Found',
      text2: 'This email is not registered. Would you like to create an account?',
      position: 'top',
      visibilityTime: 6000,
      autoHide: true,
      topOffset: 50,
    });
  }, 100);
};

// Helper to show invalid credential error
const showInvalidCredentialError = () => {
  Toast.show({
    type: 'error',
    text1: 'Sign In Failed',
    text2: 'The email or password you entered is incorrect. Please try again.',
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
  });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  userInfo: null,
  loading: false,
  error: null,
  lastErrorCode: null,
  
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  
  setUserInfo: (info) => set({ userInfo: info }),
  
  clearError: () => set({ error: null, lastErrorCode: null }),
  
  isUnregisteredEmailError: () => {
    const errorCode = get().lastErrorCode;
    return errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential';
  },
  
  initialize: async () => {
    try {
      set({ loading: true });
      
      // Set up auth state listener
      authService.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in
          try {
            // Try to get user info from AsyncStorage first for faster loading
            const userInfoStr = await AsyncStorage.getItem('userInfo');
            let userInfo: User | null = null;
            
            if (userInfoStr) {
              userInfo = JSON.parse(userInfoStr);
            }
            
            // If no cached user info or UID doesn't match, fetch from Firestore
            if (!userInfo || userInfo.publicAddress !== firebaseUser.uid) {
              const q = await userService.getUserByAddress(firebaseUser.uid);
              
              if (q) {
                userInfo = q;
                // Cache user info
                await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
              }
            }
            
            if (userInfo) {
              set({ 
                isAuthenticated: true,
                userInfo,
                loading: false
              });
            } else {
              // Create a default user if we somehow don't have one
              const defaultUser: User = {
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'User',
                publicAddress: firebaseUser.uid,
                privKey: '',
                tokenBalance: 100
              };
              
              set({
                isAuthenticated: true,
                userInfo: defaultUser,
                loading: false
              });
              
              await AsyncStorage.setItem('userInfo', JSON.stringify(defaultUser));
            }
          } catch (error) {
            console.error('Error loading user info:', error);
            set({ loading: false, error: 'Failed to load user information', lastErrorCode: null });
            showFirebaseError(error, 'Authentication Error');
          }
        } else {
          // User is signed out
          set({ 
            isAuthenticated: false,
            userInfo: null,
            loading: false
          });
          
          await AsyncStorage.removeItem('userInfo');
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, error: null, lastErrorCode: null });
      showFirebaseError(error, 'Authentication Error');
    }
  },
  
  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null, lastErrorCode: null });
      const user = await authService.signIn(email, password);
      set({ 
        isAuthenticated: true,
        userInfo: user,
        loading: false
      });
      
      // Cache user info
      await AsyncStorage.setItem('userInfo', JSON.stringify(user));
      
      // Show success toast
      showSuccessToast('Successfully signed in', 'Welcome Back');
    } catch (error: any) {
      console.error('Error signing in:', error);
      
      // Capture the error code before any async operations
      const errorCode = error?.code || '';
      console.log('Auth error code captured:', errorCode);
      
      // Update state
      set({ loading: false, error: null, lastErrorCode: errorCode });
      
      // Special handling for user-not-found and invalid-credential errors
      if (errorCode === 'auth/user-not-found') {
        // Definitely the email doesn't exist
        handleNonExistentAccount(email);
      } else if (errorCode === 'auth/invalid-credential') {
        // For Firebase Auth, auth/invalid-credential can mean either:
        // 1. The email doesn't exist
        // 2. The password is incorrect
        
        // For better UX, we'll treat it as a non-existent account by default
        console.log('Handling invalid-credential as non-existent account for:', email);
        handleNonExistentAccount(email);
      } else {
        // Handle other errors normally
        showFirebaseError(error, 'Sign In Failed');
      }
    }
  },
  
  signUp: async (email, password, name) => {
    try {
      set({ loading: true, error: null, lastErrorCode: null });
      const user = await authService.signUp(email, password, name);
      set({ 
        isAuthenticated: true,
        userInfo: user,
        loading: false
      });
      
      // Cache user info
      await AsyncStorage.setItem('userInfo', JSON.stringify(user));
      
      // Show success toast
      showSuccessToast('Your account has been created', 'Welcome to Viciniti');
    } catch (error: any) {
      console.error('Error signing up:', error);
      set({ loading: false, error: null, lastErrorCode: error?.code || null });
      showFirebaseError(error, 'Sign Up Failed');
    }
  },
  
  logout: async () => {
    try {
      set({ loading: true });
      await authService.signOut();
      await AsyncStorage.removeItem('userInfo');
      set({ 
        isAuthenticated: false,
        userInfo: null,
        loading: false
      });
      
      // Show success toast
      showSuccessToast('Successfully signed out', 'Goodbye');
    } catch (error) {
      console.error('Error logging out:', error);
      set({ loading: false, error: null, lastErrorCode: null });
      showFirebaseError(error, 'Sign Out Failed');
    }
  },
  
  updateTokenBalance: (amount) => {
    set((state) => {
      if (!state.userInfo) return state;
      
      const newBalance = state.userInfo.tokenBalance + amount;

      // Update the token balance in Firebase (async) - only if we have a valid address
      if (state.userInfo.publicAddress && 
          state.userInfo.publicAddress !== '0x0000000000000000000000000000000000000000') {
        userService.updateTokenBalance(state.userInfo.publicAddress, amount)
          .catch(error => {
            console.error("Error updating token balance in Firebase:", error);
            showFirebaseError(error, 'Token Update Failed');
          });
      } else {
        console.log("Skipping Firebase update - using demo account with zero address");
      }
      
      return {
        userInfo: {
          ...state.userInfo,
          tokenBalance: newBalance
        }
      };
    });
  }
})); 