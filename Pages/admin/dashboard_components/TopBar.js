import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { getAdminTheme } from '../../../styles/dashboardThemes';
import AuthService from '../../../services/AuthService';
import { isKaprodi } from '../../../utils/roleUtils';
import { useUser } from '../../../context/UserContext';

export default function TopBar({ title, onMenuPress, notifications = [], onNotificationPress, showBackButton = false, onBackPress, userData, onProfilePress }) {
  const [userRole, setUserRole] = useState('');
  const [currentTheme, setCurrentTheme] = useState(null);
  const { user } = useUser(); // Get user data from context
  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
  });

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser.isLoggedIn && currentUser.userData) {
          const role = currentUser.userData.role;
          setUserRole(role);
          const theme = getAdminTheme(role);
          setCurrentTheme(theme);
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        // Default to admin theme
        const theme = getAdminTheme('admin');
        setCurrentTheme(theme);
      }
    };
    getUserRole();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  // Get gradient colors based on theme
  const getGradientColors = () => {
    if (currentTheme) {
      // For kaprodi (red theme)
      if (isKaprodi(userRole)) {
        return [currentTheme.primaryDark, currentTheme.primary, currentTheme.primaryLight];
      }
      // For admin (blue theme)
      return [currentTheme.primaryDark, currentTheme.primary, currentTheme.primaryLight];
    }
    // Default blue gradient
    return ['#1E3A8A', '#3B82F6', '#6366F1'];
  };

  return (
    <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
    >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
        </View>
        
        <View style={styles.topBar}>
          {/* Left Side - Profile and Notifications */}
          <View style={styles.leftSection}>
            {/* Admin Image - Dynamic with fallback */}
            {!showBackButton && (
              <TouchableOpacity 
                style={styles.adminImageContainer}
                onPress={onProfilePress}
                activeOpacity={0.7}
              >
                {user?.profilePicture || user?.fotoUrl ? (
                  <Image 
                    source={{ uri: user.profilePicture || user.fotoUrl }}
                    style={styles.adminImage}
                    onError={() => {
                      console.log('Profile image failed to load in TopBar, using fallback');
                    }}
                  />
                ) : (
                  <Image 
                    source={require('../../../assets/logo/admin.png')}
                    style={styles.adminImage}
                  />
                )}
              </TouchableOpacity>
            )}
            
            {/* Notification or Back Button */}
            <TouchableOpacity
              style={[styles.notificationButton, { marginLeft: 8 }]}
              onPress={showBackButton ? onBackPress : onNotificationPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons 
                  name={showBackButton ? "arrow-back" : "notifications-outline"} 
                  size={28} 
                  color="#fff" 
                />
                {!showBackButton && notifications.filter(n => !n.read).length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{notifications.filter(n => !n.read).length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.topBarTitle}>{title}</Text>
          </View>
          
          {/* Hamburger Menu Button - Right side */}
          <TouchableOpacity
            style={styles.rightButton}
            onPress={onMenuPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="menu" size={28} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  circle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -40,
  },
  circle2: {
    width: 60,
    height: 60,
    top: 20,
    left: -20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    justifyContent: 'flex-start',
  },
  leftButton: {
    width: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  notificationButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  rightButton: {
    width: 100,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    paddingHorizontal: 5,
    minHeight: 44,
  },
  topBarTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  adminImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  adminImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
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
