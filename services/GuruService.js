import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, writeBatch, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.node.js';
import ActivityService from './ActivityService.js';
import RegistrationNotificationService from './RegistrationNotificationService.js';

class GuruService {
  static guruCollection = 'guru';

  static async addGuruWithCustomId(customId, guru, adminName = 'Admin') {
    try {
      // Validasi NIP - harus ada dan valid
      if (!guru.nip || typeof guru.nip !== 'string' || guru.nip.trim() === '') {
        throw new Error('NIP harus diisi dan tidak boleh kosong');
      }
      
      const existingNipQuery = query(
        collection(db, this.guruCollection),
        where('nip', '==', guru.nip)
      );
      const existingNipSnapshot = await getDocs(existingNipQuery);

      if (!existingNipSnapshot.empty) {
        throw new Error(`NIP ${guru.nip} sudah terdaftar`);
      }

      const guruWithTimestamp = {
        ...guru,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = doc(db, this.guruCollection, customId.toString());
      await setDoc(docRef, guruWithTimestamp);
      
      await ActivityService.logGuruActivity('CREATE', guruWithTimestamp, adminName);
      
      return customId.toString();
    } catch (error) {
      throw error;
    }
  }

  static async addGuru(guru, adminName = 'Admin') {
    try {
      // Validasi NIP
      if (!guru.nip || typeof guru.nip !== 'string' || guru.nip.trim() === '') {
        throw new Error('NIP harus diisi dan tidak boleh kosong');
      }
      
      const existingNipQuery = query(
        collection(db, this.guruCollection),
        where('nip', '==', guru.nip)
      );
      const existingNipSnapshot = await getDocs(existingNipQuery);

      if (!existingNipSnapshot.empty) {
        throw new Error(`NIP ${guru.nip} sudah terdaftar`);
      }

      // Validasi username
      if (!guru.username || typeof guru.username !== 'string' || guru.username.trim() === '') {
        throw new Error('Username harus diisi dan tidak boleh kosong');
      }
      
      const existingUsernameQuery = query(
        collection(db, this.guruCollection),
        where('username', '==', guru.username)
      );
      const existingUsernameSnapshot = await getDocs(existingUsernameQuery);

      if (!existingUsernameSnapshot.empty) {
        throw new Error(`Username ${guru.username} sudah digunakan`);
      }

      const guruWithTimestamp = {
        ...guru,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.guruCollection), guruWithTimestamp);
      
      await ActivityService.logGuruActivity('CREATE', guruWithTimestamp, adminName);
      
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  static async updateGuru(id, guru, adminName = 'Admin') {
    try {
      const updatedGuru = { ...guru, updatedAt: Timestamp.now() };
      await updateDoc(doc(db, this.guruCollection, id), updatedGuru);
      
      await ActivityService.logGuruActivity('UPDATE', updatedGuru, adminName);
    } catch (error) {
      throw error;
    }
  }

  static async updateGuruFoto(id, fotoUrl) {
    try {
      await updateDoc(doc(db, this.guruCollection, id), {
        fotoUrl: fotoUrl,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  }

  // NEW METHOD: Update guru by NIP (safer for registration)
  static async updateGuruByNip(nip, guruData, adminName = 'Admin') {
    try {
      console.log('GuruService.updateGuruByNip - Starting update for NIP:', nip);
      
      // Find guru by NIP first
      const q = query(
        collection(db, this.guruCollection),
        where('nip', '==', nip.toString()),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error(`Guru with NIP ${nip} not found in database`);
      }

      const guruDoc = querySnapshot.docs[0];
      const documentId = guruDoc.id;
      
      console.log('GuruService.updateGuruByNip - Found guru:', {
        documentId,
        currentNip: guruDoc.data().nip,
        currentName: guruDoc.data().namaLengkap
      });

      // Sanitize all data to prevent indexOf errors
      const sanitizedData = {};
      Object.keys(guruData).forEach(key => {
        const value = guruData[key];
        
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
        } else if (Array.isArray(value)) {
          // Handle arrays (like mataPelajaran, kelasAmpu)
          sanitizedData[key] = value.map(item => String(item));
        } else {
          sanitizedData[key] = value;
        }
      });

      // Add timestamp
      sanitizedData.updatedAt = Timestamp.now();

      console.log('GuruService.updateGuruByNip - Sanitized data keys:', Object.keys(sanitizedData));

      // Update the document
      await updateDoc(doc(db, this.guruCollection, documentId), sanitizedData);
      
      console.log('GuruService.updateGuruByNip - Update successful');

      // Skip activity logging to avoid indexOf error
      console.log('GuruService.updateGuruByNip - Skipping activity log to prevent errors');

      // Send notification to all admins about guru registration
      if (guruData.username && guruData.email) {
        console.log('GuruService.updateGuruByNip - Sending admin notifications for guru registration');
        try {
          await RegistrationNotificationService.notifyAdminGuruRegistration({
            nip: guruData.nip,
            namaLengkap: guruData.namaLengkap,
            mataPelajaran: Array.isArray(guruData.mataPelajaran) ? guruData.mataPelajaran.join(', ') : (guruData.mataPelajaran || ''),
            kelasAmpu: Array.isArray(guruData.kelasAmpu) ? guruData.kelasAmpu.join(', ') : (guruData.kelasAmpu || ''),
            username: guruData.username,
            email: guruData.email
          });
          
          console.log('✅ GuruService.updateGuruByNip - Admin notifications sent successfully');
        } catch (notificationError) {
          console.warn('⚠️ GuruService.updateGuruByNip - Failed to send admin notifications:', notificationError.message);
          // Don't throw - notification failure shouldn't stop registration
        }
      }
      
      return { success: true, documentId };
      
    } catch (error) {
      console.error('GuruService.updateGuruByNip - Error:', error);
      throw error;
    }
  }

  static async deleteGuru(id, adminName = 'Admin') {
    try {
      const guruData = await this.getGuruById(id);
      
      await deleteDoc(doc(db, this.guruCollection, id));
      
      if (guruData) {
        await ActivityService.logGuruActivity('DELETE', guruData, adminName);
      }
    } catch (error) {
      throw error;
    }
  }

  static async getGuruByNip(nip) {
    try {
      console.log('GuruService.getGuruByNip - Searching for NIP:', nip);
      
      const q = query(
        collection(db, this.guruCollection),
        where('nip', '==', nip.toString()),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      console.log('GuruService.getGuruByNip - Query result:', {
        empty: querySnapshot.empty,
        size: querySnapshot.size
      });

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        const result = { id: docData.id, ...docData.data() };
        
        console.log('GuruService.getGuruByNip - Found guru:', {
          firestoreDocId: result.id,
          nip: result.nip,
          namaLengkap: result.namaLengkap
        });
        
        return result;
      }
      
      console.log('GuruService.getGuruByNip - No guru found with NIP:', nip);
      return null;
    } catch (error) {
      console.error('GuruService.getGuruByNip - Error:', error);
      return null;
    }
  }

  static async getGuruById(id) {
    try {
      const docSnap = await getDoc(doc(db, this.guruCollection, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static async getGuruByNip(nip) {
    try {
      // Validasi NIP parameter
      if (!nip || typeof nip !== 'string' || nip.trim() === '') {
        return null;
      }
      
      const q = query(
        collection(db, this.guruCollection),
        where('nip', '==', nip),
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

  static async getAllGuru() {
    try {
      const q = query(
        collection(db, this.guruCollection),
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

  static async getGuruByMapel(mapel) {
    try {
      const q = query(
        collection(db, this.guruCollection),
        where('mataPelajaran', '==', mapel),
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

  static async getGuruByStatus(status) {
    try {
      const q = query(
        collection(db, this.guruCollection),
        where('statusPegawai', '==', status),
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

  static async getGuruByJabatan(jabatan) {
    try {
      const q = query(
        collection(db, this.guruCollection),
        where('jabatan', '==', jabatan),
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

  static async searchGuruByNama(nama) {
    try {
      const q = query(
        collection(db, this.guruCollection),
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


  static async getStatistikGuru() {
    try {
      const allGuru = await this.getAllGuru();

      let aktif = 0;
      let cuti = 0;
      let pensiun = 0;
      let lakiLaki = 0;
      let perempuan = 0;
      let pns = 0;
      let pppk = 0;
      let honorer = 0;

      for (const guru of allGuru) {
        const statusAktif = guru.statusAktif || 'Aktif';
        switch (statusAktif) {
          case 'Aktif':
            aktif++;
            break;
          case 'Cuti':
            cuti++;
            break;
          case 'Pensiun':
            pensiun++;
            break;
        }

        if (guru.jenisKelamin === 'Laki-laki') {
          lakiLaki++;
        } else {
          perempuan++;
        }

        switch (guru.statusKepegawaian) {
          case 'PNS':
            pns++;
            break;
          case 'PPPK':
            pppk++;
            break;
          case 'Honorer':
            honorer++;
            break;
        }
      }

      return {
        total: allGuru.length,
        aktif: aktif,
        cuti: cuti,
        pensiun: pensiun,
        laki_laki: lakiLaki,
        perempuan: perempuan,
        pns: pns,
        pppk: pppk,
        honorer: honorer,
      };
    } catch (error) {
      
      return {};
    }
  }

  static async batchAddGuru(guruList) {
    try {
      const batch = writeBatch(db);

      for (const guru of guruList) {
        const docRef = doc(collection(db, this.guruCollection));
        const guruData = {
          ...guru,
          createdAt: guru.createdAt || Timestamp.now(),
          updatedAt: guru.updatedAt || Timestamp.now()
        };
        batch.set(docRef, guruData);
      }

      await batch.commit();
    } catch (error) {
      
      throw error;
    }
  }

  static async deleteAllGuru() {
    try {
      const querySnapshot = await getDocs(collection(db, this.guruCollection));
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

  static async checkDuplicates(guruList) {
    try {
      let duplicateNIP = [];
      let duplicateUsername = [];
      let internalDuplicateNIP = [];
      let internalDuplicateUsername = [];

      const seenNIP = new Set();
      const seenUsername = new Set();

      for (const guru of guruList) {
        if (seenNIP.has(guru.nip)) {
          internalDuplicateNIP.push(guru.nip);
        } else {
          seenNIP.add(guru.nip);
        }

        if (seenUsername.has(guru.username)) {
          internalDuplicateUsername.push(guru.username);
        } else {
          seenUsername.add(guru.username);
        }
      }

      for (const guru of guruList) {
        // Cek duplikasi NIP hanya jika NIP valid
        if (guru.nip && typeof guru.nip === 'string' && guru.nip.trim() !== '') {
          const existingNipQuery = query(
            collection(db, this.guruCollection),
            where('nip', '==', guru.nip),
            limit(1)
          );
          const existingNipSnapshot = await getDocs(existingNipQuery);

          if (!existingNipSnapshot.empty) {
            duplicateNIP.push(guru.nip);
          }
        }

        // Cek duplikasi username hanya jika username valid
        if (guru.username && typeof guru.username === 'string' && guru.username.trim() !== '') {
          const existingUsernameQuery = query(
            collection(db, this.guruCollection),
            where('username', '==', guru.username),
            limit(1)
          );
          const existingUsernameSnapshot = await getDocs(existingUsernameQuery);

          if (!existingUsernameSnapshot.empty) {
            duplicateUsername.push(guru.username);
          }
        }
      }

      return {
        hasDuplicates: duplicateNIP.length > 0 ||
                      duplicateUsername.length > 0 ||
                      internalDuplicateNIP.length > 0 ||
                      internalDuplicateUsername.length > 0,
        duplicateNIP,
        duplicateUsername,
        internalDuplicateNIP,
        internalDuplicateUsername,
      };
    } catch (error) {
      
      return {
        hasDuplicates: false,
        duplicateNIP: [],
        duplicateUsername: [],
        internalDuplicateNIP: [],
        internalDuplicateUsername: [],
      };
    }
  }

  static async getTotalGuruCount() {
    try {
      const querySnapshot = await getDocs(collection(db, this.guruCollection));
      return querySnapshot.docs.length;
    } catch (error) {
      
      return 0;
    }
  }

  static async getGuruWithFilters(filters) {
    try {
      let q = collection(db, this.guruCollection);
      
      if (filters.mataPelajaran && filters.mataPelajaran.trim() !== '') {
        q = query(q, where('mataPelajaran', '==', filters.mataPelajaran));
      }
      if (filters.statusPegawai && filters.statusPegawai.trim() !== '') {
        q = query(q, where('statusPegawai', '==', filters.statusPegawai));
      }
      if (filters.jenisKepegawaian && filters.jenisKepegawaian.trim() !== '') {
        q = query(q, where('jenisKepegawaian', '==', filters.jenisKepegawaian));
      }
      if (filters.jabatan && filters.jabatan.trim() !== '') {
        q = query(q, where('jabatan', '==', filters.jabatan));
      }
      if (filters.jenisKelamin && filters.jenisKelamin.trim() !== '') {
        q = query(q, where('jenisKelamin', '==', filters.jenisKelamin));
      }

      q = query(q, orderBy('namaLengkap'));

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      
      return [];
    }
  }

  static async getAvailableMataPelajaran() {
    try {
      const querySnapshot = await getDocs(collection(db, this.guruCollection));
      const mataPelajaranSet = new Set();

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.mataPelajaran) {
          mataPelajaranSet.add(data.mataPelajaran);
        }
      });

      return Array.from(mataPelajaranSet).sort();
    } catch (error) {
      
      return [];
    }
  }

  static async getAvailableJabatan() {
    try {
      const querySnapshot = await getDocs(collection(db, this.guruCollection));
      const jabatanSet = new Set();

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.jabatan) {
          jabatanSet.add(data.jabatan);
        }
      });

      return Array.from(jabatanSet).sort();
    } catch (error) {
      
      return [];
    }
  }

  static async bulkUpdateGuru(updates) {
    try {
      const batch = writeBatch(db);

      for (const update of updates) {
        const docRef = doc(db, this.guruCollection, update.id);
        const updateData = { ...update.data, updatedAt: Timestamp.now() };
        batch.update(docRef, updateData);
      }

      await batch.commit();
    } catch (error) {
      
      throw error;
    }
  }

}

export default GuruService;

