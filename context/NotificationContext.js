import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, userId, userType }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const calculateUnreadCount = useCallback((notificationsList) => {
    return notificationsList.filter(notification => !notification.read).length;
  }, []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe = null;

    try {
      // getNotifications returns the unsubscribe function directly, not a promise
      unsubscribe = getNotifications(userId, (notificationsList) => {
        try {
          setNotifications(notificationsList);
          setUnreadCount(calculateUnreadCount(notificationsList));
          setLoading(false);
        } catch (err) {
          console.error('Error processing notifications:', err);
          setError('Gagal memproses notifikasi');
          setLoading(false);
        }
      }, userType);
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setError('Gagal mengambil notifikasi');
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from notifications:', error);
        }
      }
    };
  }, [userId, userType, calculateUnreadCount]);

  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      
      setError('Gagal menandai notifikasi sebagai sudah dibaca');
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await markAllAsRead(userId);
    } catch (error) {
      
      setError('Gagal menandai semua notifikasi sebagai sudah dibaca');
    }
  }, [userId]);

  const getLatestNotifications = useCallback((count = 5) => {
    return notifications.slice(0, count);
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.read);
  }, [notifications]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshNotifications = useCallback(() => {
    if (userId) {
      setLoading(true);
    }
  }, [userId]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getLatestNotifications,
    getUnreadNotifications,
    clearError,
    refreshNotifications,
    
    hasUnreadNotifications: unreadCount > 0,
    totalNotifications: notifications.length,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
