import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { markAsRead, markAllAsRead } from '../services/notificationService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const getNotificationIcon = (message) => {
  // Validasi message untuk mencegah error
  if (!message || typeof message !== 'string') {
    return 'notifications';
  }
  
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('jadwal')) return 'calendar';
  if (lowerMessage.includes('tugas')) return 'document-text';
  if (lowerMessage.includes('ujian')) return 'school';
  if (lowerMessage.includes('nilai')) return 'trophy';
  if (lowerMessage.includes('absen')) return 'checkmark-circle';
  if (lowerMessage.includes('data')) return 'person';
  return 'notifications';
};

const getNotificationColor = (message) => {
  // Validasi message untuk mencegah error
  if (!message || typeof message !== 'string') {
    return '#3B82F6'; // Default blue
  }
  
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('jadwal')) return '#3B82F6'; // Blue
  if (lowerMessage.includes('tugas')) return '#F59E0B'; // Orange
  if (lowerMessage.includes('ujian')) return '#EF4444'; // Red
  if (lowerMessage.includes('nilai')) return '#10B981'; // Green
  if (lowerMessage.includes('absen')) return '#8B5CF6'; // Purple
  if (lowerMessage.includes('data')) return '#6B7280'; // Gray
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

const NotificationItem = ({ item, index }) => {
  const itemAnim = useRef(new Animated.Value(0)).current;
  const color = getNotificationColor(item.message);
  
  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.notificationCard,
        !item.read && styles.unreadCard,
        {
          opacity: itemAnim,
          transform: [{
            translateY: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }]
        }
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
          <Text style={styles.notificationTime}>
            {formatTimestamp(item.createdAt)}
          </Text>
        </View>
        
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: color }]} />
        )}
      </View>
    </Animated.View>
  );
};

const NotificationModal = ({ visible, onClose, notifications, userId, userType }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 15,
          mass: 1,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => !n.read);
      unreadNotifications.forEach(notification => {
        markAsRead(notification.id);
      });
    }
  }, [visible, notifications]);

  const renderItem = ({ item, index }) => {
    return <NotificationItem item={item} index={index} />;
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

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>
                {userType === 'admin' ? 'Notifikasi Admin' : 
                 userType === 'murid' ? 'Notifikasi Murid' : 
                 userType === 'guru' ? 'Notifikasi Guru' : 'Notifikasi Kaprodi'}
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              {notifications.some(n => !n.read) && (
                <TouchableOpacity 
                  style={styles.markAllButton} 
                  onPress={() => markAllAsRead(userId)}
                >
                  <Text style={styles.markAllText}>Tandai Semua</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Content */}
          <View style={styles.contentContainer}>
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
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.85,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  markAllButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    backgroundColor: '#FEFEFE',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
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
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
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
    paddingHorizontal: 40,
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

export default NotificationModal;

