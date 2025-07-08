import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, writeBatch, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

class GuruService {
  static guruCollection = 'guru';

  // === GURU OPERATIONS ===

  // Tambah guru baru
  static async addGuru(guru) {
    try {
      // Cek apakah NIP atau username sudah ada
      const existingNipQuery = query(
        collection(db, this.guruCollection),
        where('nip', '==', guru.nip)
      );
      const existingNipSnapshot = await getDocs(existingNipQuery);

      if (!existingNipSnapshot.empty) {
        throw new Error(`NIP ${guru.nip} sudah terdaftar`);
      }

      const existingUsernameQuery = query(
        collection(db, this.guruCollection),
        where('username', '==', guru.username)
      );
      const existingUsernameSnapshot = await getDocs(existingUsernameQuery);

      if (!existingUsernameSnapshot.empty) {
        throw new Error(`Username ${guru.username} sudah digunakan`);
      }

      // Tambah timestamp
      const guruWithTimestamp = {
        ...guru,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Tambah document baru
      const docRef = await addDoc(collection(db, this.guruCollection), guruWithTimestamp);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  // Update guru
  static async updateGuru(id, guru) {
    try {
      const updatedGuru = { ...guru, updatedAt: Timestamp.now() };
      await updateDoc(doc(db, this.guruCollection, id), updatedGuru);
    } catch (error) {
      throw error;
    }
  }

  // Update foto guru only
  static async updateGuruFoto(id, fotoUrl) {
    try {
      await updateDoc(doc(db, this.guruCollection, id), {
        fotoUrl: fotoUrl,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  }

  // Hapus guru
  static async deleteGuru(id) {
    try {
      await deleteDoc(doc(db, this.guruCollection, id));
    } catch (error) {
      throw error;
    }
  }

  // Get guru by ID
  static async getGuruById(id) {
    try {
      const docSnap = await getDoc(doc(db, this.guruCollection, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Get guru by NIP
  static async getGuruByNip(nip) {
    try {
      const q = query(
        collection(db, this.guruCollection),
        where('nip', '==', nip),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Get semua guru
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

  // Get guru by mata pelajaran
  static async getGuruByMapel(mapel) {
    try {
      const q = query(
        collection(db, this.guruCollection),
        where('mataPelajaran', '==', mapel),
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

  // Get guru by status
  static async getGuruByStatus(status) {
    try {
      const q = query(
        collection(db, this.guruCollection),
        where('statusPegawai', '==', status),
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

  // Get guru by jabatan
  static async getGuruByJabatan(jabatan) {
    try {
      const q = query(
        collection(db, this.guruCollection),
        where('jabatan', '==', jabatan),
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

  // Search guru by nama
  static async searchGuruByNama(nama) {
    try {
      const q = query(
        collection(db, this.guruCollection),
        where('namaLengkap', '>=', nama),
        where('namaLengkap', '<', nama + 'z')
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

  // === AUTHENTICATION ===

  // Login guru
  static async loginGuru(username, password) {
    try {
      const q = query(
        collection(db, this.guruCollection),
        where('username', '==', username),
        where('password', '==', password), // Note: Dalam production, gunakan hash
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // === STORAGE OPERATIONS ===

  // Upload foto guru
  static async uploadFotoGuru(fotoFile, nip) {
    try {
      const fileName = `guru_${nip}.jpg`;
      const storageRef = ref(storage, `guru_photos/${fileName}`);

      const snapshot = await uploadBytes(storageRef, fotoFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      return downloadUrl;
    } catch (error) {
      return null;
    }
  }

  // Hapus foto guru
  static async deleteFotoGuru(fotoUrl) {
    try {
      const storageRef = ref(storage, fotoUrl);
      await deleteObject(storageRef);
    } catch (error) {
      // Silent fail
    }
  }

  // === UTILITY FUNCTIONS ===

  // Get statistik guru
  static async getStatistikGuru() {
    try {
      const allGuru = await this.getAllGuru();

      let aktif = 0;
      let cuti = 0;
      let pensiun = 0;
      let lakiLaki = 0;
      let perempuan = 0;
      let pns = 0;
      let pppk = 0;
      let honorer = 0;

      for (const guru of allGuru) {
        // Status Aktif (default aktif jika tidak ada field statusAktif)
        const statusAktif = guru.statusAktif || 'Aktif';
        switch (statusAktif) {
          case 'Aktif':
            aktif++;
            break;
          case 'Cuti':
            cuti++;
            break;
          case 'Pensiun':
            pensiun++;
            break;
        }

        // Jenis Kelamin
        if (guru.jenisKelamin === 'Laki-laki') {
          lakiLaki++;
        } else {
          perempuan++;
        }

        // Status Kepegawaian
        switch (guru.statusKepegawaian) {
          case 'PNS':
            pns++;
            break;
          case 'PPPK':
            pppk++;
            break;
          case 'Honorer':
            honorer++;
            break;
        }
      }

      return {
        total: allGuru.length,
        aktif: aktif,
        cuti: cuti,
        pensiun: pensiun,
        laki_laki: lakiLaki,
        perempuan: perempuan,
        pns: pns,
        pppk: pppk,
        honorer: honorer,
      };
    } catch (error) {
      console.error('Error getting statistik guru:', error);
      return {};
    }
  }

  // Batch operations untuk import data banyak
  static async batchAddGuru(guruList) {
    try {
      const batch = writeBatch(db);

      for (const guru of guruList) {
        const docRef = doc(collection(db, this.guruCollection));
        // Jika belum ada timestamp, tambahkan
        const guruData = {
          ...guru,
          createdAt: guru.createdAt || Timestamp.now(),
          updatedAt: guru.updatedAt || Timestamp.now()
        };
        batch.set(docRef, guruData);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error batch adding guru:', error);
      throw error;
    }
  }

  // Hapus semua data guru
  static async deleteAllGuru() {
    try {
      const querySnapshot = await getDocs(collection(db, this.guruCollection));
      const totalDocs = querySnapshot.docs.length;

      if (totalDocs === 0) {
        return 0;
      }

      // Hapus dalam batch untuk efisiensi
      const batch = writeBatch(db);

      for (const docSnapshot of querySnapshot.docs) {
        batch.delete(docSnapshot.ref);
      }

      await batch.commit();
      return totalDocs;
    } catch (error) {
      console.error('Error deleting all guru:', error);
      throw error;
    }
  }

  // Cek apakah ada duplikat berdasarkan NIP atau username
  static async checkDuplicates(guruList) {
    try {
      let duplicateNIP = [];
      let duplicateUsername = [];
      let internalDuplicateNIP = [];
      let internalDuplicateUsername = [];

      // Cek duplikat internal dalam list yang akan diimport
      const seenNIP = new Set();
      const seenUsername = new Set();

      for (const guru of guruList) {
        if (seenNIP.has(guru.nip)) {
          internalDuplicateNIP.push(guru.nip);
        } else {
          seenNIP.add(guru.nip);
        }

        if (seenUsername.has(guru.username)) {
          internalDuplicateUsername.push(guru.username);
        } else {
          seenUsername.add(guru.username);
        }
      }

      // Cek duplikat dengan data yang sudah ada di database
      for (const guru of guruList) {
        // Cek NIP
        const existingNipQuery = query(
          collection(db, this.guruCollection),
          where('nip', '==', guru.nip),
          limit(1)
        );
        const existingNipSnapshot = await getDocs(existingNipQuery);

        if (!existingNipSnapshot.empty) {
          duplicateNIP.push(guru.nip);
        }

        // Cek Username
        const existingUsernameQuery = query(
          collection(db, this.guruCollection),
          where('username', '==', guru.username),
          limit(1)
        );
        const existingUsernameSnapshot = await getDocs(existingUsernameQuery);

        if (!existingUsernameSnapshot.empty) {
          duplicateUsername.push(guru.username);
        }
      }

      return {
        hasDuplicates: duplicateNIP.length > 0 ||
                      duplicateUsername.length > 0 ||
                      internalDuplicateNIP.length > 0 ||
                      internalDuplicateUsername.length > 0,
        duplicateNIP,
        duplicateUsername,
        internalDuplicateNIP,
        internalDuplicateUsername,
      };
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return {
        hasDuplicates: false,
        duplicateNIP: [],
        duplicateUsername: [],
        internalDuplicateNIP: [],
        internalDuplicateUsername: [],
      };
    }
  }

  // Hitung total guru yang ada
  static async getTotalGuruCount() {
    try {
      const querySnapshot = await getDocs(collection(db, this.guruCollection));
      return querySnapshot.docs.length;
    } catch (error) {
      console.error('Error getting total guru count:', error);
      return 0;
    }
  }

  // Get guru dengan filter kombinasi
  static async getGuruWithFilters(filters) {
    try {
      let q = collection(db, this.guruCollection);
      
      // Apply filters
      if (filters.mataPelajaran) {
        q = query(q, where('mataPelajaran', '==', filters.mataPelajaran));
      }
      if (filters.statusPegawai) {
        q = query(q, where('statusPegawai', '==', filters.statusPegawai));
      }
      if (filters.jenisKepegawaian) {
        q = query(q, where('jenisKepegawaian', '==', filters.jenisKepegawaian));
      }
      if (filters.jabatan) {
        q = query(q, where('jabatan', '==', filters.jabatan));
      }
      if (filters.jenisKelamin) {
        q = query(q, where('jenisKelamin', '==', filters.jenisKelamin));
      }

      // Add ordering
      q = query(q, orderBy('namaLengkap'));

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting guru with filters:', error);
      return [];
    }
  }

  // Get mata pelajaran yang tersedia
  static async getAvailableMataPelajaran() {
    try {
      const querySnapshot = await getDocs(collection(db, this.guruCollection));
      const mataPelajaranSet = new Set();

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.mataPelajaran) {
          mataPelajaranSet.add(data.mataPelajaran);
        }
      });

      return Array.from(mataPelajaranSet).sort();
    } catch (error) {
      console.error('Error getting available mata pelajaran:', error);
      return [];
    }
  }

  // Get jabatan yang tersedia
  static async getAvailableJabatan() {
    try {
      const querySnapshot = await getDocs(collection(db, this.guruCollection));
      const jabatanSet = new Set();

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.jabatan) {
          jabatanSet.add(data.jabatan);
        }
      });

      return Array.from(jabatanSet).sort();
    } catch (error) {
      console.error('Error getting available jabatan:', error);
      return [];
    }
  }

  // Update multiple guru sekaligus
  static async bulkUpdateGuru(updates) {
    try {
      const batch = writeBatch(db);

      for (const update of updates) {
        const docRef = doc(db, this.guruCollection, update.id);
        const updateData = { ...update.data, updatedAt: Timestamp.now() };
        batch.update(docRef, updateData);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating guru:', error);
      throw error;
    }
  }

  // Generate laporan guru
  static async generateLaporanGuru(filters = {}) {
    try {
      const guruList = await this.getGuruWithFilters(filters);
      const statistik = await this.getStatistikGuru();

      return {
        data: guruList,
        statistik: statistik,
        totalData: guruList.length,
        generatedAt: new Date().toISOString(),
        filters: filters
      };
    } catch (error) {
      console.error('Error generating laporan guru:', error);
      throw error;
    }
  }

  // Generate guru sample data sesuai model baru
  static async generateGuruSample() {
    try {
      const actualGuruData = {
        'Adi Wijaya, S.Tr.T': {
            'mapel': 'Dasar-Dasar Otomotif',
            'allMapel': ['Dasar-Dasar Otomotif', 'Teknik Kendaraan Ringan'],
            'jurusan': 'TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Ahmad Zaenuri, S.Si': {
            'mapel': 'Matematika',
            'allMapel': ['Matematika'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Alianto, S.Pd': {
            'mapel': 'Pend. Pancasila',
            'allMapel': ['Pend. Pancasila'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Anom Soeroto, S.Pd': {
            'mapel': 'Teknik Sepeda Motor',
            'allMapel': ['Teknik Sepeda Motor'],
            'jurusan': 'TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Dhian Lestari, S.Pd.': {
            'mapel': 'Seni Budaya (Seni Teater, Rupa, Tari)',
            'allMapel': ['Seni Budaya (Seni Teater, Rupa, Tari)'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'Honorer',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Dra. Hj. A. Herlina. SH., M.Si': {
            'mapel': 'Bahasa Indonesia',
            'allMapel': ['Bahasa Indonesia'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Drs. Edi Kusnani Khosim': {
            'mapel': 'Pendidikan Agama Islam dan BP',
            'allMapel': ['Pendidikan Agama Islam dan BP'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Febry Ariyanto, S.T., M.Pd': {
            'mapel': 'Dasar-Dasar Otomotif',
            'allMapel': ['Dasar-Dasar Otomotif'],
            'jurusan': 'TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Gisoesilo Abudi, S.Pd': {
            'mapel': 'Matematika',
            'allMapel': ['Matematika'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'Honorer',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Hery Santoso, S.Pd': {
            'mapel': 'Sejarah',
            'allMapel': ['Sejarah', 'Teknik Otomasi Industri'],
            'jurusan': 'TKJ',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PPPK',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1'],
          },
        'Hj. Muntiyah, S.Pd': {
            'mapel': 'Bahasa Indonesia',
            'allMapel': ['Bahasa Indonesia', 'Pend. Pancasila'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Imam Suhadi, S.Pd.': {
            'mapel': 'Bahasa Inggris',
            'allMapel': ['Bahasa Inggris'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PPPK',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Maratus Sayyidah, S.Pd': {
            'mapel': 'Bahasa Daerah',
            'allMapel': ['Bahasa Daerah'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Masrukin, S.T': {
            'mapel': 'Dasar-Dasar Otomotif',
            'allMapel': ['Dasar-Dasar Otomotif', 'Teknik Kendaraan Ringan'],
            'jurusan': 'TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'Honorer',
            'kelas': ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Moh. Mukhlas Hadi, S.Pd.I, M.Pd.': {
            'mapel': 'Pendidikan Agama Islam dan BP',
            'allMapel': ['Pendidikan Agama Islam dan BP'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Much. Sudjada Cholilulloh, S.Pd.': {
            'mapel': 'Teknik Kendaraan Ringan',
            'allMapel': ['Teknik Kendaraan Ringan'],
            'jurusan': 'TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PPPK',
            'kelas': ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Riza Arisandi, S.Pd.': {
            'mapel': 'Penjaskes',
            'allMapel': ['Penjaskes'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'Honorer',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Sahrizal, S.Kom.': {
            'mapel': 'Dasar-dasar TJKJ',
            'allMapel': ['Dasar-dasar TJKJ'],
            'jurusan': 'TKJ',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PPPK',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1'],
          },
        'Sigit Ari Ekanto, S.Kom.': {
            'mapel': 'Pend. Pancasila',
            'allMapel': ['Pend. Pancasila', 'Sejarah', 'Informatika', 'Teknik Komputer dan Jaringan', 'Dasar-dasar TJKJ'],
            'jurusan': 'TKJ',
            'jabatan': 'Guru',
            'statusKepegawaian': 'Honorer',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1'],
          },
        'Suwarni, S.S.': {
            'mapel': 'Bahasa Inggris',
            'allMapel': ['Bahasa Inggris'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'Honorer',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Wahyu Prawira Yudha, S.Pd': {
            'mapel': 'Dasar-Dasar Otomotif',
            'allMapel': ['Dasar-Dasar Otomotif', 'Teknik Sepeda Motor', 'Proyek Kreatif dan KWU', 'Teknik Kendaraan Ringan'],
            'jurusan': 'TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PPPK',
            'kelas': ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Wisnu Andrianto, S.Pd.': {
            'mapel': 'Dasar-dasar TJKJ',
            'allMapel': ['Dasar-dasar TJKJ', 'Proyek Imu Peng. Alam dan Sosial', 'Projek Kreatif'],
            'jurusan': 'TKJ',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1'],
          },
        'Yohgi Cahyo Pratomo, S.T., MM': {
            'mapel': 'Dasar-Dasar Otomotif',
            'allMapel': ['Dasar-Dasar Otomotif', 'Proyek Kreatif dan KWU', 'Teknik Kendaraan Ringan'],
            'jurusan': 'TKR',
            'jabatan': 'Guru',
            'statusKepegawaian': 'PPPK',
            'kelas': ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Drs. Ahmad Fauzi, M.Pd': {
            'mapel': 'Bimbingan Konseling',
            'allMapel': ['Bimbingan Konseling'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Bimbingan Konseling',
            'statusKepegawaian': 'PNS',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          },
        'Siti Fatimah, S.Pd': {
            'mapel': 'Bimbingan Konseling',
            'allMapel': ['Bimbingan Konseling'],
            'jurusan': 'TKJ/TKR',
            'jabatan': 'Bimbingan Konseling',
            'statusKepegawaian': 'PPPK',
            'kelas': ['X TKJ 1', 'XI TKJ 1', 'XII TKJ 1', 'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'],
          }
      };

      const sampleGuru = [];
      let nipCounter = 196501010001; // Starting NIP

      Object.entries(actualGuruData).forEach(([name, data], index) => {
        // Generate data based on the name and subject
        const nip = (nipCounter + index).toString();
        
        // Infer gender from name
        const isFemale = name.includes('Hj.') || name.includes('Dra.') || name.includes('Dhian') || name.includes('Suwarni') || name.includes('Muntiyah') || name.includes('Maratus') || name.includes('Herlina');
        const jenisKelamin = isFemale ? 'Perempuan' : 'Laki-laki';
        
        // Infer education from title
        const pendidikanTerakhir = name.includes('Dra.') || name.includes('Drs.') || name.includes('M.') ? 'S2' : 'S1';
        
        // Parse jurusan from data - exact mapping
        let jurusan = [];
        if (data.jurusan === 'TKJ/TKR') {
          jurusan = ['TKJ', 'TKR'];
        } else if (data.jurusan === 'TKJ') {
          jurusan = ['TKJ'];
        } else if (data.jurusan === 'TKR') {
          jurusan = ['TKR'];
        } else {
          jurusan = ['TKJ', 'TKR'];
        }
        
        // Create tingkatanMengajar based on classes and subjects
        const tingkatanMengajar = {};
        data.allMapel.forEach(subject => {
          const tingkatan = [];
          data.kelas.forEach(kelas => {
            if (kelas.startsWith('X')) tingkatan.push('X');
            if (kelas.startsWith('XI')) tingkatan.push('XI');
            if (kelas.startsWith('XII')) tingkatan.push('XII');
          });
          tingkatanMengajar[subject] = [...new Set(tingkatan)];
        });
        
        // Generate username and email
        const nameParts = name.replace(/[^a-zA-Z\s]/g, '').split(' ');
        const username = nameParts.length >= 2 ? 
          `${nameParts[0].toLowerCase()}.${nameParts[1].toLowerCase()}` : 
          nameParts[0].toLowerCase();
        
        // Determine wali kelas - some specific teachers get specific classes
        let waliKelas = '';
        if (name === 'Adi Wijaya, S.Tr.T') waliKelas = 'X TKR 1';
        else if (name === 'Ahmad Zaenuri, S.Si') waliKelas = 'XI TKJ 1';
        else if (name === 'Sahrizal, S.Kom.') waliKelas = 'XII TKJ 1';
        else if (name === 'Febry Ariyanto, S.T., M.Pd') waliKelas = 'XI TKR 1';
        else if (name === 'Wisnu Andrianto, S.Pd.') waliKelas = 'X TKJ 1';
        else if (name === 'Much. Sudjada Cholilulloh, S.Pd.') waliKelas = 'XII TKR 1';
        else if (name === 'Wahyu Prawira Yudha, S.Pd') waliKelas = 'XII TKR 2';
        else if (name === 'Yohgi Cahyo Pratomo, S.T., MM') waliKelas = 'X TKR 2';
        else if (name === 'Masrukin, S.T') waliKelas = 'XI TKR 2';
        // Counseling staff tidak menjadi wali kelas
        else if (data.jabatan === 'Bimbingan Konseling') waliKelas = '';
        
        sampleGuru.push({
          nip: nip,
          namaLengkap: name,
          jenisKelamin: jenisKelamin,
          tempatLahir: 'Brebes',
          tanggalLahir: Timestamp.fromDate(new Date(1970 + (index % 20), index % 12, (index % 28) + 1)),
          alamat: `Desa Wanasari, Wanasari, Brebes`,
          nomorHP: `081${String(234567890 + index).slice(0, 9)}`,
          email: `${username}@smkn1wanasari.sch.id`,
          pendidikanTerakhir: pendidikanTerakhir,
          jurusan: jurusan,
          mataPelajaran: data.allMapel,
          kelasAmpu: data.kelas,
          tingkatanMengajar: tingkatanMengajar,
          jabatan: data.jabatan, // Use exact jabatan from data
          waliKelas: waliKelas,
          statusKepegawaian: data.statusKepegawaian, // Use exact status from data
          statusAktif: 'Aktif',
          fotoUrl: '',
          username: username,
          password: username + '123',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      });

      await this.batchAddGuru(sampleGuru);
      
      return {
        success: true,
        totalGenerated: sampleGuru.length,
        message: `Berhasil generate ${sampleGuru.length} data guru sample`
      };
    } catch (error) {
      console.error('Error generating guru sample:', error);
      throw error;
    }
  }
}

export default GuruService;
