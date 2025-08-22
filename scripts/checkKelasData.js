import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import KelasJurusanService from '../services/KelasJurusanService.js';

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

async function checkKelasData() {
  try {
    console.log('🔍 Memeriksa data kelas di database...');
    
    // 1. Cek semua document di collection kelas (tanpa filter)
    console.log('\n=== MEMERIKSA SEMUA DATA KELAS ===');
    const allKelasQuery = await getDocs(collection(db, 'kelas'));
    console.log(`📊 Total dokumen di collection 'kelas': ${allKelasQuery.size}`);
    
    if (allKelasQuery.size === 0) {
      console.log('❌ Collection kelas kosong! Akan menginisialisasi data default...');
      await initializeKelasData();
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
      console.log(`   Data lengkap:`, JSON.stringify(data, null, 2));
    });
    
    // 3. Cek data dengan filter aktif = true
    console.log('\n=== COBA QUERY DENGAN FILTER AKTIF = TRUE ===');
    const aktivKelasQuery = query(collection(db, 'kelas'), where('aktif', '==', true));
    const aktivKelasSnapshot = await getDocs(aktivKelasQuery);
    console.log(`📊 Dokumen dengan aktif = true: ${aktivKelasSnapshot.size}`);
    
    // 4. Cek data dengan filter aktif tidak sama dengan false
    console.log('\n=== COBA QUERY DENGAN FILTER AKTIF != FALSE ===');
    const nonAktifKelasQuery = query(collection(db, 'kelas'), where('aktif', '!=', false));
    const nonAktifKelasSnapshot = await getDocs(nonAktifKelasQuery);
    console.log(`📊 Dokumen dengan aktif != false: ${nonAktifKelasSnapshot.size}`);
    
    // 5. Test service method
    console.log('\n=== TEST SERVICE getAllKelas() ===');
    const kelasFromService = await KelasJurusanService.getAllKelas();
    console.log(`📊 Hasil dari service getAllKelas(): ${kelasFromService.length} dokumen`);
    
    if (kelasFromService.length > 0) {
      console.log('✅ Service berhasil mengambil data kelas');
      kelasFromService.forEach((kelas, index) => {
        console.log(`   Kelas ${index + 1}: ${kelas.nama} (${kelas.tingkat})`);
      });
    } else {
      console.log('❌ Service tidak berhasil mengambil data kelas');
    }
    
    // 6. Cek jurusan data
    console.log('\n=== MEMERIKSA DATA JURUSAN ===');
    const jurusanQuery = await getDocs(collection(db, 'jurusan'));
    console.log(`📊 Total dokumen di collection 'jurusan': ${jurusanQuery.size}`);
    
    if (jurusanQuery.size === 0) {
      console.log('❌ Collection jurusan kosong! Akan menginisialisasi data default...');
      await initializeKelasData();
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

async function initializeKelasData() {
  try {
    console.log('\n🚀 Menginisialisasi data kelas dan jurusan default...');
    
    await KelasJurusanService.initializeDefaultData();
    
    console.log('✅ Data default berhasil diinisialisasi!');
    
    // Verify the initialization
    console.log('\n🔍 Verifikasi inisialisasi...');
    const kelasAfterInit = await KelasJurusanService.getAllKelas();
    const jurusanAfterInit = await KelasJurusanService.getAllJurusan();
    
    console.log(`📊 Jumlah kelas setelah inisialisasi: ${kelasAfterInit.length}`);
    console.log(`📊 Jumlah jurusan setelah inisialisasi: ${jurusanAfterInit.length}`);
    
    if (kelasAfterInit.length > 0) {
      console.log('\n📋 Daftar kelas yang berhasil dibuat:');
      kelasAfterInit.forEach((kelas, index) => {
        console.log(`   ${index + 1}. ${kelas.nama} (Tingkat: ${kelas.tingkat})`);
      });
    }
    
    if (jurusanAfterInit.length > 0) {
      console.log('\n📋 Daftar jurusan yang berhasil dibuat:');
      jurusanAfterInit.forEach((jurusan, index) => {
        console.log(`   ${index + 1}. ${jurusan.nama} (${jurusan.kode})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error saat inisialisasi data:', error);
  }
}

async function fixKelasData() {
  try {
    console.log('\n🔧 Memperbaiki data kelas yang bermasalah...');
    
    // Get all documents without filter
    const allKelasQuery = await getDocs(collection(db, 'kelas'));
    
    if (allKelasQuery.size === 0) {
      console.log('❌ Tidak ada data kelas untuk diperbaiki. Menjalankan inisialisasi...');
      await initializeKelasData();
      return;
    }
    
    // Check and fix each document
    let fixedCount = 0;
    const batch = [];
    
    allKelasQuery.forEach((doc) => {
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};
      
      // Fix missing aktif field
      if (data.aktif === undefined || data.aktif === null) {
        updates.aktif = true;
        needsUpdate = true;
        console.log(`🔧 Memperbaiki field 'aktif' untuk dokumen ${doc.id}`);
      }
      
      // Fix missing nama field if needed
      if (!data.nama && data.tingkat && data.jurusanId) {
        // We'd need to construct nama from available data
        needsUpdate = true;
        console.log(`🔧 Field 'nama' kosong untuk dokumen ${doc.id}`);
      }
      
      if (needsUpdate) {
        batch.push({ docId: doc.id, updates });
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      console.log(`🔧 Akan memperbaiki ${fixedCount} dokumen...`);
      // Here you would actually update the documents
      // This is just logging what would be updated
      batch.forEach((item) => {
        console.log(`   - ${item.docId}: ${JSON.stringify(item.updates)}`);
      });
    } else {
      console.log('✅ Semua dokumen kelas sudah dalam kondisi baik');
    }
    
  } catch (error) {
    console.error('❌ Error saat memperbaiki data kelas:', error);
  }
}

// Main execution
console.log('🚀 Memulai pemeriksaan data kelas...');
console.log('=====================================');

checkKelasData()
  .then(() => {
    console.log('\n=====================================');
    console.log('✅ Pemeriksaan selesai!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error dalam pemeriksaan:', error);
    process.exit(1);
  });
