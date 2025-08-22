import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const NotificationCard = ({ 
  notification, 
  onPress, 
  onMarkAsRead,
  userDepartment = 'TKJ' // TKJ atau TKR
}) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDepartmentColor = () => {
    return userDepartment === 'TKJ' ? '#3B82F6' : '#10B981';
  };

  const getDepartmentGradient = () => {
    return userDepartment === 'TKJ' 
      ? ['#3B82F6', '#60A5FA'] 
      : ['#10B981', '#34D399'];
  };

  const getNotificationIcon = () => {
    if (notification.message?.includes('laporan jadwal')) {
      return 'document-text-outline';
    } else if (notification.message?.includes('disetujui')) {
      return 'checkmark-circle-outline';
    } else if (notification.message?.includes('ditolak')) {
      return 'close-circle-outline';
    }
    return 'notifications-outline';
  };

  const isReportNotification = notification.message?.includes('laporan jadwal');
  const isFromAdmin = notification.message?.includes('telah dikirim untuk persetujuan');
  const senderName = isFromAdmin ? 'Admin' : notification.senderName || 'Sistem';

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { borderLeftColor: getDepartmentColor() },
        !notification.read && styles.unreadCard
      ]}
      onPress={() => onPress && onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Icon dengan gradient sesuai jurusan */}
        <LinearGradient
          colors={getDepartmentGradient()}
          style={styles.iconContainer}
        >
          <Ionicons 
            name={getNotificationIcon()} 
            size={24} 
            color="#fff" 
          />
        </LinearGradient>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.senderText}>
                {senderName}
              </Text>
              {!notification.read && (
                <View style={[styles.unreadDot, { backgroundColor: getDepartmentColor() }]} />
              )}
            </View>
            <Text style={styles.timeText}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>

          {/* Message */}
          <Text style={styles.messageText} numberOfLines={3}>
            {notification.message}
          </Text>

          {/* Jurusan badge untuk laporan jadwal */}
          {isReportNotification && (
            <View style={styles.badgeContainer}>
              <View style={[styles.jurusanBadge, { backgroundColor: getDepartmentColor() }]}>
                <Text style={styles.jurusanBadgeText}>
                  Jurusan {userDepartment}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionContainer}>
          {!notification.read && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: getDepartmentColor() }]}
              onPress={() => onMarkAsRead && onMarkAsRead(notification.id)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.chevronButton}
            onPress={() => onPress && onPress(notification)}
          >
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  jurusanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jurusanBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  actionContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  chevronButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationCard;
