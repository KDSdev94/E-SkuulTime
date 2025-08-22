import { db } from '../config/firebase.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fetch from 'node-fetch';

/**
 * Script untuk mengirim notifikasi dari Admin REAL (ID: 001) ke murid
 * Mengambil data admin dari database Firestore
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
    console.log(`✅ Notification sent to: ${userId}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to send notification to ${userId}:`, error.message);
    throw error;
  }
}

async function sendRealAdminNotificationToStudents() {
  try {
    console.log('🚀 Starting Real Admin notification process...');
    console.log('👨‍💼 Getting admin data from database (ID: 001)');
    
    // Get admin data from Firestore
    const adminDocRef = doc(db, 'admin', '001');
    const adminDoc = await getDoc(adminDocRef);
    
    if (!adminDoc.exists()) {
      console.error('❌ Admin with ID 001 not found in database!');
      return;
    }
    
    const adminData = adminDoc.data();
    console.log(`👨‍💼 Found admin: ${adminData.namaLengkap}`);
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`📱 Phone: ${adminData.nomorHP}`);
    
    // Get all students
    const muridCollection = collection(db, 'murid');
    const muridSnapshot = await getDocs(muridCollection);
    
    const allStudents = [];
    muridSnapshot.forEach((doc) => {
      const studentData = doc.data();
      allStudents.push({
        id: doc.id,
        ...studentData
      });
    });
    
    console.log(`👨‍🎓 Found ${allStudents.length} students`);
    
    if (allStudents.length === 0) {
      console.log('❌ No students found in database');
      return;
    }
    
    // Real admin sender information
    const adminSender = {
      name: adminData.namaLengkap,
      type: 'admin',
      id: '001',
      email: adminData.email,
      jabatan: adminData.jabatan || 'Administrator'
    };
    
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`\n📧 Sending notifications from: ${adminSender.name}`);
    console.log(`👔 Jabatan: ${adminSender.jabatan}`);
    console.log('================================');
    
    for (const student of allStudents) {
      try {
        // Custom message from real admin
        const message = `🎓 Selamat datang di sistem E-SkuulTime! Saya ${adminSender.name}, ${adminSender.jabatan} sekolah, mengucapkan selamat bergabung kepada ${student.namaLengkap} dari kelas ${student.kelas}. Silakan gunakan aplikasi ini untuk mengakses jadwal pelajaran, informasi akademik, dan komunikasi sekolah. Jika ada pertanyaan, silakan hubungi saya di ${adminSender.email}. Semoga sukses dalam pembelajaran! 📚✨`;
        
        await createNotificationREST(student.id, message, adminSender, 'pengumuman', 'murid');
        successCount++;
        
        console.log(`📧 ✅ ${student.namaLengkap} (${student.kelas})`);
        
        // Small delay to be nice to Firebase
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Failed to send to ${student.namaLengkap}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 NOTIFICATION SUMMARY:');
    console.log('==========================================');
    console.log(`👨‍💼 Sender: ${adminSender.name}`);
    console.log(`👔 Position: ${adminSender.jabatan}`);
    console.log(`📧 Email: ${adminSender.email}`);
    console.log(`🆔 Admin ID: ${adminSender.id}`);
    console.log(`📨 Message Type: Personal Welcome/Pengumuman`);
    console.log(`✅ Successfully sent: ${successCount} notifications`);
    console.log(`❌ Failed to send: ${errorCount} notifications`);
    console.log(`📋 Total students: ${allStudents.length}`);
    console.log(`📈 Success rate: ${Math.round(successCount/allStudents.length*100)}%`);
    console.log('==========================================');
    
    if (successCount > 0) {
      console.log(`\n🎉 SUCCESS! Personal notifications sent from Real Admin!`);
      console.log(`📱 ${successCount} students received personal welcome message from ${adminSender.name}`);
      
      // Group students by class for summary
      const classCounts = {};
      allStudents.forEach(student => {
        const kelas = student.kelas || 'Unknown';
        classCounts[kelas] = (classCounts[kelas] || 0) + 1;
      });
      
      console.log('\n👥 Students notified by class:');
      Object.entries(classCounts).forEach(([kelas, count]) => {
        console.log(`   📚 ${kelas}: ${count} students`);
      });
      
    } else {
      console.log(`\n❌ No notifications were sent successfully.`);
    }
    
  } catch (error) {
    console.error('❌ Error in real admin notification process:', error);
    throw error;
  }
}

// Run the script
console.log('👨‍💼 REAL ADMIN NOTIFICATION SCRIPT');
console.log('===================================');
console.log('📢 Sending personal message from Real Admin (ID: 001) to all students');

sendRealAdminNotificationToStudents()
  .then(() => {
    console.log('\n✅ Real Admin notification process completed successfully!');
    console.log('📱 Students can now see the personalized welcome message from Real Admin');
    console.log('\n📍 NEXT STEPS:');
    console.log('1. Check mobile app notifications');
    console.log('2. Verify students receive the admin message with real admin name');
    console.log('3. Students should see notification from the actual admin in database');
    console.log('4. Message includes personal details and admin contact info');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Real Admin notification process failed:', error);
    console.log('\n🔍 Please check:');
    console.log('- Admin with ID "001" exists in Firestore');
    console.log('- Firebase configuration and permissions');
    console.log('- Network connectivity');
    console.log('- Student data in database');
    process.exit(1);
  });
