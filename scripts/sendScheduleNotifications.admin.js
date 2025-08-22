import { db } from '../config/firebase.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { createNotification } from '../services/notificationService.admin.js';

/**
 * Script untuk mengirim notifikasi jadwal published dari Admin (ID: 001)
 * Mengambil data admin dari database dan menggunakan sebagai sender
 */
async function sendScheduleNotifications() {
  try {
    console.log('🚀 Starting notification process from Admin (ID: 001)...');
    
    // Get admin data from Firestore
    console.log('👨‍💼 Getting admin data from database (ID: 001)');
    const adminDocRef = doc(db, 'admin', '001');
    const adminDoc = await getDoc(adminDocRef);
    
    if (!adminDoc.exists()) {
      console.error('❌ Admin with ID 001 not found in database!');
      return;
    }
    
    const adminData = adminDoc.data();
    console.log(`👨‍💼 Found admin: ${adminData.namaLengkap}`);
    console.log(`📧 Email: ${adminData.email}`);
    
    // Get all published schedules
    const jadwalCollection = collection(db, 'jadwal');
    const querySnapshot = await getDocs(jadwalCollection);
    
    const publishedSchedules = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isPublished === true) {
        publishedSchedules.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    console.log(`📊 Found ${publishedSchedules.length} published schedules`);
    
    if (publishedSchedules.length === 0) {
      console.log('✅ No published schedules found.');
      return;
    }
    
    // Get unique classes
    const uniqueClasses = [...new Set(publishedSchedules.map(s => s.namaKelas).filter(Boolean))];
    console.log(`📚 Classes with published schedules: ${uniqueClasses.join(', ')}`);
    
    // Get students by class manually - avoid complex service imports
    const muridCollection = collection(db, 'murid');
    const muridSnapshot = await getDocs(muridCollection);
    
    const allStudents = [];
    muridSnapshot.forEach((doc) => {
      const studentData = doc.data();
      if (uniqueClasses.includes(studentData.kelas)) {
        allStudents.push({
          id: doc.id,
          ...studentData
        });
      }
    });
    
    console.log(`👨‍🎓 Found ${allStudents.length} students in relevant classes`);
    
    const senderInfo = {
      name: adminData.namaLengkap,
      type: 'admin',
      id: '001',
      email: adminData.email,
      jabatan: adminData.jabatan || 'Administrator'
    };
    
    // Send notifications to students
    let successCount = 0;
    let errorCount = 0;
    
    console.log('\n📧 Sending notifications to students...');
    
    // Process students in smaller batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < allStudents.length; i += batchSize) {
      const batch = allStudents.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allStudents.length/batchSize)} (${batch.length} students)`);
      
      const batchPromises = batch.map(async (student) => {
        try {
          const message = `📅 Jadwal pelajaran kelas ${student.kelas} telah dipublikasi oleh ${senderInfo.name}! Silakan cek aplikasi untuk melihat jadwal pelajaran terbaru Anda. Jika ada pertanyaan, hubungi ${senderInfo.email}.`;
          
          await createNotification(student.id, message, senderInfo, 'jadwal', 'murid', 2); // Reduced retries for batch processing
          return { success: true, student: student.namaLengkap };
        } catch (error) {
          console.error(`❌ Failed to send notification to ${student.namaLengkap}:`, error.message);
          return { success: false, student: student.namaLengkap, error: error.message };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      });
      
      console.log(`📊 Batch completed. Success: ${successCount}, Errors: ${errorCount}`);
      
      // Small delay between batches to be nice to Firebase
      if (i + batchSize < allStudents.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Send notifications to teachers
    const uniqueTeachers = [...new Set(publishedSchedules.map(s => s.guruId).filter(id => id && id !== '-'))];
    console.log(`\n👨‍🏫 Found ${uniqueTeachers.length} unique teachers`);
    
    let teacherSuccessCount = 0;
    let teacherErrorCount = 0;
    
    console.log('📧 Sending notifications to teachers...');
    
    for (const teacherId of uniqueTeachers) {
      try {
        const teacherSchedules = publishedSchedules.filter(s => s.guruId === teacherId);
        const message = `📅 Jadwal mengajar Anda telah dipublikasi oleh ${senderInfo.name} (${teacherSchedules.length} slot jadwal). Silakan cek aplikasi untuk melihat jadwal mengajar terbaru. Kontak: ${senderInfo.email}`;
        
        await createNotification(teacherId, message, senderInfo, 'jadwal', 'guru', 2);
        teacherSuccessCount++;
        console.log(`✅ Notification sent to teacher: ${teacherId}`);
      } catch (error) {
        console.error(`❌ Failed to send notification to teacher ${teacherId}:`, error.message);
        teacherErrorCount++;
      }
    }
    
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`=======================================`);
    console.log(`👨‍🎓 Student notifications sent: ${successCount}`);
    console.log(`❌ Student notification errors: ${errorCount}`);
    console.log(`👨‍🏫 Teacher notifications sent: ${teacherSuccessCount}`);
    console.log(`❌ Teacher notification errors: ${teacherErrorCount}`);
    console.log(`📚 Total classes: ${uniqueClasses.length}`);
    console.log(`📋 Total published schedules: ${publishedSchedules.length}`);
    console.log(`=======================================`);
    
    if (successCount > 0 || teacherSuccessCount > 0) {
      console.log(`\n🎉 SUCCESS! Notifications sent successfully!`);
      console.log(`📱 Users should now receive notifications about published schedules.`);
      console.log(`\n📈 Success Rate:`);
      console.log(`   Students: ${successCount}/${allStudents.length} (${Math.round(successCount/allStudents.length*100)}%)`);
      console.log(`   Teachers: ${teacherSuccessCount}/${uniqueTeachers.length} (${Math.round(teacherSuccessCount/uniqueTeachers.length*100)}%)`);
    } else {
      console.log(`\n⚠️  No notifications were sent. Please check for errors above.`);
    }
    
  } catch (error) {
    console.error('❌ Error in notification process:', error);
    throw error;
  }
}

// Run the script
console.log('🔥 Admin Schedule Notification Script (ID: 001)');
console.log('===============================================');

sendScheduleNotifications()
  .then(() => {
    console.log('\n✅ Notification process completed successfully!');
    console.log('🎯 All notifications have been processed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Notification process failed:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('- Check Firebase Admin SDK configuration');
    console.log('- Verify Firebase project permissions');
    console.log('- Check network connectivity');
    console.log('- Review Firebase console for any issues');
    process.exit(1);
  });
