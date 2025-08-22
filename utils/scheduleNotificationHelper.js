/**
 * Helper utility untuk mengirim notifikasi publikasi jadwal ke murid
 * Dapat dipanggil dari komponen React Native
 */

import { Alert } from 'react-native';
import { sendSchedulePublishNotification, notifyAllStudentsSchedulePublished, notifyStudentsByClass } from '../scripts/sendSchedulePublishNotification.js';

/**
 * Mengirim notifikasi publikasi jadwal dengan konfirmasi
 * @param {Array} schedules - Array jadwal yang dipublikasi
 * @param {string} adminName - Nama admin
 * @param {string} adminId - ID admin (default: 001)
 * @param {function} onSuccess - Callback ketika berhasil
 * @param {function} onError - Callback ketika error
 */
export const sendSchedulePublishNotificationWithConfirm = async (
  schedules, 
  adminName = 'Admin', 
  adminId = '001',
  onSuccess = null,
  onError = null
) => {
  try {
    // Hitung total kelas yang akan mendapat notifikasi
    const affectedClasses = [...new Set(schedules.map(s => s.namaKelas).filter(Boolean))];
    
    Alert.alert(
      'Konfirmasi Notifikasi',
      `Anda akan mengirim notifikasi publikasi jadwal ke semua murid di ${affectedClasses.length} kelas:\n\n${affectedClasses.join(', ')}\n\nLanjutkan?`,
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Kirim Notifikasi',
          onPress: async () => {
            try {
              console.log('📧 Memulai pengiriman notifikasi publikasi jadwal...');
              
              const result = await sendSchedulePublishNotification(schedules, adminName, adminId);
              
              if (result && result.success) {
                const message = `✅ Berhasil mengirim notifikasi ke ${result.totalNotificationsSent} murid di ${result.classesProcessed} kelas`;
                console.log(message);
                
                Alert.alert(
                  'Notifikasi Berhasil Dikirim!',
                  `${message}\n\nError: ${result.totalErrors}\nJadwal dipublikasi: ${result.schedulesPublished}`,
                  [{ text: 'OK' }]
                );
                
                if (onSuccess) onSuccess(result);
              } else {
                throw new Error('Gagal mengirim notifikasi');
              }
              
            } catch (error) {
              console.error('❌ Error mengirim notifikasi:', error);
              Alert.alert('Error', `Gagal mengirim notifikasi: ${error.message}`);
              if (onError) onError(error);
            }
          }
        }
      ]
    );
    
  } catch (error) {
    console.error('❌ Error dalam sendSchedulePublishNotificationWithConfirm:', error);
    Alert.alert('Error', `Terjadi kesalahan: ${error.message}`);
    if (onError) onError(error);
  }
};

/**
 * Mengirim notifikasi ke semua murid dengan jadwal published
 * @param {string} adminName - Nama admin
 * @param {string} adminId - ID admin
 * @param {function} onSuccess - Callback ketika berhasil
 * @param {function} onError - Callback ketika error
 */
export const notifyAllStudentsWithConfirm = async (
  adminName = 'Admin',
  adminId = '001',
  onSuccess = null,
  onError = null
) => {
  try {
    Alert.alert(
      'Konfirmasi Notifikasi',
      'Anda akan mengirim notifikasi publikasi jadwal ke SEMUA murid yang memiliki jadwal published. Lanjutkan?',
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Kirim ke Semua',
          onPress: async () => {
            try {
              console.log('📧 Mengirim notifikasi ke semua murid dengan jadwal published...');
              
              const result = await notifyAllStudentsSchedulePublished(adminName, adminId);
              
              if (result && result.success) {
                const message = `✅ Berhasil mengirim notifikasi ke ${result.totalNotificationsSent} murid di ${result.classesProcessed} kelas`;
                console.log(message);
                
                Alert.alert(
                  'Notifikasi Berhasil Dikirim!',
                  `${message}\n\nError: ${result.totalErrors}\nJadwal dipublikasi: ${result.schedulesPublished}`,
                  [{ text: 'OK' }]
                );
                
                if (onSuccess) onSuccess(result);
              } else {
                Alert.alert('Info', result?.message || 'Tidak ada jadwal published yang ditemukan');
              }
              
            } catch (error) {
              console.error('❌ Error mengirim notifikasi ke semua murid:', error);
              Alert.alert('Error', `Gagal mengirim notifikasi: ${error.message}`);
              if (onError) onError(error);
            }
          }
        }
      ]
    );
    
  } catch (error) {
    console.error('❌ Error dalam notifyAllStudentsWithConfirm:', error);
    Alert.alert('Error', `Terjadi kesalahan: ${error.message}`);
    if (onError) onError(error);
  }
};

/**
 * Mengirim notifikasi ke murid kelas tertentu
 * @param {string} className - Nama kelas
 * @param {string} adminName - Nama admin
 * @param {string} adminId - ID admin
 * @param {function} onSuccess - Callback ketika berhasil
 * @param {function} onError - Callback ketika error
 */
export const notifyStudentsByClassWithConfirm = async (
  className,
  adminName = 'Admin',
  adminId = '001',
  onSuccess = null,
  onError = null
) => {
  try {
    if (!className) {
      Alert.alert('Error', 'Nama kelas tidak boleh kosong');
      return;
    }
    
    Alert.alert(
      'Konfirmasi Notifikasi',
      `Anda akan mengirim notifikasi publikasi jadwal ke semua murid di kelas ${className}. Lanjutkan?`,
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Kirim Notifikasi',
          onPress: async () => {
            try {
              console.log(`📧 Mengirim notifikasi ke murid kelas ${className}...`);
              
              const result = await notifyStudentsByClass(className, adminName, adminId);
              
              if (result && result.success) {
                const message = `✅ Berhasil mengirim notifikasi ke ${result.totalNotificationsSent} murid di kelas ${className}`;
                console.log(message);
                
                Alert.alert(
                  'Notifikasi Berhasil Dikirim!',
                  `${message}\n\nError: ${result.totalErrors}\nJadwal dipublikasi: ${result.schedulesPublished}`,
                  [{ text: 'OK' }]
                );
                
                if (onSuccess) onSuccess(result);
              } else {
                Alert.alert('Info', result?.message || `Tidak ada jadwal published untuk kelas ${className}`);
              }
              
            } catch (error) {
              console.error(`❌ Error mengirim notifikasi ke kelas ${className}:`, error);
              Alert.alert('Error', `Gagal mengirim notifikasi: ${error.message}`);
              if (onError) onError(error);
            }
          }
        }
      ]
    );
    
  } catch (error) {
    console.error('❌ Error dalam notifyStudentsByClassWithConfirm:', error);
    Alert.alert('Error', `Terjadi kesalahan: ${error.message}`);
    if (onError) onError(error);
  }
};

/**
 * Fungsi untuk mendapatkan admin info dengan default ID 001
 * @param {Object} user - User object dari context
 * @returns {Object} Admin info dengan nama dan ID
 */
export const getAdminInfo = (user) => {
  return {
    name: user?.namaLengkap || user?.nama || user?.username || 'Admin',
    id: user?.id || user?.uid || '001'
  };
};

/**
 * Shortcut untuk mengirim notifikasi dengan admin default (ID 001)
 * @param {Array} schedules - Array jadwal yang dipublikasi
 * @param {Object} user - User object (opsional)
 */
export const quickSendNotification = async (schedules, user = null) => {
  const adminInfo = getAdminInfo(user);
  
  try {
    const result = await sendSchedulePublishNotification(schedules, adminInfo.name, adminInfo.id);
    
    if (result && result.success) {
      console.log(`📧 Quick notification sent: ${result.totalNotificationsSent} notifications to ${result.classesProcessed} classes`);
      return result;
    } else {
      console.warn('⚠️ Quick notification failed: No schedules found');
      return null;
    }
  } catch (error) {
    console.error('❌ Quick notification error:', error);
    throw error;
  }
};

export default {
  sendSchedulePublishNotificationWithConfirm,
  notifyAllStudentsWithConfirm,
  notifyStudentsByClassWithConfirm,
  getAdminInfo,
  quickSendNotification
};
