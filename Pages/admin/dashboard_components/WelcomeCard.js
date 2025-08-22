import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PermissionService from '../../../services/PermissionService';
import AuthService from '../../../services/AuthService';
import { getAdminTheme } from '../../../styles/dashboardThemes';
import { isKaprodi } from '../../../utils/roleUtils';
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

const schoolIcon = require('../../../assets/icon/school.png');

const getCurrentAcademicYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  if (currentMonth >= 7) {
    return `${currentYear}/${currentYear + 1}`;
  } else {
    return `${currentYear - 1}/${currentYear}`;
  }
};

const getCurrentSemester = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (currentMonth >= 1 && currentMonth <= 6) {
    return 'Genap';
  } else {
    return 'Ganjil';
  }
};

export default function WelcomeCard() {
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser.isLoggedIn && currentUser.userData) {
        const role = currentUser.userData.role;
        const name = currentUser.userData.namaLengkap || 'Admin';
        setUserRole(role);
        setUserName(name);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    if (!userRole) return 'Selamat Datang, Admin!';
    
    const roleName = PermissionService.getRoleName(userRole);
    return `Selamat Datang, ${roleName}!`;
  };

  const getUserDisplayName = () => {
    return userName || 'Admin';
  };

  if (!fontsLoaded || loading) {
    return null; // Or a loading placeholder
  }

const currentTheme = getAdminTheme(userRole);
  const gradientColors = isKaprodi(userRole) ? ['#FF5733', '#C70039'] : ['#507FC4', '#2B7BBA'];

  return (
    <LinearGradient
colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <View style={styles.greetingContainer}>
            <Ionicons name="hand-left" size={20} color="#FFD700" style={styles.waveIcon} />
            <Text style={styles.title}>{getWelcomeMessage()}</Text>
          </View>
          <Text style={styles.subtitle}>{getUserDisplayName()}</Text>
          <Text style={styles.schoolName}>SMK Ma'arif NU 1 Wanasari</Text>
          <View style={styles.academicInfo}>
            <Ionicons name="calendar" size={14} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.schoolYear}>Tahun Ajaran {getCurrentAcademicYear()} - Semester {getCurrentSemester()}</Text>
          </View>
        </View>
        
        <Image source={schoolIcon} style={styles.schoolIcon} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: 'rgb(43, 123, 186)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  circle1: {
    width: 100,
    height: 100,
    top: -50,
    right: -30,
  },
  circle2: {
    width: 60,
    height: 60,
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circle3: {
    width: 40,
    height: 40,
    bottom: -20,
    left: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  schoolIcon: {
    width: 48,
    height: 48,
    marginLeft: 16,
  },
  textContainer: {
    flex: 1,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  waveIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 2,
  },
  schoolName: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  academicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolYear: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
  },
  iconContainer: {
    position: 'relative',
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
