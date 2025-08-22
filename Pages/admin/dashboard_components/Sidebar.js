import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ProtectedComponent from '../../../components/ProtectedComponent';
import PermissionService from '../../../services/PermissionService';
import AuthService from '../../../services/AuthService';
import { getAdminTheme } from '../../../styles/dashboardThemes';
import { isKaprodi } from '../../../utils/roleUtils';
import { useUser } from '../../../context/UserContext';
import {
  useFonts,
  Nunito_500Medium,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

const { width } = Dimensions.get('window');

const logo = require('../../../assets/logo/logo_nobg.png');
const adminImage = require('../../../assets/logo/admin.png');

const menuItems = [
  { 
    id: 0, 
    title: 'Dashboard', 
    icon: 'home-outline',
    permissions: [] // Semua role bisa akses dashboard
  },
  { 
    id: 1, 
    title: 'Data Murid', 
    icon: 'people-outline',
    permissions: [PermissionService.PERMISSIONS.MANAGE_STUDENTS, PermissionService.PERMISSIONS.VIEW_USERS]
  },
  { 
    id: 2, 
    title: 'Data Guru', 
    icon: 'school-outline',
    permissions: [PermissionService.PERMISSIONS.MANAGE_TEACHERS, PermissionService.PERMISSIONS.VIEW_USERS]
  },
  { 
    id: 8, 
    title: 'Data Kaprodi', 
    icon: 'briefcase-outline',
    permissions: [PermissionService.PERMISSIONS.MANAGE_ADMINS]
  },
  { 
    id: 3, 
    title: 'Jadwal Pelajaran', 
    icon: 'calendar-outline',
    permissions: [PermissionService.PERMISSIONS.MANAGE_SCHEDULE, PermissionService.PERMISSIONS.VIEW_SCHEDULE]
  },
  { 
    id: 4, 
    title: 'Mata Pelajaran', 
    icon: 'book-outline',
    permissions: [PermissionService.PERMISSIONS.MANAGE_SUBJECTS, PermissionService.PERMISSIONS.VIEW_CURRICULUM]
  },
  { 
    id: 7, 
    title: 'Kelas & Jurusan', 
    icon: 'layers-outline',
    permissions: [PermissionService.PERMISSIONS.MANAGE_CLASSES, PermissionService.PERMISSIONS.MANAGE_SCHEDULE]
  },
  { 
    id: 5, 
    title: 'Laporan', 
    icon: 'document-text-outline',
    permissions: [PermissionService.PERMISSIONS.VIEW_ACADEMIC_REPORTS, PermissionService.PERMISSIONS.GENERATE_REPORTS]
  },
  { 
    id: 9, 
    title: 'Profil', 
    icon: 'person-outline',
    permissions: [] // Semua kaprodi bisa akses profil
  },
];

export default function AdminSidebar({ 
  visible, 
  onClose, 
  selectedIndex, 
  onItemSelected, 
  onLogout,
  notifications = [],
  adminName = 'Admin'
}) {
  const sidebarWidth = width * 0.75;
  const slideAnim = useRef(new Animated.Value(sidebarWidth)).current;
  const { user } = useUser(); // Get user data from context
  
  // State to track if user is kaprodi and which type
  const [isKaprodi, setIsKaprodi] = useState(false);
  const [kaprodiType, setKaprodiType] = useState('');
  const [userRole, setUserRole] = useState('');
  const [currentTheme, setCurrentTheme] = useState(getAdminTheme('admin'));
  
  // Check if user is kaprodi on component mount
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userRole = await PermissionService.getCurrentUserRole();
        const kaprodiStatus = await PermissionService.isKaprodi();
        setIsKaprodi(kaprodiStatus);
        setUserRole(userRole);
        
        // Set current theme based on role
        const theme = getAdminTheme(userRole);
        setCurrentTheme(theme);
        
        // Determine kaprodi type
        if (kaprodiStatus) {
          if (userRole === 'kaprodi_tkj') {
            setKaprodiType('tkj');
          } else if (userRole === 'kaprodi_tkr') {
            setKaprodiType('tkr');
          } else if (adminName.toLowerCase().includes('tkj')) {
            setKaprodiType('tkj');
          } else if (adminName.toLowerCase().includes('tkr')) {
            setKaprodiType('tkr');
          } else {
            setKaprodiType('general');
          }
        }
      } catch (error) {
        console.error('Error checking user role in sidebar:', error);
        setIsKaprodi(false);
        setKaprodiType('');
      }
    };
    checkUserRole();
  }, [adminName]);

  let [fontsLoaded] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: sidebarWidth,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, sidebarWidth]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.sidebarOverlay}>
        <TouchableOpacity
          style={styles.sidebarBackdrop}
          onPress={onClose}
        />
        <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.sidebar}>
            <TouchableOpacity
              style={styles.closeSidebarButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            
            {/* Profile Section */}
            <View style={styles.profileSection}>
              {/* Dynamic Profile Image with admin.png as default */}
              {user?.profilePicture || user?.fotoUrl ? (
                <Image 
                  source={{ uri: user.profilePicture || user.fotoUrl }} 
                  style={styles.profileImage}
                  onError={() => {
                    // Fallback ke default admin image jika URL error
                    console.log('Profile image failed to load, using fallback');
                  }}
                />
              ) : (
                <Image 
                  source={adminImage} 
                  style={styles.profileImage}
                />
              )}
              <View style={styles.profileNameContainer}>
                <Text style={styles.profileName} numberOfLines={2} ellipsizeMode="tail">  
                  {user?.namaLengkap || adminName}
                </Text>
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="shield-checkmark" size={18} color={currentTheme.primary} />
                </View>
              </View>
              <Text style={styles.profileUsername}>
                {isKaprodi ? 
                  (kaprodiType === 'tkj' ? '@kaprodi_tkj' : 
                   kaprodiType === 'tkr' ? '@kaprodi_tkr' : '@kaprodi') 
                  : (user?.username ? `@${user.username}` : '@admin_eskuultime')}
              </Text>

            </View>
            
            {/* Main Menu */}
            <ScrollView style={styles.sidebarMenu}>
              <Text style={styles.menuSectionTitle}>Menu Utama</Text>
              {menuItems.map((item) => {
                const unreadCount = item.id === 5 ? notifications.filter(n => !n.read).length : 0;
                
                // Filter out irrelevant menu items for kaprodi users
                if (isKaprodi && (item.id === 1 || item.id === 4)) {
                  // Hide "Data Murid" (id: 1) and "Mata Pelajaran" (id: 4) for kaprodi
                  return null;
                }
                
                // Determine display title based on user role
                let displayTitle = item.title;
                if (item.id === 3 && isKaprodi) {
                  displayTitle = 'Data Jadwal';
                } else if (item.id === 7 && isKaprodi) {
                  displayTitle = 'Data Kelas';
                } else if (item.id === 5 && isKaprodi) {
                  displayTitle = 'Review Jadwal';
                }
                
                // Determine access control props
                const accessProps = {};
                if (item.permissions && item.permissions.length > 0) {
                  accessProps.permissions = item.permissions;
                } else if (item.roles && item.roles.length > 0) {
                  accessProps.roles = item.roles;
                }
                
                return (
                  <ProtectedComponent
                    key={item.id}
                    {...accessProps}
                    showFallback={false}
                  >
                    <TouchableOpacity
                      style={[
                        styles.sidebarMenuItem,
                        selectedIndex === item.id && styles.sidebarMenuItemActive,
                      ]}
                      onPress={() => onItemSelected(item.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.menuItemContent}>
                        <Ionicons
                          name={item.icon}
                          size={20}
                          color={selectedIndex === item.id ? currentTheme.primary : '#333'}
                        />
                        <Text
                          style={[
                            styles.sidebarMenuText,
                            selectedIndex === item.id && { ...styles.sidebarMenuTextActive, color: currentTheme.primary },
                          ]}
                        >
                          {displayTitle}
                        </Text>
                      </View>
                      {item.id === 5 && unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                          <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </ProtectedComponent>
                );
              })}
            </ScrollView>
            
            {/* Settings Section - Only for Admin */}
            {!isKaprodi && (
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Pengaturan</Text>
                
                <ProtectedComponent
                  permission={PermissionService.PERMISSIONS.MANAGE_ADMINS}
                  showFallback={false}
                >
                  <TouchableOpacity
                    style={[
                      styles.settingsMenuItem,
                      selectedIndex === 6 && styles.settingsMenuItemActive,
                    ]}
                    onPress={() => onItemSelected(6)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="settings-outline" size={20} color={selectedIndex === 6 ? currentTheme.primary : '#333'} />
                    <Text style={[
                      styles.settingsMenuText,
                      selectedIndex === 6 && { ...styles.settingsMenuTextActive, color: currentTheme.primary },
                    ]}>Kelola Admin</Text>
                  </TouchableOpacity>
                </ProtectedComponent>
                
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={onLogout}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                  <Text style={[styles.logoutButtonText, { color: '#ff4444' }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Logout Section - Only for Kaprodi */}
            {isKaprodi && (
              <View style={styles.logoutSection}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={onLogout}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                  <Text style={[styles.logoutButtonText, { color: '#ff4444' }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sidebarOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sidebarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sidebarContainer: {
    width: width * 0.75,
    maxWidth: 300,
    height: '100%',
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  closeSidebarButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 10,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e6ecf0',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    minHeight: 22,
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    marginTop: 1,
  },
  profileUsername: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#657786',
  },
  sidebarMenu: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#657786',
    marginTop: 20,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sidebarMenuItemActive: {
    backgroundColor: 'rgba(29, 161, 242, 0.1)',
  },
  sidebarMenuText: {
    marginLeft: 16,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#333',
  },
  sidebarMenuTextActive: {
    color: '#1DA1F2', // Will be overridden by dynamic inline style
    fontFamily: 'Nunito_700Bold',
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e6ecf0',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#657786',
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingsItem: {
    paddingVertical: 12,
  },
  settingsItemText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#333',
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  settingsMenuItemActive: {
    backgroundColor: 'rgba(29, 161, 242, 0.1)',
  },
  settingsMenuText: {
    marginLeft: 16,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#333',
  },
  settingsMenuTextActive: {
    color: '#1DA1F2', // Will be overridden by dynamic inline style
    fontFamily: 'Nunito_700Bold',
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e6ecf0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    marginLeft: 16,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
  },
  notificationBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
