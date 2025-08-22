import app, { db } from '../config/firebase.js';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, Timestamp, setDoc, query, where, orderBy } from 'firebase/firestore';
import { createNotification, createKaprodiNotification } from './notificationService';
import ActivityService from './ActivityService';
import JadwalService from './JadwalService.js';

class LaporanJadwalService {
  constructor() {
    this.collectionName = 'laporan_jadwal';
  }

  // Buat laporan jadwal baru
  async createLaporanJadwal(laporanData, adminName = 'Admin') {
    try {
      const laporanId = `laporan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const completeData = {
        id: laporanId,
        jurusan: laporanData.jurusan,
        kelas: laporanData.kelas,
        totalJadwal: laporanData.totalJadwal || 0,
        status: 'draft', // draft, menunggu_persetujuan, disetujui, ditolak, dipublikasi
        createdBy: adminName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        jadwalData: laporanData.jadwalData || [],
        keterangan: laporanData.keterangan || '',
        periode: laporanData.periode || this.getCurrentPeriode(),
        tahunAjaran: laporanData.tahunAjaran || '2024/2025',
        semester: laporanData.semester || 'Ganjil'
      };

      const docRef = doc(db, this.collectionName, laporanId);
      await setDoc(docRef, completeData);

      await ActivityService.logJadwalActivity('CREATE_LAPORAN', completeData, adminName);

      return laporanId;
    } catch (error) {
      console.error('Error creating laporan jadwal:', error);
      throw error;
    }
  }

  // Ambil semua laporan jadwal
  async getAllLaporanJadwal() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, this.collectionName), orderBy('createdAt', 'desc'))
      );
      const laporanList = [];
      querySnapshot.forEach((doc) => {
        laporanList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      return laporanList;
    } catch (error) {
      console.error('Error getting laporan jadwal:', error);
      throw error;
    }
  }

  // Ambil laporan berdasarkan ID
  async getLaporanJadwalById(laporanId) {
    try {
      const laporanRef = doc(db, this.collectionName, laporanId);
      const laporanSnap = await getDoc(laporanRef);
      
      if (laporanSnap.exists()) {
        return {
          id: laporanSnap.id,
          ...laporanSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting laporan jadwal by ID:', error);
      return null;
    }
  }

  // Kirim laporan ke kaprodi untuk persetujuan
  async sendToKaprodi(laporanId, targetJurusan = null, adminName = 'Admin') {
    try {
      console.log(`🚀 Sending laporan to kaprodi:`, { laporanId, targetJurusan, adminName });
      
      const laporanRef = doc(db, this.collectionName, laporanId);
      const laporanSnap = await getDoc(laporanRef);
      
      if (!laporanSnap.exists()) {
        throw new Error('Laporan tidak ditemukan');
      }

      const laporanData = laporanSnap.data();
      console.log(`📋 Laporan data found:`, laporanData);
      
      // Jika targetJurusan diberikan, update jurusan pada laporan
      const updateData = {
        status: 'menunggu_persetujuan',
        submittedAt: Timestamp.now(),
        submittedBy: adminName,
        updatedAt: Timestamp.now()
      };
      
      if (targetJurusan) {
        updateData.targetKaprodi = targetJurusan;
      }
      
      // Update status laporan
      console.log(`📝 Updating laporan status...`);
      await updateDoc(laporanRef, updateData);
      console.log(`✅ Laporan status updated successfully`);

      // Tentukan jurusan untuk notifikasi
      const jurusanTarget = targetJurusan || laporanData.jurusan;
      console.log(`🎯 Target jurusan for notification: ${jurusanTarget}`);
      
      // Validate jurusan
      if (!jurusanTarget) {
        throw new Error('Jurusan tidak dapat ditentukan untuk notifikasi kaprodi');
      }
      
      // Setup sender info for notifications
      const senderInfo = {
        name: adminName,
        type: 'admin',
        id: 'admin'
      };
      
      // Kirim notifikasi ke kaprodi menggunakan createKaprodiNotification
      const notificationData = {
        kelas: laporanData.kelas,
        jurusan: laporanData.jurusan,
        totalJadwal: laporanData.totalJadwal,
        submittedBy: adminName,
        subject: 'jadwal',
        message: `Laporan jadwal untuk kelas ${laporanData.kelas} telah dikirim untuk persetujuan. Total: ${laporanData.totalJadwal} jadwal.`
      };
      
      console.log(`📬 Creating kaprodi notification with data:`, notificationData);
      await createKaprodiNotification(jurusanTarget, 'approval_request', notificationData, senderInfo);
      console.log(`✅ Kaprodi notification created successfully`);

      try {
        await ActivityService.logJadwalActivity('SEND_TO_KAPRODI', {
          ...laporanData,
          targetKaprodi: jurusanTarget
        }, adminName);
        console.log(`✅ Activity logged successfully`);
      } catch (activityError) {
        console.warn(`⚠️ Failed to log activity, continuing:`, activityError);
        // Don't throw error here, as the main operation succeeded
      }

      console.log(`🎉 Successfully sent laporan to kaprodi ${jurusanTarget}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending to kaprodi:', error);
      throw error;
    }
  }

  // Setujui laporan (fungsi kaprodi)
  async approveLaporanJadwal(laporanId, kaprodiName = 'Kaprodi', userRole = 'kaprodi') {
    try {
      const laporanRef = doc(db, this.collectionName, laporanId);
      const laporanSnap = await getDoc(laporanRef);
      
      if (!laporanSnap.exists()) {
        throw new Error('Laporan tidak ditemukan');
      }

      const laporanData = laporanSnap.data();

      // Update status laporan
      await updateDoc(laporanRef, {
        status: 'disetujui',
        approvedAt: Timestamp.now(),
        approvedBy: kaprodiName,
        updatedAt: Timestamp.now()
      });

      // Setup sender info for notifications
      const senderInfo = {
        name: kaprodiName,
        type: 'kaprodi',
        id: userRole === 'kaprodi_tkj' ? 'kaprodi_tkj' : 'kaprodi_tkr'
      };

      await ActivityService.logJadwalActivity('APPROVE_LAPORAN', laporanData, kaprodiName);

      return { success: true };
    } catch (error) {
      console.error('Error approving laporan jadwal:', error);
      throw error;
    }
  }

  // Tolak laporan (fungsi kaprodi)
  async rejectLaporanJadwal(laporanId, kaprodiName = 'Kaprodi', userRole = 'kaprodi', reason = '', notes = '') {
    try {
      const laporanRef = doc(db, this.collectionName, laporanId);
      const laporanSnap = await getDoc(laporanRef);
      
      if (!laporanSnap.exists()) {
        throw new Error('Laporan tidak ditemukan');
      }

      const laporanData = laporanSnap.data();

      // Update status laporan dengan catatan tambahan
      await updateDoc(laporanRef, {
        status: 'ditolak',
        rejectedAt: Timestamp.now(),
        rejectedBy: kaprodiName,
        rejectionReason: reason,
        rejectionNotes: notes || reason, // Catatan tambahan dari kaprodi
        updatedAt: Timestamp.now()
      });

      // Kirim notifikasi ke admin dengan senderInfo
      const senderInfo = {
        name: kaprodiName,
        type: 'kaprodi',
        id: userRole === 'kaprodi_tkj' ? 'kaprodi_tkj' : 'kaprodi_tkr'
      };
      
      // Pesan notifikasi yang lebih detail dengan catatan
      const detailMessage = notes && notes !== reason 
        ? `\n\nCatatan: ${notes}`
        : '';
      
      const message = `❌ Laporan jadwal untuk kelas ${laporanData.kelas} (${laporanData.jurusan}) telah ditolak oleh ${kaprodiName}.\n\nAlasan: ${reason}${detailMessage}`;
      await createNotification('admin', message, senderInfo, 'jadwal');

      await ActivityService.logJadwalActivity('REJECT_LAPORAN', { 
        ...laporanData, 
        rejectionReason: reason,
        rejectionNotes: notes 
      }, kaprodiName);

      return { success: true };
    } catch (error) {
      console.error('Error rejecting laporan jadwal:', error);
      throw error;
    }
  }

  // Publikasi jadwal ke guru dan murid (fungsi admin)
  async publishSchedule(laporanId, adminName = 'Admin') {
    try {
      const laporanRef = doc(db, this.collectionName, laporanId);
      const laporanSnap = await getDoc(laporanRef);
      
      if (!laporanSnap.exists()) {
        throw new Error('Laporan tidak ditemukan');
      }

      const laporanData = laporanSnap.data();

      // Pastikan laporan sudah disetujui
      if (laporanData.status !== 'disetujui') {
        throw new Error('Laporan belum disetujui oleh kaprodi');
      }

      // Update status laporan
      await updateDoc(laporanRef, {
        status: 'dipublikasi',
        publishedAt: Timestamp.now(),
        publishedBy: adminName,
        updatedAt: Timestamp.now()
      });

      // Setup sender info for notifications (from admin to others)
      const adminSenderInfo = {
        name: adminName,
        type: 'admin',
        id: 'admin'
      };

      // Notifikasi ke guru yang terkait
      const affectedTeachers = new Set();
      if (laporanData.jadwalData && Array.isArray(laporanData.jadwalData)) {
        laporanData.jadwalData.forEach(jadwal => {
          if (jadwal.guruId && jadwal.guruId !== '-') {
            affectedTeachers.add(jadwal.guruId);
          }
        });
      }

      // Notifikasi ke guru terkait
      console.log(`👨‍🏫 Notifying ${affectedTeachers.size} teachers about schedule publication`);
      const teacherMessage = `Jadwal pelajaran untuk kelas ${laporanData.kelas} (${laporanData.jurusan}) telah dipublikasi. Silakan cek aplikasi.`;
      for (const teacherId of affectedTeachers) {
        try {
          await createNotification(teacherId, teacherMessage, adminSenderInfo, 'jadwal', 'guru');
          console.log(`✅ Successfully notified teacher: ${teacherId}`);
        } catch (notifError) {
          console.error(`❌ Failed to notify teacher ${teacherId}:`, notifError);
        }
      }

      // Import MuridService to get students by class
      const MuridService = await import('./MuridService.js');
      
      try {
        const studentsInClass = await MuridService.default.getMuridByKelas(laporanData.kelas);
        
        console.log(`👨‍🎓 Notifying ${studentsInClass.length} students in class ${laporanData.kelas}`);
        
        const studentMessage = `📅 Jadwal pelajaran kelas ${laporanData.kelas} telah dipublikasi. Silakan cek aplikasi.`;
        
        // Process students in batches to avoid overwhelming Firebase
        const batchSize = 5;
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < studentsInClass.length; i += batchSize) {
          const batch = studentsInClass.slice(i, i + batchSize);
          console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(studentsInClass.length/batchSize)} (students ${i+1}-${Math.min(i+batchSize, studentsInClass.length)})`);
          
          // Process batch with Promise.allSettled to handle individual failures
          const batchPromises = batch.map(async (student) => {
            try {
              await createNotification(student.id, studentMessage, adminSenderInfo, 'jadwal', 'murid');
              return { success: true, student: student.namaLengkap };
            } catch (error) {
              return { success: false, student: student.namaLengkap, error: error.message };
            }
          });
          
          const batchResults = await Promise.allSettled(batchPromises);
          
          // Process batch results
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              if (result.value.success) {
                console.log(`✅ Successfully notified student: ${result.value.student}`);
                successCount++;
              } else {
                console.error(`❌ Failed to notify student: ${result.value.student} - ${result.value.error}`);
                errorCount++;
              }
            } else {
              console.error(`❌ Batch processing error for student ${batch[index]?.namaLengkap}:`, result.reason);
              errorCount++;
            }
          });
          
          // Add delay between batches to avoid rate limiting
          if (i + batchSize < studentsInClass.length) {
            console.log(`⏳ Waiting 2s before next batch...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        console.log(`📊 Student Notification Summary - Success: ${successCount}, Failures: ${errorCount}`);
        
        // Log overall success rate
        const successRate = ((successCount / studentsInClass.length) * 100).toFixed(1);
        console.log(`📈 Success Rate: ${successRate}% (${successCount}/${studentsInClass.length})`);
        
      } catch (error) {
        console.error('🚨 Error fetching students for notification:', error);
      }

      await ActivityService.logJadwalActivity('PUBLISH_SCHEDULE', laporanData, adminName);

      console.log(`🗓 Jadwal berhasil dipublikasi dengan ID: ${laporanId}`);

      return { success: true };
    } catch (error) {
      console.error('Error publishing schedule:', error);
      throw error;
    }
  }

  // Ambil statistik laporan jadwal
  async getStatistics() {
    try {
      const allLaporan = await this.getAllLaporanJadwal();
      
      // Debug: Log semua status yang ada
      console.log('Debug - All laporan status:', allLaporan.map(l => ({ id: l.id, status: l.status, kelas: l.kelas, jurusan: l.jurusan })));
      
      const stats = {
        total: allLaporan.length,
        draft: allLaporan.filter(l => l.status === 'draft').length,
        menunggu_persetujuan: allLaporan.filter(l => l.status === 'menunggu_persetujuan').length,
        disetujui: allLaporan.filter(l => l.status === 'disetujui').length,
        ditolak: allLaporan.filter(l => l.status === 'ditolak').length,
        dipublikasi: allLaporan.filter(l => l.status === 'dipublikasi').length,
      };

      console.log('Debug - Statistics:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        total: 0,
        draft: 0,
        menunggu_persetujuan: 0,
        disetujui: 0,
        ditolak: 0,
        dipublikasi: 0
      };
    }
  }

  // Ambil laporan berdasarkan status
  async getLaporanByStatus(status) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const laporanList = [];
      querySnapshot.forEach((doc) => {
        laporanList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      return laporanList;
    } catch (error) {
      console.error('Error getting laporan by status:', error);
      throw error;
    }
  }

  // Hapus laporan jadwal
  async deleteLaporanJadwal(laporanId, adminName = 'Admin') {
    try {
      const laporanData = await this.getLaporanJadwalById(laporanId);
      
      await deleteDoc(doc(db, this.collectionName, laporanId));

      if (laporanData) {
        await ActivityService.logJadwalActivity('DELETE_LAPORAN', laporanData, adminName);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting laporan jadwal:', error);
      throw error;
    }
  }

  // Generate periode saat ini
  getCurrentPeriode() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (month >= 7) {
      return `${year}/${year + 1} Semester Ganjil`;
    } else {
      return `${year - 1}/${year} Semester Genap`;
    }
  }

  // Buat laporan jadwal dari data jadwal yang sudah ada
  async createLaporanFromExistingSchedule(kelasData, adminName = 'Admin') {
    try {
      // Ambil semua jadwal untuk kelas tertentu
      const allJadwal = await JadwalService.getAllJadwal();
      const kelasJadwal = allJadwal.filter(jadwal => jadwal.namaKelas === kelasData.namaKelas);

      if (kelasJadwal.length === 0) {
        throw new Error(`Tidak ada jadwal ditemukan untuk kelas ${kelasData.namaKelas}`);
      }

      // Tentukan jurusan berdasarkan nama kelas
      const jurusan = kelasData.namaKelas.includes('TKJ') ? 'TKJ' : 'TKR';

      const laporanData = {
        jurusan: jurusan,
        kelas: kelasData.namaKelas,
        totalJadwal: kelasJadwal.length,
        jadwalData: kelasJadwal,
        keterangan: `Laporan jadwal untuk kelas ${kelasData.namaKelas} periode ${this.getCurrentPeriode()}`
      };

      return await this.createLaporanJadwal(laporanData, adminName);
    } catch (error) {
      console.error('Error creating laporan from existing schedule:', error);
      throw error;
    }
  }
}

export default LaporanJadwalService;
