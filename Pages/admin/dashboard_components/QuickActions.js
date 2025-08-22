import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import AuthService from '../../../services/AuthService';
import PermissionService from '../../../services/PermissionService';

const primaryColor = 'rgb(43, 123, 186)';

// Define all available actions with their required permissions
const allActions = [
  { id: 1, title: 'Kelola Murid', kaprodiTitle: 'Data Murid', icon: 'people-outline', color: '#4F46E5', gradientColors: ['#4F46E5', '#6366F1'], permissions: [PermissionService.PERMISSIONS.MANAGE_STUDENTS, PermissionService.PERMISSIONS.VIEW_USERS] },
  { id: 2, title: 'Kelola Guru', kaprodiTitle: 'Data Guru', icon: 'school-outline', color: '#059669', gradientColors: ['#059669', '#10B981'], permissions: [PermissionService.PERMISSIONS.MANAGE_TEACHERS, PermissionService.PERMISSIONS.VIEW_USERS] },
  { id: 3, title: 'Jadwal', kaprodiTitle: 'Data Jadwal', icon: 'calendar-outline', color: '#DC2626', gradientColors: ['#DC2626', '#EF4444'], permissions: [PermissionService.PERMISSIONS.MANAGE_SCHEDULE, PermissionService.PERMISSIONS.VIEW_SCHEDULE] },
  { id: 4, title: 'Kelola Mapel', kaprodiTitle: 'Data Mapel', icon: 'book-outline', color: '#7C3AED', gradientColors: ['#7C3AED', '#8B5CF6'], permissions: [PermissionService.PERMISSIONS.MANAGE_SUBJECTS, PermissionService.PERMISSIONS.VIEW_CURRICULUM] },
  { id: 5, title: 'Laporan', kaprodiTitle: 'Review Jadwal', icon: 'document-text-outline', color: '#F59E0B', gradientColors: ['#F59E0B', '#FBBF24'], permissions: [PermissionService.PERMISSIONS.VIEW_ACADEMIC_REPORTS, PermissionService.PERMISSIONS.GENERATE_REPORTS] },
  { id: 6, title: 'Kelola Kelas', kaprodiTitle: 'Data Kelas', icon: 'layers-outline', color: '#8B5A2B', gradientColors: ['#8B5A2B', '#A0662F'], permissions: [PermissionService.PERMISSIONS.MANAGE_CLASSES, PermissionService.PERMISSIONS.VIEW_CLASSES] },
  { id: 8, title: 'Kelola Admin', kaprodiTitle: 'Kelola Admin', icon: 'settings-outline', color: '#6B46C1', gradientColors: ['#6B46C1', '#7C3AED'], permissions: [PermissionService.PERMISSIONS.MANAGE_ADMINS] },
];

const ActionCard = ({ item, onQuickAction }) => (
  <TouchableOpacity 
    style={[styles.actionCard, { borderLeftColor: item.color }]}
    onPress={() => onQuickAction(item.id)}
    activeOpacity={0.7}
  >
    <View style={styles.cardContent}>
      <LinearGradient
        colors={item.gradientColors}
        style={styles.iconContainer}
      >
        <Ionicons name={item.icon} size={18} color="#fff" />
      </LinearGradient>
      <View style={styles.textContainer}>
        <Text style={styles.actionText}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </View>
    <LinearGradient
      colors={item.gradientColors}
      style={styles.cardAccent}
    />
  </TouchableOpacity>
);

export default function QuickActions({ onQuickAction }) {
  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filterActions = async () => {
      try {
        // Debug: Get current user and log details
        const currentUser = await AuthService.getCurrentUser();
        const userRole = await PermissionService.getCurrentUserRole();
        const isKaprodi = userRole === PermissionService.ROLES.KAPRODI_TKJ || userRole === PermissionService.ROLES.KAPRODI_TKR;
        
        
      
        
        const filteredActions = [];
        
        // Define priority actions for Kaprodi users (most important for program management)
        const kaprodiPriorityActions = [2, 3, 5, 6]; // Data Guru, Data Jadwal, Review Jadwal, Data Kelas
        
        for (const action of allActions) {
          
          // Special handling for "Kelola Admin" - only for super admin
          if (action.id === 8) { // "Kelola Admin" action
            if (userRole === PermissionService.ROLES.SUPER_ADMIN) {
              filteredActions.push(action);
            }
            continue;
          }
          
          // For Kaprodi users, only show priority actions (skip Murid and Mapel)
          if (isKaprodi && !kaprodiPriorityActions.includes(action.id)) {
            continue;
          }
          
          // Check if user has any of the required permissions for this action
          let hasAccess = false;
          
          for (const permission of action.permissions) {
            const hasPermission = await PermissionService.hasPermission(permission);
            
            if (hasPermission) {
              hasAccess = true;
              break;
            }
          }
          
          if (hasAccess) {
            // Create a copy of the action and modify the title for Kaprodi users
            const actionCopy = { ...action };
            if (isKaprodi && action.kaprodiTitle) {
              actionCopy.title = action.kaprodiTitle;
            }
            filteredActions.push(actionCopy);
          }
        }
        
        
        setActionItems(filteredActions);
      } catch (error) {
        console.error('Error filtering actions:', error);
        // Fallback to show basic actions for admin
        setActionItems(allActions.slice(0, 4));
      } finally {
        setLoading(false);
      }
    };

    filterActions();
  }, []);

  if (!fontsLoaded || loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aksi Cepat</Text>
      <View style={styles.grid}>
        {actionItems.map(item => (
          <ActionCard key={item.id} item={item} onQuickAction={onQuickAction} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderLeftWidth: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#2d3748',
    flex: 1,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 3,
    height: '100%',
    zIndex: 1,
  },
});
