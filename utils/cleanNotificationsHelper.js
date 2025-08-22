import { database } from '../config/firebase.js';
import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';

export class AppNotificationCleaner {
  
  // Hapus semua notifikasi yang sudah dibaca
  static async deleteReadNotifications() {
    try {
      console.log('🧹 Membersihkan notifikasi yang sudah dibaca...');
      
      const notificationsRef = ref(database, 'notifications');
      const snapshot = await get(notificationsRef);
      const updates = {};
      let count = 0;
      
      snapshot.forEach((childSnapshot) => {
        const notificationData = childSnapshot.val();
        if (notificationData.read === true) {
          updates[`notifications/${childSnapshot.key}`] = null;
          count++;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        console.log(`✅ Berhasil menghapus ${count} notifikasi yang sudah dibaca`);
      } else {
        console.log(`ℹ️  Tidak ada notifikasi yang sudah dibaca`);
      }
      
      return count;
    } catch (error) {
      console.error('❌ Error menghapus notifikasi yang sudah dibaca:', error);
      throw error;
    }
  }

  // Hapus notifikasi lama (berdasarkan tanggal)
  static async deleteOldNotifications(daysOld = 30) {
    try {
      console.log(`🧹 Membersihkan notifikasi yang lebih lama dari ${daysOld} hari...`);
      
      const notificationsRef = ref(database, 'notifications');
      const snapshot = await get(notificationsRef);
      const updates = {};
      let count = 0;
      
      const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      
      snapshot.forEach((childSnapshot) => {
        const notificationData = childSnapshot.val();
        if (notificationData.createdAt && notificationData.createdAt < cutoffDate) {
          updates[`notifications/${childSnapshot.key}`] = null;
          count++;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        console.log(`✅ Berhasil menghapus ${count} notifikasi lama (>${daysOld} hari)`);
      } else {
        console.log(`ℹ️  Tidak ada notifikasi lama yang perlu dihapus`);
      }
      
      return count;
    } catch (error) {
      console.error('❌ Error menghapus notifikasi lama:', error);
      throw error;
    }
  }

  // Hapus notifikasi berdasarkan jenis (type)
  static async deleteNotificationsByType(notificationType) {
    try {
      console.log(`🧹 Membersihkan notifikasi dengan tipe: ${notificationType}`);
      
      const notificationsRef = ref(database, 'notifications');
      const snapshot = await get(notificationsRef);
      const updates = {};
      let count = 0;
      
      snapshot.forEach((childSnapshot) => {
        const notificationData = childSnapshot.val();
        if (notificationData.type === notificationType) {
          updates[`notifications/${childSnapshot.key}`] = null;
          count++;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        console.log(`✅ Berhasil menghapus ${count} notifikasi dengan tipe ${notificationType}`);
      } else {
        console.log(`ℹ️  Tidak ada notifikasi dengan tipe ${notificationType}`);
      }
      
      return count;
    } catch (error) {
      console.error('❌ Error menghapus notifikasi berdasarkan tipe:', error);
      throw error;
    }
  }

  // Hapus notifikasi berdasarkan sender (admin)
  static async deleteNotificationsBySender(senderId, senderType = 'admin') {
    try {
      console.log(`🧹 Membersihkan notifikasi yang dikirim oleh ${senderType}: ${senderId}`);
      
      const notificationsRef = ref(database, 'notifications');
      const snapshot = await get(notificationsRef);
      const updates = {};
      let count = 0;
      
      snapshot.forEach((childSnapshot) => {
        const notificationData = childSnapshot.val();
        if (notificationData.senderId === senderId && notificationData.senderType === senderType) {
          updates[`notifications/${childSnapshot.key}`] = null;
          count++;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        console.log(`✅ Berhasil menghapus ${count} notifikasi yang dikirim oleh ${senderType} ${senderId}`);
      } else {
        console.log(`ℹ️  Tidak ada notifikasi yang ditemukan dari ${senderType} ${senderId}`);
      }
      
      return count;
    } catch (error) {
      console.error('❌ Error menghapus notifikasi berdasarkan sender:', error);
      throw error;
    }
  }

  // Hapus SEMUA notifikasi (HATI-HATI!)
  static async deleteAllNotifications() {
    try {
      console.log('⚠️  PERINGATAN: Menghapus SEMUA notifikasi dari database!');
      
      const notificationsRef = ref(database, 'notifications');
      const snapshot = await get(notificationsRef);
      let count = 0;
      
      snapshot.forEach(() => {
        count++;
      });
      
      if (count > 0) {
        await update(ref(database), { notifications: null });
        console.log(`✅ Berhasil menghapus SEMUA ${count} notifikasi dari database`);
      } else {
        console.log(`ℹ️  Database notifikasi sudah kosong`);
      }
      
      return count;
    } catch (error) {
      console.error('❌ Error menghapus semua notifikasi:', error);
      throw error;
    }
  }

  // Fungsi untuk melihat statistik notifikasi
  static async getNotificationStats() {
    try {
      console.log('📊 Menganalisis statistik notifikasi...');
      
      const notificationsRef = ref(database, 'notifications');
      const snapshot = await get(notificationsRef);
      
      const stats = {
        total: 0,
        read: 0,
        unread: 0,
        byType: {},
        bySender: {},
        byTargetUser: {}
      };
      
      snapshot.forEach((childSnapshot) => {
        const notificationData = childSnapshot.val();
        stats.total++;
        
        if (notificationData.read) {
          stats.read++;
        } else {
          stats.unread++;
        }
        
        // Group by type
        const type = notificationData.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
        
        // Group by sender
        const sender = notificationData.senderType || 'unknown';
        stats.bySender[sender] = (stats.bySender[sender] || 0) + 1;
        
        // Group by target user type
        const targetUser = notificationData.targetUserType || 'unknown';
        stats.byTargetUser[targetUser] = (stats.byTargetUser[targetUser] || 0) + 1;
      });
      
      console.log('\n📊 STATISTIK NOTIFIKASI:');
      console.log(`Total notifikasi: ${stats.total}`);
      console.log(`Sudah dibaca: ${stats.read}`);
      console.log(`Belum dibaca: ${stats.unread}`);
      console.log('\nBerdasarkan tipe:');
      Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      console.log('\nBerdasarkan pengirim:');
      Object.entries(stats.bySender).forEach(([sender, count]) => {
        console.log(`  ${sender}: ${count}`);
      });
      console.log('\nBerdasarkan target user:');
      Object.entries(stats.byTargetUser).forEach(([target, count]) => {
        console.log(`  ${target}: ${count}`);
      });
      console.log('─'.repeat(50));
      
      return stats;
    } catch (error) {
      console.error('❌ Error mengambil statistik notifikasi:', error);
      throw error;
    }
  }

  // Pembersihan cepat (hapus yang sudah dibaca dan lama)
  static async quickClean() {
    try {
      console.log('⚡ Memulai pembersihan cepat notifikasi...\n');
      
      let totalDeleted = 0;
      
      // Hapus yang sudah dibaca
      const readDeleted = await this.deleteReadNotifications();
      totalDeleted += readDeleted;
      
      // Hapus yang lebih dari 7 hari
      const oldDeleted = await this.deleteOldNotifications(7);
      totalDeleted += oldDeleted;
      
      console.log(`\n✅ Pembersihan cepat selesai! Total dihapus: ${totalDeleted}`);
      
      return totalDeleted;
    } catch (error) {
      console.error('❌ Error saat pembersihan cepat:', error);
      throw error;
    }
  }
}

// Fungsi global yang bisa dipanggil dari console browser
window.cleanNotifications = {
  // Lihat statistik
  stats: () => AppNotificationCleaner.getNotificationStats(),
  
  // Pembersihan cepat (recommended)
  quick: () => AppNotificationCleaner.quickClean(),
  
  // Hapus yang sudah dibaca
  deleteRead: () => AppNotificationCleaner.deleteReadNotifications(),
  
  // Hapus yang lama (default 30 hari)
  deleteOld: (days = 30) => AppNotificationCleaner.deleteOldNotifications(days),
  
  // Hapus berdasarkan tipe
  deleteByType: (type) => AppNotificationCleaner.deleteNotificationsByType(type),
  
  // Hapus berdasarkan sender
  deleteBySender: (senderId, senderType = 'admin') => AppNotificationCleaner.deleteNotificationsBySender(senderId, senderType),
  
  // HATI-HATI: Hapus semua
  deleteAll: () => AppNotificationCleaner.deleteAllNotifications()
};

export default AppNotificationCleaner;
