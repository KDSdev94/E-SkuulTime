import { db } from '../config/firebase.js';
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

async function publishAllDraftSchedules() {
  try {
    console.log('🚨 EMERGENCY: Publishing all draft schedules...');
    
    const jadwalCollection = collection(db, 'jadwal');
    const querySnapshot = await getDocs(jadwalCollection);
    
    let publishedCount = 0;
    let skippedCount = 0;
    
    console.log(`📊 Total schedules found: ${querySnapshot.size}`);
    
    for (const docSnap of querySnapshot.docs) {
      const jadwalData = docSnap.data();
      const jadwalId = docSnap.id;
      
      // Check if still draft
      if (jadwalData.status === 'draft' || 
          jadwalData.approvalStatus === 'pending' ||
          jadwalData.isPublished !== true) {
        
        const jadwalRef = doc(db, 'jadwal', jadwalId);
        await updateDoc(jadwalRef, {
          status: 'published',
          approvalStatus: 'approved',
          isPublished: true,
          approvedAt: Timestamp.now(),
          approvedBy: 'Emergency System Fix',
          publishedAt: Timestamp.now(),
          publishedBy: 'Emergency System Fix',
          updatedAt: Timestamp.now()
        });
        
        publishedCount++;
        
        if (publishedCount % 50 === 0) {
          console.log(`📋 Published ${publishedCount} schedules so far...`);
        }
        
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n📊 EMERGENCY FIX SUMMARY:');
    console.log(`=======================================`);
    console.log(`📢 Schedules published: ${publishedCount}`);
    console.log(`✅ Schedules skipped: ${skippedCount}`);
    console.log(`📊 Total schedules: ${querySnapshot.size}`);
    console.log(`=======================================`);
    
    if (publishedCount > 0) {
      console.log(`\n🎉 SUCCESS! ${publishedCount} schedules have been published!`);
      console.log(`🔥 ALL schedules are now published and visible to teachers and students.`);
    } else {
      console.log(`\n✅ No schedules needed to be published.`);
    }
    
  } catch (error) {
    console.error('❌ Error during emergency fix:', error);
    throw error;
  }
}

// Run it
publishAllDraftSchedules()
  .then(() => {
    console.log('\n✅ Emergency script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Emergency script failed:', error);
    process.exit(1);
  });
