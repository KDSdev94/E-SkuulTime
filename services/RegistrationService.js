import { db } from '../config/firebase.js';
import { ref, push, get, query, orderByChild, equalTo, update, remove } from 'firebase/database';
import { createNotification } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const RegistrationService = {
  // Submit registration request (pending approval)
  submitRegistration: async (studentData) => {
    try {
      const registrationsRef = ref(database, 'registrations');
      
      // Check if NIS already exists in registrations
      const nisQuery = query(registrationsRef, orderByChild('nis'), equalTo(studentData.nis));
      const nisSnapshot = await get(nisQuery);
      
      if (nisSnapshot.exists()) {
        throw new Error('NIS sudah terdaftar dalam sistem pendaftaran');
      }
      
      // Check if NIS already exists in murid collection
      const muridCheckRef = ref(database, 'murid');
      const muridNisQuery = query(muridCheckRef, orderByChild('nis'), equalTo(studentData.nis));
      const muridSnapshot = await get(muridNisQuery);
      
      if (muridSnapshot.exists()) {
        throw new Error('NIS sudah terdaftar sebagai murid aktif');
      }
      
      const muridRef = ref(database, `murid/${studentData.nis}`);
      const muridData = {
        ...studentData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await update(muridRef, muridData);
      
      return muridData;
    } catch (error) {
      throw error;
    }
  },

  // Get all registrations (for reports)
  getAllRegistrations: async () => {
    try {
      const registrationsRef = ref(database, 'registrations');
      const snapshot = await get(registrationsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const registrations = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        
        // Validasi data untuk mencegah error
        if (!data || typeof data !== 'object') {
          console.warn('Invalid registration data:', data);
          return;
        }
        
        registrations.push({
          id: childSnapshot.key,
          ...data
        });
      });
      
      // Sort by creation date (newest first)
      return registrations.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      throw error;
    }
  },

  // Get all pending registrations
  getAllPendingRegistrations: async () => {
    try {
      const registrationsRef = ref(database, 'registrations');
      const snapshot = await get(registrationsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const registrations = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        
        // Validasi data untuk mencegah error
        if (!data || typeof data !== 'object') {
          console.warn('Invalid registration data:', data);
          return;
        }
        
        if (data.status === 'pending') {
          registrations.push({
            id: childSnapshot.key,
            ...data
          });
        }
      });
      
      // Sort by creation date (newest first)
      return registrations.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      throw error;
    }
  },

  // Get pending registrations by jurusan
  getPendingRegistrationsByJurusan: async (jurusan) => {
    try {
      const registrationsRef = ref(database, 'registrations');
      const snapshot = await get(registrationsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const registrations = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        
        // Validasi data untuk mencegah error
        if (!data || typeof data !== 'object') {
          console.warn('Invalid registration data:', data);
          return;
        }
        
        if (data.status === 'pending' && data.jurusan === jurusan) {
          registrations.push({
            id: childSnapshot.key,
            ...data
          });
        }
      });
      
      return registrations.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      throw error;
    }
  },

  // Approve registration and create murid account
  approveRegistration: async (registrationId, adminName) => {
    try {
      const registrationRef = ref(database, `registrations/${registrationId}`);
      const snapshot = await get(registrationRef);
      
      if (!snapshot.exists()) {
        throw new Error('Data pendaftaran tidak ditemukan');
      }
      
      const registrationData = snapshot.val();
      
      // Create murid account
      const muridRef = ref(database, 'murid');
      const muridData = {
        ...registrationData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: adminName,
        approvedBy: adminName,
        approvedAt: Date.now(),
      };
      
      // Remove registration-specific fields
      delete muridData.status;
      delete muridData.registrationId;
      
      // Add to murid collection with NIS as key
      const muridWithIdRef = ref(database, `murid/${registrationData.nis}`);
      await update(muridWithIdRef, muridData);
      
      // Update registration status
      await update(registrationRef, {
        status: 'approved',
        approvedBy: adminName,
        approvedAt: Date.now()
      });
      
      // Create notification for the student
      await createNotification(
        registrationData.nis,
        `🎉 Selamat! Pendaftaran akun Anda telah disetujui oleh ${adminName}. Anda sekarang dapat login dengan username dan password yang telah didaftarkan.`,
        {
          name: adminName,
          type: 'admin',
          id: 'admin'
        }
      );
      
      // Create notification for admin
      const adminId = await AsyncStorage.getItem('adminId') || 'admin';
      await createNotification(
        'admin',
        `✅ Pendaftaran ${registrationData.namaLengkap} (${registrationData.nis}) telah disetujui oleh ${adminName}`,
        {
          name: adminName,
          type: 'admin',
          id: adminId
        }
      );
      
      return muridData;
    } catch (error) {
      throw error;
    }
  },

  // Reject registration
  rejectRegistration: async (registrationId, adminName, reason = '') => {
    try {
      const registrationRef = ref(database, `registrations/${registrationId}`);
      const snapshot = await get(registrationRef);
      
      if (!snapshot.exists()) {
        throw new Error('Data pendaftaran tidak ditemukan');
      }
      
      const registrationData = snapshot.val();
      
      // Update registration status
      await update(registrationRef, {
        status: 'rejected',
        rejectedBy: adminName,
        rejectedAt: Date.now(),
        rejectionReason: reason
      });
      
      // Create notification for the student
      const rejectionMessage = reason 
        ? `❌ Pendaftaran akun Anda ditolak oleh ${adminName}. Alasan: ${reason}. Silakan hubungi administrasi sekolah untuk informasi lebih lanjut.`
        : `❌ Pendaftaran akun Anda ditolak oleh ${adminName}. Silakan hubungi administrasi sekolah untuk informasi lebih lanjut.`;
        
      await createNotification(
        registrationData.nis,
        rejectionMessage,
        {
          name: adminName,
          type: 'admin',
          id: 'admin'
        }
      );
      
      // Create notification for admin
      const adminId = await AsyncStorage.getItem('adminId') || 'admin';
      await createNotification(
        'admin',
        `❌ Pendaftaran ${registrationData.namaLengkap} (${registrationData.nis}) telah ditolak oleh ${adminName}`,
        {
          name: adminName,
          type: 'admin',
          id: adminId
        }
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Delete registration record (admin only)
  deleteRegistration: async (registrationId) => {
    try {
      const registrationRef = ref(database, `registrations/${registrationId}`);
      await remove(registrationRef);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Delete all registration records (admin only)
  deleteAllRegistrations: async () => {
    try {
      const registrationsRef = ref(database, 'registrations');
      const snapshot = await get(registrationsRef);
      
      if (!snapshot.exists()) {
        return 0; // No registrations to delete
      }
      
      let deletedCount = 0;
      const deletePromises = [];
      
      snapshot.forEach((childSnapshot) => {
        const registrationRef = ref(database, `registrations/${childSnapshot.key}`);
        deletePromises.push(remove(registrationRef));
        deletedCount++;
      });
      
      await Promise.all(deletePromises);
      return deletedCount;
    } catch (error) {
      throw error;
    }
  },

  // Get registration statistics
  getRegistrationStats: async () => {
    try {
      const registrationsRef = ref(database, 'registrations');
      const snapshot = await get(registrationsRef);
      
      const stats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        byJurusan: {}
      };
      
      if (!snapshot.exists()) {
        return stats;
      }
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        
        // Validasi data untuk mencegah error undefined
        if (!data || typeof data !== 'object') {
          console.warn('Invalid registration data:', data);
          return;
        }
        
        const status = data.status || 'pending';
        const jurusan = data.jurusan || 'Unknown';
        
        stats.total++;
        stats[status] = (stats[status] || 0) + 1;
        
        if (!stats.byJurusan[jurusan]) {
          stats.byJurusan[jurusan] = {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0
          };
        }
        
        stats.byJurusan[jurusan].total++;
        stats.byJurusan[jurusan][status]++;
      });
      
      return stats;
    } catch (error) {
      throw error;
    }
  },

};

export default RegistrationService;
