import { db } from '../config/firebase.js';
import { collection, getDocs, updateDoc, doc, Timestamp, limit, query } from 'firebase/firestore';

async function testUpdate() {
  try {
    console.log('🔧 Testing Firebase update...');
    
    // Get just one schedule to test
    const jadwalCollection = collection(db, 'jadwal');
    const q = query(jadwalCollection, limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No schedules found!');
      return;
    }
    
    const docSnap = querySnapshot.docs[0];
    const jadwalData = docSnap.data();
    const jadwalId = docSnap.id;
    
    console.log('📋 Found schedule:');
    console.log('   ID:', jadwalId);
    console.log('   Kelas:', jadwalData.namaKelas);
    console.log('   Current status:', jadwalData.status);
    console.log('   Current approval:', jadwalData.approvalStatus);
    console.log('   Current published:', jadwalData.isPublished);
    
    // Try to update it
    console.log('\n🔄 Updating schedule...');
    const jadwalRef = doc(db, 'jadwal', jadwalId);
    
    await updateDoc(jadwalRef, {
      status: 'published',
      approvalStatus: 'approved',
      isPublished: true,
      approvedAt: Timestamp.now(),
      approvedBy: 'Test Script',
      publishedAt: Timestamp.now(),
      publishedBy: 'Test Script',
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Update successful!');
    
    // Verify the update
    const updatedSnapshot = await getDocs(q);
    const updatedData = updatedSnapshot.docs[0].data();
    
    console.log('\n📋 After update:');
    console.log('   Status:', updatedData.status);
    console.log('   Approval:', updatedData.approvalStatus);
    console.log('   Published:', updatedData.isPublished);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testUpdate();
