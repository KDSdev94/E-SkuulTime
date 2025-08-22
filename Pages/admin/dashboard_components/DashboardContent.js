import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import {
  useFonts,
  Nunito_500Medium,
} from '@expo-google-fonts/nunito';
import WelcomeCard from './WelcomeCard';
import StatisticsCards from './StatisticsCards';
import QuickActions from './QuickActions';
import RecentActivities from './RecentActivities';


const { width } = Dimensions.get('window');

export default function DashboardContent({ dashboardStats, isLoading, onQuickAction, userRole }) {
  let [fontsLoaded] = useFonts({
    Nunito_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  const isMobile = width < 768;
  const padding = isMobile ? 12 : 16;
  const spacing = isMobile ? 12 : 16;

  return (
    <ScrollView 
      style={styles.dashboardContent}
      contentContainerStyle={{ padding }}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Card */}
      <WelcomeCard />
      
      <View style={{ height: spacing }} />
      
      {/* Statistics Cards */}
      <StatisticsCards dashboardStats={dashboardStats} userRole={userRole} />
      <View style={{ height: spacing }} />
      <QuickActions onQuickAction={onQuickAction} />
      <View style={{ height: spacing }} />
      <RecentActivities />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dashboardContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
  },
  placeholder: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#6c757d',
    textAlign: 'center',
  },
});
