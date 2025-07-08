import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

// Utils
import Logger from './utils/logger';

// Components
import LoadingScreen from './components/LoadingScreen';

// Onboarding
import OnboardingScreen from './Pages/OnBoarding/onboarding_screen';

// Login Pages
import PilihLogin from './Pages/PilihanLogin/pilihlogin';
import AdminLogin from './Pages/Login/Admin/admin_login';
import GuruLogin from './Pages/Login/Guru/guru_login';
import MuridLogin from './Pages/Login/Murid/murid_login';

// Dashboard Pages
import AdminDashboard from './Pages/admin/admin_dashboard';

const Stack = createStackNavigator();

// Check onboarding completion
const checkOnboardingCompletion = async () => {
  try {
    const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
    return hasCompletedOnboarding === 'true';
  } catch (error) {
    Logger.error('Error checking onboarding completion', error);
    return false;
  }
};

// Persistent login check function
const checkPersistentLogin = async () => {
  try {
    // Check AsyncStorage for login state
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    const userType = await AsyncStorage.getItem('userType');
    
    if (isLoggedIn === 'true' && userType) {
      return { isLoggedIn: true, userType };
    }
    return { isLoggedIn: false, userType: null };
  } catch (error) {
    Logger.error('Error checking persistent login', error);
    return { isLoggedIn: false, userType: null };
  }
};

// Debug utility function to clear all storage (for development testing only)
// Uncomment clearAllStorage() below ONLY for development testing
// const clearAllStorage = async () => {
//   try {
//     await AsyncStorage.multiRemove(['hasCompletedOnboarding', 'isLoggedIn', 'userType']);
//     Logger.log('All storage cleared successfully for testing');
//   } catch (error) {
//     Logger.error('Error clearing storage', error);
//   }
// };
// clearAllStorage(); // Uncomment this line ONLY for testing new user experience

// Main App Component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Load fonts globally
const [fontsLoaded] = useFonts({
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  ...Ionicons.font,
});

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Check onboarding completion first
        const onboardingCompleted = await checkOnboardingCompletion();
        setHasCompletedOnboarding(onboardingCompleted);
        
        // Only check login if onboarding is completed
        if (onboardingCompleted) {
          const loginState = await checkPersistentLogin();
          setIsLoggedIn(loginState.isLoggedIn);
          setUserType(loginState.userType);
        }
      } catch (error) {
        Logger.error('Error initializing app', error);
        // Set defaults on error
        setHasCompletedOnboarding(false);
        setIsLoggedIn(false);
        setUserType(null);
      } finally {
        // Add delay to show loading screen
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while checking login state or fonts
  if (isLoading || !fontsLoaded) {
    return <LoadingScreen message="Memuat SIMARA..." />;
  }

  // Determine initial route based on onboarding and login state
  const getInitialRouteName = () => {
    console.log('Navigation Debug - hasCompletedOnboarding:', hasCompletedOnboarding);
    console.log('Navigation Debug - isLoggedIn:', isLoggedIn);
    console.log('Navigation Debug - userType:', userType);
    
    // If onboarding not completed, show onboarding
    if (!hasCompletedOnboarding) {
      console.log('Navigation Debug - Showing OnboardingScreen');
      return 'OnboardingScreen';
    }
    
    // If logged in, show appropriate dashboard
    if (isLoggedIn && userType) {
      console.log('Navigation Debug - Showing Dashboard for:', userType);
      switch (userType) {
        case 'admin':
          return 'AdminDashboard';
        case 'guru':
          // Add guru dashboard when implemented
          return 'PilihLogin';
        case 'murid':
          // Add murid dashboard when implemented
          return 'PilihLogin';
        default:
          return 'PilihLogin';
      }
    }
    
    // Default to login selection
    console.log('Navigation Debug - Showing PilihLogin');
    return 'PilihLogin';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={getInitialRouteName()}
        screenOptions={{ headerShown: false }}
      >
        {/* Onboarding */}
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
        
        {/* Login Screens */}
        <Stack.Screen name="PilihLogin" component={PilihLogin} />
        <Stack.Screen name="AdminLogin" component={AdminLogin} />
        <Stack.Screen name="GuruLogin" component={GuruLogin} />
        <Stack.Screen name="MuridLogin" component={MuridLogin} />
        
        {/* Dashboard Screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

// Styles removed - using LoadingScreen component instead
