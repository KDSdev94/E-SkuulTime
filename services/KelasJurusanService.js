import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, writeBatch, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import ActivityService from './ActivityService';
import GuruService from './GuruService';

class KelasJurusanService {
  static jurusanCollection = 'jurusan';
  static kelasCollection = 'kelas';
  
  // ==================== JURUSAN MANAGEMENT ====================
  
  /**
   * Menambah jurusan baru
   */
  static async addJurusan(jurusanData, adminName = 'Admin') {
    try {
      // Check if jurusan already exists
      const existingQuery = query(
        collection(db, this.jurusanCollection),
        where('kode', '==', jurusanData.kode)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        throw new Error(`Jurusan dengan kode ${jurusanData.kode} sudah ada`);
      }

      const jurusanWithTimestamp = {
        ...jurusanData,
        aktif: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.jurusanCollection), jurusanWithTimestamp);
      
      await ActivityService.logActivity('CREATE', 'jurusan', jurusanWithTimestamp, adminName);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding jurusan:', error);
      throw error;
    }
  }

  /**
   * Mengupdate data jurusan
   */
  static async updateJurusan(id, jurusanData, adminName = 'Admin') {
    try {
      const updatedJurusan = { 
        ...jurusanData, 
        updatedAt: Timestamp.now() 
      };
      
      await updateDoc(doc(db, this.jurusanCollection, id), updatedJurusan);
      
      await ActivityService.logActivity('UPDATE', 'jurusan', updatedJurusan, adminName);
    } catch (error) {
      console.error('Error updating jurusan:', error);
      throw error;
    }
  }

  /**
   * Menghapus jurusan
   */
  static async deleteJurusan(id, adminName = 'Admin') {
    try {
      const jurusanData = await this.getJurusanById(id);
      
      // Check if there are classes using this jurusan
      const kelasQuery = query(
        collection(db, this.kelasCollection),
        where('jurusanId', '==', id)
      );
      const kelasSnapshot = await getDocs(kelasQuery);
      
      if (!kelasSnapshot.empty) {
        throw new Error('Tidak dapat menghapus jurusan yang masih memiliki kelas');
      }
      
      await deleteDoc(doc(db, this.jurusanCollection, id));
      
      if (jurusanData) {
        await ActivityService.logActivity('DELETE', 'jurusan', jurusanData, adminName);
      }
    } catch (error) {
      console.error('Error deleting jurusan:', error);
      throw error;
    }
  }

  /**
   * Mengambil semua jurusan yang aktif
   */
  static async getAllJurusan() {
    try {
      // Get all documents and filter in memory for consistency with getAllKelas
      const querySnapshot = await getDocs(collection(db, this.jurusanCollection));
      
      // Process all documents and filter aktif ones in memory
      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Include documents that are aktif=true or don't have aktif field (assume active)
        // Exclude only explicitly inactive (aktif=false)
        if (data.aktif !== false) {
          results.push({
            id: doc.id,
            ...data,
            // Ensure aktif field is set properly
            aktif: data.aktif !== undefined ? data.aktif : true
          });
        }
      });
      
      // Sort by nama in memory
      return results.sort((a, b) => a.nama?.localeCompare(b.nama) || 0);
    } catch (error) {
      console.error('Error getting all jurusan:', error);
      return [];
    }
  }

  /**
   * Mengambil jurusan berdasarkan ID
   */
  static async getJurusanById(id) {
    try {
      const docSnap = await getDoc(doc(db, this.jurusanCollection, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting jurusan by id:', error);
      return null;
    }
  }

  // ==================== KELAS MANAGEMENT ====================

  /**
   * Menambah kelas baru
   */
  static async addKelas(kelasData, adminName = 'Admin') {
    try {
      // Check if kelas already exists
      const existingQuery = query(
        collection(db, this.kelasCollection),
        where('nama', '==', kelasData.nama)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        throw new Error(`Kelas ${kelasData.nama} sudah ada`);
      }

      const kelasWithTimestamp = {
        ...kelasData,
        aktif: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.kelasCollection), kelasWithTimestamp);
      
      await ActivityService.logActivity('CREATE', 'kelas', kelasWithTimestamp, adminName);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding kelas:', error);
      throw error;
    }
  }

  /**
   * Mengupdate data kelas
   */
  static async updateKelas(id, kelasData, adminName = 'Admin') {
    try {
      const updatedKelas = { 
        ...kelasData, 
        updatedAt: Timestamp.now() 
      };
      
      await updateDoc(doc(db, this.kelasCollection, id), updatedKelas);
      
      await ActivityService.logActivity('UPDATE', 'kelas', updatedKelas, adminName);
    } catch (error) {
      console.error('Error updating kelas:', error);
      throw error;
    }
  }

  /**
   * Menghapus kelas
   */
  static async deleteKelas(id, adminName = 'Admin') {
    try {
      const kelasData = await this.getKelasById(id);
      
      await deleteDoc(doc(db, this.kelasCollection, id));
      
      if (kelasData) {
        await ActivityService.logActivity('DELETE', 'kelas', kelasData, adminName);
      }
    } catch (error) {
      console.error('Error deleting kelas:', error);
      throw error;
    }
  }

  /**
   * Mengambil semua kelas yang aktif
   */
  static async getAllKelas() {
    try {
      // First try to get all documents and filter in memory
      // This is more flexible than relying on Firestore query filters
      const querySnapshot = await getDocs(collection(db, this.kelasCollection));
      
      // Process all documents and filter aktif ones in memory
      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Include documents that are aktif=true or don't have aktif field (assume active)
        // Exclude only explicitly inactive (aktif=false)
        if (data.aktif !== false) {
          results.push({
            id: doc.id,
            ...data,
            // Ensure aktif field is set properly
            aktif: data.aktif !== undefined ? data.aktif : true
          });
        }
      });
      
      // If no results found, try to initialize default data
      if (results.length === 0 && querySnapshot.size === 0) {
        console.log('⚠️ No kelas data found, attempting to initialize default data...');
        try {
          await this.initializeDefaultData();
          // Recursive call to get the newly created data
          return await this.getAllKelas();
        } catch (initError) {
          console.error('Error initializing default data:', initError);
        }
      }
      
      // Sort by nama in memory
      return results.sort((a, b) => a.nama?.localeCompare(b.nama) || 0);
    } catch (error) {
      console.error('Error getting all kelas:', error);
      return [];
    }
  }

  /**
   * Mengambil kelas berdasarkan jurusan
   */
  static async getKelasByJurusan(jurusanId) {
    try {
      const q = query(
        collection(db, this.kelasCollection),
        where('jurusanId', '==', jurusanId),
        where('aktif', '==', true)
      );
      const querySnapshot = await getDocs(q);

      // Sort in memory instead of using orderBy
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by nama in memory
      return results.sort((a, b) => a.nama?.localeCompare(b.nama) || 0);
    } catch (error) {
      console.error('Error getting kelas by jurusan:', error);
      return [];
    }
  }

  /**
   * Mengambil kelas berdasarkan kode jurusan
   */
  static async getKelasByKodeJurusan(kodeJurusan) {
    try {
      // First get jurusan by kode
      const jurusanQuery = query(
        collection(db, this.jurusanCollection),
        where('kode', '==', kodeJurusan),
        where('aktif', '==', true)
      );
      const jurusanSnapshot = await getDocs(jurusanQuery);
      
      if (jurusanSnapshot.empty) {
        return [];
      }

      const jurusanId = jurusanSnapshot.docs[0].id;
      return await this.getKelasByJurusan(jurusanId);
    } catch (error) {
      console.error('Error getting kelas by kode jurusan:', error);
      return [];
    }
  }

  /**
   * Mengambil kelas berdasarkan ID
   */
  static async getKelasById(id) {
    try {
      const docSnap = await getDoc(doc(db, this.kelasCollection, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting kelas by id:', error);
      return null;
    }
  }

// ==================== UTILITY FUNCTIONS ====================

  /**
   * Get wali kelas name by class name
   */
  static async getWaliKelasByClassName(namaKelas) {
    try {
      // Get all teachers
      const allGuru = await GuruService.getAllGuru();
      
      // Find teacher who is wali kelas for this class
      const waliKelas = allGuru.find(guru => guru.waliKelas === namaKelas);
      
      return waliKelas ? waliKelas.namaLengkap : null;
    } catch (error) {
      console.error('Error getting wali kelas name:', error);
      return null;
    }
  }

  /**
   * Get wali kelas name by class ID (legacy function)
   */
  static async getWaliKelasNameByKelasId(kelasId) {
    try {
      // Get the class document
      const kelasDoc = await getDoc(doc(db, this.kelasCollection, kelasId));
      if (!kelasDoc.exists()) return null;
      const kelasData = kelasDoc.data();

      // If class has waliKelasId field, use it
      if (kelasData.waliKelasId) {
        const waliKelasDoc = await GuruService.getGuruById(kelasData.waliKelasId);
        return waliKelasDoc ? waliKelasDoc.namaLengkap : null;
      }
      
      // Otherwise, search by class name
      return await this.getWaliKelasByClassName(kelasData.nama);
    } catch (error) {
      console.error('Error getting wali kelas name:', error);
      return null;
    }
  }

  /**
   * Mengambil data lengkap kelas dan jurusan
   */
  static async getKelasJurusanData() {
    try {
      const [jurusanList, kelasList] = await Promise.all([
        this.getAllJurusan(),
        this.getAllKelas()
      ]);

      // Group kelas by jurusan
      const kelasGrouped = {};
      const jurusanMap = {};

      // Create jurusan map for easy lookup
      jurusanList.forEach(jurusan => {
        jurusanMap[jurusan.id] = jurusan;
        kelasGrouped[jurusan.kode] = [];
      });

      // Group kelas by jurusan kode
      kelasList.forEach(kelas => {
        const jurusan = jurusanMap[kelas.jurusanId];
        if (jurusan) {
          kelasGrouped[jurusan.kode].push(kelas.nama);
        }
      });

      return {
        jurusan: jurusanList.map(j => j.kode),
        kelas: kelasGrouped,
        jurusanDetail: jurusanList,
        kelasDetail: kelasList
      };
    } catch (error) {
      console.error('Error getting kelas jurusan data:', error);
      return {
        jurusan: [],
        kelas: {},
        jurusanDetail: [],
        kelasDetail: []
      };
    }
  }

  /**
   * Inisialisasi data default (jika diperlukan)
   */
  static async initializeDefaultData() {
    try {
      // Check if data already exists
      const jurusanSnapshot = await getDocs(collection(db, this.jurusanCollection));
      if (!jurusanSnapshot.empty) {
        console.log('Data jurusan sudah ada, skip inisialisasi');
        return;
      }

      const batch = writeBatch(db);

      // Default jurusan data
      const defaultJurusan = [
        {
          kode: 'TKJ',
          nama: 'Teknik Komputer dan Jaringan',
          deskripsi: 'Program keahlian yang mempelajari teknologi komputer dan jaringan',
          aktif: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        {
          kode: 'TKR',
          nama: 'Teknik Kendaraan Ringan',
          deskripsi: 'Program keahlian yang mempelajari teknologi otomotif kendaraan ringan',
          aktif: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      ];

      // Add jurusan
      const jurusanRefs = [];
      defaultJurusan.forEach(jurusan => {
        const docRef = doc(collection(db, this.jurusanCollection));
        batch.set(docRef, jurusan);
        jurusanRefs.push({ id: docRef.id, ...jurusan });
      });

      await batch.commit();

      // Add default kelas
      const batch2 = writeBatch(db);
      const tkjRef = jurusanRefs.find(j => j.kode === 'TKJ');
      const tkrRef = jurusanRefs.find(j => j.kode === 'TKR');

      const defaultKelas = [
        // TKJ Classes
        { nama: 'X TKJ 1', tingkat: 'X', jurusanId: tkjRef.id, aktif: true },
        { nama: 'X TKJ 2', tingkat: 'X', jurusanId: tkjRef.id, aktif: true },
        { nama: 'XI TKJ 1', tingkat: 'XI', jurusanId: tkjRef.id, aktif: true },
        { nama: 'XI TKJ 2', tingkat: 'XI', jurusanId: tkjRef.id, aktif: true },
        { nama: 'XII TKJ 1', tingkat: 'XII', jurusanId: tkjRef.id, aktif: true },
        { nama: 'XII TKJ 2', tingkat: 'XII', jurusanId: tkjRef.id, aktif: true },
        
        // TKR Classes
        { nama: 'X TKR 1', tingkat: 'X', jurusanId: tkrRef.id, aktif: true },
        { nama: 'X TKR 2', tingkat: 'X', jurusanId: tkrRef.id, aktif: true },
        { nama: 'XI TKR 1', tingkat: 'XI', jurusanId: tkrRef.id, aktif: true },
        { nama: 'XI TKR 2', tingkat: 'XI', jurusanId: tkrRef.id, aktif: true },
        { nama: 'XII TKR 1', tingkat: 'XII', jurusanId: tkrRef.id, aktif: true },
        { nama: 'XII TKR 2', tingkat: 'XII', jurusanId: tkrRef.id, aktif: true }
      ];

      defaultKelas.forEach(kelas => {
        const docRef = doc(collection(db, this.kelasCollection));
        batch2.set(docRef, {
          ...kelas,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      });

      await batch2.commit();

      console.log('Default data initialized successfully');
    } catch (error) {
      console.error('Error initializing default data:', error);
      throw error;
    }
  }

  /**
   * Mengambil statistik kelas
   */
  static async getKelasStatistics() {
    try {
      const [jurusanList, kelasList] = await Promise.all([
        this.getAllJurusan(),
        this.getAllKelas()
      ]);
      
      // Count active classes and departments
      const totalKelas = kelasList.filter(kelas => kelas.aktif !== false).length;
      const totalJurusan = jurusanList.filter(jurusan => jurusan.aktif !== false).length;
      
      // Group classes by jurusan
      const kelasByJurusan = {};
      kelasList.forEach(kelas => {
        const jurusan = jurusanList.find(j => j.id === kelas.jurusanId);
        if (jurusan) {
          const jurusanKode = jurusan.kode;
          if (!kelasByJurusan[jurusanKode]) {
            kelasByJurusan[jurusanKode] = 0;
          }
          kelasByJurusan[jurusanKode]++;
        }
      });
      
      // Group by tingkat
      const kelasByTingkat = {
        'X': 0,
        'XI': 0,
        'XII': 0
      };
      
      kelasList.forEach(kelas => {
        if (kelas.tingkat && kelasByTingkat.hasOwnProperty(kelas.tingkat)) {
          kelasByTingkat[kelas.tingkat]++;
        }
      });
      
      return {
        total: totalKelas,
        totalJurusan: totalJurusan,
        kelasByJurusan: kelasByJurusan,
        kelasByTingkat: kelasByTingkat,
        jurusanDetail: jurusanList,
        kelasDetail: kelasList
      };
    } catch (error) {
      console.error('Error getting kelas statistics:', error);
      return {
        total: 0,
        totalJurusan: 0,
        kelasByJurusan: {},
        kelasByTingkat: { 'X': 0, 'XI': 0, 'XII': 0 },
        jurusanDetail: [],
        kelasDetail: []
      };
    }
  }

  /**
   * Menghapus semua data (untuk testing/reset)
   */
  static async deleteAllData() {
    try {
      const [jurusanSnapshot, kelasSnapshot] = await Promise.all([
        getDocs(collection(db, this.jurusanCollection)),
        getDocs(collection(db, this.kelasCollection))
      ]);

      const batch = writeBatch(db);

      jurusanSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      kelasSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return {
        deletedJurusan: jurusanSnapshot.docs.length,
        deletedKelas: kelasSnapshot.docs.length
      };
    } catch (error) {
      console.error('Error deleting all data:', error);
      throw error;
    }
  }
}

export default KelasJurusanService;
