import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  BackHandler,
  ToastAndroid,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeStatusBar } from '../../utils/statusBarUtils';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { useUser } from '../../context/UserContext';
import { getNotifications } from '../../services/notificationService';
import useAppLifecycle from '../../hooks/useAppLifecycle';
import { themes } from '../../styles/dashboardThemes';
import { createDashboardStyles } from '../../styles/dashboardThemes';
import JadwalService from '../../services/JadwalService';
import ProfileModal from '../../components/ProfileModal';

const GuruDashboard = ({ navigation }) => {
  const { user, isLoading, logout } = useUser();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const backPressCount = useRef(0);
  const backPressTimer = useRef(null);

  useAppLifecycle();

  useEffect(() => {
    const backAction = () => {
      if (showProfileModal) {
        setShowProfileModal(false);
        return true;
      }
      
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
  }, [showProfileModal, logoutModalVisible, activeTab]);

  const theme = themes.guru; // We'll create this theme
  const styles = createDashboardStyles(theme);

  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    // Wait for loading to complete before any validation
    if (isLoading) {
      return;
    }

    // If no user after loading, redirect to login with longer timeout to avoid issues
    if (!user) {
      const timeoutId = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'PilihLogin' }],
        });
      }, 5000); // 5 second timeout to give more time for user data to load
      return () => clearTimeout(timeoutId);
    }

    // Only redirect if user has a different userType that's explicitly set
    if (user.userType === 'admin') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'AdminDashboard' }],
      });
      return;
    }
    
    if (user.userType === 'murid') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MuridDashboard' }],
      });
      return;
    }

    // Setup notifications for guru user (including those without explicit userType)
    if (user.id) {
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
  }, [user, isLoading, navigation]);

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
      color: '#7C3AED',
      onPress: () => handleTabPress('profile')
    },
    { 
      id: 'schedule', 
      title: 'Jadwal Mengajar', 
      subtitle: 'Lihat jadwal mengajar',
      icon: 'calendar', 
      color: '#A855F7',
      onPress: () => setActiveTab('schedule')
    },
    { 
      id: 'classes', 
      title: 'Kelas Saya', 
      subtitle: 'Kelola kelas yang diampu',
      icon: 'library-outline', 
      color: '#8B5CF6',
      onPress: () => setActiveTab('classes')
    },
  ];

  const tabs = [
    { id: 'home', label: 'Home', icon: 'home-outline' },
    { id: 'schedule', label: 'Jadwal', icon: 'calendar-outline' },
    { id: 'classes', label: 'Kelas', icon: 'library-outline' },
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

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
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
      case 'schedule':
        return (
          <TeachingSchedule user={user} styles={styles} />
        );
      case 'classes':
        return (
          <ClassesManaged user={user} styles={styles} />
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
                        source={require('../../assets/icon/teachericon.jpg')}
                        style={styles.defaultProfileImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user?.namaLengkap || 'Nama Guru'}</Text>
                    <Text style={styles.userSubtitle}>{user?.nip || 'NIP tidak tersedia'}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={() => navigation.navigate('NotificationPage', {
                    notifications,
                    userId: user?.id,
                    userType: 'guru',
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
                <Text style={styles.welcomeTitle}>Selamat Datang, {user?.namaLengkap?.split(' ')[0] || 'Guru'}! 👋</Text>
                <Text style={styles.welcomeText}>
                  Semoga hari ini dapat memberikan pembelajaran yang inspiratif dan bermakna bagi para siswa.
                </Text>
              </View>
            </View>

            <View style={styles.todayScheduleContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={20} color="#7C3AED" />
                <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>
              </View>
              <TouchableOpacity 
                style={styles.schedulePreview}
                onPress={() => setActiveTab('schedule')}
              >
                <View style={styles.schedulePreviewContent}>
                  <Text style={styles.schedulePreviewText}>
                    Lihat jadwal mengajar lengkap untuk hari ini
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.quickInfoContainer}>
              <Text style={styles.quickInfoTitle}>Informasi Guru</Text>
              <View style={styles.quickInfoGrid}>
                <View style={styles.quickInfoItem}>
                  <View style={styles.quickInfoIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.quickInfoText}>
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <View style={styles.quickInfoIcon}>
                    <Ionicons name="id-card-outline" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.quickInfoText}>
                    NIP: {user?.nip || 'Tidak ada'}
                  </Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <View style={styles.quickInfoIcon}>
                    <Ionicons name="library-outline" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.quickInfoText}>
                    Mata Pelajaran: {user?.mataPelajaran || 'Tidak ada'}
                  </Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <View style={styles.quickInfoIcon}>
                    <Ionicons name="people-outline" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.quickInfoText}>
                    Status: {user?.status || 'Aktif'}
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <SafeStatusBar style="light" hidden={true} />
      <View style={styles.flex}>
        {renderContent()}
        
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id && styles.activeTab]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={activeTab === tab.id ? tab.icon.replace('-outline', '') : tab.icon} 
                size={24} 
                color={activeTab === tab.id ? '#7C3AED' : '#999'} 
              />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>


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
                Anda akan keluar dari Dashboard Guru dan kembali ke halaman login.
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
          userType="guru"
        />
      </View>
    </SafeAreaView>
  );
};

// Teaching Schedule Component
const TeachingSchedule = ({ user, styles }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishedCount, setPublishedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadTeachingSchedule();
  }, [user]);

  const loadTeachingSchedule = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setSchedules([]);
        setPublishedCount(0);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // Get published schedules for this specific guru (this is what teachers can see)
      const publishedSchedules = await JadwalService.getSchedulesByTeacher(user.id);
      
      // Get all schedules for this teacher to show statistics
      const allSchedules = await JadwalService.getAllJadwal();
      const teacherAllSchedules = allSchedules.filter(schedule => {
        if (schedule.guruId === user.id) return true;
        if (schedule.namaGuru === user.id) return true;
        if (schedule.nipGuru === user.id) return true;
        return false;
      });
      
      // Sort published schedules by day and time
      const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      const sortedSchedules = publishedSchedules.sort((a, b) => {
        // Pastikan a.hari dan b.hari adalah string sebelum menggunakan indexOf
        const dayA = typeof a.hari === 'string' ? dayOrder.indexOf(a.hari) : -1;
        const dayB = typeof b.hari === 'string' ? dayOrder.indexOf(b.hari) : -1;
        
        if (dayA !== dayB) {
          return dayA - dayB;
        }
        
        // Sort by jam ke if same day
        return (a.jamKe || 0) - (b.jamKe || 0);
      });
      
      setSchedules(sortedSchedules);
      setPublishedCount(publishedSchedules.length);
      setTotalCount(teacherAllSchedules.length);
    } catch (error) {
      console.error('Error loading teaching schedule:', error);
      setSchedules([]);
      setPublishedCount(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const renderScheduleByDay = () => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const schedulesByDay = {};
    
    days.forEach(day => {
      schedulesByDay[day] = schedules.filter(schedule => schedule.hari === day)
        .sort((a, b) => a.jamKe - b.jamKe);
    });

    return (
      <ScrollView style={styles.scheduleContainer}>
        {days.map(day => (
          <View key={day} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day}</Text>
            {schedulesByDay[day].length > 0 ? (
              schedulesByDay[day].map((schedule, index) => (
                <View key={index} style={styles.scheduleItem}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.jamText}>Jam {schedule.jamKe}</Text>
                    <Text style={styles.timeText}>{schedule.waktu}</Text>
                  </View>
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.subjectText}>{schedule.namaMataPelajaran || schedule.mataPelajaran}</Text>
                    <Text style={styles.classText}>Kelas: {schedule.namaKelas || schedule.kelas}</Text>
                    <Text style={styles.roomText}>Ruang: {schedule.ruangKelas || schedule.ruang}</Text>
                    {/* Published status indicator */}
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusBadge, styles.publishedBadge]}>
                        <Ionicons name="checkmark-circle" size={12} color="#fff" />
                        <Text style={styles.statusText}>Published</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noScheduleText}>Tidak ada jadwal yang dipublikasi</Text>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Memuat jadwal mengajar...</Text>
      </View>
    );
  }

  // Show empty state if no schedules found
  if (schedules.length === 0 && !loading) {
    const hasUnpublishedSchedules = totalCount > publishedCount;
    
    return (
      <View style={[styles.placeholderContainer, { backgroundColor: styles.content.backgroundColor }]}>
        <Ionicons name="calendar-outline" size={80} color="#7C3AED" />
        <Text style={styles.placeholderText}>
          {hasUnpublishedSchedules 
            ? 'Jadwal mengajar belum dipublikasi.'
            : 'Belum ada jadwal mengajar yang tersedia.'
          }
        </Text>
        <Text style={[styles.placeholderText, { fontSize: 14, marginTop: 8, color: '#6B7280' }]}>
          {hasUnpublishedSchedules 
            ? `Anda memiliki ${totalCount} jadwal yang menunggu publikasi dari admin.`
            : 'Jadwal akan muncul setelah admin membuat dan menetapkan jadwal untuk Anda.'
          }
        </Text>
        {hasUnpublishedSchedules && (
          <View style={styles.unpublishedInfo}>
            <Ionicons name="time-outline" size={24} color="#F59E0B" />
            <Text style={styles.unpublishedText}>
              Jadwal akan terlihat setelah admin mempublikasikannya.
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: styles.content.backgroundColor }]}>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>Jadwal Mengajar</Text>
        <Text style={styles.headerSubtitle}>
          Published: {publishedCount} dari {totalCount} jadwal
        </Text>
        {totalCount > publishedCount && (
          <View style={styles.publicationStatus}>
            <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
            <Text style={styles.publicationStatusText}>
              {totalCount - publishedCount} jadwal menunggu publikasi admin
            </Text>
          </View>
        )}
      </View>
      {renderScheduleByDay()}
    </View>
  );
};

// Classes Managed Component
const ClassesManaged = ({ user, styles }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassesData();
  }, [user]);

  const loadClassesData = () => {
    if (!user?.kelasAmpu) {
      setLoading(false);
      return;
    }

    const kelasAmpu = Array.isArray(user.kelasAmpu) ? user.kelasAmpu : user.kelasAmpu.split(',').map(k => k.trim());
    const subjects = Array.isArray(user.mataPelajaran) ? user.mataPelajaran : [user.mataPelajaran];

    const mockClassData = kelasAmpu.map(kelas => {
      const studentCount = Math.floor(Math.random() * 15) + 25; // 25-40 students
      
      return {
        namaKelas: kelas,
        jumlahSiswa: studentCount,
        mataPelajaran: subjects,
        waliKelas: Math.random() > 0.7 ? user.namaLengkap : null,
        ruangKelas: `R${Math.floor(Math.random() * 20) + 1}`,
        tahunAjaran: '2024/2025',
        semester: 'Ganjil'
      };
    });

    setClasses(mockClassData);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Memuat data kelas...</Text>
      </View>
    );
  }

  if (!user?.kelasAmpu) {
    return (
      <View style={[styles.placeholderContainer, { backgroundColor: styles.content.backgroundColor }]}>
        <Ionicons name="library" size={80} color="#7C3AED" />
        <Text style={styles.placeholderText}>
          Data kelas ampu belum tersedia.
          Silakan lengkapi profil Anda.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: styles.content.backgroundColor }]}>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>Kelas yang Diampu</Text>
        <Text style={styles.headerSubtitle}>Total: {classes.length} kelas</Text>
      </View>
      
      <ScrollView style={styles.classesContainer}>
        {classes.map((classData, index) => (
          <View key={index} style={styles.classCard}>
            <View style={styles.classHeader}>
              <Text style={styles.className}>{classData.namaKelas}</Text>
              {classData.waliKelas && (
                <View style={styles.waliKelasBadge}>
                  <Text style={styles.waliKelasText}>Wali Kelas</Text>
                </View>
              )}
            </View>
            
            <View style={styles.classInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="people" size={16} color="#7C3AED" />
                <Text style={styles.infoText}>{classData.jumlahSiswa} siswa</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color="#7C3AED" />
                <Text style={styles.infoText}>Ruang {classData.ruangKelas}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={16} color="#7C3AED" />
                <Text style={styles.infoText}>{classData.tahunAjaran} - {classData.semester}</Text>
              </View>
            </View>
            
            <View style={styles.subjectsSection}>
              <Text style={styles.subjectsTitle}>Mata Pelajaran:</Text>
              <View style={styles.subjectsContainer}>
                {classData.mataPelajaran.map((subject, idx) => (
                  <View key={idx} style={styles.subjectTag}>
                    <Text style={styles.subjectTagText}>{subject}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default GuruDashboard;
