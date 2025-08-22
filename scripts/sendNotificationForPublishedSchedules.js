import { db } from '../config/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Script untuk mengirim notifikasi ke murid dan guru
 * untuk jadwal yang sudah published tapi belum dapat notifikasi
 */
async function sendNotificationForPublishedSchedules() {
  try {
    console.log('📧 Mengirim notifikasi untuk jadwal yang sudah published...');
    
    // Import services yang diperlukan
    const { createNotification } = await import('../services/notificationService.js');
    const MuridService = await import('../services/MuridService.js');
    const GuruService = await import('../services/GuruService.js');
    
    // Ambil semua jadwal yang published
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
    
    // Group schedules by class for efficient notification
    const schedulesByClass = {};
    const schedulesByTeacher = {};
    
    publishedSchedules.forEach(schedule => {
      // Group by class
      if (schedule.namaKelas) {
        if (!schedulesByClass[schedule.namaKelas]) {
          schedulesByClass[schedule.namaKelas] = [];
        }
        schedulesByClass[schedule.namaKelas].push(schedule);
      }
      
      // Group by teacher
      if (schedule.guruId && schedule.guruId !== '-') {
        if (!schedulesByTeacher[schedule.guruId]) {
          schedulesByTeacher[schedule.guruId] = [];
        }
        schedulesByTeacher[schedule.guruId].push(schedule);
      }
    });
    
    const senderInfo = {
      name: 'Sistem Notifikasi',
      type: 'system',
      id: 'notification_system'
    };
    
    console.log(`\n📧 Sending notifications to students...`);
    
    // Send notifications to students by class
    let totalStudentNotifications = 0;
    let totalStudentErrors = 0;
    
    for (const [className, schedules] of Object.entries(schedulesByClass)) {
      try {
        const studentsInClass = await MuridService.default.getMuridByKelas(className);
        console.log(`📋 Processing class ${className}: ${studentsInClass.length} students, ${schedules.length} schedules`);
        
        const message = `📅 Jadwal pelajaran kelas ${className} telah dipublikasi dan siap dilihat. Silakan cek aplikasi untuk melihat jadwal pelajaran Anda.`;
        
        for (const student of studentsInClass) {
          try {
            await createNotification(student.id, message, senderInfo, 'jadwal', 'murid');
            totalStudentNotifications++;
          } catch (error) {
            console.error(`❌ Failed to send notification to student ${student.namaLengkap}:`, error);
            totalStudentErrors++;
          }
        }
        
        console.log(`✅ Completed class ${className}`);
      } catch (error) {
        console.error(`❌ Error processing class ${className}:`, error);
      }
    }
    
    console.log(`\n📧 Sending notifications to teachers...`);
    
    // Send notifications to teachers
    let totalTeacherNotifications = 0;
    let totalTeacherErrors = 0;
    
    for (const [teacherId, schedules] of Object.entries(schedulesByTeacher)) {
      try {
        // Buat pesan yang lebih informatif tentang jadwal mengajar
        const uniqueClasses = [...new Set(schedules.map(s => s.namaKelas))];
        const classesText = uniqueClasses.length > 3 
          ? `${uniqueClasses.slice(0, 3).join(', ')} dan ${uniqueClasses.length - 3} kelas lainnya`
          : uniqueClasses.join(', ');
        
        const message = `📚 Jadwal mengajar Anda telah dipublikasi! Anda memiliki ${schedules.length} slot mengajar untuk kelas: ${classesText}. Silakan buka aplikasi untuk melihat detail jadwal lengkap Anda.`;
        
        await createNotification(teacherId, message, senderInfo, 'jadwal', 'guru');
        totalTeacherNotifications++;
        console.log(`✅ Notification sent to teacher: ${teacherId} (${schedules.length} schedules, ${uniqueClasses.length} classes)`);
      } catch (error) {
        console.error(`❌ Failed to send notification to teacher ${teacherId}:`, error);
        totalTeacherErrors++;
      }
    }
    
    console.log('\n📊 NOTIFICATION SUMMARY:');
    console.log(`======================================`);
    console.log(`👨‍🎓 Student notifications sent: ${totalStudentNotifications}`);
    console.log(`❌ Student notification errors: ${totalStudentErrors}`);
    console.log(`👨‍🏫 Teacher notifications sent: ${totalTeacherNotifications}`);
    console.log(`❌ Teacher notification errors: ${totalTeacherErrors}`);
    console.log(`📚 Classes processed: ${Object.keys(schedulesByClass).length}`);
    console.log(`👥 Teachers processed: ${Object.keys(schedulesByTeacher).length}`);
    console.log(`======================================`);
    
    if (totalStudentNotifications > 0 || totalTeacherNotifications > 0) {
      console.log(`\n🎉 SUCCESS! Notifications sent successfully!`);
      console.log(`📱 All users should now receive notifications about published schedules.`);
    } else {
      console.log(`\n⚠️  No notifications were sent. Please check for errors above.`);
    }
    
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    throw error;
  }
}

// Run the script
sendNotificationForPublishedSchedules()
  .then(() => {
    console.log('\n✅ Notification script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Notification script failed:', error);
    process.exit(1);
  });
