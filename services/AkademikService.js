import { db, storage } from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

class AkademikService {
  // Collection names
  static muridCollection = 'murid';
  static guruCollection = 'guru';
  static kelasCollection = 'kelas';
  static jadwalCollection = 'jadwal';
  static absensiCollection = 'absensi';
  static adminCollection = 'admin';

  // === GURU OPERATIONS ===

  // Add new guru
  static async addGuru(guru) {
    try {
      // Check if NIP already exists
      const existingNipQuery = query(
        collection(db, this.guruCollection),
        where('nip', '==', guru.nip)
      );
      const existingNip = await getDocs(existingNipQuery);

      if (!existingNip.empty) {
        throw new Error(`NIP ${guru.nip} sudah terdaftar`);
      }

      const docRef = await addDoc(collection(db, this.guruCollection), {
        ...guru,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding guru:', error);
      throw error;
    }
  }

  // Update guru
  static async updateGuru(id, guru) {
    try {
      const docRef = doc(db, this.guruCollection, id);
      await updateDoc(docRef, {
        ...guru,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating guru:', error);
      throw error;
    }
  }

  // Delete guru
  static async deleteGuru(id) {
    try {
      const docRef = doc(db, this.guruCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting guru:', error);
      throw error;
    }
  }

  // Get all guru
  static async getAllGuru() {
    try {
      const q = query(
        collection(db, this.guruCollection),
        orderBy('namaLengkap')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all guru:', error);
      return [];
    }
  }

  // === KELAS OPERATIONS ===

  // Add new kelas
  static async addKelas(kelas) {
    try {
      // Check if class name already exists for the same academic year
      const existingKelasQuery = query(
        collection(db, this.kelasCollection),
        where('namaKelas', '==', kelas.namaKelas),
        where('tahunAjaran', '==', kelas.tahunAjaran)
      );
      const existingKelas = await getDocs(existingKelasQuery);

      if (!existingKelas.empty) {
        throw new Error(`Kelas ${kelas.namaKelas} sudah ada untuk tahun ajaran ${kelas.tahunAjaran}`);
      }

      const docRef = await addDoc(collection(db, this.kelasCollection), {
        ...kelas,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding kelas:', error);
      throw error;
    }
  }

  // Update kelas
  static async updateKelas(id, kelas) {
    try {
      const docRef = doc(db, this.kelasCollection, id);
      await updateDoc(docRef, {
        ...kelas,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating kelas:', error);
      throw error;
    }
  }

  // Delete kelas
  static async deleteKelas(id) {
    try {
      const docRef = doc(db, this.kelasCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting kelas:', error);
      throw error;
    }
  }

  // Get all kelas
  static async getAllKelas() {
    try {
      const q = query(
        collection(db, this.kelasCollection),
        orderBy('namaKelas')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all kelas:', error);
      return [];
    }
  }

  // === JADWAL OPERATIONS ===

  // Add new jadwal
  static async addJadwal(jadwal) {
    try {
      // Check for schedule conflicts
      const existingJadwalQuery = query(
        collection(db, this.jadwalCollection),
        where('hari', '==', jadwal.hari),
        where('tahunAjaran', '==', jadwal.tahunAjaran),
        where('semester', '==', jadwal.semester)
      );
      const existingJadwal = await getDocs(existingJadwalQuery);

      for (const docSnapshot of existingJadwal.docs) {
        const existing = { id: docSnapshot.id, ...docSnapshot.data() };
        if (this.isBentrokWith(jadwal, existing)) {
          throw new Error('Jadwal bentrok dengan jadwal yang sudah ada');
        }
      }

      const docRef = await addDoc(collection(db, this.jadwalCollection), {
        ...jadwal,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding jadwal:', error);
      throw error;
    }
  }

  // Update jadwal
  static async updateJadwal(id, jadwal) {
    try {
      const docRef = doc(db, this.jadwalCollection, id);
      await updateDoc(docRef, {
        ...jadwal,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating jadwal:', error);
      throw error;
    }
  }

  // Delete jadwal
  static async deleteJadwal(id) {
    try {
      const docRef = doc(db, this.jadwalCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting jadwal:', error);
      throw error;
    }
  }

  // Get jadwal by kelas
  static async getJadwalByKelas(kelasId) {
    try {
      const q = query(
        collection(db, this.jadwalCollection),
        where('kelasId', '==', kelasId)
      );
      const querySnapshot = await getDocs(q);
      
      const jadwalList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort locally
      jadwalList.sort((a, b) => {
        const hariComparison = this.getHariIndex(a.hari) - this.getHariIndex(b.hari);
        if (hariComparison !== 0) return hariComparison;
        return a.jamKe - b.jamKe;
      });

      return jadwalList;
    } catch (error) {
      console.error('Error getting jadwal by kelas:', error);
      return [];
    }
  }

  // Get jadwal by guru
  static async getJadwalByGuru(guruId) {
    try {
      const q = query(
        collection(db, this.jadwalCollection),
        where('guruId', '==', guruId)
      );
      const querySnapshot = await getDocs(q);
      
      const jadwalList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort locally
      jadwalList.sort((a, b) => {
        const hariComparison = this.getHariIndex(a.hari) - this.getHariIndex(b.hari);
        if (hariComparison !== 0) return hariComparison;
        return a.jamKe - b.jamKe;
      });

      return jadwalList;
    } catch (error) {
      console.error('Error getting jadwal by guru:', error);
      return [];
    }
  }

  // Get all jadwal
  static async getAllJadwal() {
    try {
      const querySnapshot = await getDocs(collection(db, this.jadwalCollection));
      
      const jadwalList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort locally
      jadwalList.sort((a, b) => {
        const hariComparison = this.getHariIndex(a.hari) - this.getHariIndex(b.hari);
        if (hariComparison !== 0) return hariComparison;
        return a.jamKe - b.jamKe;
      });

      return jadwalList;
    } catch (error) {
      console.error('Error getting all jadwal:', error);
      return [];
    }
  }
  
  // Helper function to get day index for sorting
  static getHariIndex(hari) {
    switch (hari.toLowerCase()) {
      case 'senin':
        return 1;
      case 'selasa':
        return 2;
      case 'rabu':
        return 3;
      case 'kamis':
        return 4;
      case 'jumat':
        return 5;
      case 'sabtu':
        return 6;
      case 'minggu':
        return 7;
      default:
        return 0;
    }
  }

  // Helper function to check schedule conflicts
  static isBentrokWith(jadwal1, jadwal2) {
    // Check if same day, same time slot, and overlapping classes or teachers
    return (
      jadwal1.hari === jadwal2.hari &&
      jadwal1.jamKe === jadwal2.jamKe &&
      (jadwal1.kelasId === jadwal2.kelasId || jadwal1.guruId === jadwal2.guruId)
    );
  }

  // === ABSENSI OPERATIONS ===

  // Add absensi
  static async addAbsensi(absensi) {
    try {
      const docRef = await addDoc(collection(db, this.absensiCollection), {
        ...absensi,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding absensi:', error);
      return null;
    }
  }

  // Update absensi
  static async updateAbsensi(id, absensi) {
    try {
      const docRef = doc(db, this.absensiCollection, id);
      await updateDoc(docRef, {
        ...absensi,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating absensi:', error);
      throw error;
    }
  }

  // Get absensi by kelas and date
  static async getAbsensiByKelasAndDate(kelasId, tanggal) {
    try {
      const startOfDay = new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate());
      const endOfDay = new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate(), 23, 59, 59);

      const q = query(
        collection(db, this.absensiCollection),
        where('kelasId', '==', kelasId),
        where('tanggal', '>=', Timestamp.fromDate(startOfDay)),
        where('tanggal', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('tanggal'),
        orderBy('namaSiswa')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting absensi by kelas and date:', error);
      return [];
    }
  }

  // Get statistik absensi by siswa
  static async getStatistikAbsensiBySiswa(siswaId, semester, tahunAjaran) {
    try {
      const q = query(
        collection(db, this.absensiCollection),
        where('siswaId', '==', siswaId),
        where('semester', '==', semester),
        where('tahunAjaran', '==', tahunAjaran)
      );
      
      const querySnapshot = await getDocs(q);
      const absensiList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return this.calculateStatistikAbsensi(absensiList);
    } catch (error) {
      console.error('Error getting statistik absensi:', error);
      return {
        totalHadir: 0,
        totalIzin: 0,
        totalSakit: 0,
        totalAlpa: 0,
        totalTerlambat: 0,
        totalPertemuan: 0,
      };
    }
  }

  // Calculate statistik absensi
  static calculateStatistikAbsensi(absensiList) {
    const stats = {
      totalHadir: 0,
      totalIzin: 0,
      totalSakit: 0,
      totalAlpa: 0,
      totalTerlambat: 0,
      totalPertemuan: absensiList.length,
    };

    absensiList.forEach(absensi => {
      switch (absensi.statusAbsensi) {
        case 'Hadir':
          stats.totalHadir++;
          break;
        case 'Izin':
          stats.totalIzin++;
          break;
        case 'Sakit':
          stats.totalSakit++;
          break;
        case 'Alpa':
          stats.totalAlpa++;
          break;
        case 'Terlambat':
          stats.totalTerlambat++;
          break;
      }
    });

    return stats;
  }

  // === DASHBOARD STATISTICS ===

  // Get dashboard statistics
  static async getDashboardStatistics() {
    try {
      // Get total counts
      const muridSnapshot = await getDocs(collection(db, this.muridCollection));
      const guruSnapshot = await getDocs(collection(db, this.guruCollection));
      const kelasSnapshot = await getDocs(collection(db, this.kelasCollection));
      const mapelCount = 30; // Fixed count as per original

      // Get murid statistics by jurusan
      const muridList = muridSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const muridTKJ = muridList.filter(m => m.jurusan === 'TKJ').length;
      const muridTKR = muridList.filter(m => m.jurusan === 'TKR').length;
      const muridAktif = muridList.filter(m => m.statusSiswa === 'Aktif').length;

      // Get guru statistics by status
      const guruList = guruSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const guruAktif = guruList.length; // All guru considered active
      const guruPNS = guruList.filter(g => g.statusKepegawaian === 'PNS').length;

      // Get today's attendance
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const absensiHariIniQuery = query(
        collection(db, this.absensiCollection),
        where('tanggal', '>=', Timestamp.fromDate(startOfDay)),
        where('tanggal', '<=', Timestamp.fromDate(endOfDay))
      );
      
      const absensiHariIni = await getDocs(absensiHariIniQuery);
      const absensiList = absensiHariIni.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const hadirHariIni = absensiList.filter(a => a.statusAbsensi === 'Hadir').length;
      const izinHariIni = absensiList.filter(a => a.statusAbsensi === 'Izin').length;
      const sakitHariIni = absensiList.filter(a => a.statusAbsensi === 'Sakit').length;
      const alpaHariIni = absensiList.filter(a => a.statusAbsensi === 'Alpa').length;

      return {
        totalMurid: muridSnapshot.docs.length,
        totalGuru: guruSnapshot.docs.length,
        totalKelas: kelasSnapshot.docs.length,
        totalMataPelajaran: mapelCount,
        muridTKJ,
        muridTKR,
        muridAktif,
        guruAktif,
        guruPNS,
        absensiHariIni: {
          hadir: hadirHariIni,
          izin: izinHariIni,
          sakit: sakitHariIni,
          alpa: alpaHariIni,
          total: absensiList.length,
        },
      };
    } catch (error) {
      console.error('Error getting dashboard statistics:', error);
      return {};
    }
  }

  // === LAPORAN OPERATIONS ===

  // Generate laporan absensi
  static async generateLaporanAbsensi({ kelasId, startDate, endDate }) {
    try {
      const q = query(
        collection(db, this.absensiCollection),
        where('kelasId', '==', kelasId),
        where('tanggal', '>=', Timestamp.fromDate(startDate)),
        where('tanggal', '<=', Timestamp.fromDate(endDate)),
        orderBy('tanggal'),
        orderBy('namaSiswa')
      );
      
      const querySnapshot = await getDocs(q);
      const absensiList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Group by siswa
      const absensiPerSiswa = {};
      for (const absensi of absensiList) {
        if (!absensiPerSiswa[absensi.siswaId]) {
          absensiPerSiswa[absensi.siswaId] = [];
        }
        absensiPerSiswa[absensi.siswaId].push(absensi);
      }

      // Calculate statistics per siswa
      const laporanPerSiswa = [];
      for (const [siswaId, absensiSiswa] of Object.entries(absensiPerSiswa)) {
        const statistik = this.calculateStatistikAbsensi(absensiSiswa);

        laporanPerSiswa.push({
          siswaId,
          namaSiswa: absensiSiswa[0].namaSiswa,
          statistik,
          absensiDetail: absensiSiswa,
        });
      }

      return {
        periode: {
          startDate,
          endDate,
        },
        kelasId,
        namaKelas: absensiList.length > 0 ? absensiList[0].namaKelas : '',
        totalPertemuan: absensiList.length,
        laporanPerSiswa,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating laporan absensi:', error);
      return {};
    }
  }

  // === STORAGE OPERATIONS ===

  // Upload file
  static async uploadFile(file, folder, fileName) {
    try {
      const storageRef = ref(storage, `${folder}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }

  // Delete file
  static async deleteFile(fileUrl) {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  // === UTILITY FUNCTIONS ===

  // Get current academic year
  static getCurrentAcademicYear() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    
    // Academic year starts in July
    if (now.getMonth() >= 6) { // July is month 6 (0-indexed)
      return `${currentYear}/${nextYear.toString().substring(2)}`;
    } else {
      return `${currentYear - 1}/${currentYear.toString().substring(2)}`;
    }
  }

  // Get current semester
  static getCurrentSemester() {
    const now = new Date();
    const month = now.getMonth() + 1; // Convert to 1-indexed
    // Semester ganjil: July - December
    // Semester genap: January - June
    return (month >= 7 && month <= 12) ? 'Ganjil' : 'Genap';
  }

  // Initialize default data
  static async initializeDefaultData() {
    try {
      // Initialize default admin if not exists
      const adminSnapshot = await getDocs(collection(db, this.adminCollection));
      
      if (adminSnapshot.empty) {
        const batch = writeBatch(db);
        
        // Add super admin
        const superAdminRef = doc(collection(db, this.adminCollection));
        batch.set(superAdminRef, {
          username: 'superadmin',
          password: 'admin123', // Note: In production, use proper hashing
          namaLengkap: 'Super Administrator',
          email: 'superadmin@simara.com',
          role: 'superadmin',
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastLogin: null
        });
        
        // Add default admin
        const adminRef = doc(collection(db, this.adminCollection));
        batch.set(adminRef, {
          username: 'admin',
          password: 'admin123', // Note: In production, use proper hashing
          namaLengkap: 'Administrator',
          email: 'admin@simara.com',
          role: 'admin',
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastLogin: null
        });
        
        await batch.commit();
        console.log('Default admin accounts initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }
  
  // === ADMIN OPERATIONS ===
  
  // Login admin
  static async loginAdmin(username, password) {
    try {
      const q = query(
        collection(db, this.adminCollection),
        where('username', '==', username),
        where('password', '==', password), // Note: In production, use proper hashing
        where('isActive', '==', true),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const admin = {
          id: adminDoc.id,
          ...adminDoc.data()
        };
        
        // Update last login
        await updateDoc(doc(db, this.adminCollection, admin.id), {
          lastLogin: Timestamp.now()
        });
        
        return {
          ...admin,
          lastLogin: new Date()
        };
      }
      return null;
    } catch (error) {
      console.error('Error login admin:', error);
      return null;
    }
  }
  
  // Get admin by ID
  static async getAdminById(id) {
    try {
      const docRef = doc(db, this.adminCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting admin:', error);
      return null;
    }
  }
  
  // Add admin
  static async addAdmin(admin) {
    try {
      // Check if username already exists
      const existingUsernameQuery = query(
        collection(db, this.adminCollection),
        where('username', '==', admin.username)
      );
      const existingUsername = await getDocs(existingUsernameQuery);

      if (!existingUsername.empty) {
        throw new Error(`Username ${admin.username} sudah digunakan`);
      }

      const docRef = await addDoc(collection(db, this.adminCollection), {
        ...admin,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error;
    }
  }
  
  // Update admin
  static async updateAdmin(id, admin) {
    try {
      const docRef = doc(db, this.adminCollection, id);
      await updateDoc(docRef, {
        ...admin,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating admin:', error);
      throw error;
    }
  }
  
  // Get all admin
  static async getAllAdmin() {
    try {
      const q = query(
        collection(db, this.adminCollection),
        orderBy('namaLengkap')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all admin:', error);
      return [];
    }
  }
}

export default AkademikService;
