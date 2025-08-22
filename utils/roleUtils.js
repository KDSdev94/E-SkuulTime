import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mendapatkan display name berdasarkan role pengguna
 */
export const getRoleDisplayName = (role) => {
  const roleMap = {
    'admin': 'Admin',
    'superadmin': 'Super Admin',
    'kaprodi_tkj': 'Kaprodi TKJ',
    'kaprodi_tkr': 'Kaprodi TKR',
    'waka_kurikulum': 'Waka Kurikulum',
    'guru': 'Guru',
    'murid': 'Murid'
  };
  
  return roleMap[role] || 'Admin';
};

/**
 * Mendapatkan display name untuk halaman notifikasi
 */
export const getNotificationPageTitle = (role) => {
  const roleMap = {
    'admin': 'Notifikasi Admin',
    'superadmin': 'Notifikasi Super Admin',
    'kaprodi_tkj': 'Notifikasi Kaprodi TKJ',
    'kaprodi_tkr': 'Notifikasi Kaprodi TKR',
    'waka_kurikulum': 'Notifikasi Waka Kurikulum',
    'guru': 'Notifikasi Guru',
    'murid': 'Notifikasi Murid'
  };
  
  return roleMap[role] || 'Notifikasi Admin';
};

/**
 * Mendapatkan nama lengkap pengguna dengan menggabungkan nama dan role
 */
export const getUserDisplayName = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      const name = parsedUserData.namaLengkap || parsedUserData.username || 'Administrator';
      const role = parsedUserData.role || 'admin';
      
      // Return nama tanpa role display
      return name;
    }
    
    // Fallback
    const adminName = await AsyncStorage.getItem('adminName');
    return adminName || 'Administrator';
  } catch (error) {
    console.error('Error getting user display name:', error);
    return 'Administrator';
  }
};

/**
 * Mendapatkan judul yang tepat untuk notifikasi berdasarkan role
 */
export const getNotificationTitle = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      const role = parsedUserData.role || 'admin';
      
      // Return role display name for notification titles
      return getRoleDisplayName(role);
    }
    
    return 'Admin';
  } catch (error) {
    console.error('Error getting notification title:', error);
    return 'Admin';
  }
};

/**
 * Cek apakah pengguna adalah kaprodi
 */
export const isKaprodi = (role) => {
  return role === 'kaprodi_tkj' || role === 'kaprodi_tkr';
};

/**
 * Mendapatkan role pengguna saat ini
 */
export const getCurrentUserRole = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      return parsedUserData.role || 'admin';
    }
    
    return 'admin';
  } catch (error) {
    console.error('Error getting current user role:', error);
    return 'admin';
  }
};
