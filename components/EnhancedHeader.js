import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Switch,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

const { width: screenWidth } = Dimensions.get('window');

const EnhancedHeader = ({ 
  title, 
  userData, 
  onLogout, 
  theme,
  showBackButton = false,
  onBackPress,
  onProfilePress 
}) => {
  const [showSettings, setShowSettings] = useState(false);
const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const SettingsModal = () => (
    <Modal
      visible={showSettings}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pengaturan</Text>
              <TouchableOpacity
                onPress={() => setShowSettings(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={20} color={theme.primary} />
                <Text style={styles.settingLabel}>Mode Gelap</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#767577', true: theme.primary }}
                thumbColor={darkMode ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-high-outline" size={20} color={theme.primary} />
                <Text style={styles.settingLabel}>Suara</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#767577', true: theme.primary }}
                thumbColor={soundEnabled ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity style={styles.settingItem} onPress={onProfilePress}>
              <View style={styles.settingLeft}>
                <Ionicons name="person-outline" size={20} color={theme.primary} />
                <Text style={styles.settingLabel}>Profil Saya</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={onLogout}>
              <View style={styles.settingLeft}>
                <Ionicons name="log-out-outline" size={20} color="#ff4d4f" />
                <Text style={[styles.settingLabel, { color: '#ff4d4f' }]}>Keluar</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ff4d4f" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <LinearGradient
        colors={[theme.primary, theme.primaryLight, theme.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        <View style={styles.headerContent}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.profileButton}
              onPress={onProfilePress}
              activeOpacity={0.7}
            >
              <View style={styles.profileContainer}>
                <View style={styles.avatarContainer}>
                  {userData?.profileImage || userData?.fotoUrl ? (
                    <Image 
                      source={{ uri: userData?.profileImage || userData?.fotoUrl }}
                      style={styles.profileImage}
                      onError={() => {
                        // Fallback ke placeholder jika gambar error
                      }}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>
                        {(userData?.namaLengkap || userData?.nama || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.welcomeText}>Selamat Datang,</Text>
                  <Text style={styles.userName} numberOfLines={1}>
                    {userData?.namaLengkap || userData?.nama || 'User'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Center Section - Title */}
          <View style={styles.centerSection}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>

          {/* Right Section */}
          <View style={styles.rightSection}>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSettings(true)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <SettingsModal />
    </>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  circle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -30,
  },
  circle2: {
    width: 80,
    height: 80,
    top: 30,
    left: -20,
  },
  circle3: {
    width: 60,
    height: 60,
    bottom: -10,
    right: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  backButton: {
    marginRight: 8,
  },
  profileButton: {
    marginRight: 8,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarInitials: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
    textAlign: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    maxWidth: screenWidth * 0.3,
  },
  welcomeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Nunito_400Regular',
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
    textAlign: 'center',
  },
  actionButton: {
    marginLeft: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4d4f',
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#1e293b',
    marginLeft: 12,
  },
});

export default EnhancedHeader;
