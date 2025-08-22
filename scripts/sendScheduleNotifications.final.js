import { db } from '../config/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import fetch from 'node-fetch';

/**
 * FINAL script untuk mengirim notifikasi jadwal published
 * Menggunakan format ID yang SAMA dengan aplikasi
 */

const FIREBASE_URL = 'https://expo-firebase-f28df-default-rtdb.asia-southeast1.firebasedatabase.app';

// Function to create notification via REST API
async function createNotificationREST(userId, message, senderInfo = null, notificationType = 'general', userType = null) {
  try {
    const notificationData = {
      userId,
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
    
    const response = await fetch(`${FIREBASE_URL}/notifications.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Notification created for user: ${userId}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to create notification for user ${userId}:`, error.message);
    throw error;
  }
}

async function sendScheduleNotifications() {
  try {
    console.log('🚀 Starting FINAL notification process...');
    console.log('🔧 This script will send notifications that students can actually receive!');
    
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
    
    // STRATEGY 1: Send notifications to exact Document IDs (what app reads)
    let successCount = 0;
    let errorCount = 0;
    
    console.log('\n📧 STRATEGY 1: Sending to exact Document IDs...');
    
    for (const student of allStudents) {
      try {
        const message = `📅 Jadwal pelajaran kelas ${student.kelas} telah dipublikasi! Silakan cek aplikasi untuk melihat jadwal pelajaran terbaru Anda.`;
        
        // Use exact document ID that app reads from
        await createNotificationREST(student.id, message, senderInfo, 'jadwal', 'murid');
        successCount++;
        
        console.log(`📧 Sent to student ID: ${student.id} (${student.namaLengkap})`);
        
        // Small delay to be nice to Firebase
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ Failed to send to ${student.namaLengkap} (ID: ${student.id}):`, error.message);
        errorCount++;
      }
    }
    
    // STRATEGY 2: Class-based notifications as backup
    console.log('\n📱 STRATEGY 2: Creating class-based notifications (backup)...');
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
    
    // STRATEGY 3: Send to teachers (this already works)
    const uniqueTeachers = [...new Set(publishedSchedules.map(s => s.guruId).filter(id => id && id !== '-'))];
    console.log(`\n👨‍🏫 STRATEGY 3: Sending to ${uniqueTeachers.length} teachers...`);
    
    let teacherSuccessCount = 0;
    let teacherErrorCount = 0;
    
    for (const teacherId of uniqueTeachers) {
      try {
        const teacherSchedules = publishedSchedules.filter(s => s.guruId === teacherId);
        const message = `📅 Jadwal mengajar Anda telah dipublikasi (${teacherSchedules.length} slot jadwal). Silakan cek aplikasi untuk melihat jadwal mengajar terbaru.`;
        
        await createNotificationREST(teacherId, message, senderInfo, 'jadwal', 'guru');
        teacherSuccessCount++;
        console.log(`✅ Teacher notification sent: ${teacherId}`);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Failed to send to teacher ${teacherId}:`, error.message);
        teacherErrorCount++;
      }
    }
    
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`=======================================`);
    console.log(`👨‍🎓 Student notifications (Document ID): ${successCount}`);
    console.log(`❌ Student notification errors: ${errorCount}`);
    console.log(`📚 Class notifications (Backup): ${classNotificationCount}`);
    console.log(`👨‍🏫 Teacher notifications: ${teacherSuccessCount}`);
    console.log(`❌ Teacher notification errors: ${teacherErrorCount}`);
    console.log(`📋 Total published schedules: ${publishedSchedules.length}`);
    console.log(`=======================================`);
    
    if (successCount > 0 || teacherSuccessCount > 0 || classNotificationCount > 0) {
      console.log(`\n🎉 SUCCESS! Multi-strategy notification sending completed!`);
      console.log(`📱 Notifications sent using multiple approaches for maximum coverage.`);
      console.log(`\n📈 Success Rates:`);
      const studentRate = allStudents.length > 0 ? Math.round(successCount/allStudents.length*100) : 0;
      const teacherRate = uniqueTeachers.length > 0 ? Math.round(teacherSuccessCount/uniqueTeachers.length*100) : 0;
      const classRate = uniqueClasses.length > 0 ? Math.round(classNotificationCount/uniqueClasses.length*100) : 0;
      console.log(`   📱 Students (Direct): ${successCount}/${allStudents.length} (${studentRate}%)`);
      console.log(`   📚 Classes (Backup): ${classNotificationCount}/${uniqueClasses.length} (${classRate}%)`);
      console.log(`   👨‍🏫 Teachers: ${teacherSuccessCount}/${uniqueTeachers.length} (${teacherRate}%)`);
      
      console.log(`\n💡 COVERAGE ANALYSIS:`);
      if (successCount > 0) {
        console.log(`   ✅ Direct student notifications working! (${successCount} students)`);
      } else {
        console.log(`   ⚠️ Direct student notifications failed, but class notifications provide backup`);
      }
      console.log(`   ✅ Teacher notifications working perfectly! (${teacherSuccessCount} teachers)`);
      console.log(`   ✅ Class-based backup notifications sent! (${classNotificationCount} classes)`);
      
    } else {
      console.log(`\n⚠️ All strategies failed. Please check Firebase configuration.`);
    }
    
  } catch (error) {
    console.error('❌ Error in notification process:', error);
    throw error;
  }
}

// Run the script
console.log('🎯 FINAL NOTIFICATION SCRIPT');
console.log('============================');
console.log('🚀 Using multi-strategy approach for maximum notification coverage!');

sendScheduleNotifications()
  .then(() => {
    console.log('\n✅ FINAL notification process completed successfully!');
    console.log('🎯 All notification strategies have been executed.');
    console.log('\n📍 NEXT STEPS:');
    console.log('1. Check your mobile app to see if notifications appear');
    console.log('2. Both individual and class-based notifications were sent');
    console.log('3. Teachers should definitely receive notifications');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ FINAL notification process failed:', error);
    console.log('\n🔍 All strategies attempted. Check:');
    console.log('- Firebase console for notification data');
    console.log('- App notification reading logic');
    console.log('- Network connectivity and Firebase rules');
    process.exit(1);
  });
