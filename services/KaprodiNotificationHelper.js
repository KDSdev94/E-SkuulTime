import { createKaprodiNotification } from './notificationService';

/**
 * Helper functions untuk membuat notifikasi khusus kaprodi
 */

// Contoh: Membuat notifikasi laporan kelas untuk kaprodi
export const notifyClassReport = async (kelas, jurusan, periode, senderInfo = null) => {
  try {
    const data = {
      kelas,
      periode,
      message: `Laporan kelas ${kelas} periode ${periode} telah selesai`
    };
    
    await createKaprodiNotification(jurusan, 'class_report', data, senderInfo);
    console.log(`Class report notification sent to Kaprodi ${jurusan} for class ${kelas}`);
  } catch (error) {
    console.error('Error sending class report notification:', error);
  }
};

// Contoh: Membuat notifikasi permintaan persetujuan
export const notifyApprovalRequest = async (kelas, jurusan, subject, senderInfo = null) => {
  try {
    const data = {
      kelas,
      subject,
      message: `Memerlukan persetujuan untuk ${subject} kelas ${kelas}`
    };
    
    await createKaprodiNotification(jurusan, 'approval_request', data, senderInfo);
    console.log(`Approval request notification sent to Kaprodi ${jurusan} for ${subject}`);
  } catch (error) {
    console.error('Error sending approval request notification:', error);
  }
};

// Contoh: Membuat notifikasi ringkasan jadwal per kelas
export const notifyScheduleSummary = async (kelas, jurusan, senderInfo = null) => {
  try {
    const data = {
      kelas,
      message: `Jadwal kelas ${kelas} telah diperbarui`
    };
    
    await createKaprodiNotification(jurusan, 'schedule_summary', data, senderInfo);
    console.log(`Schedule summary notification sent to Kaprodi ${jurusan} for class ${kelas}`);
  } catch (error) {
    console.error('Error sending schedule summary notification:', error);
  }
};

// Contoh: Membuat notifikasi laporan siswa per kelas
export const notifyStudentReport = async (kelas, jurusan, totalSiswa, senderInfo = null) => {
  try {
    const data = {
      kelas,
      totalSiswa,
      message: `Laporan siswa kelas ${kelas} - total ${totalSiswa} siswa`
    };
    
    await createKaprodiNotification(jurusan, 'student_report', data, senderInfo);
    console.log(`Student report notification sent to Kaprodi ${jurusan} for class ${kelas}`);
  } catch (error) {
    console.error('Error sending student report notification:', error);
  }
};

// Fungsi untuk menentukan jurusan berdasarkan kelas
export const getJurusanFromKelas = (kelas) => {
  const kelasUpper = kelas.toUpperCase();
  if (kelasUpper.includes('TKJ')) {
    return 'TKJ';
  } else if (kelasUpper.includes('TKR')) {
    return 'TKR';
  }
  // Default fallback - bisa disesuaikan dengan naming convention kelas Anda
  return null;
};

// Fungsi helper untuk batch notification berdasarkan multiple kelas
export const notifyMultipleClasses = async (kelasArray, notificationType, commonData, senderInfo = null) => {
  try {
    const notifications = [];
    
    for (const kelas of kelasArray) {
      const jurusan = getJurusanFromKelas(kelas);
      if (jurusan) {
        const data = { ...commonData, kelas };
        notifications.push(
          createKaprodiNotification(jurusan, notificationType, data, senderInfo)
        );
      }
    }
    
    await Promise.all(notifications);
    console.log(`Batch notifications sent for ${kelasArray.length} classes`);
  } catch (error) {
    console.error('Error sending batch notifications:', error);
  }
};
