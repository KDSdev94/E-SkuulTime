import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, writeBatch, doc, Timestamp } from 'firebase/firestore';

// Firebase configuration - using the correct config from the project
const firebaseConfig = {
  apiKey: "AIzaSyBW4V8LafNVkvhkQlfXBKBMT0Hd8uHjYAM",
  authDomain: "expo-firebase-f28df.firebaseapp.com",
  databaseURL: "https://expo-firebase-f28df-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "expo-firebase-f28df",
  storageBucket: "expo-firebase-f28df.firebasestorage.app",
  messagingSenderId: "444588763749",
  appId: "1:444588763749:android:5ae27f5975be4ac615b48c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAndFixKelasData() {
  try {
    console.log('🚀 Memulai pemeriksaan data kelas...');
    console.log('=====================================');
    
    // 1. Cek semua document di collection kelas (tanpa filter)
    console.log('\n=== MEMERIKSA SEMUA DATA KELAS ===');
    const allKelasQuery = await getDocs(collection(db, 'kelas'));
    console.log(`📊 Total dokumen di collection 'kelas': ${allKelasQuery.size}`);
    
    if (allKelasQuery.size === 0) {
      console.log('❌ Collection kelas kosong! Akan menginisialisasi data default...');
      await initializeDefaultData();
      return;
    }
    
    // 2. Tampilkan semua dokumen
    console.log('\n=== DETAIL DOKUMEN KELAS ===');
    allKelasQuery.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📋 Dokumen ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Nama: ${data.nama || 'TIDAK ADA'}`);
      console.log(`   Tingkat: ${data.tingkat || 'TIDAK ADA'}`);
      console.log(`   Aktif: ${data.aktif}`);
      console.log(`   JurusanId: ${data.jurusanId || 'TIDAK ADA'}`);
    });
    
    // 3. Test simulated service method
    console.log('\n=== SIMULASI SERVICE getAllKelas() ===');
    const simulatedKelasResults = [];
    allKelasQuery.forEach((doc) => {
      const data = doc.data();
      
      // Simulasi logic dari getAllKelas()
      if (data.aktif !== false) {
        simulatedKelasResults.push({
          id: doc.id,
          ...data,
          aktif: data.aktif !== undefined ? data.aktif : true
        });
      }
    });
    
    console.log(`📊 Hasil simulasi getAllKelas(): ${simulatedKelasResults.length} dokumen`);
    
    if (simulatedKelasResults.length > 0) {
      console.log('✅ Simulasi berhasil mengambil data kelas');
      simulatedKelasResults.forEach((kelas, index) => {
        console.log(`   Kelas ${index + 1}: ${kelas.nama} (${kelas.tingkat})`);
      });
    } else {
      console.log('❌ Simulasi tidak berhasil mengambil data kelas');
    }
    
    // 4. Cek jurusan data
    console.log('\n=== MEMERIKSA DATA JURUSAN ===');
    const jurusanQuery = await getDocs(collection(db, 'jurusan'));
    console.log(`📊 Total dokumen di collection 'jurusan': ${jurusanQuery.size}`);
    
    if (jurusanQuery.size === 0) {
      console.log('❌ Collection jurusan kosong! Akan menginisialisasi data default...');
      await initializeDefaultData();
    } else {
      jurusanQuery.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n📋 Jurusan ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Nama: ${data.nama}`);
        console.log(`   Kode: ${data.kode}`);
        console.log(`   Aktif: ${data.aktif}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error saat memeriksa data kelas:', error);
  }
}

async function initializeDefaultData() {
  try {
    console.log('\n🚀 Menginisialisasi data kelas dan jurusan default...');
    
    // Check if data already exists
    const jurusanSnapshot = await getDocs(collection(db, 'jurusan'));
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
      const docRef = doc(collection(db, 'jurusan'));
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
      const docRef = doc(collection(db, 'kelas'));
      batch2.set(docRef, {
        ...kelas,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    await batch2.commit();

    console.log('✅ Data default berhasil diinisialisasi!');
    
    // Verify the initialization
    console.log('\n🔍 Verifikasi inisialisasi...');
    const kelasAfterInit = await getDocs(collection(db, 'kelas'));
    const jurusanAfterInit = await getDocs(collection(db, 'jurusan'));
    
    console.log(`📊 Jumlah kelas setelah inisialisasi: ${kelasAfterInit.size}`);
    console.log(`📊 Jumlah jurusan setelah inisialisasi: ${jurusanAfterInit.size}`);
    
    if (kelasAfterInit.size > 0) {
      console.log('\n📋 Daftar kelas yang berhasil dibuat:');
      kelasAfterInit.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.nama} (Tingkat: ${data.tingkat})`);
      });
    }
    
    if (jurusanAfterInit.size > 0) {
      console.log('\n📋 Daftar jurusan yang berhasil dibuat:');
      jurusanAfterInit.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.nama} (${data.kode})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error saat inisialisasi data:', error);
  }
}

// Main execution
checkAndFixKelasData()
  .then(() => {
    console.log('\n=====================================');
    console.log('✅ Pemeriksaan selesai!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error dalam pemeriksaan:', error);
    process.exit(1);
  });
