import { collection, getDocs, query, where, orderBy, addDoc, doc, setDoc, deleteDoc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase.js';

class MataPelajaranService {
  static guruCollection = 'guru';
  static mataPelajaranCollection = 'mata_pelajaran';

  static async getAllMataPelajaran() {
    try {
      const q = query(
        collection(db, this.guruCollection),
        orderBy('namaLengkap')
      );
      const querySnapshot = await getDocs(q);
      
      const guruList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const allMataPelajaran = new Set();
      
      guruList.forEach(guru => {
        if (guru.mataPelajaran && Array.isArray(guru.mataPelajaran)) {
          guru.mataPelajaran.forEach(mapel => {
            if (mapel && mapel.trim()) {
              allMataPelajaran.add(mapel.trim());
            }
          });
        }
      });

      return Array.from(allMataPelajaran).sort();
    } catch (error) {
      
      return [];
    }
  }

  static async getMataPelajaranStatistics() {
    try {
      const mataPelajaranList = await this.getAllMataPelajaran();
      
      const q = query(
        collection(db, this.guruCollection),
        orderBy('namaLengkap')
      );
      const querySnapshot = await getDocs(q);
      
      const guruList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const mataPelajaranStats = {};
      
      mataPelajaranList.forEach(mapel => {
        mataPelajaranStats[mapel] = {
          name: mapel,
          totalGuru: 0,
          guru: [],
          totalAssignments: 0 // Total guru-mapel assignments
        };
      });

      guruList.forEach(guru => {
        if (guru.mataPelajaran && Array.isArray(guru.mataPelajaran)) {
          guru.mataPelajaran.forEach((mapel, index) => {
            if (mapel && mapel.trim() && mataPelajaranStats[mapel.trim()]) {
              const assignmentId = `${guru.id}_${index + 1}`;
              
              mataPelajaranStats[mapel.trim()].totalGuru++;
              mataPelajaranStats[mapel.trim()].totalAssignments++;
              
              mataPelajaranStats[mapel.trim()].guru.push({
                id: guru.id,
                assignmentId: assignmentId,
                namaLengkap: guru.namaLengkap,
                nip: guru.nip,
                kelasAmpu: guru.kelasAmpu || [],
                statusKepegawaian: guru.statusKepegawaian || 'Tidak diketahui',
                email: guru.email || '',
                noTelepon: guru.noTelepon || ''
              });
            }
          });
        }
      });

      return {
        total: mataPelajaranList.length,
        list: mataPelajaranList,
        statistics: mataPelajaranStats
      };
    } catch (error) {
      
      return {
        total: 0,
        list: [],
        statistics: {}
      };
    }
  }

  static async getMataPelajaranByCategory(category) {
    try {
      const allStats = await this.getMataPelajaranStatistics();
      
      const filteredMapel = allStats.list.filter(mapel => {
        // Validasi mapel untuk mencegah error
        if (!mapel || typeof mapel !== 'string') {
          console.warn('Invalid mapel data:', mapel);
          return false;
        }
        
        const mapelLower = mapel.toLowerCase();
        
        if (category === 'TKJ') {
          return mapelLower.includes('komputer') || 
                 mapelLower.includes('jaringan') || 
                 mapelLower.includes('tkj') ||
                 mapelLower.includes('programming') ||
                 mapelLower.includes('database');
        } else if (category === 'TKR') {
          return mapelLower.includes('otomotif') || 
                 mapelLower.includes('mesin') || 
                 mapelLower.includes('tkr') ||
                 mapelLower.includes('engine') ||
                 mapelLower.includes('kendaraan');
        }
        return true; // Return all if no specific category
      });

      return filteredMapel;
    } catch (error) {
      
      return [];
    }
  }

  static getCommonMataPelajaran() {
    return [
      'Bahasa Indonesia',
      'Bahasa Inggris',
      'Matematika',
      'Pendidikan Agama',
      'Pendidikan Pancasila dan Kewarganegaraan',
      'Sejarah Indonesia',
      'Seni Budaya',
      'Pendidikan Jasmani, Olahraga dan Kesehatan',
      'Prakarya dan Kewirausahaan',
      'Muatan Lokal'
    ];
  }

  static getTKJMataPelajaran() {
    return [
      'Dasar-dasar Teknik Komputer dan Informatika',
      'Komputer dan Jaringan Dasar',
      'Pemrograman Dasar',
      'Dasar Desain Grafis',
      'Sistem Komputer',
      'Teknologi Jaringan Berbasis Luas (WAN)',
      'Administrasi Infrastruktur Jaringan',
      'Administrasi Sistem Jaringan',
      'Teknologi Layanan Jaringan',
      'Produk Kreatif dan Kewirausahaan'
    ];
  }

  static getTKRMataPelajaran() {
    return [
      'Dasar-dasar Teknik Otomotif',
      'Pekerjaan Dasar Teknik Otomotif',
      'Gambar Teknik Otomotif',
      'Teknologi Dasar Otomotif',
      'Pemeliharaan Mesin Kendaraan Ringan',
      'Pemeliharaan Sasis dan Pemindah Tenaga Kendaraan Ringan',
      'Pemeliharaan Kelistrikan Kendaraan Ringan',
      'Kontrol Kontemporer',
      'Produk Kreatif dan Kewirausahaan'
    ];
  }

  static getAllMataPelajaranWithCategories() {
    return {
      umum: this.getCommonMataPelajaran(),
      tkj: this.getTKJMataPelajaran(),
      tkr: this.getTKRMataPelajaran(),
      total: this.getCommonMataPelajaran().length + 
             this.getTKJMataPelajaran().length + 
             this.getTKRMataPelajaran().length
    };
  }

  static async getDetailedMataPelajaranAssignments() {
    try {
      const mataPelajaranStats = await this.getMataPelajaranStatistics();
      const detailedAssignments = {};
      
      Object.keys(mataPelajaranStats.statistics).forEach(mapel => {
        const mapelData = mataPelajaranStats.statistics[mapel];
        
        detailedAssignments[mapel] = {
          name: mapel,
          totalAssignments: mapelData.totalAssignments || 0,
          uniqueTeachers: mapelData.totalGuru || 0,
          assignments: []
        };
        
        mapelData.guru.forEach(guru => {
          detailedAssignments[mapel].assignments.push({
            assignmentId: guru.assignmentId,
            teacherId: guru.id,
            teacherName: guru.namaLengkap,
            nip: guru.nip,
            kelasAmpu: guru.kelasAmpu || [],
            statusKepegawaian: guru.statusKepegawaian,
            email: guru.email,
            noTelepon: guru.noTelepon,
            mapelName: mapel
          });
        });
      });
      
      return detailedAssignments;
    } catch (error) {
      
      return {};
    }
  }

  static async getTeacherAssignments(teacherId) {
    try {
      const detailedAssignments = await this.getDetailedMataPelajaranAssignments();
      const teacherAssignments = [];
      
      Object.keys(detailedAssignments).forEach(mapel => {
        const mapelData = detailedAssignments[mapel];
        const teacherAssignment = mapelData.assignments.find(assignment => 
          assignment.teacherId === teacherId
        );
        
        if (teacherAssignment) {
          teacherAssignments.push(teacherAssignment);
        }
      });
      
      return teacherAssignments;
    } catch (error) {
      
      return [];
    }
  }

  static async getAllAssignments() {
    try {
      const detailedAssignments = await this.getDetailedMataPelajaranAssignments();
      const allAssignments = [];
      
      Object.keys(detailedAssignments).forEach(mapel => {
        const mapelData = detailedAssignments[mapel];
        allAssignments.push(...mapelData.assignments);
      });
      
      return allAssignments;
    } catch (error) {
      
      return [];
    }
  }

  static generateCustomId(mapelData) {
    const cleanName = mapelData.nama
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
    
    const prefix = `${mapelData.kelompok.toLowerCase()}_`;
    
    let suffix = '';
    if (mapelData.jurusan && mapelData.jurusan[0] !== 'Semua') {
      suffix = `_${mapelData.jurusan[0].toLowerCase()}`;
    }
    
    return `${prefix}${cleanName}${suffix}`;
  }

  static async addMataPelajaran(mapelData) {
    try {
      const customId = this.generateCustomId(mapelData);
      const docRef = doc(db, this.mataPelajaranCollection, customId);
      
      await setDoc(docRef, {
        ...mapelData,
        id: customId, // Store the ID in the document as well
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return docRef;
    } catch (error) {
      
      throw error;
    }
  }

  static async documentExists(docId) {
    try {
      const docRef = doc(db, this.mataPelajaranCollection, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      
      return false;
    }
  }

  static async addMultipleMataPelajaran(mapelDataArray, skipExisting = true) {
    try {
      const batch = writeBatch(db);
      const results = [];
      const skipped = [];
      
      for (const mapelData of mapelDataArray) {
        const customId = this.generateCustomId(mapelData);
        
        if (skipExisting && await this.documentExists(customId)) {
          
          skipped.push({ id: customId, nama: mapelData.nama });
          continue;
        }
        
        const docRef = doc(db, this.mataPelajaranCollection, customId);
        
        batch.set(docRef, {
          ...mapelData,
          id: customId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        results.push({ id: customId, nama: mapelData.nama });
      }
      
      if (results.length > 0) {
        await batch.commit();

        if (skipped.length > 0) {
          
        }
      } else {
        
      }
      
      return {
        added: results,
        skipped: skipped,
        totalProcessed: mapelDataArray.length
      };
    } catch (error) {
      
      throw error;
    }
  }

  static async getMataPelajaranFromFirestore() {
    try {
      const q = query(
        collection(db, this.mataPelajaranCollection),
        orderBy('nama')
      );
      const querySnapshot = await getDocs(q);
      
      const mataPelajaranList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return mataPelajaranList;
    } catch (error) {
      
      return [];
    }
  }

  static async updateMataPelajaran(id, updateData) {
    try {
      const docRef = doc(db, this.mataPelajaranCollection, id);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date()
      });
      
    } catch (error) {
      
      throw error;
    }
  }

  static async deleteMataPelajaran(id) {
    try {
      await deleteDoc(doc(db, this.mataPelajaranCollection, id));
      
    } catch (error) {
      
      throw error;
    }
  }

  static async deleteAllMataPelajaran() {
    try {
      const querySnapshot = await getDocs(collection(db, this.mataPelajaranCollection));
      
      if (querySnapshot.empty) {
        
        return {
          success: true,
          count: 0,
          message: 'No documents found to delete'
        };
      }

      const batch = writeBatch(db);
      const deletedIds = [];
      
      querySnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
        deletedIds.push(docSnapshot.id);
      });

      await batch.commit();

      return {
        success: true,
        count: deletedIds.length,
        deletedIds: deletedIds,
        message: `Successfully deleted ${deletedIds.length} documents`
      };
    } catch (error) {
      
      throw error;
    }
  }

  static async initializeMataPelajaranToFirestore() {
    try {
      const mataPelajaranData = {
        kelompokA: [
          'Pendidikan Agama dan Budi Pekerti',
          'PPKn (Pendidikan Pancasila dan Kewarganegaraan)',
          'Bahasa Indonesia',
          'Matematika',
          'Sejarah Indonesia',
          'Bahasa Inggris'
        ],
        kelompokB: [
          'Seni Budaya',
          'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)',
          'Bahasa Daerah',
          'Prakarya dan Kewirausahaan'
        ],
        kelompokC_TKJ: [
          'Komputer dan Jaringan Dasar',
          'Pemrograman Dasar',
          'Desain Grafis',
          'Sistem Komputer',
          'Simulasi dan Komunikasi Digital',
          'Administrasi Infrastruktur Jaringan (AIJ)',
          'Teknologi Jaringan Berbasis Luas (WAN)',
          'Administrasi Sistem Jaringan (ASJ)',
          'Teknologi Layanan Jaringan (TLJ)',
          'Produk Kreatif dan Kewirausahaan'
        ],
        kelompokC_TKR: [
          'Gambar Teknik Otomotif',
          'Teknologi Dasar Otomotif',
          'Pekerjaan Dasar Teknik Otomotif',
          'Pemeliharaan Mesin Kendaraan Ringan',
          'Pemeliharaan Sasis dan Pemindah Tenaga',
          'Pemeliharaan Kelistrikan Kendaraan Ringan',
          'Produk Kreatif dan Kewirausahaan'
        ]
      };

      const allMataPelajaran = [];
      
      mataPelajaranData.kelompokA.forEach(nama => {
        allMataPelajaran.push({
          nama,
          kelompok: 'A',
          kategori: 'Wajib Nasional',
          deskripsi: 'Berlaku untuk semua jurusan SMK',
          jurusan: ['Semua'],
          aktif: true
        });
      });

      mataPelajaranData.kelompokB.forEach(nama => {
        allMataPelajaran.push({
          nama,
          kelompok: 'B',
          kategori: 'Wajib Kewilayahan',
          deskripsi: 'Mata pelajaran wajib kewilayahan',
          jurusan: ['Semua'],
          aktif: true
        });
      });

      mataPelajaranData.kelompokC_TKJ.forEach(nama => {
        allMataPelajaran.push({
          nama,
          kelompok: 'C',
          kategori: 'Muatan Peminatan Kejuruan',
          deskripsi: 'Mata pelajaran khusus TKJ (Teknik Komputer dan Jaringan)',
          jurusan: ['TKJ'],
          aktif: true
        });
      });

      mataPelajaranData.kelompokC_TKR.forEach(nama => {
        allMataPelajaran.push({
          nama,
          kelompok: 'C',
          kategori: 'Muatan Peminatan Kejuruan',
          deskripsi: 'Mata pelajaran khusus TKR (Teknik Kendaraan Ringan Otomotif)',
          jurusan: ['TKR'],
          aktif: true
        });
      });

      const results = await this.addMultipleMataPelajaran(allMataPelajaran);

      if (results.skipped.length > 0) {
        
      }
      
      return {
        success: true,
        count: results.added.length,
        skipped: results.skipped.length,
        total: results.totalProcessed,
        data: results
      };
    } catch (error) {
      
      throw error;
    }
  }

  static async getMataPelajaranByKategori(kategori) {
    try {
      const q = query(
        collection(db, this.mataPelajaranCollection),
        where('kategori', '==', kategori),
        orderBy('nama')
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

  static async getMataPelajaranByJurusan(jurusan) {
    try {
      const q = query(
        collection(db, this.mataPelajaranCollection),
        where('jurusan', 'array-contains', jurusan),
        orderBy('nama')
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

  static previewCustomIds() {
    const mataPelajaranData = {
      kelompokA: [
        'Pendidikan Agama dan Budi Pekerti',
        'PPKn (Pendidikan Pancasila dan Kewarganegaraan)',
        'Bahasa Indonesia',
        'Matematika',
        'Sejarah Indonesia',
        'Bahasa Inggris'
      ],
      kelompokB: [
        'Seni Budaya',
        'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)',
        'Bahasa Daerah',
        'Prakarya dan Kewirausahaan'
      ],
      kelompokC_TKJ: [
        'Komputer dan Jaringan Dasar',
        'Pemrograman Dasar',
        'Desain Grafis',
        'Sistem Komputer',
        'Simulasi dan Komunikasi Digital',
        'Administrasi Infrastruktur Jaringan (AIJ)',
        'Teknologi Jaringan Berbasis Luas (WAN)',
        'Administrasi Sistem Jaringan (ASJ)',
        'Teknologi Layanan Jaringan (TLJ)',
        'Produk Kreatif dan Kewirausahaan'
      ],
      kelompokC_TKR: [
        'Gambar Teknik Otomotif',
        'Teknologi Dasar Otomotif',
        'Pekerjaan Dasar Teknik Otomotif',
        'Pemeliharaan Mesin Kendaraan Ringan',
        'Pemeliharaan Sasis dan Pemindah Tenaga',
        'Pemeliharaan Kelistrikan Kendaraan Ringan',
        'Produk Kreatif dan Kewirausahaan'
      ]
    };

    const preview = [];
    
    mataPelajaranData.kelompokA.forEach(nama => {
      const mapelData = {
        nama,
        kelompok: 'A',
        kategori: 'Wajib Nasional',
        jurusan: ['Semua']
      };
      const customId = this.generateCustomId(mapelData);
      preview.push({ nama, customId, kelompok: 'A', kategori: 'Wajib Nasional' });
    });

    mataPelajaranData.kelompokB.forEach(nama => {
      const mapelData = {
        nama,
        kelompok: 'B',
        kategori: 'Wajib Kewilayahan',
        jurusan: ['Semua']
      };
      const customId = this.generateCustomId(mapelData);
      preview.push({ nama, customId, kelompok: 'B', kategori: 'Wajib Kewilayahan' });
    });

    mataPelajaranData.kelompokC_TKJ.forEach(nama => {
      const mapelData = {
        nama,
        kelompok: 'C',
        kategori: 'Muatan Peminatan Kejuruan',
        jurusan: ['TKJ']
      };
      const customId = this.generateCustomId(mapelData);
      preview.push({ nama, customId, kelompok: 'C', kategori: 'TKJ' });
    });

    mataPelajaranData.kelompokC_TKR.forEach(nama => {
      const mapelData = {
        nama,
        kelompok: 'C',
        kategori: 'Muatan Peminatan Kejuruan',
        jurusan: ['TKR']
      };
      const customId = this.generateCustomId(mapelData);
      preview.push({ nama, customId, kelompok: 'C', kategori: 'TKR' });
    });

    return preview;
  }
}

export default MataPelajaranService;

