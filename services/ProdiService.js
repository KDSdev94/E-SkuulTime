import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

class ProdiService {
  static async getAllProdi() {
    try {
      const prodiRef = collection(db, 'prodi');
      const q = query(prodiRef, orderBy('namaLengkap'));
      const querySnapshot = await getDocs(q);
      
      const prodiList = [];
      querySnapshot.forEach((doc) => {
        prodiList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return prodiList;
    } catch (error) {
      console.error('Error getting prodi:', error);
      return [];
    }
  }

  static async addProdi(prodiData, adminName = 'System') {
    try {
      const prodiRef = collection(db, 'prodi');
      
      // Check if username already exists in prodi collection
      if (prodiData.username) {
        const usernameQuery = query(prodiRef, where('username', '==', prodiData.username));
        const usernameSnapshot = await getDocs(usernameQuery);
        
        if (!usernameSnapshot.empty) {
          throw new Error('Username sudah digunakan');
        }
      }

      // Check if email already exists in prodi collection
      if (prodiData.email) {
        const emailQuery = query(prodiRef, where('email', '==', prodiData.email));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          throw new Error('Email sudah digunakan');
        }
      }

      // Prepare prodi data for Firestore
      const newProdi = {
        ...prodiData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminName
      };

      // Save to prodi collection first
      const docRef = await addDoc(prodiRef, newProdi);
      console.log('✅ Prodi data saved to Firestore:', docRef.id);
      
      // Note: User account creation should be done through Firebase Console
      // for security reasons. Only Firestore data is managed here.
      
      return {
        success: true,
        id: docRef.id,
        message: 'Data prodi berhasil ditambahkan'
      };
    } catch (error) {
      console.error('❌ Error adding prodi:', error);
      return {
        success: false,
        message: error.message || 'Terjadi kesalahan saat menambahkan prodi'
      };
    }
  }

  static async updateProdi(prodiId, prodiData) {
    try {
      const prodiRef = doc(db, 'prodi', prodiId);
      
      // If username is being changed, check if it's already used by another user
      if (prodiData.username) {
        const usernameQuery = query(
          collection(db, 'prodi'), 
          where('username', '==', prodiData.username)
        );
        const usernameSnapshot = await getDocs(usernameQuery);
        
        const existingUser = usernameSnapshot.docs.find(doc => doc.id !== prodiId);
        if (existingUser) {
          throw new Error('Username sudah digunakan');
        }
      }

      // If email is being changed, check if it's already used by another user
      if (prodiData.email) {
        const emailQuery = query(
          collection(db, 'prodi'), 
          where('email', '==', prodiData.email)
        );
        const emailSnapshot = await getDocs(emailQuery);
        
        const existingUser = emailSnapshot.docs.find(doc => doc.id !== prodiId);
        if (existingUser) {
          throw new Error('Email sudah digunakan');
        }
      }

      const updatedProdi = {
        ...prodiData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(prodiRef, updatedProdi);
      
      // Note: User authentication updates should be done through Firebase Console
      // for security reasons. Only Firestore data is managed here.
      
      return {
        success: true,
        message: 'Data prodi berhasil diperbarui'
      };
    } catch (error) {
      console.error('Error updating prodi:', error);
      return {
        success: false,
        message: error.message || 'Terjadi kesalahan saat memperbarui prodi'
      };
    }
  }

  static async deleteProdi(prodiId) {
    try {
      const prodiRef = doc(db, 'prodi', prodiId);
      await deleteDoc(prodiRef);
      
      return {
        success: true,
        message: 'Data prodi berhasil dihapus'
      };
    } catch (error) {
      console.error('Error deleting prodi:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat menghapus prodi'
      };
    }
  }

  static async getStatistikProdi() {
    try {
      const prodiRef = collection(db, 'prodi');
      const querySnapshot = await getDocs(prodiRef);
      
      const total = querySnapshot.size;
      
      return {
        total,
        aktif: total, // Assuming all prodi are active for now
      };
    } catch (error) {
      console.error('Error getting prodi statistics:', error);
      return {
        total: 0,
        aktif: 0,
      };
    }
  }

  static async searchProdi(searchTerm) {
    try {
      const prodiList = await this.getAllProdi();
      
      if (!searchTerm) return prodiList;
      
      const searchLower = searchTerm.toLowerCase();
      
      return prodiList.filter(prodi => {
        return (
          prodi.namaLengkap?.toLowerCase().includes(searchLower) ||
          prodi.username?.toLowerCase().includes(searchLower) ||
          prodi.email?.toLowerCase().includes(searchLower)
        );
      });
    } catch (error) {
      console.error('Error searching prodi:', error);
      return [];
    }
  }

  /**
   * Check if email already exists in both Firestore collections and Firebase Auth
   * @param {string} email - Email to check
   * @returns {boolean} True if exists
   */
  static async checkEmailExists(email) {
    try {
      if (!email) return false;
      
      // Check in prodi collection
      const prodiQuery = query(collection(db, 'prodi'), where('email', '==', email));
      const prodiSnapshot = await getDocs(prodiQuery);
      
      if (!prodiSnapshot.empty) {
        return true;
      }
      
      // Check in users collection (for new Firebase Auth system)
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking email exists:', error);
      return false;
    }
  }
}

export default ProdiService;
