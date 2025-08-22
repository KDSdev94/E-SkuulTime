import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeStatusBar } from '../../utils/statusBarUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

import TopBar from './dashboard_components/TopBar';
import AdminSidebar from './dashboard_components/Sidebar';
import { getUserDisplayName } from '../../utils/roleUtils';

// Lazy load components
const DashboardContent = React.lazy(() => import('./dashboard_components/DashboardContent'));
const MuridManagementPage = React.lazy(() => import('./MuridManagementPage'));
const GuruManagementPage = React.lazy(() => import('./GuruManagementPage'));
const JadwalManagementPage = React.lazy(() => import('./JadwalManagementPage'));
const MapelPage = React.lazy(() => import('./MapelPage'));
const NotificationPage = React.lazy(() => import('../NotificationPage'));
const LaporanPageNew = React.lazy(() => import('./LaporanPageNew'));
const AdminManagementPage = React.lazy(() => import('./AdminManagementPage'));
const KaprodiManagementPage = React.lazy(() => import('./KaprodiManagementPage'));
const KelasJadwalManagementPage = React.lazy(() => import('./KelasJadwalManagementPage'));
const ProfileModal = React.lazy(() => import('../../components/ProfileModal'));

import MuridService from '../../services/MuridService';
import GuruService from '../../services/GuruService';
import MataPelajaranService from '../../services/MataPelajaranService';
import KelasJurusanService from '../../services/KelasJurusanService';
import JadwalService from '../../services/JadwalService';
import useAppLifecycle from '../../hooks/useAppLifecycle';
import PermissionService from '../../services/PermissionService';

import { getNotifications } from '../../services/notificationService';

const { width } = Dimensions.get('window');

const mockDashboardStats = {
  totalMurid: 450,
  muridAktif: 420,
  totalGuru: 35,
  guruAktif: 35,
  totalMataPelajaran: 30,
};

const getPageTitle = (selectedIndex, user) => {
  const titles = {
    0: 'Dashboard',
    1: 'Data Murid',
    2: 'Data Guru',
    3: 'Jadwal Pelajaran',
    4: 'Mata Pelajaran',
    5: 'Laporan',
    6: 'Kelola Admin',
    7: 'Kelas dan Jurusan',
    8: 'Data Kaprodi',
    9: 'Profil',
  };
  
  // Special handling for kaprodi users
  if (selectedIndex === 3 && user?.userType === 'prodi') {
    return 'Data Jadwal';
  }
  
  if (selectedIndex === 5 && user?.userType === 'prodi') {
    return 'Review Jadwal';
  }
  
  return titles[selectedIndex] || 'Dashboard';
};

const PlaceholderPage = ({ title }) => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="construct" size={80} color="#ccc" />
    <Text style={styles.placeholderText}>
      Halaman {title}{"\n"}akan segera dibuat
    </Text>
  </View>
);

export default function AdminDashboard() {
  const navigation = useNavigation();
  const { user, loading, logout } = useUser();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('admin');
  const [currentUserType, setCurrentUserType] = useState('admin');
  const backPressCount = useRef(0);
  const backPressTimer = useRef(null);
  const notificationUnsubscribe = useRef(null);

  useAppLifecycle();

  useEffect(() => {
    const backAction = () => {
      if (sidebarVisible) {
        setSidebarVisible(false);
        return true;
      }
      
      if (logoutModalVisible) {
        setLogoutModalVisible(false);
        return true;
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }

      if (selectedIndex !== 0) {
        setSelectedIndex(0);
        backPressCount.current = 0;
        if (backPressTimer.current) {
          clearTimeout(backPressTimer.current);
        }
        return true;
      }

      backPressCount.current += 1;
      
      if (backPressCount.current === 1) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Tekan sekali lagi untuk keluar', ToastAndroid.SHORT);
        } else {
          Alert.alert('Info', 'Tekan sekali lagi untuk keluar');
        }

        backPressTimer.current = setTimeout(() => {
          backPressCount.current = 0;
        }, 2000);

        return true;
      } else if (backPressCount.current >= 2) {
        clearTimeout(backPressTimer.current);
        BackHandler.exitApp();
        return true;
      }
      
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    return () => {
      backHandler.remove();
      if (backPressTimer.current) {
        clearTimeout(backPressTimer.current);
      }
    };
  }, [sidebarVisible, logoutModalVisible, selectedIndex, navigation]);

  let [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (fontError) {
      
    }
  }, [fontError]);

  // Authentication validation
  useEffect(() => {
    console.log('🔍 AdminDashboard auth validation:', { user: !!user, loading, userType: user?.userType });
    
    // Wait for loading to complete before any validation
    if (loading) {
      console.log('⏳ UserContext still loading, waiting...');
      return;
    }

    // If no user after loading, redirect to login
    if (!user) {
      console.log('❌ No user found after loading, redirecting to login');
      const timeoutId = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'PilihLogin' }],
        });
      }, 1000); // Increased timeout to give more time for user context to load
      return () => clearTimeout(timeoutId);
    }

    // If user exists but is not admin, redirect to appropriate dashboard
    if (user.userType && user.userType !== 'admin') {
      console.log('🚫 User is not admin, redirecting to appropriate dashboard:', user.userType);
      const dashboardRoute = user.userType === 'guru' ? 'GuruDashboard' : 
                            user.userType === 'murid' ? 'MuridDashboard' : 'PilihLogin';
      navigation.reset({
        index: 0,
        routes: [{ name: dashboardRoute }],
      });
      return;
    }
    
    console.log('✅ Admin user validated successfully');
  }, [user, loading, navigation]);

  useEffect(() => {
const loadAdminData = async () => {
    try {
        const displayName = await getUserDisplayName();
        setAdminName(displayName);
    } catch (error) {
        console.error('Error loading admin display name:', error);
        setAdminName('Administrator');
    }
};
    loadAdminData();
    loadDashboardData();

    // Determine the correct user ID and type for notifications
    const getUserIdAndType = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          const userId = parsedUserData.id || parsedUserData.username || 'admin';
          // Use role from userData instead of userType from AsyncStorage
          const userType = parsedUserData.role || 'admin';
          return { userId, userType };
        }
        return { userId: 'admin', userType: 'admin' };
      } catch (error) {
        console.error('Error getting user data:', error);
        return { userId: 'admin', userType: 'admin' };
      }
    };

    getUserIdAndType().then(async ({ userId, userType }) => {
      // Set current user data for navigation
      setCurrentUserId(userId);
      setCurrentUserType(userType);
      
      try {
        // getNotifications returns the unsubscribe function directly, not a promise
        const unsubscribe = getNotifications(userId, (newNotifications) => {
          setNotifications(newNotifications);
        }, userType);
        
        // Store unsubscribe function for cleanup
        notificationUnsubscribe.current = unsubscribe;
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    });

    return () => {
      if (notificationUnsubscribe.current && typeof notificationUnsubscribe.current === 'function') {
        notificationUnsubscribe.current();
      }
    };
  }, []);

  const memoizedDashboardStats = useMemo(() => dashboardStats, [dashboardStats]);

  useEffect(() => {
    if (selectedIndex === 0) {
      loadDashboardData();
    }
  }, [selectedIndex]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Determine jurusan filter for kaprodi users
      let jurusanFilter = null;
      if (user?.userType === 'prodi' || user?.role === 'prodi') {
        // Extract jurusan from user data (e.g., "kaprodi TKJ" -> "TKJ")
        const userRole = user?.role || user?.userType || '';
        const userData = user?.nama || user?.namaLengkap || user?.displayName || '';
        
        if (userData.toUpperCase().includes('TKJ') || userRole.toUpperCase().includes('TKJ')) {
          jurusanFilter = 'TKJ';
        } else if (userData.toUpperCase().includes('TKR') || userRole.toUpperCase().includes('TKR')) {
          jurusanFilter = 'TKR';
        }
      }
      
      const [statistikMurid, statistikGuru, statistikMataPelajaran, statistikKelas, statistikJadwal] = await Promise.all([
        MuridService.getStatistikMurid(),
        GuruService.getStatistikGuru(),
        MataPelajaranService.getMataPelajaranStatistics(),
        KelasJurusanService.getKelasStatistics(),
        JadwalService.getJadwalStatistics(jurusanFilter)
      ]);
      
      setDashboardStats({
        totalMurid: statistikMurid.total || 0,
        muridAktif: statistikMurid.aktif || 0,
        totalGuru: statistikGuru.total || 0,
        guruAktif: statistikGuru.aktif || 0,
        totalMataPelajaran: statistikMataPelajaran.total || 0,
        totalKelas: statistikKelas.total || 0,
        totalJadwal: statistikJadwal.total || 0,
      });
      
    } catch (error) {
      
      setDashboardStats({
        totalMurid: 0,
        totalGuru: 0,
        totalMataPelajaran: 0,
        totalKelas: 0,
        totalJadwal: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

const handleLogout = async () => {
    try {
      await logout();
      setLogoutModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'PilihLogin' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Gagal logout');
    }
  };

  const handleSidebarItemSelected = (index) => {
    setSelectedIndex(index);
    setSidebarVisible(false);
  };

const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 1:
        setSelectedIndex(1); // Kelola Murid
        break;
      case 2:
        setSelectedIndex(2); // Kelola Guru
        break;
      case 3:
        setSelectedIndex(3); // Jadwal
        break;
      case 4:
        setSelectedIndex(4); // Mata Pelajaran
        break;
      case 5:
        setSelectedIndex(5); // Laporan
        break;
      case 6:
        setSelectedIndex(7); // Kelola Kelas (index 7 untuk KelasJadwalManagementPage)
        break;
      case 8:
        setSelectedIndex(6); // Kelola Admin (index 6 untuk AdminManagementPage)
        break;
      default:
        break;
    }
  };

const handleLogoutPress = () => {
    setSidebarVisible(false);
    setLogoutModalVisible(true);
  };

const renderCurrentPage = useCallback(() => {
    // Suspense fallback for lazy-loaded components
    const PageLoader = () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );

    const pageComponent = (() => {
      switch (selectedIndex) {
        case 0:
          return (
            <DashboardContent
              dashboardStats={memoizedDashboardStats}
              isLoading={isLoading}
              onQuickAction={handleQuickAction}
              userRole={user?.userType || user?.role}
            />
          );
        case 1:
          return <MuridManagementPage onGoBack={() => setSelectedIndex(0)} />;
        case 2:
          return <GuruManagementPage onGoBack={() => setSelectedIndex(0)} />;
        case 3:
          return <JadwalManagementPage onGoBack={() => setSelectedIndex(0)} />;
        case 4:
          return <MapelPage navigation={navigation} onGoBack={() => setSelectedIndex(0)} />;
        case 5:
          return <LaporanPageNew onGoBack={() => setSelectedIndex(0)} onOpenSidebar={() => setSidebarVisible(true)} />;
        case 6:
          return <AdminManagementPage onGoBack={() => setSelectedIndex(0)} />;
        case 7:
          return <KelasJadwalManagementPage onGoBack={() => setSelectedIndex(0)} />;
        case 8:
          return <KaprodiManagementPage onGoBack={() => setSelectedIndex(0)} />;
        case 9:
          return (
            <ProfileModal
              visible={true}
              onClose={() => setSelectedIndex(0)}
              userData={user}
              userType={user?.userType || user?.role}
            />
          );
        default:
          return (
            <DashboardContent
              dashboardStats={memoizedDashboardStats}
              isLoading={isLoading}
              onQuickAction={handleQuickAction}
              userRole={user?.userType || user?.role}
            />
          );
      }
    })();

    return (
      <React.Suspense fallback={<PageLoader />}>
        {pageComponent}
      </React.Suspense>
    );
  }, [selectedIndex, memoizedDashboardStats, isLoading, user, navigation]);

  // Show loading screen only while user context is loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <SafeStatusBar style="light" hidden={true} />
        
        {selectedIndex !== 5 && selectedIndex !== 9 && (
          <TopBar 
            title={getPageTitle(selectedIndex, user)} 
            onMenuPress={() => setSidebarVisible(true)}
            notifications={notifications}
            onNotificationPress={() => navigation.navigate('NotificationPage', {
              notifications,
              userId: currentUserId,
              userType: currentUserType,
              onRefresh: () => {}
            })}
            onProfilePress={() => setSelectedIndex(9)}
            showBackButton={selectedIndex === 6}
            onBackPress={() => selectedIndex === 6 && setSelectedIndex(0)}
            userData={user}
          />
        )}
        
        <View style={styles.content}>
          {renderCurrentPage()}
        </View>
        
        <AdminSidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          selectedIndex={selectedIndex}
          onItemSelected={handleSidebarItemSelected}
          onLogout={handleLogoutPress}
          notifications={notifications}
          adminName={adminName || 'Administrator'}
        />

        {/* Logout Modal */}
        <Modal
          visible={logoutModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setLogoutModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Ionicons name="log-out-outline" size={28} color="#dc2626" />
                <Text style={styles.modalTitle}>Konfirmasi Logout</Text>
              </View>
              <Text style={styles.modalText}>
                Apakah Anda yakin ingin logout dari sistem?
              </Text>
              <Text style={styles.modalSubtext}>
                Anda akan keluar dari Dashboard Admin dan kembali ke halaman login.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setLogoutModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleLogout}
                >
                  <Text style={styles.modalConfirmText}>Ya, Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1E3A8A',
    fontFamily: 'Poppins-Medium',
  },
  content: {
    flex: 1,
  },
  
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Nunito_500Medium',
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    width: width - 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtext: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
  },
  modalConfirmButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#fff',
  },
  
});
