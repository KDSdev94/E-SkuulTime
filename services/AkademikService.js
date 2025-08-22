import { db } from '../config/firebase.js';
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

class AkademikService {
  static muridCollection = 'murid';
  static guruCollection = 'guru';
  static kelasCollection = 'kelas';
  static jadwalCollection = 'jadwal';
  static adminCollection = 'admin';

  static async addGuru(guru) {
    try {
      console.log('Data guru yang diterima:', guru);
      
      // Validate required fields to prevent undefined values
      if (!guru.nip || guru.nip === undefined || guru.nip === '') {
        throw new Error('NIP tidak boleh kosong');
      }
      
      if (!guru.nama || guru.nama === undefined || guru.nama === '') {
        throw new Error('Nama guru tidak boleh kosong');
      }
      
      if (!guru.email || guru.email === undefined || guru.email === '') {
        throw new Error('Email tidak boleh kosong');
      }
      
      // Clean up ALL fields to prevent undefined values
      const cleanGuru = {
        nip: guru.nip,
        nama: guru.nama,
        email: guru.email,
        waliKelas: guru.waliKelas || '',
        urlFoto: guru.urlFoto || '',
        // Add other common fields that might be undefined
        alamat: guru.alamat || '',
        noTelepon: guru.noTelepon || '',
        jenisKelamin: guru.jenisKelamin || '',
        tanggalLahir: guru.tanggalLahir || '',
        statusKepegawaian: guru.statusKepegawaian || '',
        bidangKeahlian: guru.bidangKeahlian || '',
        namaLengkap: guru.namaLengkap || guru.nama || '',
        // Add timestamp
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      console.log('Data guru yang sudah dibersihkan:', cleanGuru);
      
      // Check for any undefined values in cleanGuru
      const undefinedFields = Object.entries(cleanGuru)
        .filter(([key, value]) => value === undefined)
        .map(([key]) => key);
      
      if (undefinedFields.length > 0) {
        console.error('Field yang masih undefined:', undefinedFields);
        throw new Error(`Field berikut masih undefined: ${undefinedFields.join(', ')}`);
      }
      
      const existingNipQuery = query(
        collection(db, this.guruCollection),
        where('nip', '==', cleanGuru.nip)
      );
      const existingNip = await getDocs(existingNipQuery);

      if (!existingNip.empty) {
        throw new Error(`NIP ${cleanGuru.nip} sudah terdaftar`);
      }

      const existingEmailQuery = query(
        collection(db, this.guruCollection),
        where('email', '==', cleanGuru.email)
      );
      const existingEmail = await getDocs(existingEmailQuery);

      if (!existingEmail.empty) {
        throw new Error(`Email ${cleanGuru.email} sudah terdaftar`);
      }

      console.log('Akan menyimpan data guru:', cleanGuru);
      const docRef = await addDoc(collection(db, this.guruCollection), cleanGuru);
      console.log('Guru berhasil disimpan dengan ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding guru:', error);
      throw error;
    }
  }

  static async updateGuru(id, guru) {
    try {
      const docRef = doc(db, this.guruCollection, id);
      await updateDoc(docRef, {
        ...guru,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      
      throw error;
    }
  }

  static async deleteGuru(id) {
    try {
      const docRef = doc(db, this.guruCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      
      throw error;
    }
  }

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
      
      return [];
    }
  }

  static async addKelas(kelas) {
    try {
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
      
      throw error;
    }
  }

  static async updateKelas(id, kelas) {
    try {
      const docRef = doc(db, this.kelasCollection, id);
      await updateDoc(docRef, {
        ...kelas,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      
      throw error;
    }
  }

  static async deleteKelas(id) {
    try {
      const docRef = doc(db, this.kelasCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      
      throw error;
    }
  }

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
      
      return [];
    }
  }

  static async addJadwal(jadwal) {
    try {
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
      
      throw error;
    }
  }

  static async updateJadwal(id, jadwal) {
    try {
      const docRef = doc(db, this.jadwalCollection, id);
      await updateDoc(docRef, {
        ...jadwal,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      
      throw error;
    }
  }

  static async deleteJadwal(id) {
    try {
      const docRef = doc(db, this.jadwalCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      
      throw error;
    }
  }

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
      
      jadwalList.sort((a, b) => {
        const hariComparison = this.getHariIndex(a.hari) - this.getHariIndex(b.hari);
        if (hariComparison !== 0) return hariComparison;
        return a.jamKe - b.jamKe;
      });

      return jadwalList;
    } catch (error) {
      
      return [];
    }
  }

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
      
      jadwalList.sort((a, b) => {
        const hariComparison = this.getHariIndex(a.hari) - this.getHariIndex(b.hari);
        if (hariComparison !== 0) return hariComparison;
        return a.jamKe - b.jamKe;
      });

      return jadwalList;
    } catch (error) {
      
      return [];
    }
  }

  static async getAllJadwal() {
    try {
      const querySnapshot = await getDocs(collection(db, this.jadwalCollection));
      
      const jadwalList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      jadwalList.sort((a, b) => {
        const hariComparison = this.getHariIndex(a.hari) - this.getHariIndex(b.hari);
        if (hariComparison !== 0) return hariComparison;
        return a.jamKe - b.jamKe;
      });

      return jadwalList;
    } catch (error) {
      
      return [];
    }
  }
  
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

  static isBentrokWith(jadwal1, jadwal2) {
    return (
      jadwal1.hari === jadwal2.hari &&
      jadwal1.jamKe === jadwal2.jamKe &&
      (jadwal1.kelasId === jadwal2.kelasId || jadwal1.guruId === jadwal2.guruId)
    );
  }

  static async getDashboardStatistics() {
    try {
      const muridSnapshot = await getDocs(collection(db, this.muridCollection));
      const guruSnapshot = await getDocs(collection(db, this.guruCollection));
      const kelasSnapshot = await getDocs(collection(db, this.kelasCollection));
      const mapelCount = 30; // Fixed count as per original

      const muridList = muridSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const muridTKJ = muridList.filter(m => m.jurusan === 'TKJ').length;
      const muridTKR = muridList.filter(m => m.jurusan === 'TKR').length;
      const muridAktif = muridList.filter(m => m.statusSiswa === 'Aktif').length;

      const guruList = guruSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const guruAktif = guruList.length; // All guru considered active
      const guruPNS = guruList.filter(g => g.statusKepegawaian === 'PNS').length;

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
      };
    } catch (error) {
      
      return {};
    }
  }


  static getCurrentAcademicYear() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    
    if (now.getMonth() >= 6) { // July is month 6 (0-indexed)
      return `${currentYear}/${nextYear.toString().substring(2)}`;
    } else {
      return `${currentYear - 1}/${currentYear.toString().substring(2)}`;
    }
  }

  static getCurrentSemester() {
    const now = new Date();
    const month = now.getMonth() + 1; // Convert to 1-indexed
    return (month >= 7 && month <= 12) ? 'Ganjil' : 'Genap';
  }

  static async initializeDefaultData() {
    try {
      const adminSnapshot = await getDocs(collection(db, this.adminCollection));
      
      if (adminSnapshot.empty) {
        const batch = writeBatch(db);
        
        const superAdminRef = doc(collection(db, this.adminCollection));
        batch.set(superAdminRef, {
          username: 'superadmin',
          password: 'admin123', // Note: In production, use proper hashing
          namaLengkap: 'Super Administrator',
          email: 'superadmin@eskuultime.com',
          role: 'superadmin',
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastLogin: null
        });
        
        const adminRef = doc(collection(db, this.adminCollection));
        batch.set(adminRef, {
          username: 'admin',
          password: 'admin123', // Note: In production, use proper hashing
          namaLengkap: 'Administrator',
          email: 'admin@eskuultime.com',
          role: 'admin',
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastLogin: null
        });
        
        await batch.commit();
        
      }
    } catch (error) {
      
    }
  }

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
      
      return null;
    }
  }
  
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
      
      return null;
    }
  }
  
  static async addAdmin(admin) {
    try {
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
      
      throw error;
    }
  }
  
  static async updateAdmin(id, admin) {
    try {
      const docRef = doc(db, this.adminCollection, id);
      await updateDoc(docRef, {
        ...admin,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      
      throw error;
    }
  }
  
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
      
      return [];
    }
  }
}

export default AkademikService;

