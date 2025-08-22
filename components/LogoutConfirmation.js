import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';

export const useLogoutConfirmation = () => {
  const navigation = useNavigation();
  const { logout } = useUser();

  const showLogoutConfirmation = () => {
    Alert.alert(
      '⚠️ Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar dari aplikasi?',
      [
        {
          text: 'Batal',
          style: 'cancel',
          onPress: () => null,
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'PilihLogin' }],
              });
            } catch (error) {
              
              Alert.alert('Error', 'Gagal logout. Silakan coba lagi.');
            }
          },
        },
      ],
      { 
        cancelable: true,
        onDismiss: () => null 
      }
    );
  };

  return { showLogoutConfirmation };
};

export default useLogoutConfirmation;
