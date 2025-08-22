import { db } from '../config/firebase.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fetch from 'node-fetch';

/**
 * Script untuk mengirim notifikasi jadwal dari Admin (ID: 001) menggunakan REST API
 * Mengambil data admin dari database dan menggunakan sebagai sender
 */

const FIREBASE_URL = 'https://expo-firebase-f28df-default-rtdb.asia-southeast1.firebasedatabase.app';

// Function to create notification via REST API
async function createNotificationREST(userId, message, senderInfo = null, notificationType = 'general', userType = null, useNIS = false) {
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
    console.log('🚀 Starting notification process from Admin (ID: 001) with REST API...');
    
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
    
    // Debug: Show first few student IDs to understand format
    console.log('\n🔍 Sample student IDs:');
    allStudents.slice(0, 3).forEach(student => {
      console.log(`   ID: ${student.id}, Name: ${student.namaLengkap}, NIS: ${student.nis || 'N/A'}`);
    });
    
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
    
    for (const student of allStudents) {
      try {
        const message = `📅 Jadwal pelajaran kelas ${student.kelas} telah dipublikasi oleh ${senderInfo.name}! Silakan cek aplikasi untuk melihat jadwal pelajaran terbaru Anda. Kontak: ${senderInfo.email}`;
        
        // Try different ID formats to find one that works
        const studentUserId = `student_${student.id}`; // Format: student_33
        await createNotificationREST(studentUserId, message, senderInfo, 'jadwal', 'murid');
        successCount++;
        
        if (successCount % 5 === 0) {
          console.log(`📧 Sent ${successCount} notifications so far...`);
        }
        
        // Small delay to be nice to Firebase
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Failed to send notification to ${student.namaLengkap}:`, error.message);
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
        const message = `📅 Jadwal mengajar Anda telah dipublikasi oleh ${senderInfo.name} (${teacherSchedules.length} slot jadwal). Silakan cek aplikasi untuk melihat jadwal mengajar terbaru. Kontak: ${senderInfo.email}`;
        
        await createNotificationREST(teacherId, message, senderInfo, 'jadwal', 'guru');
        teacherSuccessCount++;
        console.log(`✅ Notification sent to teacher: ${teacherId}`);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
        
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
      const studentRate = allStudents.length > 0 ? Math.round(successCount/allStudents.length*100) : 0;
      const teacherRate = uniqueTeachers.length > 0 ? Math.round(teacherSuccessCount/uniqueTeachers.length*100) : 0;
      console.log(`   Students: ${successCount}/${allStudents.length} (${studentRate}%)`);
      console.log(`   Teachers: ${teacherSuccessCount}/${uniqueTeachers.length} (${teacherRate}%)`);
    } else {
      console.log(`\n⚠️  No notifications were sent. Please check for errors above.`);
    }
    
  } catch (error) {
    console.error('❌ Error in notification process:', error);
    throw error;
  }
}

// Install node-fetch if not available
try {
  await import('node-fetch');
} catch (error) {
  console.log('⚠️ node-fetch not found, trying to install...');
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    await execAsync('npm install node-fetch');
    console.log('✅ node-fetch installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install node-fetch:', installError.message);
    console.log('Please run: npm install node-fetch');
    process.exit(1);
  }
}

// Run the script
console.log('🌐 Admin REST API Schedule Notification Script (ID: 001)');
console.log('=========================================================');

sendScheduleNotifications()
  .then(() => {
    console.log('\n✅ Notification process completed successfully!');
    console.log('🎯 All notifications have been processed via REST API.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Notification process failed:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('- Check network connectivity');
    console.log('- Verify Firebase project URL');
    console.log('- Check Firebase database rules');
    process.exit(1);
  });
