import { createUserSpecificNotification, sendBulkNotificationByUserType } from './notificationService';
import GuruService from './GuruService';
import MuridService from './MuridService';

export class AdminNotificationService {
  
  // Send notification to specific guru about schedule changes
  static async notifyGuruScheduleChange(guruId, action, scheduleData, adminInfo) {
    try {
      await createUserSpecificNotification(
        guruId,
        'jadwal',
        action, // 'create', 'update', 'delete'
        scheduleData,
        {
          name: adminInfo.name || 'Admin',
          type: 'admin',
          id: adminInfo.id
        },
        'guru'
      );
    } catch (error) {
      console.error('Error sending guru schedule notification:', error);
      throw error;
    }
  }

  // Send notification to specific murid about schedule changes
  static async notifyMuridScheduleChange(muridId, action, scheduleData, adminInfo) {
    try {
      await createUserSpecificNotification(
        muridId,
        'jadwal',
        action, // 'create', 'update', 'delete'
        scheduleData,
        {
          name: adminInfo.name || 'Admin',
          type: 'admin',
          id: adminInfo.id
        },
        'murid'
      );
    } catch (error) {
      console.error('Error sending murid schedule notification:', error);
      throw error;
    }
  }

  // Send notification to all admins when a student registers
  static async notifyAdminStudentRegistration(studentData, senderInfo = null) {
    try {
      console.log('🔔 AdminNotificationService: Sending student registration notification to all admins');
      
      const registrationTime = new Date();
      const formattedTime = registrationTime.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const notificationData = {
        message: `🎓 Pendaftaran Akun Murid: ${studentData.namaLengkap} (${studentData.nis}) dari kelas ${studentData.kelas} telah berhasil mendaftar`,
        studentInfo: {
          nis: studentData.nis,
          namaLengkap: studentData.namaLengkap,
          kelas: studentData.kelas,
          jurusan: studentData.jurusan,
          username: studentData.username,
          email: studentData.email,
          registrationTime: formattedTime
        },
        priority: 'normal',
        category: 'student_registration',
        actionRequired: false,
        relatedUserId: studentData.nis,
        registrationTime: registrationTime.toISOString()
      };

      await sendBulkNotificationByUserType(
        'admin',
        'registrasi',
        'create',
        notificationData,
        senderInfo || {
          name: 'System',
          type: 'system',
          id: 'auto-registration'
        }
      );

      console.log('✅ AdminNotificationService: Student registration notification sent to admins successfully');

      // Also notify relevant kaprodi if exists
      try {
        if (studentData.jurusan) {
          console.log('🔔 AdminNotificationService: Checking for kaprodi notifications');
          
          const kaprodiMessage = `🎓 Pendaftaran akun murid di jurusan Anda: ${studentData.namaLengkap} (${studentData.nis}) dari ${studentData.kelas} telah mendaftar`;
          
          // Send to kaprodi of the same department
          await sendBulkNotificationByUserType(
            'kaprodi',
            'registrasi',
            'create',
            {
              ...notificationData,
              message: kaprodiMessage,
              targetJurusan: studentData.jurusan
            },
            senderInfo || {
              name: 'System',
              type: 'system',
              id: 'auto-registration'
            }
          );

          console.log('✅ AdminNotificationService: Kaprodi notifications sent successfully');
        }
      } catch (kaprodiError) {
        console.warn('⚠️ AdminNotificationService: Failed to send kaprodi notifications:', kaprodiError.message);
        // Don't throw - this is optional
      }

      console.log('✅ AdminNotificationService: All registration notifications completed');
    } catch (error) {
      console.error('❌ AdminNotificationService: Error sending student registration notification:', error);
      // Don't throw error - notification failure shouldn't stop registration
    }
  }

  // Send notification to all admins when a guru registers
  static async notifyAdminGuruRegistration(guruData, senderInfo = null) {
    try {
      console.log('🔔 AdminNotificationService: Sending guru registration notification to all admins');
      
      const registrationTime = new Date();
      const formattedTime = registrationTime.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const notificationData = {
        message: `👨‍🏫 Pendaftaran Akun Guru: ${guruData.namaLengkap} (${guruData.nip}) telah berhasil mendaftar`,
        guruInfo: {
          nip: guruData.nip,
          namaLengkap: guruData.namaLengkap,
          mataPelajaran: guruData.mataPelajaran,
          kelasAmpu: guruData.kelasAmpu,
          username: guruData.username,
          email: guruData.email,
          registrationTime: formattedTime
        },
        priority: 'normal',
        category: 'guru_registration',
        actionRequired: false,
        relatedUserId: guruData.nip,
        registrationTime: registrationTime.toISOString()
      };

      await sendBulkNotificationByUserType(
        'admin',
        'registrasi',
        'create',
        notificationData,
        senderInfo || {
          name: 'System',
          type: 'system',
          id: 'auto-registration'
        }
      );

      console.log('✅ AdminNotificationService: Guru registration notification sent to admins successfully');

      // Also notify relevant kaprodi if guru teaches in specific department
      try {
        if (guruData.mataPelajaran) {
          console.log('🔔 AdminNotificationService: Checking for kaprodi notifications for guru');
          
          // Determine department from mata pelajaran or kelas ampu
          let targetDepartment = null;
          const mataPelajaran = guruData.mataPelajaran.toLowerCase();
          const kelasAmpu = guruData.kelasAmpu.toLowerCase();
          
          if (mataPelajaran.includes('tkj') || kelasAmpu.includes('tkj')) {
            targetDepartment = 'TKJ';
          } else if (mataPelajaran.includes('tkr') || kelasAmpu.includes('tkr')) {
            targetDepartment = 'TKR';
          } else if (mataPelajaran.includes('rpl') || kelasAmpu.includes('rpl')) {
            targetDepartment = 'RPL';
          } else if (mataPelajaran.includes('tbsm') || kelasAmpu.includes('tbsm')) {
            targetDepartment = 'TBSM';
          }
          
          if (targetDepartment) {
            const kaprodiMessage = `👨‍🏫 Pendaftaran akun guru di jurusan Anda: ${guruData.namaLengkap} (${guruData.nip}) mengajar ${guruData.mataPelajaran} telah mendaftar`;
            
            // Send to kaprodi of the same department
            await sendBulkNotificationByUserType(
              'kaprodi',
              'registrasi',
              'create',
              {
                ...notificationData,
                message: kaprodiMessage,
                targetJurusan: targetDepartment
              },
              senderInfo || {
                name: 'System',
                type: 'system',
                id: 'auto-registration'
              }
            );

            console.log(`✅ AdminNotificationService: Kaprodi ${targetDepartment} notifications sent successfully`);
          } else {
            console.log('ℹ️ AdminNotificationService: No specific department detected for guru, skipping kaprodi notifications');
          }
        }
      } catch (kaprodiError) {
        console.warn('⚠️ AdminNotificationService: Failed to send kaprodi notifications:', kaprodiError.message);
        // Don't throw - this is optional
      }

      console.log('✅ AdminNotificationService: All guru registration notifications completed');
    } catch (error) {
      console.error('❌ AdminNotificationService: Error sending guru registration notification:', error);
      // Don't throw error - notification failure shouldn't stop registration
    }
  }

  // Send profile update notification
  static async notifyProfileUpdate(userId, userType, adminInfo) {
    try {
      await createUserSpecificNotification(
        userId,
        'data',
        'update',
        { message: 'Data profil telah diperbarui' },
        {
          name: adminInfo.name || 'Admin',
          type: 'admin',
          id: adminInfo.id
        },
        userType
      );
    } catch (error) {
      console.error('Error sending profile update notification:', error);
      throw error;
    }
  }

  // Send class assignment notification to guru
  static async notifyGuruClassAssignment(guruId, classData, adminInfo) {
    try {
      await createUserSpecificNotification(
        guruId,
        'kelas',
        'assign',
        classData,
        {
          name: adminInfo.name || 'Admin',
          type: 'admin',
          id: adminInfo.id
        },
        'guru'
      );
    } catch (error) {
      console.error('Error sending class assignment notification:', error);
      throw error;
    }
  }

  // Send announcement to all murid
  static async sendAnnouncementToAllMurid(message, adminInfo) {
    try {
      // Get all murid
      const allMurid = await MuridService.getAllMurid();
      
      // Send notification to each murid
      const notificationPromises = allMurid.map(murid =>
        createUserSpecificNotification(
          murid.id,
          'pengumuman',
          'create',
          { message },
          {
            name: adminInfo.name || 'Admin',
            type: 'admin',
            id: adminInfo.id
          },
          'murid'
        )
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error sending announcement to all murid:', error);
      throw error;
    }
  }

  // Send announcement to all guru
  static async sendAnnouncementToAllGuru(message, adminInfo) {
    try {
      // Get all guru
      const allGuru = await GuruService.getAllGuru();
      
      // Send notification to each guru
      const notificationPromises = allGuru.map(guru =>
        createUserSpecificNotification(
          guru.id,
          'pengumuman',
          'create',
          { message },
          {
            name: adminInfo.name || 'Admin',
            type: 'admin',
            id: adminInfo.id
          },
          'guru'
        )
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error sending announcement to all guru:', error);
      throw error;
    }
  }

  // Send notification when a new jadwal is created - notify affected guru and murid
  static async notifyJadwalCreation(jadwalData, adminInfo) {
    try {
      const promises = [];

      // Notify the assigned guru
      if (jadwalData.guruId) {
        promises.push(
          this.notifyGuruScheduleChange(
            jadwalData.guruId,
            'create',
            {
              mataPelajaran: jadwalData.namaMataPelajaran,
              kelas: jadwalData.namaKelas,
              hari: jadwalData.hari,
              jamKe: jadwalData.jamKe
            },
            adminInfo
          )
        );
      }

      // Notify all murid in the affected class
      if (jadwalData.namaKelas) {
        const muridInClass = await MuridService.getMuridByKelas(jadwalData.namaKelas);
        
        const muridNotifications = muridInClass.map(murid =>
          this.notifyMuridScheduleChange(
            murid.id,
            'create',
            {
              mataPelajaran: jadwalData.namaMataPelajaran,
              namaGuru: jadwalData.namaGuru,
              kelas: jadwalData.namaKelas,
              hari: jadwalData.hari,
              jamKe: jadwalData.jamKe
            },
            adminInfo
          )
        );

        promises.push(...muridNotifications);
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error notifying jadwal creation:', error);
      throw error;
    }
  }

  // Similar method for jadwal updates
  static async notifyJadwalUpdate(oldJadwalData, newJadwalData, adminInfo) {
    try {
      const promises = [];

      // Notify the assigned guru
      if (newJadwalData.guruId) {
        promises.push(
          this.notifyGuruScheduleChange(
            newJadwalData.guruId,
            'update',
            {
              mataPelajaran: newJadwalData.namaMataPelajaran,
              kelas: newJadwalData.namaKelas,
              hari: newJadwalData.hari,
              jamKe: newJadwalData.jamKe
            },
            adminInfo
          )
        );
      }

      // Notify all murid in the affected class
      if (newJadwalData.namaKelas) {
        const muridInClass = await MuridService.getMuridByKelas(newJadwalData.namaKelas);
        
        const muridNotifications = muridInClass.map(murid =>
          this.notifyMuridScheduleChange(
            murid.id,
            'update',
            {
              mataPelajaran: newJadwalData.namaMataPelajaran,
              namaGuru: newJadwalData.namaGuru,
              kelas: newJadwalData.namaKelas,
              hari: newJadwalData.hari,
              jamKe: newJadwalData.jamKe
            },
            adminInfo
          )
        );

        promises.push(...muridNotifications);
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error notifying jadwal update:', error);
      throw error;
    }
  }

  // Method for jadwal deletion
  static async notifyJadwalDeletion(jadwalData, adminInfo) {
    try {
      const promises = [];

      // Notify the assigned guru
      if (jadwalData.guruId) {
        promises.push(
          this.notifyGuruScheduleChange(
            jadwalData.guruId,
            'delete',
            {
              mataPelajaran: jadwalData.namaMataPelajaran,
              kelas: jadwalData.namaKelas,
              hari: jadwalData.hari,
              jamKe: jadwalData.jamKe
            },
            adminInfo
          )
        );
      }

      // Notify all murid in the affected class
      if (jadwalData.namaKelas) {
        const muridInClass = await MuridService.getMuridByKelas(jadwalData.namaKelas);
        
        const muridNotifications = muridInClass.map(murid =>
          this.notifyMuridScheduleChange(
            murid.id,
            'delete',
            {
              mataPelajaran: jadwalData.namaMataPelajaran,
              namaGuru: jadwalData.namaGuru,
              kelas: jadwalData.namaKelas,
              hari: jadwalData.hari
            },
            adminInfo
          )
        );

        promises.push(...muridNotifications);
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error notifying jadwal deletion:', error);
      throw error;
    }
  }
}

export default AdminNotificationService;
