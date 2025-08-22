import { db } from '../config/firebase.js';
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

/**
 * Script untuk memperbaiki jadwal yang sudah di-ACC tapi masih berstatus draft
 * Akan mengubah status menjadi published dan isPublished menjadi true
 */
async function fixApprovedSchedules() {
  try {
    console.log('🔧 Memulai perbaikan jadwal yang sudah di-ACC...');
    
    // Ambil semua jadwal dari database
    const jadwalCollection = collection(db, 'jadwal');
    const querySnapshot = await getDocs(jadwalCollection);
    
    let fixedCount = 0;
    let alreadyPublishedCount = 0;
    let pendingCount = 0;
    
    console.log(`📊 Total jadwal ditemukan: ${querySnapshot.size}`);
    
    for (const docSnap of querySnapshot.docs) {
      const jadwalData = docSnap.data();
      const jadwalId = docSnap.id;
      
      // Log status saat ini
      console.log(`\n📋 ID: ${jadwalId}`);
      console.log(`   Kelas: ${jadwalData.namaKelas || 'N/A'}`);
      console.log(`   Mapel: ${jadwalData.namaMataPelajaran || 'N/A'}`);
      console.log(`   Status: ${jadwalData.status || 'N/A'}`);
      console.log(`   Approval Status: ${jadwalData.approvalStatus || 'N/A'}`);
      console.log(`   Is Published: ${jadwalData.isPublished || false}`);
      
      // Cek jika sudah di-ACC tapi masih draft
      if (jadwalData.approvalStatus === 'approved' && 
          (jadwalData.status === 'draft' || jadwalData.status === 'Draft' || 
           jadwalData.isPublished !== true)) {
        
        console.log(`   ✅ Memperbaiki jadwal yang sudah di-ACC...`);
        
        const jadwalRef = doc(db, 'jadwal', jadwalId);
        await updateDoc(jadwalRef, {
          status: 'published',
          isPublished: true,
          publishedAt: jadwalData.publishedAt || Timestamp.now(),
          publishedBy: jadwalData.approvedBy || 'System Fix',
          updatedAt: Timestamp.now()
        });
        
        fixedCount++;
        console.log(`   ✅ DIPERBAIKI!`);
        
      } else if (jadwalData.approvalStatus === 'approved' && 
                 jadwalData.status === 'published' && 
                 jadwalData.isPublished === true) {
        
        alreadyPublishedCount++;
        console.log(`   ✅ Sudah benar (published)`);
        
      } else if (jadwalData.approvalStatus === 'pending' || 
                 !jadwalData.approvalStatus) {
        
        pendingCount++;
        console.log(`   ⏳ Masih pending approval`);
        
      } else {
        console.log(`   ℹ️  Status lainnya`);
      }
    }
    
    console.log('\n📊 SUMMARY PERBAIKAN:');
    console.log(`=====================================`);
    console.log(`✅ Jadwal yang diperbaiki: ${fixedCount}`);
    console.log(`✅ Jadwal sudah benar: ${alreadyPublishedCount}`);
    console.log(`⏳ Jadwal pending approval: ${pendingCount}`);
    console.log(`📊 Total jadwal: ${querySnapshot.size}`);
    console.log(`=====================================`);
    
    if (fixedCount > 0) {
      console.log(`\n🎉 Berhasil memperbaiki ${fixedCount} jadwal!`);
      console.log(`Jadwal yang sudah di-ACC sekarang sudah berstatus published dan dapat dilihat oleh guru dan murid.`);
    } else {
      console.log(`\n✅ Tidak ada jadwal yang perlu diperbaiki.`);
    }
    
  } catch (error) {
    console.error('❌ Error saat memperbaiki jadwal:', error);
    throw error;
  }
}

// Jalankan script jika dipanggil langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  fixApprovedSchedules()
    .then(() => {
      console.log('\n✅ Script selesai dijalankan!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script gagal:', error);
      process.exit(1);
    });
}

export default fixApprovedSchedules;
