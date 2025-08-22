import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, writeBatch, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import ActivityService from './ActivityService.js';
import PermissionService from './PermissionService.js';

class AdminService {
  static adminCollection = 'admin';

  static async addAdmin(admin, adminName = 'System') {
    try {
      // Check if adminId already exists
      if (admin.adminId) {
        const existingAdminDoc = await getDoc(doc(db, this.adminCollection, admin.adminId));
        if (existingAdminDoc.exists()) {
          throw new Error(`ID Admin ${admin.adminId} sudah digunakan`);
        }
      }

      const existingUsernameQuery = query(
        collection(db, this.adminCollection),
        where('username', '==', admin.username)
      );
      const existingUsernameSnapshot = await getDocs(existingUsernameQuery);

      if (!existingUsernameSnapshot.empty) {
        throw new Error(`Username ${admin.username} sudah digunakan`);
      }

      const adminWithTimestamp = {
        ...admin,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        role: admin.role || 'admin', // Use provided role or default to 'admin'
        permissions: admin.permissions || PermissionService.getPermissionsForRole(admin.role || 'admin'),
        department: admin.department || null,
        status: 'aktif'
      };

      // Use adminId as document ID (numeric)
      const docRef = doc(db, this.adminCollection, admin.adminId);
      await setDoc(docRef, adminWithTimestamp);
      
      try {
        await ActivityService.logAdminActivity('CREATE', adminWithTimestamp, adminName);
      } catch (activityError) {
        
      }
      
      return docRef.id;
    } catch (error) {
      
      throw error;
    }
  }

  static async updateAdmin(id, admin, adminName = 'System') {
    try {
      const updatedAdmin = { ...admin, updatedAt: Timestamp.now() };
      await updateDoc(doc(db, this.adminCollection, id), updatedAdmin);
      
      try {
        await ActivityService.logAdminActivity('UPDATE', updatedAdmin, adminName);
      } catch (activityError) {
        
      }
    } catch (error) {
      
      throw error;
    }
  }

  static async deleteAdmin(id, adminName = 'System') {
    try {
      const adminData = await this.getAdminById(id);
      
      await deleteDoc(doc(db, this.adminCollection, id));
      
      if (adminData) {
        try {
          await ActivityService.logAdminActivity('DELETE', adminData, adminName);
        } catch (activityError) {
          
        }
      }
    } catch (error) {
      
      throw error;
    }
  }

  static async getAdminById(id) {
    try {
      const docSnap = await getDoc(doc(db, this.adminCollection, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      
      return null;
    }
  }

  static async getAdminByUsername(username) {
    try {
      const q = query(
        collection(db, this.adminCollection),
        where('username', '==', username),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      
      return null;
    }
  }

  static async getAllAdmin() {
    try {
      const q = query(
        collection(db, this.adminCollection),
        orderBy('namaLengkap')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      
      return [];
    }
  }

  static async searchAdminByNama(nama) {
    try {
      const q = query(
        collection(db, this.adminCollection),
        where('namaLengkap', '>=', nama),
        where('namaLengkap', '<', nama + 'z')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      
      return [];
    }
  }

  static async loginAdmin(username, password) {
    try {
      const q = query(
        collection(db, this.adminCollection),
        where('username', '==', username),
        where('password', '==', password), // Note: Dalam production, gunakan hash
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const adminData = { id: doc.id, ...doc.data() };
        return adminData;
      }
      return null;
    } catch (error) {
      
      return null;
    }
  }

  static async getStatistikAdmin() {
    try {
      const allAdmin = await this.getAllAdmin();

      let aktif = 0;
      let nonAktif = 0;

      for (const admin of allAdmin) {
        if (admin.status === 'aktif') {
          aktif++;
        } else {
          nonAktif++;
        }
      }

      return {
        total: allAdmin.length,
        aktif: aktif,
        nonAktif: nonAktif,
      };
    } catch (error) {
      
      return {};
    }
  }

  static async batchAddAdmin(adminList) {
    try {
        const batch = writeBatch(db);

        for (const admin of adminList) {
          // Use adminId as document ID
          const docRef = doc(db, this.adminCollection, admin.adminId);
          const adminData = {
            ...admin,
            createdAt: admin.createdAt || Timestamp.now(),
            updatedAt: admin.updatedAt || Timestamp.now(),
            role: admin.role || 'admin',
            permissions: admin.permissions || PermissionService.getPermissionsForRole(admin.role || 'admin'),
            department: admin.department || null,
            status: 'aktif'
          };
          batch.set(docRef, adminData);
        }

      await batch.commit();
    } catch (error) {
      
      throw error;
    }
  }

  static async deleteAllAdmin() {
    try {
      const querySnapshot = await getDocs(collection(db, this.adminCollection));
      const totalDocs = querySnapshot.docs.length;

      if (totalDocs === 0) {
        return 0;
      }

      const batch = writeBatch(db);

      for (const docSnapshot of querySnapshot.docs) {
        batch.delete(docSnapshot.ref);
      }

      await batch.commit();
      return totalDocs;
    } catch (error) {
      
      throw error;
    }
  }

  static async checkDuplicates(adminList) {
    try {
      let duplicateUsername = [];
      let internalDuplicateUsername = [];
      let duplicateAdminId = [];
      let internalDuplicateAdminId = [];

      const seenUsername = new Set();
      const seenAdminId = new Set();

      // Check for internal duplicates
      for (const admin of adminList) {
        if (seenUsername.has(admin.username)) {
          internalDuplicateUsername.push(admin.username);
        } else {
          seenUsername.add(admin.username);
        }

        if (seenAdminId.has(admin.adminId)) {
          internalDuplicateAdminId.push(admin.adminId);
        } else {
          seenAdminId.add(admin.adminId);
        }
      }

      // Check for database duplicates
      for (const admin of adminList) {
        // Check username
        const existingUsernameQuery = query(
          collection(db, this.adminCollection),
          where('username', '==', admin.username),
          limit(1)
        );
        const existingUsernameSnapshot = await getDocs(existingUsernameQuery);

        if (!existingUsernameSnapshot.empty) {
          duplicateUsername.push(admin.username);
        }

        // Check adminId
        const existingAdminDoc = await getDoc(doc(db, this.adminCollection, admin.adminId));
        if (existingAdminDoc.exists()) {
          duplicateAdminId.push(admin.adminId);
        }
      }

      return {
        hasDuplicates: duplicateUsername.length > 0 ||
                      internalDuplicateUsername.length > 0 ||
                      duplicateAdminId.length > 0 ||
                      internalDuplicateAdminId.length > 0,
        duplicateUsername,
        internalDuplicateUsername,
        duplicateAdminId,
        internalDuplicateAdminId,
      };
    } catch (error) {
      
      return {
        hasDuplicates: false,
        duplicateUsername: [],
        internalDuplicateUsername: [],
      };
    }
  }

  static async getTotalAdminCount() {
    try {
      const querySnapshot = await getDocs(collection(db, this.adminCollection));
      return querySnapshot.docs.length;
    } catch (error) {
      
      return 0;
    }
  }

}

export default AdminService;

