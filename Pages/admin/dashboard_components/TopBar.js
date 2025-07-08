import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

export default function TopBar({ title, onMenuPress }) {
  // Load Google Fonts
  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
  });

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient
        colors={['rgb(80, 160, 220)', 'rgb(43, 123, 186)', 'rgb(30, 100, 160)']}
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
          {/* Left side buttons - Profile and Notification */}
          <View style={styles.topBarLeft}>
            {/* Profile Avatar */}
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <View style={styles.iconBadgeContainer}>
                <Ionicons name="person-circle-outline" size={26} color="#fff" />
                <View style={styles.onlineIndicator} />
              </View>
            </TouchableOpacity>
            
            {/* Notification Button */}
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <View style={styles.iconBadgeContainer}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.topBarTitle} numberOfLines={1}>{title}</Text>
          </View>
          
          {/* Hamburger Menu Button - Now on the right */}
          <TouchableOpacity
            style={styles.menuButton}
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
    paddingVertical: 8,
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
    height: 50,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    paddingLeft: 16,
  },
  titleContainer: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
    textAlign: 'center',
  },
  iconButton: {
    marginHorizontal: 6,
  },
  iconBadgeContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ff4d4f',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
