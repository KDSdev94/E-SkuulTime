import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';

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

async function initKelasWithExistingJurusan() {
  try {
    console.log('🚀 Menginisialisasi data kelas dengan jurusan yang ada...');
    console.log('=======================================================');
    
    // 1. Ambil data jurusan yang sudah ada
    console.log('\n=== MENGAMBIL DATA JURUSAN ===');
    const jurusanSnapshot = await getDocs(collection(db, 'jurusan'));
    console.log(`📊 Total dokumen jurusan: ${jurusanSnapshot.size}`);
    
    if (jurusanSnapshot.empty) {
      console.log('❌ Tidak ada data jurusan! Tidak dapat membuat kelas.');
      return;
    }
    
    // Tampilkan jurusan yang ada
    const jurusanList = [];
    jurusanSnapshot.forEach((doc) => {
      const data = doc.data();
      jurusanList.push({ id: doc.id, ...data });
      console.log(`📋 Jurusan: ${data.nama} (${data.kode}) - ID: ${doc.id}`);
    });
    
    // 2. Cek apakah kelas sudah ada
    console.log('\n=== MENGECEK DATA KELAS ===');
    const kelasSnapshot = await getDocs(collection(db, 'kelas'));
    console.log(`📊 Total dokumen kelas saat ini: ${kelasSnapshot.size}`);
    
    if (kelasSnapshot.size > 0) {
      console.log('⚠️ Data kelas sudah ada. Akan menampilkan data yang ada:');
      kelasSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   Kelas ${index + 1}: ${data.nama} (${data.tingkat})`);
      });
      return;
    }
    
    // 3. Buat data kelas default berdasarkan jurusan yang ada
    console.log('\n=== MEMBUAT DATA KELAS ===');
    const batch = writeBatch(db);
    
    let totalKelasToCreate = 0;
    
    jurusanList.forEach((jurusan) => {
      const tingkatList = ['X', 'XI', 'XII'];
      const kelasNumbers = ['1', '2'];
      
      tingkatList.forEach((tingkat) => {
        kelasNumbers.forEach((number) => {
          const kelasData = {
            nama: `${tingkat} ${jurusan.kode} ${number}`,
            tingkat: tingkat,
            jurusanId: jurusan.id,
            aktif: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };
          
          const docRef = doc(collection(db, 'kelas'));
          batch.set(docRef, kelasData);
          totalKelasToCreate++;
          
          console.log(`   Akan membuat: ${kelasData.nama}`);
        });
      });
    });
    
    console.log(`\n📊 Total kelas yang akan dibuat: ${totalKelasToCreate}`);
    
    // 4. Commit batch
    console.log('\n=== MENYIMPAN DATA KELAS ===');
    await batch.commit();
    console.log('✅ Data kelas berhasil disimpan!');
    
    // 5. Verifikasi hasil
    console.log('\n=== VERIFIKASI HASIL ===');
    const kelasAfterInit = await getDocs(collection(db, 'kelas'));
    console.log(`📊 Total kelas setelah inisialisasi: ${kelasAfterInit.size}`);
    
    if (kelasAfterInit.size > 0) {
      console.log('\n📋 Daftar kelas yang telah dibuat:');
      kelasAfterInit.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.nama} (Tingkat: ${data.tingkat})`);
      });
    }
    
    // 6. Test query aktif = true
    console.log('\n=== TEST QUERY KELAS AKTIF ===');
    const activeKelasQuery = kelasAfterInit.docs.filter(doc => {
      const data = doc.data();
      return data.aktif !== false;
    });
    
    console.log(`📊 Kelas dengan aktif !== false: ${activeKelasQuery.length}`);
    
  } catch (error) {
    console.error('❌ Error saat inisialisasi kelas:', error);
  }
}

// Main execution
initKelasWithExistingJurusan()
  .then(() => {
    console.log('\n=======================================================');
    console.log('✅ Inisialisasi kelas selesai!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error dalam inisialisasi:', error);
    process.exit(1);
  });
