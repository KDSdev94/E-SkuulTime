import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { useActivity } from '../../../context/ActivityContext';

const primaryColor = 'rgb(43, 123, 186)';

const getActivityIcon = (title, description) => {
  const text = (title + ' ' + (description || '')).toLowerCase();
  
  if (text.includes('murid') || text.includes('siswa') || text.includes('student')) {
    return { icon: 'people-outline', color: '#4F46E5', gradientColors: ['#4F46E5', '#6366F1'] }; // Indigo for students
  }
  if (text.includes('guru') || text.includes('teacher')) {
    return { icon: 'school-outline', color: '#059669', gradientColors: ['#059669', '#10B981'] }; // Emerald for teachers
  }
  if (text.includes('jadwal') || text.includes('schedule')) {
    return { icon: 'calendar-outline', color: '#DC2626', gradientColors: ['#DC2626', '#EF4444'] }; // Red for schedules
  }
  if (text.includes('notif')) {
    return { icon: 'notifications-outline', color: '#7C3AED', gradientColors: ['#7C3AED', '#8B5CF6'] }; // Violet for notifications
  }
  
  return { icon: 'information-circle-outline', color: primaryColor, gradientColors: [primaryColor, primaryColor] }; // Default
};

const ActivityItem = ({ item, index, totalItems, formatTimeAgo }) => {
  const activityIconData = getActivityIcon(item.title, item.description);
  const iconColor = item.color || activityIconData.color;
  const iconName = item.icon || activityIconData.icon;
  const gradientColors = item.gradientColors || activityIconData.gradientColors || [iconColor, iconColor];
  
  const timeAgo = formatTimeAgo ? formatTimeAgo(item.timestamp) : (item.time || 'Baru saja');
  
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityContent}>
        <LinearGradient
          colors={gradientColors}
          style={styles.iconContainer}
        >
          <Ionicons name={iconName} size={20} color='white' />
        </LinearGradient>
        <View style={styles.textContainer}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.activityDescription}>{item.description}</Text>
          )}
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={12} color="#999" />
            <Text style={styles.activityTime}>{timeAgo}</Text>
          </View>
        </View>
        <View style={styles.statusIndicator}>
          <LinearGradient
            colors={gradientColors}
            style={styles.statusDot}
          />
        </View>
      </View>
      {index < totalItems - 1 && <View style={styles.separator} />}
    </View>
  );
};

export default function RecentActivities() {
  const { activities, loading, error, formatTimeAgo } = useActivity();
  
  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleRefresh = () => {
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Aktivitas Terbaru</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.activitiesContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={primaryColor} />
            <Text style={styles.loadingText}>Memuat aktivitas...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={32} color="#999" />
            <Text style={styles.emptyText}>Belum ada aktivitas</Text>
          </View>
        ) : (
          activities.map((activity, index) => (
            <ActivityItem 
              key={activity.id} 
              item={activity} 
              index={index} 
              totalItems={activities.length}
              formatTimeAgo={formatTimeAgo}
            />
          ))
        )}
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#718096',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#718096',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#EF4444',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#999',
    marginTop: 8,
  },
});
