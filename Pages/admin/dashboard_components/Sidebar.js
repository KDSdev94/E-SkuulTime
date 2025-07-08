import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_500Medium,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

const { width } = Dimensions.get('window');

const logo = require('../../../assets/logo/logo_nobg.png');
const adminImage = require('../../../assets/logo/admin.png');

const menuItems = [
  { id: 0, title: 'Dashboard', icon: 'home-outline' },
  { id: 1, title: 'Data Murid', icon: 'people-outline' },
  { id: 2, title: 'Data Guru', icon: 'school-outline' },
  { id: 3, title: 'Jadwal Pelajaran', icon: 'calendar-outline' },
  { id: 4, title: 'Data Kelas', icon: 'library-outline' },
  { id: 5, 'title': 'Admin Settings', icon: 'settings-outline' },
  { id: 7, title: 'Laporan', icon: 'document-text-outline' },
];

export default function AdminSidebar({ 
  visible, 
  onClose, 
  selectedIndex, 
  onItemSelected, 
  onLogout 
}) {
  const sidebarWidth = width * 0.75;
  const slideAnim = useRef(new Animated.Value(sidebarWidth)).current;

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
              <Image 
                source={adminImage} 
                style={styles.profileImage}
              />
              <View style={styles.profileNameContainer}>
                <Text style={styles.profileName}>Admin</Text>
                <Ionicons name="shield-checkmark" size={18} color="#1DA1F2" style={{ marginLeft: 8 }} />
              </View>
              <Text style={styles.profileUsername}>@admin_simara</Text>

            </View>
            
            {/* Main Menu */}
            <ScrollView style={styles.sidebarMenu}>
              <Text style={styles.menuSectionTitle}>Menu Utama</Text>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.sidebarMenuItem,
                    selectedIndex === item.id && styles.sidebarMenuItemActive,
                  ]}
                  onPress={() => onItemSelected(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={selectedIndex === item.id ? '#1DA1F2' : '#333'}
                  />
                  <Text
                    style={[
                      styles.sidebarMenuText,
                      selectedIndex === item.id && styles.sidebarMenuTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Settings Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Pengaturan & Dukungan</Text>
              <TouchableOpacity style={styles.settingsItem}>
                <Text style={styles.settingsItemText}>Pengaturan dan privasi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={onLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                <Text style={[styles.logoutButtonText, { color: '#ff4444' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
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
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
  },
  profileUsername: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#657786',
  },
  sidebarMenu: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#657786',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
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
    color: '#1DA1F2',
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
});