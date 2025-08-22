import { collection, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase.node.js';

async function publishAllSchedules() {
  try {
    console.log('🔄 Updating all schedules to be published...');
    const snapshot = await getDocs(collection(db, 'jadwal'));
    let updateCount = 0;

    snapshot.forEach(async (document) => {
      const scheduleRef = doc(db, 'jadwal', document.id);
      await updateDoc(scheduleRef, {
        isPublished: true,
        status: 'published',
        approvalStatus: 'approved',
      });
      updateCount++;
      console.log(`✅ Updated schedule: ${document.id}`);
    });

    console.log(`🔄 Total schedules updated: ${updateCount}`);
  } catch (error) {
    console.error('❌ Error updating schedules:', error);
  }
}

publishAllSchedules();
