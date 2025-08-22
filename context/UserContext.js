import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import AuthService from '../services/AuthService';
import StorageService from '../services/StorageService';
import * as FileSystem from 'expo-file-system';

const USER_ACTIONS = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

const initialState = {
  user: null,
  userType: null,
  isLoading: true, // Start with loading true to prevent premature redirects
  error: null,
  isLoggedIn: false
};

const userReducer = (state, action) => {
  switch (action.type) {
    case USER_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        userType: action.payload.userType,
        isLoggedIn: action.payload.isLoggedIn,
        isLoading: false,
        error: null
      };
    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case USER_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case USER_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        isLoading: false,
        error: null
      };
    case USER_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      console.log('🔄 UserContext: Starting user initialization...');
      const currentUser = await AuthService.getCurrentUser();
      console.log('👤 UserContext: Got user data:', {
        isLoggedIn: currentUser.isLoggedIn,
        userType: currentUser.userType,
        hasUserData: !!currentUser.userData
      });
      
      dispatch({
        type: USER_ACTIONS.SET_USER,
        payload: {
          user: currentUser.userData,
          userType: currentUser.userType,
          isLoggedIn: currentUser.isLoggedIn
        }
      });
      console.log('✅ UserContext: User initialization complete');
    } catch (error) {
      console.error('❌ UserContext: Error initializing user:', error);
      dispatch({
        type: USER_ACTIONS.SET_ERROR,
        payload: 'Gagal memuat data pengguna'
      });
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
      
      if (!state.user || !state.userType) {
        throw new Error('User data not available');
      }
      // Validasi dan sanitasi data sebelum dikirim ke Firestore
      const sanitizedData = {};
      
      // Pastikan updatedData adalah object yang valid
      if (!updatedData || typeof updatedData !== 'object') {
        throw new Error('Data update tidak valid');
      }
      
      Object.keys(updatedData).forEach(key => {
        const value = updatedData[key];
        // Cek apakah value adalah null atau undefined
        if (value === null || value === undefined) {
          sanitizedData[key] = null;
        } 
        // Cek tipe data primitif
        else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          sanitizedData[key] = value;
        } 
        // Cek array dengan validasi yang lebih aman
        else if (Array.isArray(value)) {
          // Pastikan array berisi data yang valid dan filter dengan aman
          try {
            sanitizedData[key] = value.filter(item => {
              // Pastikan item bukan null/undefined dan dapat diproses
              if (item === null || item === undefined) return false;
              // Jika item adalah string, pastikan aman untuk indexOf
              if (typeof item === 'string' && item.indexOf) return true;
              // Untuk tipe lain, biarkan masuk asal bukan null/undefined
              return typeof item === 'number' || typeof item === 'boolean' || (typeof item === 'object' && item !== null);
            });
          } catch (filterError) {
            console.error(`UserContext: Error filtering array for ${key}:`, filterError);
            sanitizedData[key] = [];
          }
        } 
        // Cek Firebase Timestamp
        else if (typeof value === 'object' && value !== null && value.seconds) {
          sanitizedData[key] = value;
        } 
        // Untuk object lainnya, konversi ke string dengan aman
        else {
          try {
            // Pastikan value dapat di-convert dengan aman
            if (value && typeof value.toString === 'function') {
              sanitizedData[key] = value.toString();
            } else if (value) {
              sanitizedData[key] = String(value);
            } else {
              sanitizedData[key] = '';
            }
          } catch (stringError) {
            console.error(`UserContext: Failed to convert ${key} to string:`, stringError);
            sanitizedData[key] = '';
          }
        }
      });
      // Tentukan collection berdasarkan userType
      let collection_name;
      switch(state.userType) {
        case 'murid':
          collection_name = 'murid';
          break;
        case 'guru':
          collection_name = 'guru';
          break;
        case 'admin':
        case 'prodi':
          collection_name = 'admin';
          break;
        default:
          collection_name = 'murid';
      }
      
      const userRef = doc(db, collection_name, state.user.id);
      
      await updateDoc(userRef, {
        ...sanitizedData,
        updatedAt: serverTimestamp()
      });

      await createProfileChangeNotification(state.user, sanitizedData);

      dispatch({
        type: USER_ACTIONS.UPDATE_PROFILE,
        payload: sanitizedData
      });

      const updatedUser = { ...state.user, ...sanitizedData };
      await AuthService.saveLoginData(updatedUser, state.userType);

      return { success: true, message: 'Profile berhasil diperbarui' };
    } catch (error) {
      console.error('UserContext: Update profile error:', error);
      console.error('UserContext: Error stack:', error.stack);
      dispatch({
        type: USER_ACTIONS.SET_ERROR,
        payload: 'Gagal memperbarui profile'
      });
      return { success: false, message: error.message || 'Gagal memperbarui profile' };
    }
  };

  const updateProfileWithImages = async (updatedData, progressCallback = null) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
      
      if (!state.user || !state.userType) {
        throw new Error('User data tidak tersedia');
      }

      const finalData = { ...updatedData };
      let imageProcessingProgress = 0;

      const updateResult = await updateProfile(finalData);
      
      if (!updateResult.success) {
        throw new Error(updateResult.message);
      }

      // Final progress update
      if (progressCallback) progressCallback(100);
      return { success: true, message: 'Profile dan gambar berhasil diperbarui', data: finalData };
      
    } catch (error) {
      console.error('UserContext: updateProfileWithImages error:', error);
      dispatch({
        type: USER_ACTIONS.SET_ERROR,
        payload: error.message || 'Gagal memperbarui profile dengan gambar'
      });
      return { success: false, message: error.message || 'Gagal memperbarui profile dengan gambar' };
    }
  };

  const createProfileChangeNotification = async (user, updatedData) => {
    try {
      const changedFields = Object.keys(updatedData);
      // Validasi state.userType untuk mencegah error
      const userType = state.userType || 'user';
      const capitalizedUserType = userType.charAt(0).toUpperCase() + userType.slice(1);
      
      await addDoc(collection(db, 'notifications'), {
        type: 'profile_update',
        userId: user.id,
        userType: state.userType,
        userName: user.namaLengkap || user.username,
        changedFields: changedFields,
        changes: updatedData,
        message: `${user.namaLengkap || user.username} (${capitalizedUserType}) telah mengubah profil mereka`,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
      
      if (!state.user || !state.userType) {
        throw new Error('User data not available');
      }

      if (state.user.password !== currentPassword) {
        throw new Error('Password lama tidak benar');
      }

      const collection_name = 'murid';
      const userRef = doc(db, collection_name, state.user.id);
      
      await updateDoc(userRef, {
        password: newPassword,
        updatedAt: serverTimestamp()
      });

      await createPasswordChangeNotification(state.user);

      dispatch({
        type: USER_ACTIONS.UPDATE_PROFILE,
        payload: { password: newPassword }
      });

      const updatedUser = { ...state.user, password: newPassword };
      await AuthService.saveLoginData(updatedUser, state.userType);

      return { success: true, message: 'Password berhasil diubah' };
    } catch (error) {
      
      const errorMessage = error.message || 'Gagal mengubah password';
      dispatch({
        type: USER_ACTIONS.SET_ERROR,
        payload: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  };

  const createPasswordChangeNotification = async (user) => {
    try {
      // Validasi state.userType untuk mencegah error
      const userType = state.userType || 'user';
      const capitalizedUserType = userType.charAt(0).toUpperCase() + userType.slice(1);
      
      await addDoc(collection(db, 'notifications'), {
        type: 'password_change',
        userId: user.id,
        userType: state.userType,
        userName: user.namaLengkap || user.username,
        message: `${user.namaLengkap || user.username} (${capitalizedUserType}) telah mengubah password mereka`,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      
    }
  };

  const logout = async () => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
      
      const logoutResult = await AuthService.logout();
      
      if (logoutResult) {
        dispatch({
          type: USER_ACTIONS.SET_USER,
          payload: {
            user: null,
            userType: null,
            isLoggedIn: false
          }
        });
        return { success: true };
      }
      
      return { success: false, message: 'Gagal logout' };
    } catch (error) {
      
      dispatch({
        type: USER_ACTIONS.SET_ERROR,
        payload: 'Gagal logout'
      });
      return { success: false, message: 'Gagal logout' };
    }
  };

  const clearError = () => {
    dispatch({ type: USER_ACTIONS.CLEAR_ERROR });
  };

  const refreshUser = async () => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
      const currentUser = await AuthService.getCurrentUser();
      
      dispatch({
        type: USER_ACTIONS.SET_USER,
        payload: {
          user: currentUser.userData,
          userType: currentUser.userType,
          isLoggedIn: currentUser.isLoggedIn
        }
      });
    } catch (error) {
      console.error('UserContext: Error refreshing user:', error);
      dispatch({
        type: USER_ACTIONS.SET_ERROR,
        payload: 'Gagal memuat data pengguna'
      });
    }
  };

  const value = {
    user: state.user,
    userType: state.userType,
    isLoading: state.isLoading,
    error: state.error,
    isLoggedIn: state.isLoggedIn,
    updateProfile,
    updateProfileWithImages,
    changePassword,
    logout,
    clearError,
    refreshUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
