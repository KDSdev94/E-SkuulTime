// Script ini harus dijalankan di browser console saat sudah login sebagai admin
// Copy dan paste script ini di browser console (F12 -> Console)

console.log('🚀 Memulai script pembersihan notifikasi di browser...');

// Fungsi untuk membersihkan notifikasi
const browserNotificationCleaner = {
  
  // Lihat statistik notifikasi
  async getStats() {
    try {
      console.log('📊 Menganalisis statistik notifikasi...');
      
      // Gunakan Firebase yang sudah ada di window
      const { database } = window;
      const { ref, get } = window;
      
      if (!database || !ref || !get) {
        throw new Error('Firebase tidak tersedia. Pastikan Anda sudah login di aplikasi.');
      }
      
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
  },

  // Hapus notifikasi yang sudah dibaca
  async deleteRead() {
    try {
      console.log('🧹 Menghapus notifikasi yang sudah dibaca...');
      
      const { database } = window;
      const { ref, get, update } = window;
      
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
  },

  // Hapus notifikasi lama
  async deleteOld(daysOld = 30) {
    try {
      console.log(`🧹 Menghapus notifikasi lebih dari ${daysOld} hari...`);
      
      const { database } = window;
      const { ref, get, update } = window;
      
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
  },

  // Hapus semua notifikasi (HATI-HATI!)
  async deleteAll() {
    try {
      console.log('⚠️  PERINGATAN: Menghapus SEMUA notifikasi dari database!');
      
      if (!confirm('⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA notifikasi? Tindakan ini tidak dapat dibatalkan!')) {
        console.log('❌ Operasi dibatalkan oleh user');
        return 0;
      }
      
      const { database } = window;
      const { ref, get, update } = window;
      
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
  },

  // Pembersihan cepat
  async quickClean() {
    try {
      console.log('⚡ Memulai pembersihan cepat...');
      
      let totalDeleted = 0;
      
      // Hapus yang sudah dibaca
      const readDeleted = await this.deleteRead();
      totalDeleted += readDeleted;
      
      // Hapus yang lebih dari 7 hari
      const oldDeleted = await this.deleteOld(7);
      totalDeleted += oldDeleted;
      
      console.log(`\n✅ Pembersihan cepat selesai! Total dihapus: ${totalDeleted}`);
      
      return totalDeleted;
    } catch (error) {
      console.error('❌ Error saat pembersihan cepat:', error);
      throw error;
    }
  }
};

// Buat fungsi global yang mudah diakses
window.cleanNotifications = browserNotificationCleaner;

console.log(`
📋 CARA PENGGUNAAN DI BROWSER CONSOLE:

// Lihat statistik
cleanNotifications.getStats()

// Pembersihan cepat (hapus yang sudah dibaca + lebih dari 7 hari)
cleanNotifications.quickClean()

// Hapus hanya yang sudah dibaca
cleanNotifications.deleteRead()

// Hapus yang lebih dari X hari
cleanNotifications.deleteOld(30)  // contoh: 30 hari

// HATI-HATI: Hapus SEMUA notifikasi
cleanNotifications.deleteAll()
`);

console.log('✅ Script siap digunakan! Gunakan perintah di atas untuk membersihkan notifikasi.');
