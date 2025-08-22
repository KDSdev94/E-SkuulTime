import { NotificationCleaner } from './cleanNotifications.js';

// Konfigurasi - sesuaikan dengan kebutuhan Anda
const CONFIG = {
  // ID admin yang ingin dibersihkan notifikasinya (kosongkan jika ingin hapus semua admin)
  ADMIN_ID: '', // contoh: 'admin123'
  
  // Pilihan pembersihan (set true untuk mengaktifkan)
  OPTIONS: {
    // Hapus notifikasi yang sudah dibaca
    DELETE_READ: true,
    
    // Hapus notifikasi lama (lebih dari X hari)
    DELETE_OLD: true,
    OLD_DAYS: 7, // hapus yang lebih dari 7 hari
    
    // Hapus berdasarkan tipe notifikasi tertentu
    DELETE_BY_TYPE: false,
    NOTIFICATION_TYPES: ['jadwal', 'data'], // tipe yang akan dihapus
    
    // Hapus notifikasi dari admin tertentu
    DELETE_BY_ADMIN: false,
    
    // HATI-HATI: Hapus SEMUA notifikasi
    DELETE_ALL: false
  }
};

async function cleanAdminNotifications() {
  try {
    console.log('🚀 Memulai pembersihan notifikasi admin...\n');
    
    // Tampilkan statistik terlebih dahulu
    console.log('📊 Mengecek statistik notifikasi saat ini:');
    await NotificationCleaner.getNotificationStats();
    
    let totalDeleted = 0;
    
    // 1. Hapus notifikasi yang sudah dibaca
    if (CONFIG.OPTIONS.DELETE_READ) {
      console.log('\n🧹 Menghapus notifikasi yang sudah dibaca...');
      const deletedRead = await NotificationCleaner.deleteReadNotifications();
      totalDeleted += deletedRead;
    }
    
    // 2. Hapus notifikasi lama
    if (CONFIG.OPTIONS.DELETE_OLD) {
      console.log(`\n🧹 Menghapus notifikasi lebih dari ${CONFIG.OPTIONS.OLD_DAYS} hari...`);
      const deletedOld = await NotificationCleaner.deleteOldNotifications(CONFIG.OPTIONS.OLD_DAYS);
      totalDeleted += deletedOld;
    }
    
    // 3. Hapus berdasarkan tipe notifikasi
    if (CONFIG.OPTIONS.DELETE_BY_TYPE && CONFIG.OPTIONS.NOTIFICATION_TYPES.length > 0) {
      console.log('\n🧹 Menghapus notifikasi berdasarkan tipe...');
      for (const type of CONFIG.OPTIONS.NOTIFICATION_TYPES) {
        const deletedByType = await NotificationCleaner.deleteNotificationsByType(type);
        totalDeleted += deletedByType;
      }
    }
    
    // 4. Hapus notifikasi dari admin tertentu
    if (CONFIG.OPTIONS.DELETE_BY_ADMIN && CONFIG.ADMIN_ID) {
      console.log(`\n🧹 Menghapus notifikasi dari admin: ${CONFIG.ADMIN_ID}...`);
      const deletedByAdmin = await NotificationCleaner.deleteAllNotificationsBySender(CONFIG.ADMIN_ID, 'admin');
      totalDeleted += deletedByAdmin;
    }
    
    // 5. HATI-HATI: Hapus semua notifikasi
    if (CONFIG.OPTIONS.DELETE_ALL) {
      console.log('\n⚠️  PERINGATAN: Menghapus SEMUA notifikasi...');
      const deletedAll = await NotificationCleaner.deleteAllNotifications();
      totalDeleted = deletedAll; // override karena menghapus semua
    }
    
    // Tampilkan statistik setelah pembersihan
    if (totalDeleted > 0) {
      console.log('\n📊 Statistik setelah pembersihan:');
      await NotificationCleaner.getNotificationStats();
    }
    
    console.log(`\n✅ Pembersihan selesai! Total notifikasi yang dihapus: ${totalDeleted}`);
    
  } catch (error) {
    console.error('❌ Error saat membersihkan notifikasi admin:', error);
  }
}

// Fungsi untuk pembersihan cepat (hapus yang sudah dibaca dan lama)
async function quickClean() {
  try {
    console.log('⚡ Pembersihan cepat notifikasi admin...\n');
    
    let totalDeleted = 0;
    
    // Hapus yang sudah dibaca
    console.log('🧹 Menghapus notifikasi yang sudah dibaca...');
    const readDeleted = await NotificationCleaner.deleteReadNotifications();
    totalDeleted += readDeleted;
    
    // Hapus yang lebih dari 7 hari
    console.log('🧹 Menghapus notifikasi lebih dari 7 hari...');
    const oldDeleted = await NotificationCleaner.deleteOldNotifications(7);
    totalDeleted += oldDeleted;
    
    console.log(`\n✅ Pembersihan cepat selesai! Total dihapus: ${totalDeleted}`);
    
  } catch (error) {
    console.error('❌ Error saat pembersihan cepat:', error);
  }
}

// Jalankan berdasarkan argumen command line
const args = process.argv.slice(2);

if (args.includes('--quick') || args.includes('-q')) {
  // Pembersihan cepat
  quickClean();
} else if (args.includes('--stats') || args.includes('-s')) {
  // Hanya tampilkan statistik
  NotificationCleaner.getNotificationStats();
} else if (args.includes('--all')) {
  // Hapus semua notifikasi (HATI-HATI!)
  CONFIG.OPTIONS.DELETE_ALL = true;
  CONFIG.OPTIONS.DELETE_READ = false;
  CONFIG.OPTIONS.DELETE_OLD = false;
  cleanAdminNotifications();
} else {
  // Pembersihan normal sesuai konfigurasi
  cleanAdminNotifications();
}

console.log(`
📋 CARA PENGGUNAAN:
   node scripts/cleanAdminNotifications.js          # Pembersihan sesuai konfigurasi
   node scripts/cleanAdminNotifications.js --quick  # Pembersihan cepat (read + 7 hari)
   node scripts/cleanAdminNotifications.js --stats  # Hanya lihat statistik
   node scripts/cleanAdminNotifications.js --all    # Hapus SEMUA (HATI-HATI!)
`);
