import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform, 
  TextInput, 
  KeyboardAvoidingView, 
  ScrollView,
  Image,
  SafeAreaView,
  Dimensions,
  Animated,
  LogBox
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../shared/store/auth';
import { showInfoToast } from '../../../utils/errorHandlers';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// Suppress Firebase auth error logs from appearing in the UI
LogBox.ignoreLogs(['Firebase: Error (auth/']);

export function OnboardingScreen() {
  const navigation = useNavigation();
  const { signIn, signUp, loading, clearError, isUnregisteredEmailError, setAuthenticated, setUserInfo } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showUnregisteredMessage, setShowUnregisteredMessage] = useState(false);
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const lastAttemptedEmail = useRef('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  
  // Clear errors when switching between login and signup
  useEffect(() => {
    clearError();
    setShowUnregisteredMessage(false);
    Animated.timing(messageOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [isLogin]);

  // Check for error and show the unregistered message if needed
  const checkForUnregisteredEmail = () => {
    // Get the current error state to detect Firebase auth errors
    const isUnregistered = isUnregisteredEmailError();
    
    console.log('Checking for unregistered email:', {
      lastAttemptedEmail: lastAttemptedEmail.current,
      currentEmail: email,
      isUnregistered: isUnregistered
    });
    
    if (lastAttemptedEmail.current === email && isUnregistered) {
      console.log('Unregistered email detected, showing message and transitioning to signup');
      
      // Force show message with a direct timeout to ensure it runs
      setTimeout(() => {
        // Show animation for unregistered email
        setShowUnregisteredMessage(true);
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }).start();
        
        // Switch to signup after 2 seconds
        setTimeout(() => {
          setIsLogin(false);
          setPassword('');
        }, 2000);
      }, 200);
    } else {
      console.log('Error check complete - no unregistered email detected');
    }
  };
  
  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };
  
  const handleAuthAction = async () => {
    // Reset error states
    let hasError = false;
    
    // Reset the unregistered message
    setShowUnregisteredMessage(false);
    Animated.timing(messageOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Validate email
    if (!email.trim()) {
      showInfoToast('Please enter your email address', 'Form Incomplete');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showInfoToast('Please enter a valid email address', 'Invalid Email');
      hasError = true;
    }
    
    // Validate password
    if (!password) {
      setPasswordError(true);
      showInfoToast('Please enter a password', 'Form Incomplete');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError(true);
      showInfoToast('Password must be at least 6 characters', 'Password Error');
      hasError = true;
    }
    
    // Extra signup validations
    if (!isLogin) {
      if (!name.trim()) {
        showInfoToast('Please enter your name', 'Form Incomplete');
        hasError = true;
      }
      
      if (password !== confirmPassword) {
        setConfirmPasswordError(true);
        showInfoToast('Passwords do not match', 'Password Error');
        hasError = true;
      }
    }
    
    if (hasError) return;
    
    try {
      if (isLogin) {
        console.log(`Attempting to sign in with email: ${email}`);
        lastAttemptedEmail.current = email;
        
        // Wrap in another try/catch to ensure we completely handle the error
        try {
          await signIn(email, password);
        } catch (authError) {
          console.log('Caught auth error:', authError);
          // This inner catch ensures the error doesn't propagate further
          // For login attempts, check for unregistered email after a delay
          setTimeout(checkForUnregisteredEmail, 300);
          setTimeout(checkForUnregisteredEmail, 1000);
          
          // Very important: return early to prevent further propagation
          return;
        }
      } else {
        console.log(`Attempting to sign up with email: ${email}`);
        try {
          await signUp(email, password, name);
        } catch (signupError) {
          console.log('Caught signup error:', signupError);
          // Handle signup errors with the default handler
          // No need to return early as we don't have special UI for signup errors
        }
      }
    } catch (error) {
      // This catch should now only trigger for errors not caught by the inner try/catch
      console.log(`Uncaught ${isLogin ? 'sign in' : 'sign up'} error:`, error);
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Skip login for testing (creates a demo account)
  const skipLogin = () => {
    // Create a demo user
    const demoUser = {
      email: 'demo@viciniti.app',
      name: 'Demo User',
      publicAddress: '0x0000000000000000000000000000000000000000',
      privKey: '',
      tokenBalance: 500 // Give the demo user some tokens to test with
    };
    
    // Set as authenticated
    setUserInfo(demoUser);
    setAuthenticated(true);
    
    showInfoToast('Demo mode activated', 'Testing Mode');
  };
  
  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Viciniti</Text>
            <Text style={styles.subtitle}>Connect with your community</Text>
          </View>
          
          <View style={styles.formContainer}>
            {/* Show animated message when an unregistered email is used */}
            {showUnregisteredMessage && (
              <Animated.View 
                style={[
                  styles.unregisteredMessageContainer, 
                  { opacity: messageOpacity }
                ]}
              >
                <Text style={styles.unregisteredMessageText}>
                  This email is not registered. Creating a new account for you...
                </Text>
              </Animated.View>
            )}
            
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.placeholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.placeholder}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError(false);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="oneTimeCode"
                  autoComplete="off"
                />
                <TouchableOpacity 
                  style={styles.passwordVisibilityButton} 
                  onPress={togglePasswordVisibility}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.passwordContainer, confirmPasswordError ? styles.inputError : null]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.colors.placeholder}
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setConfirmPasswordError(false);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="oneTimeCode"
                    autoComplete="off"
                  />
                  <TouchableOpacity 
                    style={styles.passwordVisibilityButton} 
                    onPress={togglePasswordVisibility}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={24} 
                      color={theme.colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.button}
              onPress={handleAuthAction}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setPassword('');
                setConfirmPassword('');
              }}
            >
              <Text style={styles.switchButtonText}>
                {isLogin 
                  ? "Don't have an account? Sign Up" 
                  : "Already have an account? Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.terms}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>

          {/* Skip Login Button (for testing environments) */}
          {(typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development') && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={skipLogin}
            >
              <Text style={styles.skipButtonText}>Skip Login (Testing Only)</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  terms: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  unregisteredMessageContainer: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  unregisteredMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: theme.colors.text,
  },
  passwordVisibilityButton: {
    padding: 10,
  },
  skipButton: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 30,
  },
  skipButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
}); 