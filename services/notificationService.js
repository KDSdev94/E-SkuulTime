import { database, ensureAuth } from '../config/firebase.js';
import { ref, push, serverTimestamp, query, orderByChild, equalTo, onValue, update, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const createNotification = async (userId, message, senderInfo = null, notificationType = 'general', userType = null, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure authentication before database operations
      await ensureAuth();

      const notificationsRef = ref(database, 'notifications');
      const notificationData = {
        userId,
        message,
        read: false,
        createdAt: serverTimestamp(),
        type: notificationType, // e.g., 'jadwal', 'data', 'profil', 'general'
        targetUserType: userType, // 'guru', 'murid', 'admin'
      };
      
      // Add sender information if provided
      if (senderInfo && typeof senderInfo === 'object') {
        notificationData.senderName = senderInfo.name || 'Unknown';
        notificationData.senderType = senderInfo.type || 'system';
        notificationData.senderId = senderInfo.id || null;
      }
      
      const result = await push(notificationsRef, notificationData);
      
      // Success - log and return
      if (attempt > 1) {
        console.log(`✅ Notification created successfully on attempt ${attempt} for user: ${userId}`);
      }
      return result;
      
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for user ${userId}:`, error.message);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`❌ Final attempt failed for user ${userId}:`, error);
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Helper function to create user-type specific messages
export const createUserSpecificNotification = async (userId, notificationType, action, data, senderInfo, userType) => {
  let message = '';
  
  if (userType === 'guru') {
    switch (notificationType) {
      case 'jadwal':
        if (action === 'create') {
          message = `Jadwal mengajar baru telah ditambahkan: ${data.mataPelajaran} untuk kelas ${data.kelas} pada ${data.hari} jam ke-${data.jamKe}`;
        } else if (action === 'update') {
          message = `Jadwal mengajar Anda telah diperbarui: ${data.mataPelajaran} untuk kelas ${data.kelas}`;
        } else if (action === 'delete') {
          message = `Jadwal mengajar telah dihapus: ${data.mataPelajaran} untuk kelas ${data.kelas}`;
        }
        break;
      case 'data':
        if (action === 'update') {
          message = `Data profil Anda telah diperbarui oleh admin. Silakan periksa informasi terbaru.`;
        }
        break;
      case 'kelas':
        if (action === 'assign') {
          message = `Anda telah ditugaskan mengajar di kelas ${data.kelas} untuk mata pelajaran ${data.mataPelajaran}`;
        }
        break;
      default:
        message = `Notifikasi: ${data.message || 'Ada update terbaru untuk Anda'}`;
    }
  } else if (userType === 'admin') {
    switch (notificationType) {
      case 'registrasi':
        if (action === 'create') {
          if (data.studentInfo) {
            message = `🎓 Pendaftaran Murid Baru: ${data.studentInfo.namaLengkap} (${data.studentInfo.nis}) dari kelas ${data.studentInfo.kelas} telah berhasil mendaftar dengan username "${data.studentInfo.username}"`;
          } else if (data.guruInfo) {
            message = `👨‍🏫 Pendaftaran Guru Baru: ${data.guruInfo.namaLengkap} (${data.guruInfo.nip}) mengajar ${data.guruInfo.mataPelajaran} telah berhasil mendaftar dengan username "${data.guruInfo.username}"`;
          }
        }
        break;
      case 'data':
        if (action === 'update') {
          message = `Data sistem telah diperbarui. Silakan periksa informasi terbaru.`;
        }
        break;
      case 'sistem':
        message = `Notifikasi sistem: ${data.message || 'Ada update sistem terbaru'}`;
        break;
      default:
        message = `Notifikasi: ${data.message || 'Ada update terbaru untuk Anda'}`;
    }
  } else if (userType === 'kaprodi') {
    switch (notificationType) {
      case 'registrasi':
        if (action === 'create') {
          if (data.studentInfo) {
            message = `🎓 Murid Baru di Jurusan: ${data.studentInfo.namaLengkap} (${data.studentInfo.nis}) dari kelas ${data.studentInfo.kelas} telah mendaftar di jurusan ${data.studentInfo.jurusan}`;
          } else if (data.guruInfo) {
            message = `👨‍🏫 Guru Baru di Jurusan: ${data.guruInfo.namaLengkap} (${data.guruInfo.nip}) mengajar ${data.guruInfo.mataPelajaran} telah mendaftar di jurusan Anda`;
          }
        }
        break;
      case 'jadwal':
        if (action === 'create') {
          message = `Jadwal baru telah ditambahkan untuk jurusan Anda: ${data.mataPelajaran} kelas ${data.kelas}`;
        } else if (action === 'update') {
          message = `Jadwal jurusan Anda telah diperbarui: ${data.mataPelajaran} kelas ${data.kelas}`;
        }
        break;
      case 'data':
        message = `Update data untuk jurusan Anda: ${data.message || 'Ada perubahan data terbaru'}`;
        break;
      default:
        message = `Notifikasi Kaprodi: ${data.message || 'Ada update terbaru untuk jurusan Anda'}`;
    }
  } else if (userType === 'murid') {
    switch (notificationType) {
      case 'jadwal':
        if (action === 'create') {
          message = `Jadwal pelajaran baru: ${data.mataPelajaran} dengan ${data.namaGuru} pada ${data.hari} jam ke-${data.jamKe}`;
        } else if (action === 'update') {
          message = `Jadwal pelajaran diperbarui: ${data.mataPelajaran} untuk kelas ${data.kelas}`;
        } else if (action === 'delete') {
          message = `Jadwal pelajaran dibatalkan: ${data.mataPelajaran} pada ${data.hari}`;
        }
        break;
      case 'data':
        if (action === 'update') {
          message = `Data profil Anda telah diperbarui oleh admin. Silakan periksa informasi terbaru.`;
        }
        break;
      case 'pengumuman':
        message = `Pengumuman: ${data.message}`;
        break;
      default:
        message = `Notifikasi: ${data.message || 'Ada update terbaru untuk Anda'}`;
    }
  }
  
  return await createNotification(userId, message, senderInfo, notificationType, userType);
};

// Function to create kaprodi-specific notifications
export const createKaprodiNotification = async (jurusan, notificationType, data, senderInfo = null) => {
  try {
    console.log(`📋 Creating kaprodi notification for ${jurusan}:`, { notificationType, data, senderInfo });
    
    // Ensure authentication before database operations
    await ensureAuth();
    
    const notificationsRef = ref(database, 'notifications');
    let message = '';
    
    // Validate required parameters
    if (!jurusan) {
      throw new Error('Jurusan is required for kaprodi notification');
    }
    if (!data || !data.kelas) {
      throw new Error('Data with kelas is required for kaprodi notification');
    }
    
    // Create appropriate messages for kaprodi based on notification type
    switch (notificationType) {
      case 'class_report':
        message = `Laporan kelas ${data.kelas} ${jurusan} - ${data.periode} memerlukan persetujuan`;
        break;
      case 'approval_request':
        message = `Permintaan persetujuan untuk ${data.subject || 'jadwal'} kelas ${data.kelas} ${jurusan}`;
        break;
      case 'schedule_summary':
        message = `Ringkasan jadwal kelas ${data.kelas} ${jurusan} telah diperbarui`;
        break;
      case 'student_report':
        message = `Laporan siswa kelas ${data.kelas} ${jurusan} - ${data.totalSiswa} siswa`;
        break;
      default:
        message = `Notifikasi untuk jurusan ${jurusan}: ${data.message || 'Ada update terbaru'}`;
    }
    
    const notificationData = {
      message,
      read: false,
      createdAt: serverTimestamp(),
      type: notificationType,
      targetJurusan: jurusan,
      targetUserType: 'kaprodi',
      kelas: data.kelas,
      periode: data.periode || null,
    };
    
    // Add sender information if provided
    if (senderInfo && typeof senderInfo === 'object') {
      notificationData.senderName = senderInfo.name || 'Unknown';
      notificationData.senderType = senderInfo.type || 'system';
      notificationData.senderId = senderInfo.id || null;
    }
    
    // Add additional data based on notification type
    if (data.totalSiswa) notificationData.totalSiswa = data.totalSiswa;
    if (data.subject) notificationData.subject = data.subject;
    if (data.status) notificationData.status = data.status;
    
    const result = await push(notificationsRef, notificationData);
    console.log(`Kaprodi notification created for ${jurusan}:`, message);
    return result;
  } catch (error) {
    console.error('Error creating kaprodi notification:', error);
    throw error;
  }
};

// Bulk notification function for sending to multiple users by type
export const sendBulkNotificationByUserType = async (userType, notificationType, action, data, senderInfo) => {
  try {
    console.log(`📢 sendBulkNotificationByUserType: Sending to all ${userType} users`);
    
    let users = [];
    let message = '';

    // Fetch users based on type
    if (userType === 'admin') {
      // Import AdminService here to avoid circular dependency
      const { default: AdminService } = await import('./AdminService.js');
      const allAdmins = await AdminService.getAllAdmin();
      users = allAdmins.filter(admin => admin.status === 'aktif');
      
      // Create message for admin notifications
      if (notificationType === 'registrasi' && action === 'create') {
        if (data.studentInfo) {
          message = data.message || `🎓 Pendaftaran Murid Baru: ${data.studentInfo.namaLengkap} (${data.studentInfo.nis}) dari kelas ${data.studentInfo.kelas}`;
        } else if (data.guruInfo) {
          message = data.message || `👨‍🏫 Pendaftaran Guru Baru: ${data.guruInfo.namaLengkap} (${data.guruInfo.nip}) mengajar ${data.guruInfo.mataPelajaran}`;
        } else {
          message = data.message || `Pendaftaran pengguna baru`;
        }
      } else if (notificationType === 'jadwal') {
        message = data.message || `Perubahan jadwal: ${data.mataPelajaran} untuk kelas ${data.kelas}`;
      } else if (notificationType === 'data') {
        message = data.message || `Perubahan data sistem telah dilakukan`;
      } else {
        message = data.message || `Notifikasi admin: Ada update terbaru`;
      }
    } else if (userType === 'guru') {
      const { default: GuruService } = await import('./GuruService.js');
      const allGuru = await GuruService.getAllGuru();
      users = allGuru.filter(guru => guru.statusGuru === 'Aktif');
    } else if (userType === 'murid') {
      const { default: MuridService } = await import('./MuridService.js');
      const allMurid = await MuridService.getAllMurid();
      users = allMurid.filter(murid => murid.statusSiswa === 'Aktif');
    } else if (userType === 'kaprodi') {
      const { default: KaprodiService } = await import('./KaprodiService.js');
      const allKaprodi = await KaprodiService.getAllKaprodi();
      
      // Filter by department if targetJurusan is specified
      if (data.targetJurusan) {
        users = allKaprodi.filter(kaprodi => 
          kaprodi.statusKaprodi === 'Aktif' && 
          (kaprodi.jurusan === data.targetJurusan || kaprodi.department === data.targetJurusan)
        );
        console.log(`🎯 sendBulkNotificationByUserType: Filtering kaprodi by jurusan: ${data.targetJurusan}`);
      } else {
        users = allKaprodi.filter(kaprodi => kaprodi.statusKaprodi === 'Aktif');
      }
      
      // Create message for kaprodi notifications
      if (notificationType === 'registrasi' && action === 'create') {
        if (data.studentInfo) {
          message = data.message || `🎓 Murid baru di jurusan Anda: ${data.studentInfo.namaLengkap} (${data.studentInfo.nis}) dari ${data.studentInfo.kelas}`;
        } else if (data.guruInfo) {
          message = data.message || `👨‍🏫 Guru baru di jurusan Anda: ${data.guruInfo.namaLengkap} (${data.guruInfo.nip}) mengajar ${data.guruInfo.mataPelajaran}`;
        } else {
          message = data.message || `Registrasi baru di jurusan Anda`;
        }
      } else {
        message = data.message || `Notifikasi kaprodi: Ada update terbaru`;
      }
    }

    console.log(`📧 sendBulkNotificationByUserType: Found ${users.length} active ${userType} users`);

    if (users.length === 0) {
      const targetInfo = userType === 'kaprodi' && data.targetJurusan ? ` for jurusan ${data.targetJurusan}` : '';
      console.warn(`⚠️ sendBulkNotificationByUserType: No active ${userType} users found${targetInfo}`);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        userType,
        notificationType,
        action,
        message: `No active ${userType} users found${targetInfo}`
      };
    }

    // Create notifications for each user
    const notificationPromises = users.map(async (user) => {
      try {
        const userId = user.adminId || user.guruId || user.kaprodiId || user.id; // Handle different ID fields
        
        if (!userId) {
          console.warn(`⚠️ sendBulkNotificationByUserType: User has no valid ID:`, user);
          return null;
        }

        return await createNotification(
          userId.toString(),
          message,
          senderInfo,
          notificationType,
          userType
        );
      } catch (error) {
        console.error(`❌ sendBulkNotificationByUserType: Failed to send notification to user:`, user.namaLengkap || 'Unknown', error.message);
        return null;
      }
    });

    // Wait for all notifications to be sent
    const results = await Promise.allSettled(notificationPromises);
    
    const successful = results.filter(result => result.status === 'fulfilled' && result.value !== null).length;
    const failed = results.length - successful;

    console.log(`✅ sendBulkNotificationByUserType: Sent ${successful} notifications successfully, ${failed} failed`);

    return {
      total: users.length,
      successful,
      failed,
      userType,
      notificationType,
      action
    };

  } catch (error) {
    console.error('❌ sendBulkNotificationByUserType: Error sending bulk notifications:', error);
    throw error;
  }
};

export const getNotifications = async (userId, callback, userType = null) => {
  const notificationsRef = ref(database, 'notifications');
  
  // Determine user role if not provided
  let actualUserType = userType;
  if (!actualUserType) {
    try {
      actualUserType = await AsyncStorage.getItem('userType');
    } catch (error) {
      console.error('Error getting user type:', error);
    }
  }

  let userNotificationsQuery;
  
  // For kaprodi, we need to get all notifications and filter them in memory
  // because old notifications might not have targetJurusan field
  if (actualUserType === 'kaprodi_tkj' || actualUserType === 'kaprodi_tkr') {
    // Get all notifications for kaprodi filtering
    userNotificationsQuery = query(notificationsRef, orderByChild('targetUserType'), equalTo('kaprodi'));
  } else if (actualUserType === 'admin') {
    // Admin sees all notifications - get all notifications without filtering
    userNotificationsQuery = notificationsRef;
  } else {
    // For regular users (guru, murid), show notifications for specific userId
    userNotificationsQuery = query(notificationsRef, orderByChild('userId'), equalTo(userId));
  }

  return onValue(userNotificationsQuery, (snapshot) => {
    const notifications = [];
    snapshot.forEach((childSnapshot) => {
      const notificationData = childSnapshot.val();
      
      // Additional filtering for kaprodi based on specific roles and notification types
      if (actualUserType === 'kaprodi_tkj' || actualUserType === 'kaprodi_tkr') {
        const expectedJurusan = actualUserType === 'kaprodi_tkj' ? 'TKJ' : 'TKR';
        
        // Filter notifications for kaprodi:
        // 1. Check if targetJurusan matches (for new notifications)
        // 2. If targetJurusan doesn't exist, check message content for jurusan keywords (for old notifications)
        // 3. Focus on class-level and approval notifications
        const hasCorrectJurusan = notificationData.targetJurusan === expectedJurusan ||
                                  (!notificationData.targetJurusan && 
                                   notificationData.message && 
                                   notificationData.message.toLowerCase().includes(expectedJurusan.toLowerCase()));
        
        const isRelevantType = !notificationData.type || // old notifications without type
                               notificationData.type === 'class_report' || 
                               notificationData.type === 'approval_request' ||
                               notificationData.type === 'schedule_summary' ||
                               notificationData.type === 'student_report' ||
                               notificationData.type === 'jadwal' || // include schedule notifications
                               notificationData.type === 'general';
        
        if (hasCorrectJurusan && isRelevantType) {
          notifications.push({ id: childSnapshot.key, ...notificationData });
        }
      } else if (actualUserType === 'admin') {
        // Filter notifications for admin - exclude schedule publication notifications
        // Admin should only see notifications that are specifically for admin (userId = 'admin')
        // or important system notifications, but NOT schedule publication notifications
        const isForAdmin = notificationData.userId === 'admin' || notificationData.userId === userId;
        const isSystemNotification = notificationData.type === 'system' || notificationData.type === 'approval_request';
        const isRejectionNotification = notificationData.type === 'jadwal' && 
                                       notificationData.senderType === 'kaprodi' &&
                                       (notificationData.message?.includes('ditolak') || notificationData.message?.includes('disetujui'));
        
        // Exclude schedule publication notifications (notifications sent to teachers and students)
        const isSchedulePublication = notificationData.targetUserType === 'guru' || 
                                     notificationData.targetUserType === 'murid' ||
                                     (notificationData.type === 'jadwal' && 
                                      notificationData.senderType === 'admin' &&
                                      notificationData.message?.includes('dipublikasi'));
        
        if ((isForAdmin || isSystemNotification || isRejectionNotification) && !isSchedulePublication) {
          notifications.push({ id: childSnapshot.key, ...notificationData });
        }
      } else {
        notifications.push({ id: childSnapshot.key, ...notificationData });
      }
    });
    
    notifications.sort((a, b) => b.createdAt - a.createdAt);
    callback(notifications);
  });
};

export const markAsRead = async (notificationId) => {
  try {
    const notificationRef = ref(database, `notifications/${notificationId}`);
    await update(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    
  }
};

export const markAllAsRead = async (userId, userType = null) => {
  try {
    const notificationsRef = ref(database, 'notifications');
    let userNotificationsQuery;
    
    // Use same filtering logic as getNotifications
    if (userType === 'admin') {
      // Admin sees all notifications - get all notifications without filtering
      userNotificationsQuery = notificationsRef;
    } else if (userType === 'kaprodi_tkj') {
      userNotificationsQuery = query(notificationsRef, orderByChild('targetJurusan'), equalTo('TKJ'));
    } else if (userType === 'kaprodi_tkr') {
      userNotificationsQuery = query(notificationsRef, orderByChild('targetJurusan'), equalTo('TKR'));
    } else {
      userNotificationsQuery = query(notificationsRef, orderByChild('userId'), equalTo(userId));
    }
    
    const snapshot = await get(userNotificationsQuery);
    const updates = {};
    
    snapshot.forEach((childSnapshot) => {
      const notificationData = childSnapshot.val();
      
      // Apply same filtering for kaprodi and admin as in getNotifications
      let shouldMarkAsRead = true;
      
      if (userType === 'kaprodi_tkj' || userType === 'kaprodi_tkr') {
        const expectedJurusan = userType === 'kaprodi_tkj' ? 'TKJ' : 'TKR';
        shouldMarkAsRead = notificationData.targetJurusan === expectedJurusan &&
                          (notificationData.type === 'class_report' || 
                           notificationData.type === 'approval_request' ||
                           notificationData.type === 'schedule_summary' ||
                           notificationData.type === 'student_report');
      } else if (userType === 'admin') {
        // Apply same filtering for admin - exclude schedule publication notifications
        const isForAdmin = notificationData.userId === 'admin' || notificationData.userId === userId;
        const isSystemNotification = notificationData.type === 'system' || notificationData.type === 'approval_request';
        const isRejectionNotification = notificationData.type === 'jadwal' && 
                                       notificationData.senderType === 'kaprodi' &&
                                       (notificationData.message?.includes('ditolak') || notificationData.message?.includes('disetujui'));
        
        // Exclude schedule publication notifications
        const isSchedulePublication = notificationData.targetUserType === 'guru' || 
                                     notificationData.targetUserType === 'murid' ||
                                     (notificationData.type === 'jadwal' && 
                                      notificationData.senderType === 'admin' &&
                                      notificationData.message?.includes('dipublikasi'));
        
        shouldMarkAsRead = (isForAdmin || isSystemNotification || isRejectionNotification) && !isSchedulePublication;
      }
      
      if (shouldMarkAsRead && !notificationData.read) {
        updates[`notifications/${childSnapshot.key}/read`] = true;
        updates[`notifications/${childSnapshot.key}/readAt`] = serverTimestamp();
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const updates = {};
    updates[`notifications/${notificationId}`] = null;
    await update(ref(database), updates);
    
  } catch (error) {
    
    throw error;
  }
};

export const deleteAllNotifications = async (userId) => {
  try {
    const notificationsRef = ref(database, 'notifications');
    const userNotificationsQuery = query(notificationsRef, orderByChild('userId'), equalTo(userId));
    
    const snapshot = await get(userNotificationsQuery);
    const updates = {};
    
    snapshot.forEach((childSnapshot) => {
      updates[`notifications/${childSnapshot.key}`] = null; // Set to null to delete
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
      
    }
  } catch (error) {
    
    throw error;
  }
};


