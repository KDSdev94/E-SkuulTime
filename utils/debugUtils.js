import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugLoginState = async () => {
  try {
    console.log('=== DEBUG LOGIN STATE ===');
    
    // Check all stored login-related keys
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    const userType = await AsyncStorage.getItem('userType');
    const userData = await AsyncStorage.getItem('userData');
    const token = await AsyncStorage.getItem('token');
    
    console.log('isLoggedIn:', isLoggedIn);
    console.log('userType:', userType);
    console.log('userData:', userData ? JSON.parse(userData) : null);
    console.log('token:', token);
    
    // Get all keys to see what else might be stored
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('All AsyncStorage keys:', allKeys);
    
    console.log('=========================');
    
    return {
      isLoggedIn,
      userType,
      userData: userData ? JSON.parse(userData) : null,
      token,
      allKeys
    };
  } catch (error) {
    console.error('Error debugging login state:', error);
    return null;
  }
};

export const clearLoginState = async () => {
  try {
    console.log('=== CLEARING LOGIN STATE ===');
    
    // Clear all login-related keys
    await AsyncStorage.multiRemove([
      'isLoggedIn',
      'userType', 
      'userData',
      'token'
    ]);
    
    console.log('Login state cleared successfully');
    console.log('App should now show onboarding on restart');
    console.log('===============================');
    
    return true;
  } catch (error) {
    console.error('Error clearing login state:', error);
    return false;
  }
};

export const clearAllAsyncStorage = async () => {
  try {
    console.log('=== CLEARING ALL ASYNCSTORAGE ===');
    
    await AsyncStorage.clear();
    
    console.log('All AsyncStorage data cleared');
    console.log('App will reset to initial state');
    console.log('=================================');
    
    return true;
  } catch (error) {
    console.error('Error clearing AsyncStorage:', error);
    return false;
  }
};

// Temporary function to force onboarding - add this to your App.js checkPersistentLogin
export const forceOnboarding = async () => {
  await clearLoginState();
  return false; // This will force the app to show onboarding
};
