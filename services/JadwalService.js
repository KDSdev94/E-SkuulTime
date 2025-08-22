import app, { db } from '../config/firebase.node.js';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, Timestamp, setDoc } from 'firebase/firestore';
import ActivityService from './ActivityService.js';

class JadwalService {
  constructor() {
    this.collectionName = 'jadwal';
  }

  static getJamPelajaranSMK() {
    return [
      { jamKe: 1, jamMulai: '07:00', jamSelesai: '07:45' },
      { jamKe: 2, jamMulai: '07:45', jamSelesai: '08:30' },
      { jamKe: 3, jamMulai: '08:30', jamSelesai: '09:15' },
      { jamKe: 4, jamMulai: '09:30', jamSelesai: '10:15' }, // Setelah istirahat 15 menit
      { jamKe: 5, jamMulai: '10:15', jamSelesai: '11:00' },
      { jamKe: 6, jamMulai: '11:00', jamSelesai: '11:45' },
      { jamKe: 7, jamMulai: '12:30', jamSelesai: '13:15' }, // Setelah istirahat sholat/makan
      { jamKe: 8, jamMulai: '13:15', jamSelesai: '14:00' },
      { jamKe: 9, jamMulai: '14:00', jamSelesai: '14:45' },
      { jamKe: 10, jamMulai: '14:45', jamSelesai: '15:30' },
    ];
  }

  static getHariEfektif() {
    return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  }

  static getRuangKelasDefault() {
    return [
      'R.1', 'R.2', 'R.3', 'R.4', 'R.5', 'R.6',
      'Lab. Komputer 1', 'Lab. Komputer 2', 'Lab. TKR',
      'Workshop TKJ', 'Workshop TKR', 'Perpustakaan'
    ];
  }

  static generateMapelId(namaMataPelajaran) {
    const mapelMap = {
      'Pendidikan Agama dan Budi Pekerti': 'A1',
      'PPKn (Pendidikan Pancasila dan Kewarganegaraan)': 'A2', 
      'Bahasa Indonesia': 'A3',
      'Matematika': 'A4',
      'Sejarah Indonesia': 'A5',
      'Bahasa Inggris': 'A6',
      
      'Seni Budaya': 'B1',
      'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)': 'B2',
      'Bahasa Daerah': 'B3',
      'Prakarya dan Kewirausahaan': 'B4',
      
      'Komputer dan Jaringan Dasar': 'C1',
      'Pemrograman Dasar': 'C2',
      'Desain Grafis': 'C3',
      'Sistem Komputer': 'C4',
      'Simulasi dan Komunikasi Digital': 'C5',
      'Administrasi Infrastruktur Jaringan (AIJ)': 'C6',
      'Teknologi Jaringan Berbasis Luas (WAN)': 'C7',
      'Administrasi Sistem Jaringan (ASJ)': 'C8',
      'Teknologi Layanan Jaringan (TLJ)': 'C9',
      'Produk Kreatif dan Kewirausahaan': 'C10',
      
      'Gambar Teknik Otomotif': 'C11',
      'Teknologi Dasar Otomotif': 'C12',
      'Pekerjaan Dasar Teknik Otomotif': 'C13',
      'Pemeliharaan Mesin Kendaraan Ringan': 'C14',
      'Pemeliharaan Sasis dan Pemindah Tenaga': 'C15',
      'Pemeliharaan Kelistrikan Kendaraan Ringan': 'C16',
      
      'MC': 'S1',
      'Istirahat': 'S2',
      'Feed Back': 'S3',
      'Green & Clean': 'S4'
    };
    
    return mapelMap[namaMataPelajaran] || 'X1'; // Default untuk mapel tidak dikenal
  }

  static generateGuruSuffix(guruId, namaMataPelajaran, allSchedules = []) {
    const teachersForSubject = new Set();
    allSchedules.forEach(schedule => {
      if (schedule.namaMataPelajaran === namaMataPelajaran && schedule.guruId) {
        teachersForSubject.add(schedule.guruId);
      }
    });
    
    const sortedTeachers = Array.from(teachersForSubject).sort();
    // Pastikan guruId adalah string sebelum menggunakan indexOf
    const teacherIndex = typeof guruId === 'string' ? sortedTeachers.indexOf(guruId) : -1;
    
    return String.fromCharCode(97 + (teacherIndex >= 0 ? teacherIndex : sortedTeachers.length));
  }

  static generateJadwalDocId(jadwalData) {
    // Validasi jadwalData untuk mencegah error
    const namaKelas = jadwalData.namaKelas || 'Unknown';
    const hari = jadwalData.hari || 'Unknown';
    const jamKe = jadwalData.jamKe || 1;
    
    const kelasClean = namaKelas.replace(/\s+/g, '-').toUpperCase();
    const hariClean = hari.toUpperCase();
    const jamKeString = jamKe.toString();
    
    return `${kelasClean}_${hariClean}_${jamKeString}`;
  }

  async checkDocIdExists(docId) {
    try {
      const docRef = doc(db, this.collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      return false;
    }
  }

  async generateUniqueDocId(jadwalData) {
    const baseId = JadwalService.generateJadwalDocId(jadwalData);
    let docId = baseId;
    let counter = 1;
    
    while (await this.checkDocIdExists(docId)) {
      docId = `${baseId}_${counter}`;
      counter++;
    }
    
    return docId;
  }

  async addJadwal(jadwalData, adminName = 'Admin') {
    try {
      const existingSchedules = await this.getAllJadwal();
      
      const mapelId = JadwalService.generateMapelId(jadwalData.namaMataPelajaran);
      
      const guruSuffix = jadwalData.guruId && jadwalData.guruId !== '-' ? 
        JadwalService.generateGuruSuffix(jadwalData.guruId, jadwalData.namaMataPelajaran, existingSchedules) : '';
      
      const mapelGuruId = guruSuffix ? `${mapelId}${guruSuffix}` : mapelId;
      
      const documentId = await this.generateUniqueDocId(jadwalData);
      
      const completeData = {
        ...jadwalData,
        mapelId: mapelId,
        mapelGuruId: mapelGuruId,
        guruSuffix: guruSuffix,
        documentId: documentId, // Store the document ID in the data for reference
        status: 'draft', // draft, approved, published
        approvalStatus: 'pending', // pending, approved, rejected
        isPublished: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = doc(db, this.collectionName, documentId);
      await setDoc(docRef, completeData);
      
      await ActivityService.logJadwalActivity('CREATE', completeData, adminName);
      
      console.log('📝 Jadwal berhasil dibuat dengan status draft:', documentId);
      
      return documentId;
    } catch (error) {
      console.error('❌ Error saat membuat jadwal:', error);
      throw error;
    }
  }

  async createJadwal(jadwalData) {
    return this.addJadwal(jadwalData);
  }

  static async createJadwal(jadwalData) {
    const service = new JadwalService();
    return service.addJadwal(jadwalData);
  }

  async getAllJadwal() {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const jadwalList = [];
      querySnapshot.forEach((doc) => {
        jadwalList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      return jadwalList;
    } catch (error) {
      
      throw error;
    }
  }

  async getJadwalById(jadwalId) {
    try {
      const jadwalRef = doc(db, this.collectionName, jadwalId);
      const jadwalSnap = await getDoc(jadwalRef);
      
      if (jadwalSnap.exists()) {
        return {
          id: jadwalSnap.id,
          ...jadwalSnap.data()
        };
      }
      return null;
    } catch (error) {
      
      return null;
    }
  }

  async updateJadwal(jadwalId, updatedData, adminName = 'Admin') {
    try {
      const existingSchedules = await this.getAllJadwal();
      
      const mapelId = updatedData.namaMataPelajaran ? 
        JadwalService.generateMapelId(updatedData.namaMataPelajaran) : undefined;
      
      const guruSuffix = updatedData.guruId && updatedData.guruId !== '-' && updatedData.namaMataPelajaran ? 
        JadwalService.generateGuruSuffix(updatedData.guruId, updatedData.namaMataPelajaran, existingSchedules) : '';
      
      const mapelGuruId = mapelId && guruSuffix ? `${mapelId}${guruSuffix}` : mapelId;
      
      const jadwalRef = doc(db, this.collectionName, jadwalId);
      const dataWithTimestamp = {
        ...updatedData,
        ...(mapelId && { mapelId }),
        ...(mapelGuruId && { mapelGuruId }),
        ...(guruSuffix !== undefined && { guruSuffix }),
        updatedAt: Timestamp.now(),
      };
      await updateDoc(jadwalRef, dataWithTimestamp);

      await ActivityService.logJadwalActivity('UPDATE', dataWithTimestamp, adminName);
    } catch (error) {
      
      throw error;
    }
  }

  async deleteJadwal(jadwalId, adminName = 'Admin') {
    try {
      const jadwalData = await this.getJadwalById(jadwalId);
      
      await deleteDoc(doc(db, this.collectionName, jadwalId));

      if (jadwalData) {
        await ActivityService.logJadwalActivity('DELETE', jadwalData, adminName);
      }
    } catch (error) {
      
      throw error;
    }
  }

  async deleteAllJadwal() {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deletePromises);
      return querySnapshot.size;
    } catch (error) {
      
      throw error;
    }
  }

  static async getAllJadwal() {
    const service = new JadwalService();
    return service.getAllJadwal();
  }

  async getSchedulesByClass(classId) {
    try {
      // For students, only show published schedules
      const publishedSchedules = await this.getPublishedSchedules();
      return publishedSchedules.filter(schedule => 
        schedule.kelasId === classId || schedule.namaKelas === classId
      );
    } catch (error) {
      
      throw error;
    }
  }

  async getSchedulesByTeacher(teacherId) {
    try {
      // For teachers, only show published schedules
      const publishedSchedules = await this.getPublishedSchedules();
      
      
      const filteredSchedules = publishedSchedules.filter(schedule => {
      const matchByGuruId = schedule.guruId !== '-' && schedule.guruId === teacherId;
      const matchByNamaGuru = schedule.namaGuru !== '-' && schedule.namaGuru === teacherId;
      const matchByNipGuru = schedule.nipGuru !== undefined && schedule.nipGuru === teacherId;
        
        if (matchByGuruId || matchByNamaGuru || matchByNipGuru) {
          return true;
        }
        
        return false;
      });
      
      return filteredSchedules;
    } catch (error) {
      console.error('❌ Error in getSchedulesByTeacher:', error);
      throw error;
    }
  }

  static async getSchedulesByClass(classId) {
    const service = new JadwalService();
    return service.getSchedulesByClass(classId);
  }

  static async getSchedulesByTeacher(teacherId) {
    const service = new JadwalService();
    return service.getSchedulesByTeacher(teacherId);
  }

  static async deleteAllJadwal() {
    const service = new JadwalService();
    return service.deleteAllJadwal();
  }

  static async updateJadwal(jadwalId, updatedData) {
    const service = new JadwalService();
    return service.updateJadwal(jadwalId, updatedData);
  }

  static async addJadwal(jadwalData, adminName = 'Admin') {
    const service = new JadwalService();
    return service.addJadwal(jadwalData, adminName);
  }

  static checkJadwalConflict(newJadwal, existingJadwals) {
    return existingJadwals.filter(existing => {
      if (existing.hari !== newJadwal.hari) return false;

      if (existing.guruId === newJadwal.guruId) return true;

      if (existing.ruangKelas === newJadwal.ruangKelas) return true;

      const newStart = JadwalService.timeToMinutes(newJadwal.jamMulai);
      const newEnd = JadwalService.timeToMinutes(newJadwal.jamSelesai);
      const existingStart = JadwalService.timeToMinutes(existing.jamMulai);
      const existingEnd = JadwalService.timeToMinutes(existing.jamSelesai);

      return (newStart < existingEnd && newEnd > existingStart);
    });
  }

  static timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  static getMapelNameFromId(mapelId) {
    const idToNameMap = {
      'A1': 'Pendidikan Agama dan Budi Pekerti',
      'A2': 'PPKn (Pendidikan Pancasila dan Kewarganegaraan)',
      'A3': 'Bahasa Indonesia',
      'A4': 'Matematika',
      'A5': 'Sejarah Indonesia',
      'A6': 'Bahasa Inggris',
      
      'B1': 'Seni Budaya',
      'B2': 'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)',
      'B3': 'Bahasa Daerah',
      'B4': 'Prakarya dan Kewirausahaan',
      
      'C1': 'Komputer dan Jaringan Dasar',
      'C2': 'Pemrograman Dasar',
      'C3': 'Desain Grafis',
      'C4': 'Sistem Komputer',
      'C5': 'Simulasi dan Komunikasi Digital',
      'C6': 'Administrasi Infrastruktur Jaringan (AIJ)',
      'C7': 'Teknologi Jaringan Berbasis Luas (WAN)',
      'C8': 'Administrasi Sistem Jaringan (ASJ)',
      'C9': 'Teknologi Layanan Jaringan (TLJ)',
      'C10': 'Produk Kreatif dan Kewirausahaan',
      
      'C11': 'Gambar Teknik Otomotif',
      'C12': 'Teknologi Dasar Otomotif',
      'C13': 'Pekerjaan Dasar Teknik Otomotif',
      'C14': 'Pemeliharaan Mesin Kendaraan Ringan',
      'C15': 'Pemeliharaan Sasis dan Pemindah Tenaga',
      'C16': 'Pemeliharaan Kelistrikan Kendaraan Ringan',
      
      'S1': 'MC',
      'S2': 'Istirahat',
      'S3': 'Feed Back',
      'S4': 'Green & Clean'
    };
    
    return idToNameMap[mapelId] || 'Unknown Subject';
  }

  static getMapelCategoryFromId(mapelId) {
    if (mapelId.startsWith('A')) {
      return { kelompok: 'A', kategori: 'Wajib Nasional' };
    } else if (mapelId.startsWith('B')) {
      return { kelompok: 'B', kategori: 'Wajib Kewilayahan' };
    } else if (mapelId.startsWith('C')) {
      const mapelNumber = parseInt(mapelId.substring(1));
      if (mapelNumber <= 10) {
        return { kelompok: 'C', kategori: 'Muatan Peminatan Kejuruan', jurusan: 'TKJ' };
      } else {
        return { kelompok: 'C', kategori: 'Muatan Peminatan Kejuruan', jurusan: 'TKR' };
      }
    } else if (mapelId.startsWith('S')) {
      return { kelompok: 'S', kategori: 'Aktivitas Khusus' };
    }
    return { kelompok: 'X', kategori: 'Unknown' };
  }

  static parseMapelGuruId(mapelGuruId) {
    if (!mapelGuruId) return null;
    
    const lastChar = mapelGuruId.slice(-1);
    const isLastCharLetter = /[a-z]/.test(lastChar);
    
    if (isLastCharLetter) {
      const mapelId = mapelGuruId.slice(0, -1);
      const guruSuffix = lastChar;
      return {
        mapelId,
        guruSuffix,
        mapelName: this.getMapelNameFromId(mapelId),
        category: this.getMapelCategoryFromId(mapelId)
      };
    } else {
      return {
        mapelId: mapelGuruId,
        guruSuffix: '',
        mapelName: this.getMapelNameFromId(mapelGuruId),
        category: this.getMapelCategoryFromId(mapelGuruId)
      };
    }
  }

async getJadwalStatistics(jurusanFilter = null) {
    try {
      const allJadwal = await this.getAllJadwal();
      
      // Filter jadwal by jurusan if specified
      const filteredJadwal = jurusanFilter
        ? allJadwal.filter(jadwal => {
            // Extract jurusan from class name (e.g., "X TKJ 1" -> "TKJ")
            if (jadwal.namaKelas) {
              const kelas = jadwal.namaKelas.toUpperCase();
              if (jurusanFilter === 'TKJ' && kelas.includes('TKJ')) {
                return true;
              }
              if (jurusanFilter === 'TKR' && kelas.includes('TKR')) {
                return true;
              }
            }
            return false;
          })
        : allJadwal;
      
      // Initialize counters
      let totalJadwal = filteredJadwal.length;
      let jadwalPerHari = {
        'Senin': 0,
        'Selasa': 0,
        'Rabu': 0,
        'Kamis': 0,
        'Jumat': 0
      };
      let jadwalPerKelas = {};
      let jadwalPerGuru = {};
      let jadwalPerMapel = {};
      let jadwalKosong = 0;
      
      // Process each jadwal (use filtered data for counting)
      for (const jadwal of filteredJadwal) {
        // Count by day
        if (jadwal.hari && jadwalPerHari.hasOwnProperty(jadwal.hari)) {
          jadwalPerHari[jadwal.hari]++;
        }
        
        // Count by class
        if (jadwal.namaKelas) {
          jadwalPerKelas[jadwal.namaKelas] = (jadwalPerKelas[jadwal.namaKelas] || 0) + 1;
        }
        
        // Count by teacher
        if (jadwal.namaGuru && jadwal.namaGuru !== '-') {
          jadwalPerGuru[jadwal.namaGuru] = (jadwalPerGuru[jadwal.namaGuru] || 0) + 1;
        } else {
          jadwalKosong++;
        }
        
        // Count by subject
        if (jadwal.namaMataPelajaran) {
          jadwalPerMapel[jadwal.namaMataPelajaran] = (jadwalPerMapel[jadwal.namaMataPelajaran] || 0) + 1;
        }
      }
      
      // Calculate additional statistics
      const totalKelas = Object.keys(jadwalPerKelas).length;
      const totalGuru = Object.keys(jadwalPerGuru).length;
      const totalMapel = Object.keys(jadwalPerMapel).length;
      const jadwalTerisi = totalJadwal - jadwalKosong;
      const persentaseTerisi = totalJadwal > 0 ? Math.round((jadwalTerisi / totalJadwal) * 100) : 0;
      
      return {
        total: totalJadwal,
        terisi: jadwalTerisi,
        kosong: jadwalKosong,
        persentaseTerisi: persentaseTerisi,
        totalKelas: totalKelas,
        totalGuru: totalGuru,
        totalMapel: totalMapel,
        jadwalPerHari: jadwalPerHari,
        jadwalPerKelas: jadwalPerKelas,
        jadwalPerGuru: jadwalPerGuru,
        jadwalPerMapel: jadwalPerMapel
      };
    } catch (error) {
      console.error('Error getting jadwal statistics:', error);
      return {
        total: 0,
        terisi: 0,
        kosong: 0,
        persentaseTerisi: 0,
        totalKelas: 0,
        totalGuru: 0,
        totalMapel: 0,
        jadwalPerHari: { 'Senin': 0, 'Selasa': 0, 'Rabu': 0, 'Kamis': 0, 'Jumat': 0 },
        jadwalPerKelas: {},
        jadwalPerGuru: {},
        jadwalPerMapel: {}
      };
    }
  }

  static async getJadwalStatistics(jurusanFilter = null) {
    const service = new JadwalService();
    return service.getJadwalStatistics(jurusanFilter);
  }

  // Approve schedules (Kaprodi function) - ONLY APPROVE, NOT PUBLISH
  async approveSchedules(scheduleIds, kaprodiName = 'Kaprodi', userRole = 'kaprodi') {
    try {
      const results = [];
      
      for (const scheduleId of scheduleIds) {
        const jadwalRef = doc(db, this.collectionName, scheduleId);
        const jadwalSnap = await getDoc(jadwalRef);
        
        if (!jadwalSnap.exists()) {
          console.warn(`Jadwal ${scheduleId} tidak ditemukan`);
          continue;
        }

        const jadwalData = jadwalSnap.data();
        
        // ONLY UPDATE APPROVAL STATUS - DO NOT PUBLISH YET
        await updateDoc(jadwalRef, {
          approvalStatus: 'approved',
          approvedAt: Timestamp.now(),
          approvedBy: kaprodiName,
          updatedAt: Timestamp.now()
          // NOTE: status stays 'draft', isPublished stays false
          // Admin will publish later
        });
        
        results.push({ id: scheduleId, approved: true });
        console.log(`📋 Jadwal disetujui (belum dipublikasi): ${jadwalData.namaKelas} - ${jadwalData.namaMataPelajaran}`);
      }
      
      // Log activity for approval only
      await ActivityService.logJadwalActivity('APPROVE_SCHEDULES', {
        schedulesCount: results.length
      }, kaprodiName);
      
      return { success: true, results };
    } catch (error) {
      console.error('Error approving schedules:', error);
      throw error;
    }
  }

  // Publish approved schedules (Admin function)
  async publishApprovedSchedules(scheduleIds, adminName = 'Admin', adminId = '001') {
    try {
      const { createNotification } = await import('./notificationService.js');
      const { sendSchedulePublishNotification } = await import('../scripts/sendSchedulePublishNotification.js');
      const results = [];
      const affectedClasses = new Set();
      const affectedTeachers = new Set();
      const publishedScheduleData = [];
      
      for (const scheduleId of scheduleIds) {
        const jadwalRef = doc(db, this.collectionName, scheduleId);
        const jadwalSnap = await getDoc(jadwalRef);
        
        if (!jadwalSnap.exists()) {
          console.warn(`Jadwal ${scheduleId} tidak ditemukan`);
          continue;
        }

        const jadwalData = jadwalSnap.data();
        
        // Only publish approved schedules
        if (jadwalData.approvalStatus !== 'approved') {
          console.warn(`Jadwal ${scheduleId} belum disetujui, skip publikasi`);
          continue;
        }
        
        // Update publication status
        await updateDoc(jadwalRef, {
          status: 'published',
          isPublished: true,
          publishedAt: Timestamp.now(),
          publishedBy: adminName,
          updatedAt: Timestamp.now()
        });
        
        // Collect affected classes and teachers
        if (jadwalData.namaKelas) {
          affectedClasses.add(jadwalData.namaKelas);
        }
        if (jadwalData.guruId && jadwalData.guruId !== '-') {
          affectedTeachers.add(jadwalData.guruId);
        }
        
        results.push({ id: scheduleId, published: true });
        publishedScheduleData.push(jadwalData);
        console.log(`📢 Jadwal dipublikasi: ${jadwalData.namaKelas} - ${jadwalData.namaMataPelajaran}`);
      }
      
      // Send notifications using new integrated system
      const senderInfo = {
        name: adminName,
        type: 'admin',
        id: adminId
      };
      
      // Send bulk notifications to all students by class using new system
      try {
        console.log('📧 Mengirim notifikasi publikasi jadwal ke semua murid...');
        const notificationResult = await sendSchedulePublishNotification(
          publishedScheduleData, 
          adminName, 
          adminId
        );
        
        if (notificationResult && notificationResult.success) {
          console.log(`✅ Berhasil mengirim ${notificationResult.totalNotificationsSent} notifikasi ke murid`);
          console.log(`📚 Notifikasi dikirim untuk ${notificationResult.classesProcessed} kelas`);
        }
      } catch (notificationError) {
        console.error('❌ Error saat mengirim notifikasi bulk ke murid:', notificationError);
        // Continue dengan notifikasi individual sebagai fallback
      }
      
      // Notify affected teachers
      for (const teacherId of affectedTeachers) {
        try {
          const message = `Jadwal mengajar Anda telah dipublikasi oleh ${adminName}. Silakan cek aplikasi untuk melihat jadwal terbaru.`;
          await createNotification(teacherId, message, senderInfo, 'jadwal', 'guru');
          console.log(`📧 Notifikasi terkirim ke guru: ${teacherId}`);
        } catch (error) {
          console.error(`❌ Gagal kirim notifikasi ke guru ${teacherId}:`, error);
        }
      }
      
      // Notify affected students
      try {
        const MuridService = await import('./MuridService.js');
        
        for (const className of affectedClasses) {
          try {
            const studentsInClass = await MuridService.default.getMuridByKelas(className);
            console.log(`📧 Mengirim notifikasi publikasi ke ${studentsInClass.length} murid di kelas ${className}`);
            
            const studentMessage = `📅 Jadwal pelajaran kelas ${className} telah dipublikasi oleh ${adminName}. Silakan cek aplikasi untuk melihat jadwal pelajaran Anda.`;
            
            let successCount = 0;
            let errorCount = 0;
            
            for (const student of studentsInClass) {
              try {
                await createNotification(student.id, studentMessage, senderInfo, 'jadwal', 'murid');
                successCount++;
              } catch (error) {
                console.error(`❌ Gagal kirim notifikasi ke murid ${student.namaLengkap}:`, error);
                errorCount++;
              }
            }
            
            console.log(`📊 Notifikasi ${className} - Berhasil: ${successCount}, Gagal: ${errorCount}`);
          } catch (error) {
            console.error(`❌ Error mengambil data murid kelas ${className}:`, error);
          }
        }
      } catch (error) {
        console.error('❌ Error saat mengirim notifikasi ke murid:', error);
      }
      
      await ActivityService.logJadwalActivity('PUBLISH_SCHEDULES', {
        schedulesCount: results.length,
        affectedClasses: Array.from(affectedClasses),
        affectedTeachers: Array.from(affectedTeachers)
      }, adminName);
      
      return { success: true, results, affectedClasses: Array.from(affectedClasses), affectedTeachers: Array.from(affectedTeachers) };
    } catch (error) {
      console.error('Error publishing schedules:', error);
      throw error;
    }
  }

  // Get schedules by approval status
  async getSchedulesByApprovalStatus(status = 'pending') {
    try {
      const allSchedules = await this.getAllJadwal();
      return allSchedules.filter(schedule => schedule.approvalStatus === status);
    } catch (error) {
      console.error('Error getting schedules by approval status:', error);
      throw error;
    }
  }

  // Get published schedules only (for students and teachers)
  async getPublishedSchedules() {
    try {
      const allSchedules = await this.getAllJadwal();
      return allSchedules.filter(schedule => schedule.isPublished === true);
    } catch (error) {
      console.error('Error getting published schedules:', error);
      throw error;
    }
  }

  // Static methods for the new functions
  static async approveSchedules(scheduleIds, kaprodiName, userRole) {
    const service = new JadwalService();
    return service.approveSchedules(scheduleIds, kaprodiName, userRole);
  }

  static async publishApprovedSchedules(scheduleIds, adminName, adminId = '001') {
    const service = new JadwalService();
    return service.publishApprovedSchedules(scheduleIds, adminName, adminId);
  }

  static async getSchedulesByApprovalStatus(status) {
    const service = new JadwalService();
    return service.getSchedulesByApprovalStatus(status);
  }

  static async getPublishedSchedules() {
    const service = new JadwalService();
    return service.getPublishedSchedules();
  }

}

export default JadwalService;

