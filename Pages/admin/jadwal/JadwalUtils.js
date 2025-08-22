import { getJamPelajaranData, getRuangKelasData, getStaticClassData } from './JadwalConstants';

export const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getScheduleItemColor = (schedule) => {
  const ruangKelasData = getRuangKelasData();
  const allRuanganLain = ruangKelasData.ruanganLain;
  
  if (schedule.namaKelas && schedule.namaKelas.includes('TKJ')) {
    return '#3B82F6';
  } else if (schedule.namaKelas && schedule.namaKelas.includes('TKR')) {
    return '#10B981';
  } else {
    const ruangan = allRuanganLain.find(r => r.nama === schedule.ruangKelas);
    return ruangan ? ruangan.color : '#6B7280';
  }
};

export const getTextColor = (schedule) => {
  const color = getScheduleItemColor(schedule);
  const lightColors = ['#FBBF24', '#F59E0B'];
  return lightColors.includes(color) ? '#1F2937' : '#FFFFFF';
};
export const createJadwalData = (formData) => {
  const jamPelajaranData = getJamPelajaranData();
  const jamData = jamPelajaranData[formData.hari === 'Jumat' ? 'jumat' : 'reguler'];
  const jam = jamData[formData.jamKe];

  return {
    ...formData,
    jamMulai: jam?.jamMulai || '',
    jamSelesai: jam?.jamSelesai || '',
    id: Date.now().toString(),
    tanggalDibuat: new Date().toISOString(),
    tanggalDiubah: new Date().toISOString(),
    statusJadwal: 'Draft', // Mark schedule as draft for approval
  };
};

export const getJurusanFromKelas = (namaKelas) => {
  if (namaKelas.includes('TKJ')) return 'TKJ';
  if (namaKelas.includes('TKR')) return 'TKR';
  return '';
};

export const sendNotificationToStudents = async (
  scheduleData,
  allUsers,
  action = 'create',
  sendPushNotification
) => {
  const jurusan = getJurusanFromKelas(scheduleData.namaKelas);
  const students = allUsers.filter(user => 
    user.role === 'student' && user.jurusan === jurusan
  );

  const actionText = {
    create: 'ditambahkan',
    update: 'diperbarui',
    delete: 'dihapus'
  }[action];

  const message = `Jadwal ${scheduleData.namaMataPelajaran} untuk kelas ${scheduleData.namaKelas} telah ${actionText}`;
  
  await Promise.all(
    students.map(student => 
      sendPushNotification(student.expoPushToken, 'Update Jadwal', message)
    )
  );
};

export const sendNotificationToGuru = async (
  scheduleData,
  allUsers,
  action = 'create',
  sendPushNotification
) => {
  const guru = allUsers.find(user => 
    user.role === 'guru' && user.id === scheduleData.guruId
  );

  if (guru && guru.expoPushToken) {
    const actionText = {
      create: 'ditambahkan',
      update: 'diperbarui',
      delete: 'dihapus'
    }[action];

    const message = `Jadwal mengajar Anda untuk mata pelajaran ${scheduleData.namaMataPelajaran} telah ${actionText}`;
    
    await sendPushNotification(guru.expoPushToken, 'Update Jadwal Mengajar', message);
  }
};

// Fungsi untuk mengirim notifikasi approval jadwal per kelas ke Kaprodi
export const sendScheduleApprovalNotification = async (scheduleData, adminName = 'Admin', action = 'create') => {
  try {
    const { notifyApprovalRequest } = await import('../../../services/KaprodiNotificationHelper');
    
    const jurusan = getJurusanFromKelas(scheduleData.namaKelas);
    if (!jurusan) {
      console.warn('Jurusan tidak dapat ditentukan dari kelas:', scheduleData.namaKelas);
      return;
    }

    const actionText = {
      create: 'jadwal baru',
      update: 'perubahan jadwal',
      delete: 'penghapusan jadwal'
    }[action];

    const subject = `${actionText} - ${scheduleData.namaMataPelajaran} (${scheduleData.hari} jam ${scheduleData.jamKe}) oleh ${adminName}`;
    
    const senderInfo = {
      name: adminName,
      type: 'admin',
      id: 'admin_jadwal'
    };

    await notifyApprovalRequest(
      scheduleData.namaKelas,
      jurusan,
      subject,
      senderInfo
    );

    console.log(`✅ Approval notification sent to Kaprodi ${jurusan} for ${scheduleData.namaKelas}`);
  } catch (error) {
    console.error('❌ Error sending schedule approval notification:', error);
  }
};

// Fungsi untuk batch approval notification - mengelompokkan per kelas
export const sendBatchScheduleApprovalNotification = async (schedulesArray, adminName = 'Admin', action = 'create') => {
  try {
    const { notifyApprovalRequest } = await import('../../../services/KaprodiNotificationHelper');
    
    // Kelompokkan jadwal berdasarkan kelas untuk mengurangi spam notifikasi
    const schedulesByClass = schedulesArray.reduce((acc, schedule) => {
      const kelas = schedule.namaKelas;
      if (!acc[kelas]) {
        acc[kelas] = [];
      }
      acc[kelas].push(schedule);
      return acc;
    }, {});

    const actionText = {
      create: 'pembuatan jadwal',
      update: 'perubahan jadwal',
      delete: 'penghapusan jadwal'
    }[action];

    const senderInfo = {
      name: adminName,
      type: 'admin',
      id: 'admin_jadwal'
    };

    // Kirim satu notifikasi per kelas dengan ringkasan
    for (const [kelas, schedules] of Object.entries(schedulesByClass)) {
      const jurusan = getJurusanFromKelas(kelas);
      if (!jurusan) continue;

      const scheduleCount = schedules.length;
      const subject = `${actionText} ${scheduleCount} slot jadwal untuk kelas ${kelas} oleh ${adminName}`;
      
      await notifyApprovalRequest(
        kelas,
        jurusan,
        subject,
        senderInfo
      );

      console.log(`✅ Batch approval notification sent to Kaprodi ${jurusan} for ${kelas} (${scheduleCount} schedules)`);
    }

  } catch (error) {
    console.error('❌ Error sending batch schedule approval notification:', error);
  }
};

// Fungsi untuk mengirim laporan jadwal per kelas ke Kaprodi
export const sendScheduleReportNotification = async (kelas, adminName = 'Sistem') => {
  try {
    const { notifyScheduleSummary } = await import('../../../services/KaprodiNotificationHelper');
    
    const jurusan = getJurusanFromKelas(kelas);
    if (!jurusan) {
      console.warn('Jurusan tidak dapat ditentukan dari kelas:', kelas);
      return;
    }

    const senderInfo = {
      name: adminName,
      type: 'admin',
      id: 'schedule_system'
    };

    await notifyScheduleSummary(kelas, jurusan, senderInfo);
    console.log(`📊 Schedule report sent to Kaprodi ${jurusan} for ${kelas}`);
  } catch (error) {
    console.error('❌ Error sending schedule report notification:', error);
  }
};

// Fungsi untuk mengirim notifikasi dari Kaprodi ke Admin setelah jadwal disetujui
export const sendScheduleApprovedNotificationToAdmin = async (scheduleData, kaprodiName, kaprodiJurusan, status = 'approved') => {
  try {
    const { createNotification } = await import('../../../services/notificationService');
    
    const statusText = {
      approved: 'disetujui',
      rejected: 'ditolak',
      needs_revision: 'perlu revisi'
    }[status];

    const statusIcon = {
      approved: '✅',
      rejected: '❌', 
      needs_revision: '📝'
    }[status];

    const message = `${statusIcon} Jadwal ${scheduleData.namaMataPelajaran} untuk kelas ${scheduleData.namaKelas} (${scheduleData.hari} jam ${scheduleData.jamKe}) telah ${statusText} oleh Kaprodi ${kaprodiJurusan}: ${kaprodiName}`;
    
    const senderInfo = {
      name: kaprodiName,
      type: 'kaprodi',
      id: `kaprodi_${kaprodiJurusan.toLowerCase()}`
    };

    // Kirim notifikasi ke semua admin
    await createNotification('admin', message, senderInfo, 'jadwal_approval');
    
    console.log(`📬 Schedule ${status} notification sent to Admin from Kaprodi ${kaprodiJurusan} (${kaprodiName})`);
  } catch (error) {
    console.error('❌ Error sending schedule approved notification to admin:', error);
  }
};

// Fungsi untuk batch approval notification dari Kaprodi ke Admin
export const sendBatchScheduleApprovedNotificationToAdmin = async (schedulesArray, kaprodiName, kaprodiJurusan, status = 'approved') => {
  try {
    const { createNotification } = await import('../../../services/notificationService');
    
    // Kelompokkan jadwal berdasarkan kelas
    const schedulesByClass = schedulesArray.reduce((acc, schedule) => {
      const kelas = schedule.namaKelas;
      if (!acc[kelas]) {
        acc[kelas] = [];
      }
      acc[kelas].push(schedule);
      return acc;
    }, {});

    const statusText = {
      approved: 'disetujui',
      rejected: 'ditolak', 
      needs_revision: 'perlu revisi'
    }[status];

    const statusIcon = {
      approved: '✅',
      rejected: '❌',
      needs_revision: '📝'
    }[status];

    const senderInfo = {
      name: kaprodiName,
      type: 'kaprodi',
      id: `kaprodi_${kaprodiJurusan.toLowerCase()}`
    };

    // Kirim satu notifikasi per kelas dengan ringkasan
    for (const [kelas, schedules] of Object.entries(schedulesByClass)) {
      const scheduleCount = schedules.length;
      const message = `${statusIcon} ${scheduleCount} jadwal untuk kelas ${kelas} telah ${statusText} oleh Kaprodi ${kaprodiJurusan}: ${kaprodiName}`;
      
      await createNotification('admin', message, senderInfo, 'jadwal_approval');
      
      console.log(`📬 Batch schedule ${status} notification sent to Admin from Kaprodi ${kaprodiJurusan} for ${kelas} (${scheduleCount} schedules)`);
    }

  } catch (error) {
    console.error('❌ Error sending batch schedule approved notification to admin:', error);
  }
};

// Fungsi untuk mengirim notifikasi komentar/catatan dari Kaprodi ke Admin
export const sendScheduleCommentNotificationToAdmin = async (scheduleData, kaprodiName, kaprodiJurusan, comment) => {
  try {
    const { createNotification } = await import('../../../services/notificationService');
    
    const message = `💬 Kaprodi ${kaprodiJurusan} (${kaprodiName}) memberikan komentar pada jadwal ${scheduleData.namaMataPelajaran} - ${scheduleData.namaKelas}: "${comment}"`;
    
    const senderInfo = {
      name: kaprodiName,
      type: 'kaprodi',
      id: `kaprodi_${kaprodiJurusan.toLowerCase()}`
    };

    await createNotification('admin', message, senderInfo, 'jadwal_comment');
    
    console.log(`💬 Schedule comment notification sent to Admin from Kaprodi ${kaprodiJurusan} (${kaprodiName})`);
  } catch (error) {
    console.error('❌ Error sending schedule comment notification to admin:', error);
  }
};

export const filterSchedulesByKelas = (schedules, selectedKelas) => {
  if (!selectedKelas || selectedKelas === 'Semua') return schedules;
  return schedules.filter(schedule => schedule.namaKelas === selectedKelas);
};

export const filterSchedulesByJurusan = (schedules, selectedJurusan) => {
  if (!selectedJurusan || selectedJurusan === 'Semua') return schedules;
  return schedules.filter(schedule => 
    schedule.namaKelas && schedule.namaKelas.includes(selectedJurusan)
  );
};

export const filterSchedulesByHari = (schedules, selectedHari) => {
  if (!selectedHari || selectedHari === 'Semua') return schedules;
  return schedules.filter(schedule => schedule.hari === selectedHari);
};

export const validateForm = (formData) => {
  const errors = {};
  
  if (!formData.namaMataPelajaran) errors.namaMataPelajaran = 'Nama mata pelajaran wajib diisi';
  if (!formData.namaGuru) errors.namaGuru = 'Guru wajib dipilih';
  if (!formData.hari) errors.hari = 'Hari wajib dipilih';
  if (!formData.jamKe) errors.jamKe = 'Jam pelajaran wajib dipilih';
  if (!formData.ruangKelas) errors.ruangKelas = 'Ruang kelas wajib dipilih';
  if (!formData.jurusan) errors.jurusan = 'Jurusan wajib dipilih';
  if (!formData.namaKelas) errors.namaKelas = 'Kelas wajib dipilih';
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
