import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  BackHandler,
  Modal,
  Dimensions,
  ToastAndroid,
  Platform,
} from 'react-native';
import { SafeStatusBar } from '../../utils/statusBarUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import PlaceholderPage from '../../components/PlaceholderPage';
import ScheduleWidget from '../../components/ScheduleWidget';
import EnhancedHeader from '../../components/EnhancedHeader';
import { themes, createDashboardStyles } from '../../styles/dashboardThemes';
import { useUser } from '../../context/UserContext';
import useAppLifecycle from '../../hooks/useAppLifecycle';
import { getNotifications } from '../../services/notificationService';
import ProfileModal from '../../components/ProfileModal';

const MuridDashboard = ({ navigation }) => {
  const { user, loading, logout } = useUser();
  
  const [selectedPage, setSelectedPage] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('home');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const backPressCount = useRef(0);
  const backPressTimer = useRef(null);

  useAppLifecycle();

  useEffect(() => {
    const backAction = () => {
      
      if (logoutModalVisible) {
        setLogoutModalVisible(false);
        return true;
      }

      if (activeTab !== 'home') {
        setActiveTab('home');
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
      } else if (backPressCount.current === 2) {
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
  }, [logoutModalVisible, activeTab]);

  const theme = themes.murid;
  const styles = createDashboardStyles(theme);

  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    // Wait for loading to complete before any validation
    if (loading) {
      return;
    }

    // If no user after loading, redirect to login
    if (!user) {
      const timeoutId = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'PilihLogin' }],
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }

    // If user exists but is not murid, redirect to appropriate dashboard
    if (user.userType && user.userType !== 'murid') {
      const dashboardRoute = user.userType === 'admin' ? 'AdminDashboard' : 
                            user.userType === 'guru' ? 'GuruDashboard' : 'PilihLogin';
      navigation.reset({
        index: 0,
        routes: [{ name: dashboardRoute }],
      });
      return;
    }

    // Setup notifications for valid murid user
    if (user.id && (user.userType === 'murid' || !user.userType)) {
      const unsubscribe = getNotifications(user.id, (newNotifications) => {
        setNotifications(newNotifications);
      });
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          try {
            unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing from notifications:', error);
          }
        }
      };
    }
  }, [user, loading, navigation]);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
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

  const menuItems = [
    { 
      id: 'profile', 
      title: 'Profil Saya', 
      subtitle: 'Lihat informasi pribadi',
      icon: 'person-circle-outline', 
      color: '#4A90E2',
      onPress: () => handleTabPress('profile')
    },
    { 
      id: 'schedule', 
      title: 'Jadwal Pelajaran', 
      subtitle: 'Lihat jadwal harian',
      icon: 'calendar', 
      color: '#10B981',
      onPress: () => setActiveTab('school')
    },
  ];

  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-outline' },
    { id: 'school', label: 'Jadwal Kelas', icon: 'school-outline' },
    { id: 'profile', label: 'Profil', icon: 'person-outline' }
  ];

  const handleTabPress = (tabId) => {
    if (tabId === 'profile') {
      setShowProfileModal(true);
    } else {
      setActiveTab(tabId);
      setShowProfileModal(false);
    }
  };

  const handleProfileModalClose = () => {
    setShowProfileModal(false);
  };


  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Memuat Dashboard...</Text>
      </View>
    );
  }

  const renderMenuGrid = () => {
    return (
      <View style={styles.newMenuRow}>
        {menuItems.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.newMenuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.newMenuIconContainer, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.newMenuText}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
case 'school':
        return (
          <ScheduleWidget 
            userType="murid"
            userClass={user?.kelas}
            theme={theme}
            headerBackgroundColor={theme.background}
          />
        );
      case 'home':
      default:
        return (
          <View style={styles.homeContainer}>
            {/* Fixed Top Bar - Outside ScrollView */}
            <View style={styles.topBarHeader}>
              <View style={styles.topBarContent}>
                <View style={styles.userInfo}>
                  {user?.fotoUrl ? (
                    <Image 
                      source={{ uri: user.fotoUrl }} 
                      style={styles.profilePhoto} 
                      onError={(e) => {}}
                    />
                  ) : (
                    <View style={styles.defaultProfileIcon}>
                      <Image
                        source={require('../../assets/logo/student.png')}
                        style={styles.defaultProfileImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user?.namaLengkap || 'Nama Siswa'}</Text>
                    <Text style={styles.userSubtitle}>{user?.kelas || 'Kelas tidak tersedia'}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={() => navigation.navigate('NotificationPage', {
                    notifications,
                    userId: user?.id,
                    userType: 'murid',
                    onRefresh: () => {}
                  })}
                >
                  <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>{notifications.filter(n => !n.read).length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Scrollable Content */}
            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              contentContainerStyle={styles.scrollContent}
            >
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>Selamat Datang, {user?.namaLengkap?.split(' ')[0] || 'Siswa'}! 👋</Text>
                <Text style={styles.welcomeText}>
                  Semoga hari ini penuh dengan pembelajaran yang menyenangkan dan prestasi yang membanggakan.
                </Text>
              </View>
            </View>

            <View style={styles.todayScheduleContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={20} color={theme.primary} />
                <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>
              </View>
              <TouchableOpacity 
                style={styles.schedulePreview}
                onPress={() => setActiveTab('school')}
              >
                <View style={styles.schedulePreviewContent}>
                  <Text style={styles.schedulePreviewText}>
                    Lihat jadwal pelajaran lengkap untuk hari ini
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.quickInfoContainer}>
              <Text style={styles.quickInfoTitle}>Informasi Siswa</Text>
              <View style={styles.quickInfoGrid}>
                <View style={styles.quickInfoItem}>
                  <View style={styles.quickInfoIcon}>
                    <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                  </View>
                  <Text style={styles.quickInfoText}>
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <View style={styles.quickInfoIcon}>
                    <Ionicons name="school-outline" size={20} color={theme.primary} />
                  </View>
                  <Text style={styles.quickInfoText}>
                    {user?.kelas || 'Kelas'}
                  </Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <View style={styles.quickInfoIcon}>
                    <Ionicons name="id-card-outline" size={20} color={theme.primary} />
                  </View>
                  <Text style={styles.quickInfoText}>
                    NIS: {user?.nis || 'Tidak ada'}
                  </Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <View style={styles.quickInfoIcon}>
                    <Ionicons name="library-outline" size={20} color={theme.primary} />
                  </View>
                  <Text style={styles.quickInfoText}>
                    Jurusan: {user?.jurusan || 'Tidak ada'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.newMenuSection}>
              <Text style={styles.menuTitle}>Menu Utama</Text>
              {renderMenuGrid()}
            </View>

            <View style={styles.bottomSpacing} />
            </ScrollView>
          </View>
        );
    }
  };

  const BottomTabBar = () => (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              isActive && styles.activeTab
            ]}
            onPress={() => handleTabPress(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={isActive ? theme.tabActive : theme.tabInactive}
            />
            <Text
              style={[
                styles.tabLabel,
                isActive && styles.activeLabel
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.newContainer} edges={['bottom', 'left', 'right']}>
      <SafeStatusBar style="light" hidden={true} />
      
      <View style={styles.flex}>
        {renderContent()}
      </View>

      <BottomTabBar />



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
              Apakah Anda yakin ingin keluar dari aplikasi?
            </Text>
            <Text style={styles.modalSubtext}>
              Anda akan keluar dari Dashboard Murid dan kembali ke halaman login.
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
                onPress={confirmLogout}
              >
                <Text style={styles.modalConfirmText}>Ya, Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={handleProfileModalClose}
        userData={user}
        userType="murid"
      />
    </SafeAreaView>
  );
};

export default MuridDashboard;
