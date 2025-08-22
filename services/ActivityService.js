import app, { database } from '../config/firebase.node.js';
import { ref, push, set, onValue, off, query, orderByChild, limitToLast, remove, get } from 'firebase/database';

class ActivityService {
  constructor() {
    this.activitiesRef = ref(database, 'activities');
    this.MAX_ACTIVITIES = 3; // Maksimal 3 aktivitas
  }

  async logActivity(activityData) {
    try {
      const timestamp = new Date().toISOString();
      const activity = {
        ...activityData,
        timestamp,
        id: Date.now().toString(),
      };

      const newActivityRef = push(this.activitiesRef);
      await set(newActivityRef, activity);
      
      await this.cleanupExcessActivities();
      
      return { success: true, activity };
    } catch (error) {
      
      return { success: false, error: error.message };
    }
  }

  async cleanupExcessActivities() {
    try {
      const snapshot = await get(this.activitiesRef);
      
      if (snapshot.exists()) {
        const activities = [];
        snapshot.forEach((childSnapshot) => {
          const activityData = childSnapshot.val();
          activities.push({
            key: childSnapshot.key,
            timestamp: activityData.timestamp,
            numericId: parseInt(activityData.id) || 0
          });
        });
        
        activities.sort((a, b) => {
          const timestampA = new Date(a.timestamp).getTime();
          const timestampB = new Date(b.timestamp).getTime();
          
          if (timestampB !== timestampA) {
            return timestampB - timestampA;
          }
          
          return b.numericId - a.numericId;
        });
        
        if (activities.length > this.MAX_ACTIVITIES) {
          const activitiesToDelete = activities.slice(this.MAX_ACTIVITIES);
          
          for (const activity of activitiesToDelete) {
            try {
              await remove(ref(database, `activities/${activity.key}`));
            } catch (deleteError) {
              
            }
          }
        }
      }
    } catch (error) {
      
    }
  }

  subscribeToActivities(callback, limit = 3) {
    try {
      const unsubscribe = onValue(this.activitiesRef, 
        (snapshot) => {
          const activities = [];
          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const activityData = childSnapshot.val();
              activities.push({
                id: childSnapshot.key,
                ...activityData,
                numericId: parseInt(activityData.id) || 0
              });
            });
            
            activities.sort((a, b) => {
              const timestampA = new Date(a.timestamp).getTime();
              const timestampB = new Date(b.timestamp).getTime();
              
              if (timestampB !== timestampA) {
                return timestampB - timestampA;
              }
              
              return b.numericId - a.numericId;
            });
            
            const limitedActivities = activities.slice(0, limit);
            callback(limitedActivities);
          } else {
            callback([]);
          }
        },
        (error) => {
          console.error('Error in activities listener:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to activities:', error);
      callback([]);
      return () => {}; // Return empty function instead of null
    }
  }

  unsubscribeFromActivities(unsubscribe) {
    if (unsubscribe && typeof unsubscribe === 'function') {
      try {
        unsubscribe();
      } catch (error) {
        
      }
    }
  }

  async logMuridActivity(action, muridData, adminName = 'Admin') {
    try {
      console.log('ActivityService.logMuridActivity called with:', {
        action,
        muridData: muridData ? {
          nis: muridData.nis,
          namaLengkap: muridData.namaLengkap,
          kelas: muridData.kelas
        } : null,
        adminName
      });

      // Skip activity logging if data is not safe
      if (!muridData || !action) {
        console.log('ActivityService.logMuridActivity - Skipping due to invalid data');
        return { success: false, error: 'Invalid data' };
      }

      // Safe getter for student data with extensive validation
      const getNamaLengkap = (data) => {
        if (!data) return 'Unknown';
        const name = data.namaLengkap;
        if (!name) return 'Unknown';
        if (typeof name === 'string') return name;
        if (typeof name === 'number') return name.toString();
        return 'Unknown';
      };
      
      const getKelas = (data) => {
        if (!data) return 'Unknown';
        const kelas = data.kelas;
        if (!kelas) return 'Unknown';
        if (typeof kelas === 'string') return kelas;
        if (typeof kelas === 'number') return kelas.toString();
        return 'Unknown';
      };

      const namaLengkap = getNamaLengkap(muridData);
      const kelas = getKelas(muridData);

      console.log('ActivityService.logMuridActivity - Processed names:', { namaLengkap, kelas });

      const activityTypes = {
        'CREATE': {
          icon: 'person-add-outline',
          color: '#10B981',
          title: `Menambahkan murid baru: ${namaLengkap}`,
          description: `Murid ${namaLengkap} (${kelas}) berhasil ditambahkan`
        },
        'UPDATE': {
          icon: 'create-outline',
          color: '#F59E0B',
          title: `Memperbarui data murid: ${namaLengkap}`,
          description: `Data murid ${namaLengkap} berhasil diperbarui`
        },
        'DELETE': {
          icon: 'trash-outline',
          color: '#EF4444',
          title: `Menghapus murid: ${namaLengkap}`,
          description: `Murid ${namaLengkap} berhasil dihapus dari sistem`
        }
      };

      const activityType = activityTypes[action];
      if (!activityType) {
        console.log('ActivityService.logMuridActivity - Invalid action:', action);
        return { success: false, error: 'Invalid action' };
      }

      // Create safe data object for logging
      const safeData = {
        nis: muridData.nis ? muridData.nis.toString() : '',
        namaLengkap: namaLengkap,
        kelas: kelas
      };

      const activityData = {
        type: 'MURID',
        action: action.toString(),
        adminName: adminName ? adminName.toString() : 'Admin',
        ...activityType,
        data: safeData
      };

      console.log('ActivityService.logMuridActivity - Activity data prepared:', activityData);

      return await this.logActivity(activityData);

    } catch (error) {
      console.error('Error in logMuridActivity:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        action,
        muridData: muridData ? Object.keys(muridData) : null,
        adminName
      });
      return { success: false, error: error.message };
    }
  }

  async logGuruActivity(action, guruData, adminName = 'Admin') {
    const activityTypes = {
      'CREATE': {
        icon: 'school-outline',
        color: '#8B5CF6',
        title: `Menambahkan guru baru: ${guruData.namaLengkap}`,
        description: `Guru ${guruData.namaLengkap} (${guruData.mataPelajaran}) berhasil ditambahkan`
      },
      'UPDATE': {
        icon: 'create-outline',
        color: '#F59E0B',
        title: `Memperbarui data guru: ${guruData.namaLengkap}`,
        description: `Data guru ${guruData.namaLengkap} berhasil diperbarui`
      },
      'DELETE': {
        icon: 'trash-outline',
        color: '#EF4444',
        title: `Menghapus guru: ${guruData.namaLengkap}`,
        description: `Guru ${guruData.namaLengkap} berhasil dihapus dari sistem`
      }
    };

    const activityType = activityTypes[action];
    if (!activityType) return;

    return await this.logActivity({
      type: 'GURU',
      action,
      adminName,
      ...activityType,
      data: guruData
    });
  }

  async logJadwalActivity(action, jadwalData, adminName = 'Admin') {
    const activityTypes = {
      'CREATE': {
        icon: 'calendar-outline',
        color: '#06B6D4',
        title: `Menambahkan jadwal baru`,
        description: `Jadwal ${jadwalData.namaMataPelajaran || jadwalData.mataPelajaran || 'Tidak diketahui'} untuk kelas ${jadwalData.namaKelas || jadwalData.kelas || 'Tidak diketahui'} berhasil ditambahkan`
      },
      'UPDATE': {
        icon: 'create-outline',
        color: '#F59E0B',
        title: `Memperbarui jadwal`,
        description: `Jadwal ${jadwalData.namaMataPelajaran || jadwalData.mataPelajaran || 'Tidak diketahui'} untuk kelas ${jadwalData.namaKelas || jadwalData.kelas || 'Tidak diketahui'} berhasil diperbarui`
      },
      'DELETE': {
        icon: 'trash-outline',
        color: '#EF4444',
        title: `Menghapus jadwal`,
        description: `Jadwal ${jadwalData.namaMataPelajaran || jadwalData.mataPelajaran || 'Tidak diketahui'} untuk kelas ${jadwalData.namaKelas || jadwalData.kelas || 'Tidak diketahui'} berhasil dihapus`
      }
    };

    const activityType = activityTypes[action];
    if (!activityType) return;

    return await this.logActivity({
      type: 'JADWAL',
      action,
      adminName,
      ...activityType,
      data: jadwalData
    });
  }

  formatTimeAgo(timestamp) {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);

    if (diffInSeconds < 60) {
      return 'Baru saja';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} menit lalu`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} jam lalu`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} hari lalu`;
    }
  }

  async cleanOldActivities(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
    } catch (error) {
      
    }
  }
}

export default new ActivityService();

