import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, writeBatch, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.node.js';
import ActivityService from './ActivityService.js';
import RegistrationNotificationService from './RegistrationNotificationService.js';

class MuridService {
  static muridCollection = 'murid';
  static counterCollection = 'counters';

  // Generate next ID for murid
  static async getNextMuridId() {
    try {
      const counterDoc = doc(db, this.counterCollection, 'murid');
      const counterSnap = await getDoc(counterDoc);
      
      let nextId = 1;
      if (counterSnap.exists()) {
        nextId = counterSnap.data().lastId + 1;
      }
      
      await setDoc(counterDoc, { lastId: nextId }, { merge: true });
      return nextId;
    } catch (error) {
      console.error('Error generating next murid ID:', error);
      // Fallback: use timestamp-based ID
      return Date.now();
    }
  }

  static async addMurid(murid, adminName = 'Admin') {
    try {
      // Validate required fields
      if (!murid.nis) {
        throw new Error('NIS is required');
      }
      if (!murid.namaLengkap) {
        throw new Error('Nama lengkap is required');
      }

      // Check if NIS already exists
      const existingNisQuery = query(
        collection(db, this.muridCollection),
        where('nis', '==', murid.nis.toString())
      );
      const existingNisSnapshot = await getDocs(existingNisQuery);
      
      if (!existingNisSnapshot.empty) {
        throw new Error(`NIS ${murid.nis} sudah terdaftar`);
      }

      // Only check username if it exists (for backward compatibility with existing data)
      if (murid.username) {
        const existingUsernameQuery = query(
          collection(db, this.muridCollection),
          where('username', '==', murid.username)
        );
        const existingUsernameSnapshot = await getDocs(existingUsernameQuery);

        if (!existingUsernameSnapshot.empty) {
          throw new Error(`Username ${murid.username} sudah digunakan`);
        }
      }

      // Generate new ID
      const newId = await this.getNextMuridId();
      
      const muridWithTimestamp = {
        id: newId,
        ...murid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Use auto-generated document ID
      const docRef = await addDoc(collection(db, this.muridCollection), muridWithTimestamp);
      
      console.log('MuridService.addMurid - Document created:', {
        firestoreDocId: docRef.id,
        internalId: newId,
        nis: murid.nis,
        namaLengkap: murid.namaLengkap
      });
      
      try {
        await ActivityService.logMuridActivity('CREATE', muridWithTimestamp, adminName);
      } catch (activityError) {
        console.warn('MuridService.addMurid - Activity logging failed, but creation was successful:', activityError.message);
      }
      
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  static async updateMurid(id, murid, adminName = 'Admin') {
    try {
      // Validate required fields
      if (!id) {
        throw new Error('Student ID is required for update');
      }
      if (!murid.nis) {
        throw new Error('NIS is required');
      }
      if (!murid.namaLengkap) {
        throw new Error('Nama lengkap is required');
      }

      console.log('MuridService.updateMurid - Input data:', {
        documentId: id,
        nis: murid.nis,
        namaLengkap: murid.namaLengkap,
        adminName
      });

      // Check if document exists before updating
      console.log('MuridService.updateMurid - Checking if document exists with ID:', id);
      const existingDoc = await getDoc(doc(db, this.muridCollection, id));
      
      if (!existingDoc.exists()) {
        console.error('MuridService.updateMurid - Document does not exist!');
        console.error('MuridService.updateMurid - Attempted document ID:', id);
        console.error('MuridService.updateMurid - Document ID type:', typeof id);
        throw new Error(`Document with ID ${id} does not exist in database. Make sure you're using Firestore document ID, not internal numeric ID.`);
      }

      console.log('MuridService.updateMurid - Document exists, proceeding with update');
      console.log('MuridService.updateMurid - Existing document data preview:', {
        nis: existingDoc.data().nis,
        namaLengkap: existingDoc.data().namaLengkap,
        hasUsername: !!existingDoc.data().username
      });

      // Ensure string conversion for ALL fields that might be used
      const sanitizedMurid = {};
      
      // Copy and sanitize each field safely
      Object.keys(murid).forEach(key => {
        const value = murid[key];
        if (value !== null && value !== undefined) {
          if (typeof value === 'string' || typeof value === 'number') {
            sanitizedMurid[key] = value.toString();
          } else {
            sanitizedMurid[key] = value;
          }
        } else {
          // Set default values for critical fields
          if (key === 'namaLengkap') sanitizedMurid[key] = 'Unknown';
          else if (key === 'kelas') sanitizedMurid[key] = 'Unknown';
          else if (key === 'jurusan') sanitizedMurid[key] = 'TKJ';
          else if (key === 'jenisKelamin') sanitizedMurid[key] = 'Laki-laki';
          else sanitizedMurid[key] = '';
        }
      });

      // Add required timestamp
      sanitizedMurid.updatedAt = Timestamp.now();

      console.log('MuridService.updateMurid - Sanitized data:', sanitizedMurid);

      // Update in Firebase
      await updateDoc(doc(db, this.muridCollection, id.toString()), sanitizedMurid);
      
      console.log('MuridService.updateMurid - Firebase update successful');
      
      // Try to log activity with error handling
      try {
        console.log('MuridService.updateMurid - Attempting to log activity');
        await ActivityService.logMuridActivity('UPDATE', sanitizedMurid, adminName);
        console.log('MuridService.updateMurid - Activity logged successfully');
      } catch (activityError) {
        console.warn('MuridService.updateMurid - Activity logging failed, but update was successful:', activityError.message);
        // Don't throw - the main operation was successful
      }
      
    } catch (error) {
      console.error('Error in updateMurid:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        id,
        muridKeys: Object.keys(murid),
        adminName
      });
      throw error;
    }
  }

  // NEW METHOD: Update student by NIS (safer for registration)
  static async updateMuridByNis(nis, muridData, adminName = 'Admin') {
    try {
      console.log('MuridService.updateMuridByNis - Starting update for NIS:', nis);
      
      // Find student by NIS first
      const q = query(
        collection(db, this.muridCollection),
        where('nis', '==', nis.toString()),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error(`Student with NIS ${nis} not found in database`);
      }

      const studentDoc = querySnapshot.docs[0];
      const documentId = studentDoc.id;
      
      console.log('MuridService.updateMuridByNis - Found student:', {
        documentId,
        currentNis: studentDoc.data().nis,
        currentName: studentDoc.data().namaLengkap
      });

      // Sanitize all data to prevent indexOf errors
      const sanitizedData = {};
      Object.keys(muridData).forEach(key => {
        const value = muridData[key];
        
        // Skip undefined/null
        if (value === undefined || value === null) {
          return;
        }
        
        // Handle different data types safely
        if (typeof value === 'string' || typeof value === 'number') {
          sanitizedData[key] = String(value);
        } else if (value instanceof Date) {
          sanitizedData[key] = Timestamp.fromDate(value);
        } else if (value && typeof value === 'object' && value.seconds && value.nanoseconds) {
          // Already a Timestamp
          sanitizedData[key] = value;
        } else {
          sanitizedData[key] = value;
        }
      });

      // Add timestamp
      sanitizedData.updatedAt = Timestamp.now();

      console.log('MuridService.updateMuridByNis - Sanitized data keys:', Object.keys(sanitizedData));

      // Update the document
      await updateDoc(doc(db, this.muridCollection, documentId), sanitizedData);
      
      console.log('MuridService.updateMuridByNis - Update successful');

      // Skip activity logging to avoid indexOf error  
      console.log('MuridService.updateMuridByNis - Skipping activity log to prevent errors');

      // Send notification to all admins about student registration
      if (muridData.username && muridData.email) {
        console.log('MuridService.updateMuridByNis - Sending admin notifications for student registration');
        try {
          await RegistrationNotificationService.notifyAdminStudentRegistration({
            nis: muridData.nis,
            namaLengkap: muridData.namaLengkap,
            kelas: muridData.kelas,
            jurusan: muridData.jurusan,
            username: muridData.username,
            email: muridData.email
          });
          
          console.log('✅ MuridService.updateMuridByNis - Admin notifications sent successfully');
        } catch (notificationError) {
          console.warn('⚠️ MuridService.updateMuridByNis - Failed to send admin notifications:', notificationError.message);
          // Don't throw - notification failure shouldn't stop registration
        }
      }
      
      return { success: true, documentId };
      
    } catch (error) {
      console.error('MuridService.updateMuridByNis - Error:', error);
      throw error;
    }
  }

  static async updateMuridFoto(id, fotoUrl) {
    try {
      await updateDoc(doc(db, this.muridCollection, id), {
        fotoUrl: fotoUrl,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      
      throw error;
    }
  }

  static async deleteMurid(id, adminName = 'Admin') {
    try {
      const muridData = await this.getMuridById(id);
      
      await deleteDoc(doc(db, this.muridCollection, id));
      
      if (muridData) {
        await ActivityService.logMuridActivity('DELETE', muridData, adminName);
      }
    } catch (error) {
      throw error;
    }
  }

  static async getMuridById(id) {
    try {
      const docSnap = await getDoc(doc(db, this.muridCollection, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      
      return null;
    }
  }

  static async getMuridByNis(nis) {
    try {
      console.log('MuridService.getMuridByNis - Searching for NIS:', nis);
      
      const q = query(
        collection(db, this.muridCollection),
        where('nis', '==', nis.toString()), // Ensure string comparison
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      console.log('MuridService.getMuridByNis - Query result:', {
        empty: querySnapshot.empty,
        size: querySnapshot.size
      });

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        const result = { id: docData.id, ...docData.data() };
        
        console.log('MuridService.getMuridByNis - Found student:', {
          firestoreDocId: result.id,
          nis: result.nis,
          namaLengkap: result.namaLengkap
        });
        
        return result;
      }
      
      console.log('MuridService.getMuridByNis - No student found with NIS:', nis);
      return null;
    } catch (error) {
      console.error('MuridService.getMuridByNis - Error:', error);
      return null;
    }
  }

  static async getMuridByInternalId(internalId) {
    try {
      const q = query(
        collection(db, this.muridCollection),
        where('id', '==', internalId),
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

  static async getAllMurid() {
    try {
      const q = query(
        collection(db, this.muridCollection),
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

  static async getMuridByKelas(kelas) {
    try {
      const q = query(
        collection(db, this.muridCollection),
        where('kelas', '==', kelas)
      );
      const querySnapshot = await getDocs(q);

      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return students.sort((a, b) => {
        // Validasi untuk mencegah error
        const nameA = (a.namaLengkap && typeof a.namaLengkap === 'string') ? a.namaLengkap.toLowerCase() : '';
        const nameB = (b.namaLengkap && typeof b.namaLengkap === 'string') ? b.namaLengkap.toLowerCase() : '';
        return nameA.localeCompare(nameB);
      });
    } catch (error) {
      
      return [];
    }
  }

  static async getMuridByJurusan(jurusan) {
    try {
      const q = query(
        collection(db, this.muridCollection),
        where('jurusan', '==', jurusan),
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

  static async getMuridByStatus(status) {
    try {
      const q = query(
        collection(db, this.muridCollection),
        where('statusSiswa', '==', status),
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

  static async searchMuridByNama(nama) {
    try {
      const q = query(
        collection(db, this.muridCollection),
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

  static async loginMurid(username, password) {
    try {
      const q = query(
        collection(db, this.muridCollection),
        where('username', '==', username),
        where('password', '==', password), // Note: Dalam production, gunakan hash
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


  static async getStatistikMurid() {
    try {
      const allMurid = await this.getAllMurid();

      let aktif = 0;
      let lulus = 0;
      let keluar = 0;
      let lakiLaki = 0;
      let perempuan = 0;

      for (const murid of allMurid) {
        switch (murid.statusSiswa) {
          case 'Aktif':
            aktif++;
            break;
          case 'Lulus':
            lulus++;
            break;
          case 'Keluar':
          case 'Pindah':
          case 'Tidak Aktif':
            keluar++;
            break;
        }

        if (murid.jenisKelamin === 'Laki-laki') {
          lakiLaki++;
        } else {
          perempuan++;
        }
      }

      return {
        total: allMurid.length,
        aktif: aktif,
        lulus: lulus,
        keluar: keluar,
        laki_laki: lakiLaki,
        perempuan: perempuan,
      };
    } catch (error) {
      
      return {};
    }
  }

  static async batchAddMurid(muridList) {
    try {
      const batch = writeBatch(db);
      let nextId = await this.getNextMuridId();

      for (const murid of muridList) {
        const docRef = doc(collection(db, this.muridCollection));
        const muridData = {
          id: nextId++,
          ...murid,
          createdAt: murid.createdAt || Timestamp.now(),
          updatedAt: murid.updatedAt || Timestamp.now()
        };
        batch.set(docRef, muridData);
      }

      // Update counter for batch
      const counterDoc = doc(db, this.counterCollection, 'murid');
      batch.set(counterDoc, { lastId: nextId - 1 }, { merge: true });

      await batch.commit();
    } catch (error) {
      
      throw error;
    }
  }

  static async deleteAllMurid() {
    try {
      const querySnapshot = await getDocs(collection(db, this.muridCollection));
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

  static async checkDuplicates(muridList) {
    try {
      let duplicateNIS = [];
      let duplicateUsername = [];
      let internalDuplicateNIS = [];
      let internalDuplicateUsername = [];

      const seenNIS = new Set();
      const seenUsername = new Set();

      for (const murid of muridList) {
        if (seenNIS.has(murid.nis)) {
          internalDuplicateNIS.push(murid.nis);
        } else {
          seenNIS.add(murid.nis);
        }

        if (seenUsername.has(murid.username)) {
          internalDuplicateUsername.push(murid.username);
        } else {
          seenUsername.add(murid.username);
        }
      }

      for (const murid of muridList) {
        // Check for existing NIS
        const existingNisQuery = query(
          collection(db, this.muridCollection),
          where('nis', '==', murid.nis),
          limit(1)
        );
        const existingNisSnapshot = await getDocs(existingNisQuery);
        
        if (!existingNisSnapshot.empty) {
          duplicateNIS.push(murid.nis);
        }

        const existingUsernameQuery = query(
          collection(db, this.muridCollection),
          where('username', '==', murid.username),
          limit(1)
        );
        const existingUsernameSnapshot = await getDocs(existingUsernameQuery);

        if (!existingUsernameSnapshot.empty) {
          duplicateUsername.push(murid.username);
        }
      }

      return {
        hasDuplicates: duplicateNIS.length > 0 ||
                      duplicateUsername.length > 0 ||
                      internalDuplicateNIS.length > 0 ||
                      internalDuplicateUsername.length > 0,
        duplicateNIS,
        duplicateUsername,
        internalDuplicateNIS,
        internalDuplicateUsername,
      };
    } catch (error) {
      
      return {
        hasDuplicates: false,
        duplicateNIS: [],
        duplicateUsername: [],
        internalDuplicateNIS: [],
        internalDuplicateUsername: [],
      };
    }
  }

  static async getTotalMuridCount() {
    try {
      const querySnapshot = await getDocs(collection(db, this.muridCollection));
      return querySnapshot.docs.length;
    } catch (error) {
      
      return 0;
    }
  }

  /**
   * Get murid data with department filtering for Kaprodi
   * This method automatically filters data based on current user's role
   * @returns {Promise<Array>} Filtered murid data
   */
  static async getMuridWithRoleFiltering() {
    try {
      // Import PermissionService here to avoid circular dependency
      const PermissionService = (await import('./PermissionService')).default;
      
      const isKaprodi = await PermissionService.isKaprodi();
      const userDepartment = await PermissionService.getUserDepartment();
      
      
      let muridData;
      if (isKaprodi) {
        if (userDepartment) {
          muridData = await this.getMuridByJurusan(userDepartment);
        } else {
          muridData = await this.getAllMurid();
        }
      } else {
        muridData = await this.getAllMurid();
      }
      
      return muridData;
    } catch (error) {
      console.error('Error getting murid with role filtering:', error);
      // Fallback to get all data if there's an error
      return await this.getAllMurid();
    }
  }

  /**
   * Get murid statistics - shows all students regardless of role
   * @returns {Promise<Object>} Statistics for all students
   */
  static async getStatistikMuridWithRoleFiltering() {
    try {
      // Simply use the existing getStatistikMurid method which gets all students
      return await this.getStatistikMurid();
    } catch (error) {
      console.error('Error getting statistik murid with role filtering:', error);
      return {
        total: 0,
        aktif: 0,
        lulus: 0,
        keluar: 0,
        laki_laki: 0,
        perempuan: 0
      };
    }
  }

  /**
   * Check if current user can view specific murid data
   * @param {Object} muridData - Murid data to check access for
   * @returns {Promise<boolean>}
   */
  static async canViewMuridData(muridData) {
    try {
      const PermissionService = (await import('./PermissionService')).default;
      
      if (!muridData || !muridData.jurusan) {
        return false;
      }
      
      return await PermissionService.canViewDepartmentData(muridData.jurusan);
    } catch (error) {
      console.error('Error checking murid data access:', error);
      return false;
    }
  }

}

export default MuridService;

