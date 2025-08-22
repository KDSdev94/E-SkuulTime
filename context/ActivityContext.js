import React, { createContext, useContext, useEffect, useState } from 'react';
import ActivityService from '../services/ActivityService';

const ActivityContext = createContext();

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    let timeoutId;

    const setupActivityListener = async () => {
      try {
        setLoading(true);
        setError(null);
        
        timeoutId = setTimeout(() => {
          const fallbackActivities = [
            {
              id: '1',
              type: 'SYSTEM',
              action: 'INFO',
              title: 'Sistem aktivitas dimuat',
              description: 'Sistem pencatatan aktivitas berhasil diinisialisasi',
              icon: 'checkmark-circle-outline',
              color: '#10B981',
              adminName: 'System',
              timestamp: new Date().toISOString()
            }
          ];
          setActivities(fallbackActivities);
          setLoading(false);
        }, 5000);
        
        unsubscribe = ActivityService.subscribeToActivities((newActivities) => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          const updatedActivities = newActivities.map(activity => {
    const text = (activity.title || '').toLowerCase();
            if (text.includes('murid')) {
              return { ...activity, icon: 'people-outline', color: '#4F46E5' };
            } else if (text.includes('guru')) {
              return { ...activity, icon: 'school-outline', color: '#059669' };
            } else if (text.includes('jadwal')) {
              return { ...activity, icon: 'calendar-outline', color: '#DC2626' };
            }
            return { ...activity, icon: 'information-circle-outline', color: '#7C3AED' };
          });
          setActivities(updatedActivities);
          setLoading(false);
          setError(null);
        });
        
      } catch (err) {
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        setError(err.message);
        setLoading(false);
        
        const fallbackActivities = [
          {
            id: '1',
            type: 'SYSTEM',
            action: 'ERROR',
            title: 'Error memuat aktivitas',
            description: 'Menggunakan data fallback. Periksa koneksi Firebase.',
            icon: 'alert-circle-outline',
            color: '#EF4444',
            adminName: 'System',
            timestamp: new Date().toISOString()
          }
        ];
        setActivities(fallbackActivities);
      }
    };

    setupActivityListener();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing from activities:', err);
        }
      }
    };
  }, []);

  const logActivity = async (activityData) => {
    try {
      const result = await ActivityService.logActivity(activityData);
      return result;
    } catch (error) {
      
      return { success: false, error: error.message };
    }
  };

  const logMuridActivity = async (action, muridData, adminName) => {
    return await ActivityService.logMuridActivity(action, muridData, adminName);
  };

  const logGuruActivity = async (action, guruData, adminName) => {
    return await ActivityService.logGuruActivity(action, guruData, adminName);
  };

  const logJadwalActivity = async (action, jadwalData, adminName) => {
    return await ActivityService.logJadwalActivity(action, jadwalData, adminName);
  };

  const formatTimeAgo = (timestamp) => {
    return ActivityService.formatTimeAgo(timestamp);
  };

  const value = {
    activities,
    loading,
    error,
    logActivity,
    logMuridActivity,
    logGuruActivity,
    logJadwalActivity,
    formatTimeAgo,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};

export default ActivityContext;
