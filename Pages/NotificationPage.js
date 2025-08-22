import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from '../services/notificationService';
import { getNotificationPageTitle } from '../utils/roleUtils';


const getNotificationIcon = (message) => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('jadwal')) return 'calendar';
  if (lowerMessage.includes('murid')) return 'person-add';
  if (lowerMessage.includes('guru')) return 'people';
  if (lowerMessage.includes('data')) return 'person';
  if (lowerMessage.includes('mata pelajaran') || lowerMessage.includes('mapel')) return 'book';
  if (lowerMessage.includes('profil')) return 'person-circle';
  if (lowerMessage.includes('update') || lowerMessage.includes('perbarui')) return 'refresh';
  if (lowerMessage.includes('tambah') || lowerMessage.includes('ditambah')) return 'add-circle';
  if (lowerMessage.includes('hapus') || lowerMessage.includes('dihapus')) return 'trash';
  return 'notifications';
};

const getNotificationColor = (message) => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('jadwal')) return '#3B82F6'; // Blue
  if (lowerMessage.includes('murid')) return '#10B981'; // Green
  if (lowerMessage.includes('guru')) return '#8B5CF6'; // Purple
  if (lowerMessage.includes('data')) return '#6B7280'; // Gray
  if (lowerMessage.includes('mata pelajaran') || lowerMessage.includes('mapel')) return '#F59E0B'; // Orange
  if (lowerMessage.includes('profil')) return '#06B6D4'; // Cyan
  if (lowerMessage.includes('update') || lowerMessage.includes('perbarui')) return '#3B82F6'; // Blue
  if (lowerMessage.includes('tambah') || lowerMessage.includes('ditambah')) return '#10B981'; // Green
  if (lowerMessage.includes('hapus') || lowerMessage.includes('dihapus')) return '#EF4444'; // Red
  return '#3B82F6'; // Default blue
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Waktu tidak tersedia';
  
  let date;
  if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp && timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return 'Waktu tidak tersedia';
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  
  return date.toLocaleDateString('id-ID');
};

const NotificationItem = ({ item, index, isLast, onDelete }) => {
  const color = getNotificationColor(item.message);

  const handleDelete = () => {
    onDelete(item.id);
  };

  return (
    <View 
      style={[
        styles.notificationCard,
        !item.read && styles.unreadCard,
        isLast && styles.lastCard,
      ]}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons 
            name={getNotificationIcon(item.message)} 
            size={20} 
            color={color} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[
            styles.notificationMessage,
            !item.read && styles.unreadMessage
          ]}>
            {item.message}
          </Text>
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationTime}>
              {formatTimestamp(item.createdAt)}
            </Text>
            {item.senderName && (
              <Text style={styles.senderText}>
                dari {item.senderName}
              </Text>
            )}
          </View>
        </View>
        
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: color }]} />
        )}
        
        {/* Delete icon */}
        <TouchableOpacity 
          style={styles.quickDeleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const NotificationPage = ({ navigation, route, onGoBack }) => {
  const { notifications = [], userId, onRefresh, userType } = route?.params || {};
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    if (notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => !n.read);
      unreadNotifications.forEach(notification => {
        markAsRead(notification.id);
      });
    }
  }, [notifications]);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      // Navigate back to the appropriate dashboard
      if (navigation) {
        if (navigation.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
        } else {
          // If we can't go back, navigate to the appropriate dashboard
          if (userType === 'guru') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'GuruDashboard' }]
            });
          } else if (userType === 'murid') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MuridDashboard' }]
            });
          } else if (userType === 'admin') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'AdminDashboard' }]
            });
          } else {
            // Fallback to login if userType is unknown
            navigation.reset({
              index: 0,
              routes: [{ name: 'PilihLogin' }]
            });
          }
        }
      } else if (onGoBack) {
        onGoBack();
      }
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation, userType, onGoBack]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };



  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal menghapus notifikasi');
    }
  };

  const handleDeleteAllNotifications = () => {
    Alert.alert(
      'Hapus Semua Notifikasi',
      'Apakah Anda yakin ingin menghapus semua notifikasi?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllNotifications(userId);
              if (onRefresh) {
                onRefresh();
              }
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus semua notifikasi');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => {
    const isLast = index === notifications.length - 1;
    return (
      <NotificationItem 
        item={item} 
        index={index} 
        isLast={isLast} 
        onDelete={handleDeleteNotification}
      />
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>Belum ada notifikasi</Text>
      <Text style={styles.emptySubtitle}>
        Notifikasi akan muncul di sini ketika ada update baru
      </Text>
    </View>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

const getHeaderGradient = () => {
    if (userType === 'admin') {
      return ['#1E3A8A', '#3B82F6', '#6366F1']; // Admin - Blue gradient
    } else if (userType === 'guru') {
      return ['#7C3AED', '#A855F7', '#C084FC']; // Guru - Purple gradient
    } else if (userType === 'kaprodi_tkj' || userType === 'kaprodi_tkr' || userType === 'kaprodi') {
      return ['#C70039', '#FF5733', '#FF8C69']; // Kaprodi - Red gradient
    } else {
      return ['#059669', '#10B981', '#34D399']; // Murid - Green gradient
    }
  };

const getStatusBarColor = () => {
    if (userType === 'admin') {
      return '#1E3A8A'; // Admin - Dark blue
    } else if (userType === 'guru') {
      return '#7C3AED'; // Guru - Dark purple
    } else if (userType === 'kaprodi_tkj' || userType === 'kaprodi_tkr' || userType === 'kaprodi') {
      return '#C70039'; // Kaprodi - Dark red
    } else {
      return '#059669'; // Murid - Dark green
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={getStatusBarColor()} hidden={true} />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={getHeaderGradient()}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
        </View>
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              // Always try to navigate back to the appropriate dashboard
              if (navigation) {
                if (navigation.canGoBack && navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  // If we can't go back, navigate to the appropriate dashboard
                  if (userType === 'guru') {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'GuruDashboard' }]
                    });
                  } else if (userType === 'murid') {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'MuridDashboard' }]
                    });
                  } else if (userType === 'admin') {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'AdminDashboard' }]
                    });
                  } else {
                    // Fallback to login if userType is unknown
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'PilihLogin' }]
                    });
                  }
                }
              } else if (onGoBack) {
                onGoBack();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.title}>
{getNotificationPageTitle(userType)}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {notifications.length > 0 && (
              <TouchableOpacity 
                style={styles.deleteAllButton}
                onPress={handleDeleteAllNotifications}
              >
                <Ionicons name="trash" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            notifications.length === 0 && { flexGrow: 1 }
          ]}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 4,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  markAllButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteAllButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    backgroundColor: '#F8FAFF',
  },
  lastCard: {
    borderBottomWidth: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  quickDeleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  notificationMessage: {
    fontSize: 15,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#1F2937',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  senderText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationPage;
