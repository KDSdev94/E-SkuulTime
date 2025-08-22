import { useEffect, useRef } from 'react';
import { AppState, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { useLogoutConfirmation } from '../components/LogoutConfirmation';

export const useAppLifecycle = () => {
  const navigation = useNavigation();
  const { user, userType } = useUser();
  const { showLogoutConfirmation } = useLogoutConfirmation();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription?.remove();
    };
  }, []);

  return {
    currentAppState: appState.current,
  };
};

export default useAppLifecycle;

