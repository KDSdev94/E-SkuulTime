import { database } from '../config/firebase.js';
import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';

class NotificationCleaner {
  
  // Hapus semua notifikasi berdasarkan userId
  static async deleteAllNotificationsByUserId(userId) {
    try {
      console.log(`🧹 Membersihkan notifikasi untuk user ID: ${userId}`);
      
      const notificationsRef = ref(database, 'notifications');
      const userNotificationsQuery = query(notificationsRef, orderByChild('userId'), equalTo(userId));
      
      const snapshot = await get(userNotificationsQuery);
      const updates = {};
      let count = 0;
      
      snapshot.forEach((childSnapshot) => {
        updates[`notifications/${childSnapshot.key}`] = null;
        count++;
      });
      
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        console.log(`✅ Berhasil menghapus ${count} notifikasi untuk user ${userId}`);
      } else {
        console.log(`ℹ️  Tidak ada notifikasi yang ditemukan untuk user ${userId}`);
      }
      
      return count;
    } catch (error) {
      console.error('❌ Error menghapus notifikasi berdasarkan userId:', error);
      throw error;
    }
  }

  // Hapus semua notifikasi berdasarkan sender (admin)
  static async deleteAllNotificationsBySender(senderId, senderType = 'admin') {
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

  // Hapus notifikasi berdasarkan jenis (type)
  static async deleteNotificationsByType(notificationType) {
    try {
      console.log(`🧹 Membersihkan notifikasi dengan tipe: ${notificationType}`);
      
      const notificationsRef = ref(database, 'notifications');
      const typeQuery = query(notificationsRef, orderByChild('type'), equalTo(notificationType));
      
      const snapshot = await get(typeQuery);
      const updates = {};
      let count = 0;
      
      snapshot.forEach((childSnapshot) => {
        updates[`notifications/${childSnapshot.key}`] = null;
        count++;
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

  // Hapus notifikasi lama (berdasarkan tanggal)
  static async deleteOldNotifications(daysOld = 30) {
    try {
      console.log(`🧹 Membersihkan notifikasi yang lebih lama dari ${daysOld} hari`);
      
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

  // Hapus notifikasi yang sudah dibaca
  static async deleteReadNotifications() {
    try {
      console.log(`🧹 Membersihkan notifikasi yang sudah dibaca`);
      
      const notificationsRef = ref(database, 'notifications');
      const readQuery = query(notificationsRef, orderByChild('read'), equalTo(true));
      
      const snapshot = await get(readQuery);
      const updates = {};
      let count = 0;
      
      snapshot.forEach((childSnapshot) => {
        updates[`notifications/${childSnapshot.key}`] = null;
        count++;
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

  // Fungsi untuk melihat statistik notifikasi sebelum menghapus
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
}

// Fungsi utama untuk menjalankan pembersihan
async function main() {
  try {
    console.log('🚀 Memulai script pembersihan notifikasi...\n');
    
    // Tampilkan statistik terlebih dahulu
    await NotificationCleaner.getNotificationStats();
    
    // Pilih operasi yang ingin dilakukan (uncomment yang diperlukan):
    
    // 1. Hapus semua notifikasi yang sudah dibaca
    // await NotificationCleaner.deleteReadNotifications();
    
    // 2. Hapus notifikasi berdasarkan tipe tertentu
    // await NotificationCleaner.deleteNotificationsByType('jadwal');
    
    // 3. Hapus notifikasi lama (lebih dari 30 hari)
    // await NotificationCleaner.deleteOldNotifications(30);
    
    // 4. Hapus notifikasi berdasarkan sender admin tertentu
    // await NotificationCleaner.deleteAllNotificationsBySender('adminId123', 'admin');
    
    // 5. Hapus notifikasi berdasarkan userId tertentu
    // await NotificationCleaner.deleteAllNotificationsByUserId('userId123');
    
    // 6. HATI-HATI: Hapus SEMUA notifikasi
    // await NotificationCleaner.deleteAllNotifications();
    
    console.log('\n✅ Script selesai dijalankan!');
    
  } catch (error) {
    console.error('❌ Error menjalankan script:', error);
  }
}

// Export untuk penggunaan individual
export { NotificationCleaner };

// Jalankan script jika dipanggil langsung
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}
