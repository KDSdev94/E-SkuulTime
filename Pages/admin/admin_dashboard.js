import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

// Import components
import TopBar from './dashboard_components/TopBar';
import AdminSidebar from './dashboard_components/Sidebar';
import DashboardContent from './dashboard_components/DashboardContent';
import MuridManagementPage from './MuridManagementPage';
import GuruManagementPage from './GuruManagementPage';
import JadwalManagementPage from './JadwalManagementPage';
import KelasManagementPage from './KelasManagementPage';

// Import services
import MuridService from '../../services/MuridService';
import GuruService from '../../services/GuruService';

const { width } = Dimensions.get('window');

// Mock data untuk statistik dashboard
const mockDashboardStats = {
  totalMurid: 450,
  muridAktif: 420,
  muridLulus: 25,
  muridKeluar: 5,
  muridLakiLaki: 230,
  muridPerempuan: 220,
  totalGuru: 35,
  guruAktif: 35,
  guruPNS: 15,
  guruPPPK: 10,
  guruHonorer: 10,
  guruLakiLaki: 18,
  guruPerempuan: 17,
  totalKelas: 9,
  totalMataPelajaran: 30,
};

const getPageTitle = (selectedIndex) => {
  const titles = {
    0: 'Dashboard',
    1: 'Data Murid',
    2: 'Data Guru',
    3: 'Jadwal Pelajaran',
    4: 'Data Kelas',
    5: 'Admin Settings',
    6: 'Absensi',
    7: 'Laporan',
  };
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Load Google Fonts
  let [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    const loadAdminData = async () => {
      const name = await AsyncStorage.getItem('adminName');
      if (name) {
        setAdminName(name);
      }
    };
    loadAdminData();
    loadDashboardData();
  }, []);

  // Refresh data when returning to dashboard
  useEffect(() => {
    if (selectedIndex === 0) {
      loadDashboardData();
    }
  }, [selectedIndex]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get real data from Firebase
      const [statistikMurid, statistikGuru] = await Promise.all([
        MuridService.getStatistikMurid(),
        GuruService.getStatistikGuru()
      ]);
      
      // Combine both statistics
      setDashboardStats({
        // Murid statistics
        totalMurid: statistikMurid.total || 0,
        muridAktif: statistikMurid.aktif || 0,
        muridLulus: statistikMurid.lulus || 0,
        muridKeluar: statistikMurid.keluar || 0,
        muridLakiLaki: statistikMurid.laki_laki || 0,
        muridPerempuan: statistikMurid.perempuan || 0,
        // Guru statistics
        totalGuru: statistikGuru.total || 0,
        guruAktif: statistikGuru.aktif || 0,
        guruPNS: statistikGuru.pns || 0,
        guruPPPK: statistikGuru.pppk || 0,
        guruHonorer: statistikGuru.honorer || 0,
        guruLakiLaki: statistikGuru.laki_laki || 0,
        guruPerempuan: statistikGuru.perempuan || 0,
        // Default for other data
        totalKelas: 6, // 3 TKJ + 3 TKR
        totalMataPelajaran: 20,
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to empty stats on error
      setDashboardStats({
        totalMurid: 0,
        muridAktif: 0,
        muridLulus: 0,
        muridKeluar: 0,
        muridLakiLaki: 0,
        muridPerempuan: 0,
        totalGuru: 0,
        guruAktif: 0,
        guruPNS: 0,
        guruPPPK: 0,
        guruHonorer: 0,
        guruLakiLaki: 0,
        guruPerempuan: 0,
        totalKelas: 0,
        totalMataPelajaran: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userType');
      setLogoutModalVisible(false);
      navigation.navigate('PilihLogin');
      Alert.alert('Success', 'Berhasil logout dari sistem');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleSidebarItemSelected = (index) => {
    setSelectedIndex(index);
    setSidebarVisible(false);
  };

  const handleLogoutPress = () => {
    setSidebarVisible(false);
    setLogoutModalVisible(true);
  };

  const renderCurrentPage = () => {
    switch (selectedIndex) {
      case 0:
        return (
          <DashboardContent
            dashboardStats={dashboardStats}
            isLoading={isLoading}
            onQuickAction={setSelectedIndex}
          />
        );
      case 1:
        return <MuridManagementPage />;
case 2:
        return <GuruManagementPage />;
      case 3:
        return <JadwalManagementPage />;
      case 4:
        return <KelasManagementPage />;
      case 5:
        return <PlaceholderPage title="Admin Settings" />;
      case 6:
        return <PlaceholderPage title="Absensi" />;
      case 7:
        return <PlaceholderPage title="Laporan" />;
      default:
        return (
          <DashboardContent
            dashboardStats={dashboardStats}
            isLoading={isLoading}
            onQuickAction={setSelectedIndex}
          />
        );
    }
  };

  // Show loading indicator while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
        <StatusBar backgroundColor="rgb(80, 160, 220)" barStyle="light-content" />
        
        <TopBar 
          title={getPageTitle(selectedIndex)} 
          onMenuPress={() => setSidebarVisible(true)} 
        />
        
        <View style={styles.content}>
          {renderCurrentPage()}
        </View>
        
        <AdminSidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          selectedIndex={selectedIndex}
          onItemSelected={handleSidebarItemSelected}
          onLogout={handleLogoutPress}
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
    </SafeAreaProvider>
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
  
  // Placeholder Styles
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
  
  // Modal Styles
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
