import { db } from '../config/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import { createNotification } from '../services/notificationService.node.js';

/**
 * Script sederhana untuk mengirim notifikasi jadwal published
 */
async function sendScheduleNotifications() {
  try {
    console.log('🚀 Starting notification process...');
    
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
      name: 'Sistem Jadwal',
      type: 'system',
      id: 'schedule_system'
    };
    
    // Send notifications to students
    let successCount = 0;
    let errorCount = 0;
    
    console.log('\n📧 Sending notifications to students...');
    
    for (const student of allStudents) {
      try {
        const message = `📅 Jadwal pelajaran kelas ${student.kelas} telah dipublikasi! Silakan cek aplikasi untuk melihat jadwal pelajaran terbaru Anda.`;
        
        await createNotification(student.id, message, senderInfo, 'jadwal', 'murid');
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`📧 Sent ${successCount} notifications so far...`);
        }
      } catch (error) {
        console.error(`❌ Failed to send notification to ${student.namaLengkap}:`, error);
        errorCount++;
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
        
        // Buat pesan yang lebih informatif tentang jadwal mengajar
        const uniqueClasses = [...new Set(teacherSchedules.map(s => s.namaKelas))];
        const classesText = uniqueClasses.length > 3 
          ? `${uniqueClasses.slice(0, 3).join(', ')} dan ${uniqueClasses.length - 3} kelas lainnya`
          : uniqueClasses.join(', ');
        
        const message = `📚 Jadwal mengajar Anda telah dipublikasi! Anda memiliki ${teacherSchedules.length} slot mengajar untuk kelas: ${classesText}. Silakan buka aplikasi untuk melihat detail jadwal lengkap Anda.`;
        
        await createNotification(teacherId, message, senderInfo, 'jadwal', 'guru');
        teacherSuccessCount++;
        console.log(`✅ Notification sent to teacher: ${teacherId} (${teacherSchedules.length} schedules, ${uniqueClasses.length} classes)`);
      } catch (error) {
        console.error(`❌ Failed to send notification to teacher ${teacherId}:`, error);
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
    } else {
      console.log(`\n⚠️  No notifications were sent. Please check for errors above.`);
    }
    
  } catch (error) {
    console.error('❌ Error in notification process:', error);
    throw error;
  }
}

// Run the script
sendScheduleNotifications()
  .then(() => {
    console.log('\n✅ Notification process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Notification process failed:', error);
    process.exit(1);
  });
