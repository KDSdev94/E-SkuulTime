import React, { useState, useEffect } from 'react';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import { SafeStatusBar } from './utils/statusBarUtils';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// UI Kitten imports
import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';

// Ignore specific LogBox warnings that are causing indexOf errors
LogBox.ignoreLogs([
  'TypeError: _n8.indexOf is not a function',
  '_n8.indexOf is not a function', 
  'indexOf is not a function',
  /.*indexOf.*not.*function.*/,
  'Error stack: TypeError: _n8.indexOf is not a function',
  'updateProfileWithImages error: Error: _n8.indexOf is not a function',
]);
import {
  useFonts,
  Nunito_200ExtraLight,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { enableScreens } from 'react-native-screens';

enableScreens();

import './utils/loggerConfig';



import AuthService from './services/AuthService';

import { UserProvider } from './context/UserContext';
import { ActivityProvider } from './context/ActivityContext';

import LoadingScreen from './components/LoadingScreen';

import OnboardingScreen from './Pages/OnBoarding/onboarding_screen';

import PilihLogin from './Pages/PilihanLogin/pilihlogin';
import AdminLogin from './Pages/Login/Admin/admin_login';
import KaprodiLogin from './Pages/Login/Kaprodi/kaprodi_login';
import MuridLogin from './Pages/Login/Murid/murid_login';
import GuruLogin from './Pages/Login/Guru/guru_login';
import RegisterMurid from './Pages/Login/Murid/register_murid';
import RegisterGuru from './Pages/Login/Guru/register_guru';
import ForgotPassword from './Pages/Login/ForgotPassword/ForgotPassword';

import AdminDashboard from './Pages/admin/admin_dashboard';
import MuridDashboard from './Pages/murid/MuridDashboard';
import GuruDashboard from './Pages/guru/GuruDashboard';

import NotificationPage from './Pages/NotificationPage';
import MuridManagementPage from './Pages/admin/MuridManagementPage';
import GuruManagementPage from './Pages/admin/GuruManagementPage';
import JadwalManagementPage from './Pages/admin/JadwalManagementPage';
import MapelDetailPage from './Pages/admin/MapelDetailPage';
import LaporanPageNew from './Pages/admin/LaporanPageNew';

const Stack = createStackNavigator();

const checkOnboardingCompletion = async () => {
  try {
    const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
    return hasCompletedOnboarding === 'true';
  } catch (error) {
    console.error('Error checking onboarding completion', error);
    return false;
  }
};

const checkPersistentLogin = async () => {
  try {
    const currentUser = await AuthService.getCurrentUser();
    
    if (currentUser.isLoggedIn && currentUser.userType && currentUser.userData) {
      // Cek apakah user adalah kaprodi
      const isKaprodi = await AsyncStorage.getItem('isKaprodi');
      const kaprodiRole = await AsyncStorage.getItem('kaprodiRole');
      
      return { 
        isLoggedIn: true, 
        userType: currentUser.userType,
        userData: currentUser.userData,
        isKaprodi: isKaprodi === 'true',
        kaprodiRole: kaprodiRole
      };
    }
    
    return { isLoggedIn: false, userType: null, userData: null, isKaprodi: false, kaprodiRole: null };
  } catch (error) {
    console.error('Error checking persistent login:', error);
    return { isLoggedIn: false, userType: null, userData: null, isKaprodi: false, kaprodiRole: null };
  }
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isKaprodi, setIsKaprodi] = useState(false);
  const [kaprodiRole, setKaprodiRole] = useState(null);

const [fontsLoaded] = useFonts({
  Nunito_200ExtraLight,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  ...Ionicons.font,
});

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        const onboardingCompleted = await checkOnboardingCompletion();
        setHasCompletedOnboarding(onboardingCompleted);
        console.log('📋 Onboarding completed:', onboardingCompleted);
        
        if (onboardingCompleted) {
          const loginState = await checkPersistentLogin();
          console.log('🔐 Login state check result:', loginState);
          
          if (loginState.isLoggedIn && loginState.userType) {
            console.log('✅ User is logged in:', {
              userType: loginState.userType,
              isKaprodi: loginState.isKaprodi,
              kaprodiRole: loginState.kaprodiRole
            });
            setIsLoggedIn(loginState.isLoggedIn);
            setUserType(loginState.userType);
            setIsKaprodi(loginState.isKaprodi);
            setKaprodiRole(loginState.kaprodiRole);
          } else {
            console.log('❌ No valid login session found');
            setIsLoggedIn(false);
            setUserType(null);
            setIsKaprodi(false);
            setKaprodiRole(null);
          }
        }
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setHasCompletedOnboarding(false);
        setIsLoggedIn(false);
        setUserType(null);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    initializeApp();
  }, []);

  if (isLoading || !fontsLoaded) {
    return <LoadingScreen message="Memuat E-SkuulTime..." />;
  }

  const getInitialRouteName = () => {
    if (!hasCompletedOnboarding) {
      console.log('🎯 Initial route: OnboardingScreen (onboarding not completed)');
      return 'OnboardingScreen';
    }
    
    if (isLoggedIn && userType) {
      let route;
      switch (userType) {
        case 'admin':
          // Baik admin biasa maupun kaprodi sama-sama ke AdminDashboard
          // Perbedaan ditangani oleh role dan permissions di dalam dashboard
          route = 'AdminDashboard';
          console.log('🎯 Initial route: AdminDashboard', {
            userType,
            isKaprodi,
            kaprodiRole
          });
          break;
        case 'murid':
          route = 'MuridDashboard';
          console.log('🎯 Initial route: MuridDashboard');
          break;
        case 'guru':
          route = 'GuruDashboard';
          console.log('🎯 Initial route: GuruDashboard');
          break;
        default:
          route = 'PilihLogin';
          console.log('🎯 Initial route: PilihLogin (unknown userType)');
          break;
      }
      return route;
    }
    
    console.log('🎯 Initial route: PilihLogin (not logged in)');
    return 'PilihLogin';
  };

  return (
    <ApplicationProvider {...eva} theme={eva.light}>
      <SafeAreaProvider>
        <UserProvider>
          <ActivityProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <NavigationContainer
            onStateChange={(state) => {
              if (__DEV__) {
                
              }
            }}
          >
          <Stack.Navigator 
            initialRouteName={getInitialRouteName()}
            screenOptions={{ headerShown: false }}
          >
          {/* Onboarding */}
          <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
          
          {/* Login Screens */}
          <Stack.Screen name="PilihLogin" component={PilihLogin} />
          <Stack.Screen name="AdminLogin" component={AdminLogin} />
          <Stack.Screen name="KaprodiLogin" component={KaprodiLogin} />
          <Stack.Screen name="MuridLogin" component={MuridLogin} />
          <Stack.Screen name="GuruLogin" component={GuruLogin} />
          <Stack.Screen name="RegisterMurid" component={RegisterMurid} />
          <Stack.Screen name="RegisterGuru" component={RegisterGuru} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          
          {/* Dashboard Screens */}
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="MuridDashboard" component={MuridDashboard} />
          <Stack.Screen name="GuruDashboard" component={GuruDashboard} />
          
          {/* Other Screens */}
          <Stack.Screen name="NotificationPage" component={NotificationPage} />
            <Stack.Screen name="MuridManagementPage" component={MuridManagementPage} />
            <Stack.Screen name="GuruManagementPage" component={GuruManagementPage} />
            <Stack.Screen name="JadwalManagementPage" component={JadwalManagementPage} />
            <Stack.Screen name="MapelDetail" component={MapelDetailPage} />
            <Stack.Screen name="LaporanPageNew" component={LaporanPageNew} />
  </Stack.Navigator>
            <SafeStatusBar style="auto" />
          </NavigationContainer>
          </SafeAreaView>
        </ActivityProvider>
      </UserProvider>
    </SafeAreaProvider>
    </ApplicationProvider>
  );
}

