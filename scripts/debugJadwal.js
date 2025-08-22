import { db } from '../config/firebase.node.js';
import { collection, getDocs, query, limit } from 'firebase/firestore';

/**
 * Debug script untuk mengecek koneksi Firebase dan data jadwal
 */
async function debugFirebaseConnection() {
  try {
    console.log('🔍 DEBUGGING FIREBASE CONNECTION');
    console.log('=====================================\n');
    
    // Test koneksi Firebase dengan collection sederhana
    console.log('📡 Testing Firebase connection...');
    
    // Coba ambil data dari collection jadwal dengan limit
    const jadwalCollection = collection(db, 'jadwal');
    const testQuery = query(jadwalCollection, limit(5));
    const snapshot = await getDocs(testQuery);
    
    console.log(`📊 Total documents found: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('⚠️ No documents found in jadwal collection');
      
      // Coba cek collection lain untuk memastikan koneksi
      console.log('\n🔍 Checking other collections...');
      
      const collections = ['murid', 'guru', 'admin'];
      for (const collectionName of collections) {
        try {
          const testCol = collection(db, collectionName);
          const testSnap = await getDocs(query(testCol, limit(1)));
          console.log(`📚 Collection '${collectionName}': ${testSnap.size} documents`);
        } catch (error) {
          console.log(`❌ Error checking '${collectionName}': ${error.message}`);
        }
      }
    } else {
      console.log('\n📋 Sample jadwal documents:');
      let count = 0;
      snapshot.forEach((doc) => {
        if (count < 3) { // Show only first 3 documents
          const data = doc.data();
          console.log(`\n📄 Document ID: ${doc.id}`);
          console.log(`   📚 Mata Pelajaran: ${data.namaMataPelajaran || 'N/A'}`);
          console.log(`   🏫 Kelas: ${data.namaKelas || 'N/A'}`);
          console.log(`   👨‍🏫 Guru: ${data.namaGuru || 'N/A'}`);
          console.log(`   📅 Hari: ${data.hari || 'N/A'}`);
          console.log(`   ⏰ Jam: ${data.jamKe || 'N/A'} (${data.jamMulai || 'N/A'}-${data.jamSelesai || 'N/A'})`);
          console.log(`   📊 Status: ${data.status || 'N/A'}`);
          console.log(`   ✅ Published: ${data.isPublished || false}`);
          console.log(`   📋 Approval Status: ${data.approvalStatus || 'N/A'}`);
          count++;
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Firebase connection error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

/**
 * Debug JadwalService methods
 */
async function debugJadwalService() {
  try {
    console.log('\n\n🔧 DEBUGGING JADWALSERVICE METHODS');
    console.log('=====================================\n');
    
    // Import JadwalService
    const JadwalService = (await import('../services/JadwalService.js')).default;
    
    // Test getAllJadwal
    console.log('📚 Testing getAllJadwal...');
    const allJadwal = await JadwalService.getAllJadwal();
    console.log(`📊 getAllJadwal returned: ${allJadwal.length} schedules`);
    
    if (allJadwal.length > 0) {
      console.log(`📋 Sample from getAllJadwal:`, {
        id: allJadwal[0].id,
        namaMataPelajaran: allJadwal[0].namaMataPelajaran,
        namaKelas: allJadwal[0].namaKelas,
        isPublished: allJadwal[0].isPublished,
        status: allJadwal[0].status
      });
    }
    
    // Test getPublishedSchedules
    console.log('\n📚 Testing getPublishedSchedules...');
    const service = new JadwalService();
    const publishedSchedules = await service.getPublishedSchedules();
    console.log(`📊 getPublishedSchedules returned: ${publishedSchedules.length} schedules`);
    
    if (publishedSchedules.length > 0) {
      console.log(`📋 Sample from getPublishedSchedules:`, {
        id: publishedSchedules[0].id,
        namaMataPelajaran: publishedSchedules[0].namaMataPelajaran,
        namaKelas: publishedSchedules[0].namaKelas,
        isPublished: publishedSchedules[0].isPublished
      });
    }
    
    // Test status breakdown
    console.log('\n📊 Status breakdown of all schedules:');
    const statusCounts = {};
    const publishedCounts = { true: 0, false: 0, undefined: 0 };
    
    allJadwal.forEach(jadwal => {
      const status = jadwal.status || 'undefined';
      const published = jadwal.isPublished;
      
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      if (published === true) publishedCounts.true++;
      else if (published === false) publishedCounts.false++;
      else publishedCounts.undefined++;
    });
    
    console.log('📋 By status:', statusCounts);
    console.log('📋 By isPublished:', publishedCounts);
    
  } catch (error) {
    console.error('❌ JadwalService debug error:', error);
  }
}

/**
 * Main debug function
 */
async function main() {
  console.log('🚀 Starting jadwal debugging...');
  console.log('==========================================');
  
  await debugFirebaseConnection();
  await debugJadwalService();
  
  console.log('\n✅ Debugging completed!');
}

// Run debugging
main().catch(console.error);
