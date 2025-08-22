import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase.node.js';
import { createNotification } from './notificationService';

export class RegistrationNotificationService {
  
  // Send notification to all admins when a guru registers
  static async notifyAdminGuruRegistration(guruData, senderInfo = null) {
    try {
      console.log('🔔 RegistrationNotificationService: Sending guru registration notification to all admins');
      
      // Get all admins directly from database to avoid circular dependency
      const adminQuery = query(
        collection(db, 'admin'),
        where('statusAdmin', '==', 'Aktif')
      );
      const adminSnapshot = await getDocs(adminQuery);
      
      if (adminSnapshot.empty) {
        console.warn('⚠️ RegistrationNotificationService: No active admins found');
        return;
      }

      const registrationTime = new Date();
      const formattedTime = registrationTime.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const message = `👨‍🏫 Pendaftaran Akun Guru: ${guruData.namaLengkap} (${guruData.nip}) telah berhasil mendaftar pada ${formattedTime}`;

      // Send notification to each admin
      const notificationPromises = [];
      adminSnapshot.forEach((adminDoc) => {
        const adminData = adminDoc.data();
        const adminId = adminData.adminId || adminDoc.id;
        
        if (adminId) {
          notificationPromises.push(
            createNotification(
              adminId.toString(),
              message,
              senderInfo || {
                name: 'System',
                type: 'system',
                id: 'auto-registration'
              },
              'registrasi',
              'admin'
            )
          );
        }
      });

      await Promise.allSettled(notificationPromises);
      console.log(`✅ RegistrationNotificationService: Guru registration notification sent to ${notificationPromises.length} admins`);
      
    } catch (error) {
      console.error('❌ RegistrationNotificationService: Error sending guru registration notification:', error);
      // Don't throw - notification failure shouldn't stop registration
    }
  }

  // Send notification to all admins when a student registers
  static async notifyAdminStudentRegistration(muridData, senderInfo = null) {
    try {
      console.log('🔔 RegistrationNotificationService: Sending student registration notification to all admins');
      
      // Get all admins directly from database to avoid circular dependency
      const adminQuery = query(
        collection(db, 'admin'),
        where('statusAdmin', '==', 'Aktif')
      );
      const adminSnapshot = await getDocs(adminQuery);
      
      if (adminSnapshot.empty) {
        console.warn('⚠️ RegistrationNotificationService: No active admins found');
        return;
      }

      const registrationTime = new Date();
      const formattedTime = registrationTime.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const message = `👨‍🎓 Pendaftaran Akun Murid: ${muridData.namaLengkap} (${muridData.nis}) dari kelas ${muridData.kelas} telah berhasil mendaftar pada ${formattedTime}`;

      // Send notification to each admin
      const notificationPromises = [];
      adminSnapshot.forEach((adminDoc) => {
        const adminData = adminDoc.data();
        const adminId = adminData.adminId || adminDoc.id;
        
        if (adminId) {
          notificationPromises.push(
            createNotification(
              adminId.toString(),
              message,
              senderInfo || {
                name: 'System',
                type: 'system',
                id: 'auto-registration'
              },
              'registrasi',
              'admin'
            )
          );
        }
      });

      await Promise.allSettled(notificationPromises);
      console.log(`✅ RegistrationNotificationService: Student registration notification sent to ${notificationPromises.length} admins`);
      
    } catch (error) {
      console.error('❌ RegistrationNotificationService: Error sending student registration notification:', error);
      // Don't throw - notification failure shouldn't stop registration
    }
  }
}

export default RegistrationNotificationService;