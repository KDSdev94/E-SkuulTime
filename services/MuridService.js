import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, writeBatch, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

class MuridService {
  static muridCollection = 'murid';

  // === MURID OPERATIONS ===

  // Tambah murid baru
  static async addMurid(murid) {
    try {
      // Cek apakah NIS atau username sudah ada
      const existingNisQuery = query(
        collection(db, this.muridCollection),
        where('nis', '==', murid.nis)
      );
      const existingNisSnapshot = await getDocs(existingNisQuery);

      if (!existingNisSnapshot.empty) {
        throw new Error(`NIS ${murid.nis} sudah terdaftar`);
      }

      const existingUsernameQuery = query(
        collection(db, this.muridCollection),
        where('username', '==', murid.username)
      );
      const existingUsernameSnapshot = await getDocs(existingUsernameQuery);

      if (!existingUsernameSnapshot.empty) {
        throw new Error(`Username ${murid.username} sudah digunakan`);
      }

      // Tambah timestamp
      const muridWithTimestamp = {
        ...murid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Tambah document baru
      const docRef = await addDoc(collection(db, this.muridCollection), muridWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error adding murid:', error);
      throw error;
    }
  }

  // Update murid
  static async updateMurid(id, murid) {
    try {
      const updatedMurid = { ...murid, updatedAt: Timestamp.now() };
      await updateDoc(doc(db, this.muridCollection, id), updatedMurid);
    } catch (error) {
      console.error('Error updating murid:', error);
      throw error;
    }
  }

  // Update foto murid only
  static async updateMuridFoto(id, fotoUrl) {
    try {
      await updateDoc(doc(db, this.muridCollection, id), {
        fotoUrl: fotoUrl,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating murid foto:', error);
      throw error;
    }
  }

  // Hapus murid
  static async deleteMurid(id) {
    try {
      await deleteDoc(doc(db, this.muridCollection, id));
    } catch (error) {
      console.error('Error deleting murid:', error);
      throw error;
    }
  }

  // Get murid by ID
  static async getMuridById(id) {
    try {
      const docSnap = await getDoc(doc(db, this.muridCollection, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting murid:', error);
      return null;
    }
  }

  // Get murid by NIS
  static async getMuridByNis(nis) {
    try {
      const q = query(
        collection(db, this.muridCollection),
        where('nis', '==', nis),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting murid by NIS:', error);
      return null;
    }
  }

  // Get semua murid
  static async getAllMurid() {
    try {
      const q = query(
        collection(db, this.muridCollection),
        orderBy('namaLengkap')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all murids:', error);
      return [];
    }
  }

  // Get murid by kelas
  static async getMuridByKelas(kelas) {
    try {
      const q = query(
        collection(db, this.muridCollection),
        where('kelas', '==', kelas),
        orderBy('namaLengkap')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting murid by kelas:', error);
      return [];
    }
  }

  // Get murid by jurusan
  static async getMuridByJurusan(jurusan) {
    try {
      const q = query(
        collection(db, this.muridCollection),
        where('jurusan', '==', jurusan),
        orderBy('namaLengkap')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting murid by jurusan:', error);
      return [];
    }
  }

  // Get murid by status
  static async getMuridByStatus(status) {
    try {
      const q = query(
        collection(db, this.muridCollection),
        where('statusSiswa', '==', status),
        orderBy('namaLengkap')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting murid by status:', error);
      return [];
    }
  }

  // Search murid by nama
  static async searchMuridByNama(nama) {
    try {
      const q = query(
        collection(db, this.muridCollection),
        where('namaLengkap', '>=', nama),
        where('namaLengkap', '<', nama + 'z')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error searching murid:', error);
      return [];
    }
  }

  // === AUTHENTICATION ===

  // Login murid
  static async loginMurid(username, password) {
    try {
      const q = query(
        collection(db, this.muridCollection),
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
      console.error('Error login murid:', error);
      return null;
    }
  }

  // === STORAGE OPERATIONS ===

  // Upload foto murid
  static async uploadFotoMurid(fotoFile, nis) {
    try {
      const fileName = `murid_${nis}.jpg`;
      const storageRef = ref(storage, `murid_photos/${fileName}`);

      const snapshot = await uploadBytes(storageRef, fotoFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading foto:', error);
      return null;
    }
  }

  // Hapus foto murid
  static async deleteFotoMurid(fotoUrl) {
    try {
      const storageRef = ref(storage, fotoUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting foto:', error);
    }
  }

  // === UTILITY FUNCTIONS ===

  // Get statistik murid
  static async getStatistikMurid() {
    try {
      const allMurid = await this.getAllMurid();

      let aktif = 0;
      let lulus = 0;
      let keluar = 0;
      let lakiLaki = 0;
      let perempuan = 0;

      for (const murid of allMurid) {
        // Status
        switch (murid.statusSiswa) {
          case 'Aktif':
            aktif++;
            break;
          case 'Lulus':
            lulus++;
            break;
          case 'Keluar':
          case 'Pindah':
          case 'Tidak Aktif':
            keluar++;
            break;
        }

        // Jenis Kelamin
        if (murid.jenisKelamin === 'Laki-laki') {
          lakiLaki++;
        } else {
          perempuan++;
        }
      }

      return {
        total: allMurid.length,
        aktif: aktif,
        lulus: lulus,
        keluar: keluar,
        laki_laki: lakiLaki,
        perempuan: perempuan,
      };
    } catch (error) {
      console.error('Error getting statistik:', error);
      return {};
    }
  }

  // Batch operations untuk import data banyak
  static async batchAddMurid(muridList) {
    try {
      const batch = writeBatch(db);

      for (const murid of muridList) {
        const docRef = doc(collection(db, this.muridCollection));
        // Jika belum ada timestamp, tambahkan
        const muridData = {
          ...murid,
          createdAt: murid.createdAt || Timestamp.now(),
          updatedAt: murid.updatedAt || Timestamp.now()
        };
        batch.set(docRef, muridData);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error batch adding murid:', error);
      throw error;
    }
  }

  // Hapus semua data murid
  static async deleteAllMurid() {
    try {
      const querySnapshot = await getDocs(collection(db, this.muridCollection));
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
      console.error('Error deleting all murid:', error);
      throw error;
    }
  }

  // Cek apakah ada duplikat berdasarkan NIS atau username
  static async checkDuplicates(muridList) {
    try {
      let duplicateNIS = [];
      let duplicateUsername = [];
      let internalDuplicateNIS = [];
      let internalDuplicateUsername = [];

      // Cek duplikat internal dalam list yang akan diimport
      const seenNIS = new Set();
      const seenUsername = new Set();

      for (const murid of muridList) {
        if (seenNIS.has(murid.nis)) {
          internalDuplicateNIS.push(murid.nis);
        } else {
          seenNIS.add(murid.nis);
        }

        if (seenUsername.has(murid.username)) {
          internalDuplicateUsername.push(murid.username);
        } else {
          seenUsername.add(murid.username);
        }
      }

      // Cek duplikat dengan data yang sudah ada di database
      for (const murid of muridList) {
        // Cek NIS
        const existingNisQuery = query(
          collection(db, this.muridCollection),
          where('nis', '==', murid.nis),
          limit(1)
        );
        const existingNisSnapshot = await getDocs(existingNisQuery);

        if (!existingNisSnapshot.empty) {
          duplicateNIS.push(murid.nis);
        }

        // Cek Username
        const existingUsernameQuery = query(
          collection(db, this.muridCollection),
          where('username', '==', murid.username),
          limit(1)
        );
        const existingUsernameSnapshot = await getDocs(existingUsernameQuery);

        if (!existingUsernameSnapshot.empty) {
          duplicateUsername.push(murid.username);
        }
      }

      return {
        hasDuplicates: duplicateNIS.length > 0 ||
                      duplicateUsername.length > 0 ||
                      internalDuplicateNIS.length > 0 ||
                      internalDuplicateUsername.length > 0,
        duplicateNIS,
        duplicateUsername,
        internalDuplicateNIS,
        internalDuplicateUsername,
      };
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return {
        hasDuplicates: false,
        duplicateNIS: [],
        duplicateUsername: [],
        internalDuplicateNIS: [],
        internalDuplicateUsername: [],
      };
    }
  }

  // Hitung total murid yang ada
  static async getTotalMuridCount() {
    try {
      const querySnapshot = await getDocs(collection(db, this.muridCollection));
      return querySnapshot.docs.length;
    } catch (error) {
      console.error('Error getting total murid count:', error);
      return 0;
    }
  }

  // Generate siswa massal untuk jurusan tertentu
  // TKJ: 3 tingkat, 1 kelas per tingkat (total 3 kelas)
  // TKR: 3 tingkat, 2 kelas per tingkat (total 6 kelas)
  static async generateSiswaMassal(major = 'TKJ', progressCallback) {
    try {
      const tahunSekarang = new Date().getFullYear();
      const siswaList = [];
      
      // Validasi parameter major
      if (!['TKJ', 'TKR'].includes(major)) {
        throw new Error('Major harus TKJ atau TKR');
      }
      
      // Data nama siswa berdasarkan jenis kelamin
      const namaLakiLaki = [
        'Aditya Rahman', 'Budi Santoso', 'Deni Kurniawan', 'Fajar Setiawan', 'Hendra Wijaya',
        'Joko Susilo', 'Lukman Hakim', 'Oka Prasetya', 'Qori Ramadhan', 'Taufik Hidayat',
        'Yanto Suryadi', 'Zulfikar Akbar', 'Arif Budiman', 'Dimas Aditya', 'Galih Pratama',
        'Irwan Setiawan', 'Prabowo Aji', 'Yudi Hermawan', 'Ahmad Fadli', 'Bayu Endra',
        'Edo Prasetyo', 'Febri Wahyu', 'Ivan Maulana', 'Kevin Saputra', 'Oscar Rizki',
        'Reza Firmansyah', 'Tommy Gunawan', 'Vicky Pratama', 'Xavier Putra', 'Aldi Permana',
        'Candra Wijaya', 'Erik Maulana', 'Gilang Ramadhan', 'Ilham Pratama', 'Mario Setiawan',
        'Oki Firmansyah', 'Ravi Wijaya', 'Teguh Permana', 'Wahyu Hidayat', 'Yoga Aditama',
        'Alvin Kurniawan', 'Calvin Nugroho', 'Emanuel Wijaya', 'Gilbert Saputra', 'Ibrahim Maulana',
        'Kenzo Pratama', 'Maulana Yusuf', 'Okta Ramadhan', 'Putra Wijaya', 'Rico Firmansyah',
        'Tegar Maulana', 'Vincent Saputra', 'Xylo Pratama', 'Zidan Permana', 'Bryan Setiawan',
        // Tambahan nama laki-laki untuk mencegah duplikasi
        'Andika Pratama', 'Bagus Wijaya', 'Cahya Nugraha', 'Dedi Susanto', 'Eko Saputra',
        'Fajri Hidayat', 'Gunawan Putra', 'Hadi Setiawan', 'Imam Santoso', 'Jefri Rahman',
        'Krisna Maulana', 'Luthfi Hakim', 'Mahendra Putra', 'Naufal Rizki', 'Oni Permana',
        'Pamungkas Aji', 'Qadri Ramadhan', 'Rangga Pratama', 'Syahrul Gunawan', 'Tri Santoso',
        'Umar Faruq', 'Valdo Setiawan', 'Wisnu Wardana', 'Yusuf Maulana', 'Zacky Ramadhan',
        'Akbar Maulana', 'Bagas Nugroho', 'Chandra Kirana', 'David Pratama', 'Erlangga Putra',
        'Farhan Hidayat', 'Galang Setiawan', 'Hanif Rahman', 'Indra Wijaya', 'Januar Santoso',
        'Kalam Hidayat', 'Lucky Pratama', 'Muhamad Rizki', 'Nanda Permana', 'Ovan Setiawan',
        'Pandu Wijaya', 'Qayim Rahman', 'Rafli Maulana', 'Satrio Nugroho', 'Tama Pratama',
        'Ucup Hidayat', 'Vino Setiawan', 'Widi Santoso', 'Yogi Permana', 'Zaki Maulana'
      ];
      
      const namaPerempuan = [
        'Citra Dewi', 'Eka Putri', 'Gita Sari', 'Indah Permata', 'Kartika Sari',
        'Maya Sari', 'Nur Hidayah', 'Putri Melati', 'Rina Wati', 'Sari Dewi',
        'Umi Kalsum', 'Vina Lestari', 'Winda Sari', 'Xena Putri', 'Bina Kusuma',
        'Candra Kirana', 'Elsa Ramadhani', 'Fitri Handayani', 'Hesti Purnama', 'Jihan Nuraini',
        'Kirana Sari', 'Lina Marlina', 'Mira Utami', 'Nita Puspita', 'Olivia Sari',
        'Quentin Rama', 'Riska Wulandari', 'Sinta Dewi', 'Ulfa Rahmawati',
        'Vera Anggraini', 'Wulan Sari', 'Cici Maharani', 'Dara Amelia', 'Gina Puspita',
        'Hana Aulia', 'Jessica Putri', 'Lilis Suryani', 'Mulia Sari', 'Nova Andriani',
        'Prima Dewi', 'Qila Zahira', 'Siska Nurhaliza', 'Umi Salamah', 'Wulandari Sari',
        'Yuni Astuti', 'Zahra Kamila', 'Bella Safitri', 'Dini Rahayu', 'Fira Anggraini',
        'Hilda Permata', 'Jasmine Putri', 'Kiki Amalia', 'Luna Maharani', 'Nanda Sari',
        'Pita Dewi', 'Qonita Azzahra', 'Silvia Ramadhani', 'Uci Nurjannah', 'Vega Pratiwi',
        'Xenia Putri', 'Zaskia Mecca', 'Bunga Citra', 'Diana Puspita', 'Firda Aulia',
        'Helena Sari', 'Julia Rahayu', 'Laras Dewi', 'Nadya Safitri', 'Queen Maharani',
        'Shinta Dewi', 'Wida Purnama', 'Yulia Anggraini', 'Adinda Putri',
        // Tambahan nama perempuan untuk mencegah duplikasi
        'Aini Rahmawati', 'Bertha Kusuma', 'Cahaya Sari', 'Dewi Lestari', 'Erni Suryani',
        'Farah Diba', 'Gisela Putri', 'Hani Permata', 'Intan Sari', 'Jenni Wulandari',
        'Kania Dewi', 'Lia Maharani', 'Melly Pratiwi', 'Nina Rahayu', 'Okta Anggraini',
        'Puji Lestari', 'Qisthi Ramadhani', 'Rere Puspita', 'Selly Handayani', 'Tika Sari',
        'Ully Rahmawati', 'Vivi Lestari', 'Wenny Kusuma', 'Yolanda Dewi', 'Zizah Putri',
        'Anisa Rahman', 'Bela Purnama', 'Cinta Sari', 'Desi Wulandari', 'Evi Kusuma',
        'Fitria Dewi', 'Gilda Permata', 'Henny Lestari', 'Ira Puspita', 'Jessi Sari',
        'Karin Wulandari', 'Linda Rahayu', 'Mila Pratiwi', 'Niken Dewi', 'Ocha Lestari',
        'Prita Sari', 'Quina Permata', 'Rika Wulandari', 'Sari Kusuma', 'Tiara Dewi',
        'Unik Lestari', 'Vira Sari', 'Wulan Permata', 'Yesi Rahayu', 'Zahra Lestari'
      ];
      
      // Gabung semua nama untuk referensi umum
      const namaSiswa = [...namaLakiLaki, ...namaPerempuan];
      
      const tempatLahir = [
        'Brebes', 'Brebes', 'Brebes', 'Brebes', 'Brebes', 'Brebes', 'Brebes', 'Brebes',
        'Brebes', 'Brebes', 'Brebes', 'Brebes', 'Brebes', 'Brebes', 'Brebes', 'Brebes',
        'Wanasari', 'Wanasari', 'Wanasari', 'Wanasari'
      ];
      
      const alamat = [
        'Desa Wanasari, Wanasari, Brebes',
        'Desa Dukuhwringin, Wanasari, Brebes',
        'Desa Dumeling, Wanasari, Brebes',
        'Desa Glonggong, Wanasari, Brebes',
        'Desa Jagalempeni, Wanasari, Brebes',
        'Desa Keboledan, Wanasari, Brebes',
        'Desa Kertabesuki, Wanasari, Brebes',
        'Desa Klampok, Wanasari, Brebes',
        'Desa Kupu, Wanasari, Brebes',
        'Desa Lengkong, Wanasari, Brebes',
        'Desa Pebatan, Wanasari, Brebes',
        'Desa Pesantunan, Wanasari, Brebes',
        'Desa Sawojajar, Wanasari, Brebes',
        'Desa Siasem, Wanasari, Brebes',
        'Desa Sidamulya, Wanasari, Brebes',
        'Desa Sigentong, Wanasari, Brebes',
        'Desa Sisalam, Wanasari, Brebes',
        'Desa Siwungkuk, Wanasari, Brebes',
        'Desa Tanjungsari, Wanasari, Brebes',
        'Desa Tegalgandu, Wanasari, Brebes'
      ];
      
      // Tentukan jumlah kelas per tingkat berdasarkan jurusan
      const kelasPerTingkat = major === 'TKJ' ? 1 : 2;
      const totalKelas = 3 * kelasPerTingkat;
      const totalExpected = totalKelas * 30; // Total siswa yang akan di-generate
      
      let totalSiswa = 0;
      
      // Helper function untuk shuffle array
      const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Tracking global untuk memastikan tidak ada duplikasi nama di seluruh sistem
      const namaYangTerpakai = new Set();
      
      // Function untuk mendapatkan nama unik
      const getNamaUnik = (namaArray, jumlah, jenisKelamin) => {
        const namaUnik = [];
        const namaShuffled = shuffleArray(namaArray);
        
        for (const nama of namaShuffled) {
          if (!namaYangTerpakai.has(nama) && namaUnik.length < jumlah) {
            namaUnik.push(nama);
            namaYangTerpakai.add(nama);
          }
        }
        
        // Jika masih kurang, buat variasi nama dengan menambah angka
        let counter = 1;
        while (namaUnik.length < jumlah) {
          for (const nama of namaShuffled) {
            if (namaUnik.length >= jumlah) break;
            
            const namaVariasi = `${nama} ${counter}`;
            if (!namaYangTerpakai.has(namaVariasi)) {
              namaUnik.push(namaVariasi);
              namaYangTerpakai.add(namaVariasi);
            }
          }
          counter++;
        }
        
        return namaUnik.map(nama => ({ nama, jenisKelamin }));
      };

      // Generate untuk setiap tingkat (X, XI, XII)
      for (let tingkat = 1; tingkat <= 3; tingkat++) {
        const tingkatRoman = tingkat === 1 ? 'X' : tingkat === 2 ? 'XI' : 'XII';
        // Tahun masuk sesuai tingkatan (Juli 2025 - belum ada murid baru):
        // Kelas X (tingkat 1) = masuk tahun 2024 (murid yang sekarang naik ke kelas 10)
        // Kelas XI (tingkat 2) = masuk tahun 2023 (murid yang sekarang naik ke kelas 11)
        // Kelas XII (tingkat 3) = masuk tahun 2022 (murid yang sekarang naik ke kelas 12)
        const tahunMasuk = tahunSekarang - tingkat;
        
        // Generate kelas berdasarkan jurusan
        for (let kelas = 1; kelas <= kelasPerTingkat; kelas++) {
          const namaKelas = `${tingkatRoman} ${major} ${kelas}`;
          
          // Tentukan distribusi gender yang seimbang (15 laki-laki, 15 perempuan)
          const jumlahLakiLaki = 15;
          const jumlahPerempuan = 15;
          
          const tempatLahirShuffled = shuffleArray(tempatLahir);
          const alamatShuffled = shuffleArray(alamat);
          
          // Dapatkan nama unik untuk kelas ini
          const siswaLakiLaki = getNamaUnik(namaLakiLaki, jumlahLakiLaki, 'Laki-laki');
          const siswaPerempuan = getNamaUnik(namaPerempuan, jumlahPerempuan, 'Perempuan');
          
          // Gabung dan shuffle urutan siswa dalam kelas
          const siswaKelas = [...siswaLakiLaki, ...siswaPerempuan];
          const siswaKelasShuffled = shuffleArray(siswaKelas);
          
          // 30 siswa per kelas
          for (let siswa = 1; siswa <= 30; siswa++) {
            // Ambil data siswa (nama dan jenis kelamin) dari array yang sudah divalidasi
            const { nama: selectedNama, jenisKelamin } = siswaKelasShuffled[siswa - 1];
            const randomTempatLahir = tempatLahirShuffled[siswa % tempatLahirShuffled.length];
            const randomAlamat = alamatShuffled[siswa % alamatShuffled.length];
            
            // Generate tanggal lahir (umur 15-18 tahun)
            const umur = 15 + Math.floor(Math.random() * 4);
            const tanggalLahir = new Date(tahunSekarang - umur, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
            
            // Generate NIS dan NISN dengan prefix sesuai jurusan
            const jurusanPrefix = major === 'TKJ' ? '01' : '02';
            const nisNumber = (20240000 + parseInt(jurusanPrefix) * 1000 + totalSiswa + 1).toString();
            const nisnNumber = (3320240000 + parseInt(jurusanPrefix) * 1000 + totalSiswa + 1).toString();
            
            // Generate username dan email
            const namaForUsername = selectedNama.toLowerCase().replace(/\s+/g, '');
            const username = `${namaForUsername}${tingkat}${kelas}${siswa.toString().padStart(2, '0')}`;
            const email = `${username}@murid.${major.toLowerCase()}.sch.id`;
            
            // Generate nomor HP
            const nomorHP = `08${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 90000000) + 10000000}`;
            const nomorHPOrtu = `08${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 90000000) + 10000000}`;
            const nomorHPWali = `08${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 90000000) + 10000000}`;
            
            // Generate nama orang tua (bisa berbeda dari nama siswa)
            const namaOrtuShuffled = shuffleArray(namaSiswa);
            const namaOrtu = namaOrtuShuffled[Math.floor(Math.random() * namaOrtuShuffled.length)];
            
            const siswaData = {
              nis: nisNumber,
              nisn: nisnNumber,
              namaLengkap: selectedNama,
              jenisKelamin: jenisKelamin,
              tempatLahir: randomTempatLahir,
              tanggalLahir: Timestamp.fromDate(tanggalLahir),
              alamat: randomAlamat,
              nomorHP: nomorHP,
              nomorHPOrtu: nomorHPOrtu,
              nomorHPWali: nomorHPWali,
              kelas: namaKelas,
              rombel: namaKelas,
              jurusan: major,
              tahunMasuk: tahunMasuk.toString(),
              statusSiswa: 'Aktif',
              fotoUrl: '',
              username: username,
              email: email,
              password: `${username}123`, // Password format: username123
              namaOrtu: namaOrtu,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            };
            
            siswaList.push(siswaData);
            totalSiswa++;
            
            // Update progress
            if (progressCallback) {
              progressCallback((totalSiswa / totalExpected) * 100);
            }
          }
        }
      }
      
      // Check for duplicates before adding
      const duplicateCheck = await this.checkDuplicates(siswaList);
      if (duplicateCheck.hasDuplicates) {
        throw new Error('Terdapat duplikasi data yang akan mengakibatkan konflik');
      }
      
      // Add siswa in batches
      await this.batchAddMurid(siswaList);
      
      const kelasInfo = major === 'TKJ' ? '3 tingkat, 1 kelas per tingkat' : '3 tingkat, 2 kelas per tingkat';
      
      return {
        success: true,
        totalGenerated: totalSiswa,
        message: `Berhasil generate ${totalSiswa} siswa ${major} (${kelasInfo}, 30 siswa per kelas)`
      };
      
    } catch (error) {
      console.error('Error generating siswa massal:', error);
      throw error;
    }
  }
}

export default MuridService;
