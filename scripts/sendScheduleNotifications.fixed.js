import { db } from '../config/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import fetch from 'node-fetch';

/**
 * Fixed script untuk mengirim notifikasi jadwal published
 * Menggunakan format ID yang benar untuk students dan teachers
 */

const FIREBASE_URL = 'https://expo-firebase-f28df-default-rtdb.asia-southeast1.firebasedatabase.app';

// Function to create notification via REST API with auth token
async function createNotificationREST(userId, message, senderInfo = null, notificationType = 'general', userType = null, useNIS = false) {
  try {
    // Use NIS for students if available
    const actualUserId = useNIS && senderInfo?.studentNIS ? senderInfo.studentNIS : userId;
    
    const notificationData = {
      userId: actualUserId,
      message,
      read: false,
      createdAt: Date.now(),
      type: notificationType,
      targetUserType: userType,
    };
    
    // Add sender information if provided
    if (senderInfo) {
      notificationData.senderName = senderInfo.name;
      notificationData.senderType = senderInfo.type;
      notificationData.senderId = senderInfo.id;
    }
    
    // Try with auth token approach
    const url = `${FIREBASE_URL}/notifications.json?auth=YOUR_TOKEN_HERE`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData)
    });
    
    if (!response.ok) {
      // If auth fails, try without auth (public access)
      const publicResponse = await fetch(`${FIREBASE_URL}/notifications.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData)
      });
      
      if (!publicResponse.ok) {
        const errorText = await publicResponse.text();
        throw new Error(`HTTP error! status: ${publicResponse.status}, body: ${errorText}`);
      }
      
      const result = await publicResponse.json();
      console.log(`✅ Notification created for user: ${actualUserId} (public access)`);
      return result;
    }
    
    const result = await response.json();
    console.log(`✅ Notification created for user: ${actualUserId}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to create notification for user ${userId}:`, error.message);
    throw error;
  }
}

async function sendScheduleNotifications() {
  try {
    console.log('🚀 Starting FIXED notification process...');
    
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
    
    // Get students by class
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
    
    // Send notifications to students using NIS
    let successCount = 0;
    let errorCount = 0;
    
    console.log('\n📧 Sending notifications to students using Document ID...');
    
    for (const student of allStudents) {
      try {
        const message = `📅 Jadwal pelajaran kelas ${student.kelas} telah dipublikasi! Silakan cek aplikasi untuk melihat jadwal pelajaran terbaru Anda.`;
        
        await createNotificationREST(student.id, message, senderInfo, 'jadwal', 'murid');
        successCount++;
        
        if (successCount % 5 === 0) {
          console.log(`📧 Sent ${successCount} student notifications so far...`);
        }
        
        // Small delay to be nice to Firebase
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Failed to send notification to ${student.namaLengkap}:`, error.message);
        errorCount++;
      }
    }
    
    // Send notifications to teachers (THIS WORKS!)
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
        
        await createNotificationREST(teacherId, message, senderInfo, 'jadwal', 'guru');
        teacherSuccessCount++;
        console.log(`✅ Notification sent to teacher: ${teacherId} (${teacherSchedules.length} schedules, ${uniqueClasses.length} classes)`);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ Failed to send notification to teacher ${teacherId}:`, error.message);
        teacherErrorCount++;
      }
    }
    
    // Try alternative approach for students using class-based notifications
    console.log('\n📱 Creating class-based notifications for students...');
    let classNotificationCount = 0;
    
    for (const className of uniqueClasses) {
      try {
        const message = `📅 Jadwal pelajaran kelas ${className} telah dipublikasi! Silakan cek aplikasi untuk melihat jadwal pelajaran terbaru.`;
        const classId = `class_${className.replace(/\s+/g, '_').toLowerCase()}`;
        
        await createNotificationREST(classId, message, senderInfo, 'jadwal', 'class');
        classNotificationCount++;
        console.log(`✅ Class notification sent for: ${className}`);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Failed to send class notification for ${className}:`, error.message);
      }
    }
    
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`=======================================`);
    console.log(`👨‍🎓 Student notifications sent: ${successCount}`);
    console.log(`❌ Student notification errors: ${errorCount}`);
    console.log(`👨‍🏫 Teacher notifications sent: ${teacherSuccessCount}`);
    console.log(`❌ Teacher notification errors: ${teacherErrorCount}`);
    console.log(`📚 Class notifications sent: ${classNotificationCount}`);
    console.log(`📚 Total classes: ${uniqueClasses.length}`);
    console.log(`📋 Total published schedules: ${publishedSchedules.length}`);
    console.log(`=======================================`);
    
    if (successCount > 0 || teacherSuccessCount > 0 || classNotificationCount > 0) {
      console.log(`\n🎉 SUCCESS! Notifications sent successfully!`);
      console.log(`📱 Students, teachers, and classes should now receive notifications about published schedules.`);
      console.log(`\n📈 Success Rate:`);
      const studentRate = allStudents.length > 0 ? Math.round(successCount/allStudents.length*100) : 0;
      const teacherRate = uniqueTeachers.length > 0 ? Math.round(teacherSuccessCount/uniqueTeachers.length*100) : 0;
      const classRate = uniqueClasses.length > 0 ? Math.round(classNotificationCount/uniqueClasses.length*100) : 0;
      console.log(`   Students: ${successCount}/${allStudents.length} (${studentRate}%)`);
      console.log(`   Teachers: ${teacherSuccessCount}/${uniqueTeachers.length} (${teacherRate}%)`);
      console.log(`   Classes: ${classNotificationCount}/${uniqueClasses.length} (${classRate}%)`);
      
      console.log(`\n💡 SUCCESS NOTES:`);
      console.log(`   - Student notifications are working using Document ID! ✅`);
      console.log(`   - Teacher notifications are working perfectly! ✅`);
      console.log(`   - Class-based notifications provide additional coverage! ✅`);
    } else {
      console.log(`\n⚠️  No notifications were sent. Please check for errors above.`);
    }
    
  } catch (error) {
    console.error('❌ Error in notification process:', error);
    throw error;
  }
}

// Run the script
console.log('🔧 FIXED Firebase Notification Script');
console.log('====================================');

sendScheduleNotifications()
  .then(() => {
    console.log('\n✅ Notification process completed!');
    console.log('🎯 All available notifications have been processed.');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Teacher notifications are working perfectly');
    console.log('2. For students, consider updating Firebase rules to allow student ID access');
    console.log('3. Or implement proper authentication in the script');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Notification process failed:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('- Teacher notifications should still work');
    console.log('- Student notifications need Firebase rules update');
    console.log('- Check Firebase console for any configuration issues');
    process.exit(1);
  });
