import { db } from '../config/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { createNotification } from '../services/notificationService.js';
import MuridService from '../services/MuridService.js';

/**
 * Script untuk mengirim notifikasi ke semua murid saat jadwal kelas dipublikasi oleh admin
 * @param {Array} publishedSchedules - Array of published schedule data
 * @param {string} adminName - Nama admin yang mempublikasi (default: Admin dengan ID 001)
 * @param {string} adminId - ID admin yang mempublikasi (default: 001)
 */
export const sendSchedulePublishNotification = async (publishedSchedules, adminName = 'Admin', adminId = '001') => {
  try {
    console.log('📧 Mengirim notifikasi publikasi jadwal ke semua murid...');
    
    if (!publishedSchedules || publishedSchedules.length === 0) {
      console.log('⚠️ Tidak ada jadwal yang dipublikasi');
      return;
    }

    // Grup jadwal berdasarkan kelas untuk efisiensi notifikasi
    const schedulesByClass = {};
    publishedSchedules.forEach(schedule => {
      if (schedule.namaKelas) {
        if (!schedulesByClass[schedule.namaKelas]) {
          schedulesByClass[schedule.namaKelas] = [];
        }
        schedulesByClass[schedule.namaKelas].push(schedule);
      }
    });

    // Info pengirim (admin dengan ID 001)
    const senderInfo = {
      name: adminName,
      type: 'admin', 
      id: adminId
    };

    console.log(`📊 Jadwal dipublikasi untuk ${Object.keys(schedulesByClass).length} kelas`);
    
    let totalNotificationsSent = 0;
    let totalErrors = 0;
    const classNotificationResults = [];

    // Kirim notifikasi ke murid berdasarkan kelas
    for (const [className, classSchedules] of Object.entries(schedulesByClass)) {
      try {
        console.log(`\n📋 Memproses kelas: ${className}`);
        
        // Ambil semua murid di kelas ini
        const studentsInClass = await MuridService.getMuridByKelas(className);
        console.log(`👥 Ditemukan ${studentsInClass.length} murid di kelas ${className}`);
        
        if (studentsInClass.length === 0) {
          console.log(`⚠️ Tidak ada murid ditemukan di kelas ${className}`);
          continue;
        }

        // Buat pesan notifikasi yang informatif
        const scheduleCount = classSchedules.length;
        const message = `📅 Jadwal pelajaran kelas ${className} telah dipublikasi oleh ${adminName}! Terdapat ${scheduleCount} slot jadwal baru yang siap dilihat. Silakan buka aplikasi untuk melihat jadwal pelajaran terbaru Anda.`;
        
        let classSuccessCount = 0;
        let classErrorCount = 0;

        // Kirim notifikasi ke setiap murid di kelas
        for (const student of studentsInClass) {
          try {
            await createNotification(
              student.id, 
              message, 
              senderInfo, 
              'jadwal', 
              'murid'
            );
            
            console.log(`✅ Notifikasi terkirim ke: ${student.namaLengkap} (${student.nis})`);
            classSuccessCount++;
            totalNotificationsSent++;
            
          } catch (notifError) {
            console.error(`❌ Gagal kirim notifikasi ke ${student.namaLengkap}:`, notifError.message);
            classErrorCount++;
            totalErrors++;
          }
        }

        classNotificationResults.push({
          className,
          studentCount: studentsInClass.length,
          scheduleCount,
          successCount: classSuccessCount,
          errorCount: classErrorCount
        });

        console.log(`📊 Kelas ${className} - Berhasil: ${classSuccessCount}/${studentsInClass.length}`);
        
      } catch (classError) {
        console.error(`❌ Error memproses kelas ${className}:`, classError.message);
        totalErrors++;
      }
    }

    // Tampilkan ringkasan hasil
    console.log('\n📈 RINGKASAN NOTIFIKASI PUBLIKASI JADWAL:');
    console.log('=====================================');
    console.log(`👨‍🎓 Total notifikasi berhasil dikirim: ${totalNotificationsSent}`);
    console.log(`❌ Total error: ${totalErrors}`);
    console.log(`📚 Jumlah kelas diproses: ${Object.keys(schedulesByClass).length}`);
    console.log(`📅 Total jadwal dipublikasi: ${publishedSchedules.length}`);
    console.log(`👤 Dipublikasi oleh: ${adminName} (ID: ${adminId})`);
    
    // Detail per kelas
    console.log('\n📋 DETAIL PER KELAS:');
    classNotificationResults.forEach(result => {
      console.log(`• ${result.className}: ${result.successCount}/${result.studentCount} murid, ${result.scheduleCount} jadwal`);
    });
    
    if (totalNotificationsSent > 0) {
      console.log('\n🎉 Notifikasi publikasi jadwal berhasil dikirim!');
    } else {
      console.log('\n⚠️ Tidak ada notifikasi yang berhasil dikirim');
    }

    return {
      success: true,
      totalNotificationsSent,
      totalErrors,
      classesProcessed: Object.keys(schedulesByClass).length,
      schedulesPublished: publishedSchedules.length,
      adminName,
      adminId,
      classResults: classNotificationResults
    };

  } catch (error) {
    console.error('❌ Error dalam sendSchedulePublishNotification:', error);
    throw error;
  }
};

/**
 * Fungsi untuk mengirim notifikasi ke semua murid saat admin mempublikasi jadwal
 * Mengambil jadwal yang baru dipublikasi dan mengirim notifikasi
 */
export const notifyAllStudentsSchedulePublished = async (adminName = 'Admin', adminId = '001') => {
  try {
    console.log('🔍 Mencari jadwal yang baru dipublikasi...');
    
    // Ambil semua jadwal yang published
    const jadwalCollection = collection(db, 'jadwal');
    const publishedQuery = query(jadwalCollection, where('isPublished', '==', true));
    const querySnapshot = await getDocs(publishedQuery);
    
    const publishedSchedules = [];
    querySnapshot.forEach((doc) => {
      publishedSchedules.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (publishedSchedules.length === 0) {
      console.log('ℹ️ Tidak ada jadwal yang dipublikasi ditemukan');
      return { success: false, message: 'Tidak ada jadwal published' };
    }

    console.log(`📊 Ditemukan ${publishedSchedules.length} jadwal yang sudah dipublikasi`);
    
    // Kirim notifikasi
    const result = await sendSchedulePublishNotification(publishedSchedules, adminName, adminId);
    
    return result;

  } catch (error) {
    console.error('❌ Error dalam notifyAllStudentsSchedulePublished:', error);
    throw error;
  }
};

/**
 * Fungsi untuk mengirim notifikasi berdasarkan kelas tertentu
 * @param {string} className - Nama kelas yang jadwalnya dipublikasi
 * @param {string} adminName - Nama admin
 * @param {string} adminId - ID admin
 */
export const notifyStudentsByClass = async (className, adminName = 'Admin', adminId = '001') => {
  try {
    console.log(`🔍 Mencari jadwal kelas ${className} yang dipublikasi...`);
    
    // Ambil jadwal yang published untuk kelas tertentu
    const jadwalCollection = collection(db, 'jadwal');
    const querySnapshot = await getDocs(jadwalCollection);
    
    const classSchedules = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isPublished === true && data.namaKelas === className) {
        classSchedules.push({
          id: doc.id,
          ...data
        });
      }
    });

    if (classSchedules.length === 0) {
      console.log(`ℹ️ Tidak ada jadwal published untuk kelas ${className}`);
      return { success: false, message: `Tidak ada jadwal published untuk kelas ${className}` };
    }

    console.log(`📊 Ditemukan ${classSchedules.length} jadwal published untuk kelas ${className}`);
    
    // Kirim notifikasi khusus kelas ini
    const result = await sendSchedulePublishNotification(classSchedules, adminName, adminId);
    
    return result;

  } catch (error) {
    console.error(`❌ Error dalam notifyStudentsByClass untuk kelas ${className}:`, error);
    throw error;
  }
};

// Export default untuk kemudahan penggunaan
export default {
  sendSchedulePublishNotification,
  notifyAllStudentsSchedulePublished,
  notifyStudentsByClass
};
