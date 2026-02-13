import Toast from 'react-native-toast-message';

// Map Firebase error codes to user-friendly messages
const errorMessages: Record<string, string> = {
  // Authentication errors
  'auth/invalid-email': 'The email address is not valid.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
  'auth/email-already-in-use': 'This email is already in use.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
  'auth/configuration-not-found': 'Authentication service is not properly configured.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/operation-not-allowed': 'This sign-in method is not allowed. Please contact support.',
  'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
  'auth/invalid-verification-code': 'The verification code is invalid. Please try again.',
  'auth/invalid-verification-id': 'The verification ID is invalid. Please try again.',
  'auth/missing-verification-code': 'Please enter the verification code.',
  'auth/missing-verification-id': 'The verification ID is missing. Please try again.',
  'auth/invalid-continue-uri': 'The continue URL provided is invalid.',
  'auth/unauthorized-continue-uri': 'The domain of the continue URL is not whitelisted.',
  'auth/invalid-phone-number': 'The phone number is invalid.',
  'auth/missing-phone-number': 'Please provide a phone number.',
  'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
  'auth/cancelled-popup-request': 'The authentication request was cancelled.',
  'auth/popup-blocked': 'The authentication popup was blocked by the browser.',
  'auth/popup-closed-by-user': 'The authentication popup was closed by the user.',
  
  // Firestore errors
  'permission-denied': 'You don\'t have permission to access this resource.',
  'unavailable': 'The service is temporarily unavailable. Please try again later.',
  
  // Default error
  'default': 'Something went wrong. Please try again.'
};

// Extract Firebase error code from error object
export const getFirebaseErrorCode = (error: any): string => {
  if (error && error.code) {
    return error.code;
  }
  
  // Handle error message string that contains the error code
  if (error && typeof error.message === 'string') {
    const match = error.message.match(/\(([^)]+)\)/);
    if (match && match[1].startsWith('auth/')) {
      return match[1];
    }
  }
  
  return 'default';
};

// Get user-friendly error message
export const getErrorMessage = (error: any): string => {
  const errorCode = getFirebaseErrorCode(error);
  return errorMessages[errorCode] || errorMessages['default'];
};

// Show Firebase error as toast
export const showFirebaseError = (error: any, title: string = 'Error') => {
  const errorCode = getFirebaseErrorCode(error);
  const message = getErrorMessage(error);
  
  // Improved error logging for debugging
  console.error(`${title}:`, error);
  console.error('Error details:', {
    code: errorCode,
    message: error?.message,
    fullError: JSON.stringify(error, null, 2)
  });
  
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
  });
};

// Show success toast
export const showSuccessToast = (message: string, title: string = 'Success') => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
};

// Show info toast
export const showInfoToast = (message: string, title: string = 'Info') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
}; 