import { db } from '../config/firebase.js';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, Timestamp, query, where, orderBy } from 'firebase/firestore';
import ActivityService from './ActivityService.js';

class LaporanService {
  static laporanCollection = 'laporan';

  static async createLaporan(laporanData, senderName = 'User') {
    try {
      const laporanWithTimestamp = {
        ...laporanData,
        status: 'pending', // pending, reviewed, resolved
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.laporanCollection), laporanWithTimestamp);
      
      await ActivityService.logLaporanActivity('CREATE', laporanWithTimestamp, senderName);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating laporan:', error);
      throw error;
    }
  }

  static async getAllLaporan() {
    try {
      const q = query(
        collection(db, this.laporanCollection),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all laporan:', error);
      return [];
    }
  }

  static async getLaporanByUserId(userId) {
    try {
      const q = query(
        collection(db, this.laporanCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting laporan by user:', error);
      return [];
    }
  }

  static async getLaporanByStatus(status) {
    try {
      const q = query(
        collection(db, this.laporanCollection),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting laporan by status:', error);
      return [];
    }
  }

  static async getLaporanByCategory(category) {
    try {
      const q = query(
        collection(db, this.laporanCollection),
        where('kategori', '==', category),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting laporan by category:', error);
      return [];
    }
  }

  static async updateLaporanStatus(laporanId, status, adminResponse = '', adminName = 'Admin') {
    try {
      const updateData = {
        status: status,
        adminResponse: adminResponse,
        respondedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, this.laporanCollection, laporanId), updateData);
      
      await ActivityService.logLaporanActivity('UPDATE', updateData, adminName);
    } catch (error) {
      console.error('Error updating laporan status:', error);
      throw error;
    }
  }

  static async getLaporanById(laporanId) {
    try {
      const docSnap = await getDoc(doc(db, this.laporanCollection, laporanId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting laporan by id:', error);
      return null;
    }
  }

  static async deleteLaporan(laporanId, adminName = 'Admin') {
    try {
      const laporanData = await this.getLaporanById(laporanId);
      
      await deleteDoc(doc(db, this.laporanCollection, laporanId));
      
      if (laporanData) {
        await ActivityService.logLaporanActivity('DELETE', laporanData, adminName);
      }
    } catch (error) {
      console.error('Error deleting laporan:', error);
      throw error;
    }
  }

  static async getLaporanStatistics() {
    try {
      const allLaporan = await this.getAllLaporan();
      
      let total = allLaporan.length;
      let pending = 0;
      let reviewed = 0;
      let resolved = 0;
      let kategoris = {};
      
      for (const laporan of allLaporan) {
        // Count by status
        switch (laporan.status) {
          case 'pending':
            pending++;
            break;
          case 'reviewed':
            reviewed++;
            break;
          case 'resolved':
            resolved++;
            break;
        }
        
        // Count by category
        if (laporan.kategori) {
          kategoris[laporan.kategori] = (kategoris[laporan.kategori] || 0) + 1;
        }
      }
      
      return {
        total,
        pending,
        reviewed,
        resolved,
        kategoris
      };
    } catch (error) {
      console.error('Error getting laporan statistics:', error);
      return {
        total: 0,
        pending: 0,
        reviewed: 0,
        resolved: 0,
        kategoris: {}
      };
    }
  }

  static getKategoriOptions() {
    return [
      'Fasilitas & Infrastruktur',
      'Kegiatan Pembelajaran',
      'Kedisiplinan Siswa',
      'Masalah Teknis',
      'Keamanan & Ketertiban',
      'Kebersihan Lingkungan',
      'Administrasi',
      'Lainnya'
    ];
  }

  static getPriorityOptions() {
    return [
      { value: 'rendah', label: 'Rendah', color: '#10B981' },
      { value: 'sedang', label: 'Sedang', color: '#F59E0B' },
      { value: 'tinggi', label: 'Tinggi', color: '#EF4444' },
      { value: 'mendesak', label: 'Mendesak', color: '#DC2626' }
    ];
  }
}

export default LaporanService;
