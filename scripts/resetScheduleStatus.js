import { db } from '../config/firebase.js';
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

/**
 * Script untuk mereset status jadwal ke workflow yang benar:
 * - Jadwal tetap published (isPublished: true) agar murid/guru masih bisa lihat
 * - Tapi status direset ke 'draft' dan approvalStatus ke 'approved'
 * - Sehingga admin bisa publish ulang dengan ID admin yang benar
 */
async function resetScheduleStatus() {
  try {
    console.log('🔄 Mereset status jadwal ke workflow yang benar...');
    
    // Get all schedules
    const jadwalCollection = collection(db, 'jadwal');
    const querySnapshot = await getDocs(jadwalCollection);
    
    let resetCount = 0;
    let skippedCount = 0;
    
    console.log(`📊 Total jadwal ditemukan: ${querySnapshot.size}`);
    
    for (const docSnap of querySnapshot.docs) {
      const jadwalData = docSnap.data();
      const jadwalId = docSnap.id;
      
      console.log(`\n📋 Processing: ${jadwalData.namaKelas} - ${jadwalData.namaMataPelajaran}`);
      console.log(`   Current status: ${jadwalData.status}`);
      console.log(`   Current approval: ${jadwalData.approvalStatus}`);
      console.log(`   Current published: ${jadwalData.isPublished}`);
      
      // Reset to correct workflow state
      if (jadwalData.status === 'published' && jadwalData.approvalStatus === 'approved') {
        const jadwalRef = doc(db, 'jadwal', jadwalId);
        
        await updateDoc(jadwalRef, {
          // Keep published status so students/teachers can still see schedules
          status: 'draft',              // Reset to draft for admin to publish
          approvalStatus: 'approved',   // Keep approved by kaprodi
          isPublished: true,            // Keep published so students can see
          // Keep existing approval data
          // Remove auto-publish data to allow admin to publish properly
          publishedBy: null,            // Clear so admin can publish with their ID
          publishedAt: null,            // Clear so admin can set proper timestamp
          updatedAt: Timestamp.now()
        });
        
        resetCount++;
        console.log(`   ✅ RESET: Ready for admin to publish`);
        
      } else {
        skippedCount++;
        console.log(`   ⏭️  SKIPPED: Different status`);
      }
    }
    
    console.log('\n📊 RESET SUMMARY:');
    console.log(`================================`);
    console.log(`🔄 Jadwal yang direset: ${resetCount}`);
    console.log(`⏭️  Jadwal yang dilewati: ${skippedCount}`);
    console.log(`📊 Total jadwal: ${querySnapshot.size}`);
    console.log(`================================`);
    
    console.log('\n✅ NEW WORKFLOW:');
    console.log('1. 📋 Status: draft (siap untuk admin publish)');
    console.log('2. ✅ Approval: approved (sudah di-ACC kaprodi)');
    console.log('3. 👁️  Published: true (murid/guru masih bisa lihat)');
    console.log('4. 🎯 Admin tinggal publish dengan ID admin yang benar');
    
    if (resetCount > 0) {
      console.log(`\n🎉 SUCCESS! ${resetCount} jadwal siap untuk di-publish admin!`);
      console.log(`📱 Murid dan guru masih bisa melihat jadwal seperti biasa.`);
      console.log(`👨‍💼 Admin sekarang bisa publish dengan ID admin yang tercatat.`);
    } else {
      console.log(`\n✅ Tidak ada jadwal yang perlu direset.`);
    }
    
  } catch (error) {
    console.error('❌ Error saat mereset status jadwal:', error);
    throw error;
  }
}

// Run the script
resetScheduleStatus()
  .then(() => {
    console.log('\n✅ Reset schedule status completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Reset schedule status failed:', error);
    process.exit(1);
  });
