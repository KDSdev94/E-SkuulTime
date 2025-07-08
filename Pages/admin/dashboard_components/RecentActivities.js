import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

const primaryColor = 'rgb(43, 123, 186)';

const activities = [
  {
    id: 1,
    icon: 'people-outline',
    color: primaryColor,
    title: 'Pembaruan Data Murid',
    time: '2 menit lalu',
  },
  {
    id: 2,
    icon: 'school-outline',
    color: primaryColor,
    title: 'Profil Guru Diperbarui',
    time: '15 menit lalu',
  },
  {
    id: 3,
    icon: 'calendar-outline',
    color: primaryColor,
    title: 'Jadwal Mingguan Diterbitkan',
    time: '1 jam lalu',
  },
  {
    id: 4,
    icon: 'sync-outline',
    color: primaryColor,
    title: 'Sinkronisasi Data Selesai',
    time: '2 jam lalu',
  },
  {
    id: 5,
    icon: 'checkmark-circle-outline',
    color: primaryColor,
    title: 'Backup Data Selesai',
    time: '3 jam lalu',
  }
];

const ActivityItem = ({ item, index }) => (
  <View style={styles.activityItem}>
    <View style={styles.activityContent}>
      <View style={[styles.iconContainer, { backgroundColor: item.color.replace('rgb', 'rgba').replace(')', ', 0.15)') }]}>
        <Ionicons name={item.icon} size={16} color={item.color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={12} color="#999" />
          <Text style={styles.activityTime}>{item.time}</Text>
        </View>
      </View>
      <View style={styles.statusIndicator}>
        <View style={[styles.statusDot, { backgroundColor: item.color }]} />
      </View>
    </View>
    {index < 4 && <View style={styles.separator} />}
  </View>
);

export default function RecentActivities() {
  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Aktivitas Terbaru</Text>
        <Ionicons name="refresh" size={20} color="#666" />
      </View>
      <View style={styles.activitiesContainer}>
        {activities.map((activity, index) => (
          <ActivityItem key={activity.id} item={activity} index={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1a1a1a',
  },
  activitiesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  activityItem: {
    marginBottom: 8,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#718096',
    marginLeft: 4,
  },
  statusIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#f7fafc',
    marginLeft: 44,
  },
});
