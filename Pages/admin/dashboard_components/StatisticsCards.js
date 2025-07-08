import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

const StatCard = ({ icon, title, value, subtitle, iconColor, gradientColors }) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={gradientColors || [iconColor, iconColor]}
            style={styles.iconGradient}
          >
            <Ionicons name={icon} size={22} color="#fff" />
          </LinearGradient>
        </View>
        <View style={styles.textContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardValue}>{value}</Text>
          <View style={styles.subtitleContainer}>
            <Ionicons name="trending-up" size={12} color="#4CAF50" />
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardDecoration} />
    </View>
  );
};

export default function StatisticsCards({ dashboardStats }) {
  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const primaryColor = 'rgb(43, 123, 186)';

  return (
    <View style={styles.container}>
      <StatCard
        icon="people-outline"
        title="Total Murid"
        value={dashboardStats.totalMurid || 0}
        subtitle={`${dashboardStats.muridAktif || 0} Aktif`}
        iconColor={primaryColor}
        gradientColors={['#667eea', '#764ba2']}
      />
      <View style={{ width: 16 }} />
      <StatCard
        icon="school-outline"
        title="Total Guru"
        value={dashboardStats.totalGuru || 0}
        subtitle={`${dashboardStats.guruAktif || 0} Aktif`}
        iconColor={primaryColor}
        gradientColors={['#f093fb', '#f5576c']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  cardContent: {
    zIndex: 2,
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: '#4CAF50',
    marginLeft: 4,
  },
  cardDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    zIndex: 1,
  },
});
