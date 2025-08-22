import { 
  collection, 
  getDocs, 
  doc,
  getDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

class KaprodiService {
  constructor() {
    this.collectionName = 'admin'; // Kaprodi disimpan di collection admin
  }

  /**
   * Mengambil semua data kaprodi dari database
   * @param {boolean} includePasswords - Apakah password akan disertakan
   * @returns {Array} Array berisi data kaprodi
   */
  // STATIC METHOD for notification service
  static async getAllKaprodi() {
    try {
      console.log('🔍 KaprodiService.getAllKaprodi: Fetching all kaprodi data');
      
      // Query untuk mendapatkan semua admin dengan role kaprodi
      const adminRef = collection(db, 'admin');
      const querySnapshot = await getDocs(adminRef);
      const kaprodiList = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        
        // Filter hanya kaprodi (role mengandung kaprodi)
        if (data.role && (data.role.includes('kaprodi') || data.role === 'kaprodi')) {
          const kaprodiData = {
            id: docSnapshot.id,
            kaprodiId: data.adminId || docSnapshot.id, // Use adminId or document ID
            namaLengkap: data.namaLengkap || '',
            username: data.username || '',
            email: data.email || '',
            role: data.role || '',
            department: data.department || KaprodiService.getDepartmentFromRole(data.role),
            jurusan: data.department || KaprodiService.getDepartmentFromRole(data.role), // Add jurusan field
            statusKaprodi: data.status === 'aktif' ? 'Aktif' : (data.status || 'Aktif'), // Map status to statusKaprodi with proper case
            nip: data.nip || '',
            noTelepon: data.noTelepon || ''
          };
          
          console.log('📋 KaprodiService.getAllKaprodi: Found kaprodi:', {
            name: kaprodiData.namaLengkap,
            role: kaprodiData.role,
            jurusan: kaprodiData.jurusan,
            status: kaprodiData.statusKaprodi
          });
          
          kaprodiList.push(kaprodiData);
        }
      });
      
      console.log(`✅ KaprodiService.getAllKaprodi: Retrieved ${kaprodiList.length} kaprodi records`);
      return kaprodiList;
      
    } catch (error) {
      console.error('❌ KaprodiService.getAllKaprodi: Error fetching kaprodi data:', error);
      return [];
    }
  }

  static getDepartmentFromRole(role) {
    if (!role) return '';
    
    if (role.includes('tkj') || role.includes('TKJ')) return 'TKJ';
    if (role.includes('tkr') || role.includes('TKR')) return 'TKR';
    if (role.includes('rpl') || role.includes('RPL')) return 'RPL';
    if (role.includes('tbsm') || role.includes('TBSM')) return 'TBSM';
    
    return role.replace('kaprodi_', '').toUpperCase();
  }

  async getAllKaprodiData(includePasswords = false) {
    try {
      // Query untuk mendapatkan semua admin data
      const adminRef = collection(db, this.collectionName);
      const querySnapshot = await getDocs(adminRef);
      const kaprodiList = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        
        // Filter hanya kaprodi (role = kaprodi_tkj atau kaprodi_tkr)
        if (data.role === 'kaprodi_tkj' || data.role === 'kaprodi_tkr') {
          // Format data kaprodi untuk export
          const kaprodiData = {
            id: docSnapshot.id,
            namaLengkap: data.namaLengkap || '',
            username: data.username || '',
            email: data.email || '',
            role: data.role || '',
            department: data.department || KaprodiService.getDepartmentFromRole(data.role),
            nip: data.nip || '',
            noTelepon: data.noTelepon || '',
            alamat: data.alamat || '',
            tanggalLahir: data.tanggalLahir || '',
            jenisKelamin: data.jenisKelamin || '',
            pendidikanTerakhir: data.pendidikanTerakhir || '',
            bidangKeahlian: data.bidangKeahlian || '',
            jabatan: data.jabatan || '',
            status: data.status || 'aktif',
            createdAt: data.createdAt,
            lastLogin: data.lastLogin
          };

          // Tambahkan password jika diminta (untuk keperluan backup/audit)
          if (includePasswords && data.password) {
            kaprodiData.password = data.password;
          }

          kaprodiList.push(kaprodiData);
        }
      });
      
      // Sort the kaprodiList by namaLengkap after fetching
      kaprodiList.sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));

      return kaprodiList;
    } catch (error) {
      console.error('Error getting kaprodi data:', error);
      throw new Error('Gagal mengambil data kaprodi: ' + error.message);
    }
  }

  /**
   * Mengambil data kaprodi berdasarkan ID
   * @param {string} kaprodiId - ID kaprodi
   * @param {boolean} includePassword - Apakah password akan disertakan
   * @returns {Object} Data kaprodi
   */
  async getKaprodiById(kaprodiId, includePassword = false) {
    try {
      const kaprodiRef = doc(db, this.collectionName, kaprodiId);
      const kaprodiSnap = await getDoc(kaprodiRef);
      
      if (kaprodiSnap.exists()) {
        const data = kaprodiSnap.data();
        
        const kaprodiData = {
          id: kaprodiSnap.id,
          namaLengkap: data.namaLengkap || '',
          username: data.username || '',
          email: data.email || '',
          role: data.role || '',
          department: data.department || KaprodiService.getDepartmentFromRole(data.role),
          nip: data.nip || '',
          noTelepon: data.noTelepon || '',
          alamat: data.alamat || '',
          tanggalLahir: data.tanggalLahir || '',
          jenisKelamin: data.jenisKelamin || '',
          pendidikanTerakhir: data.pendidikanTerakhir || '',
          bidangKeahlian: data.bidangKeahlian || '',
          jabatan: data.jabatan || '',
          status: data.status || 'aktif',
          createdAt: data.createdAt,
          lastLogin: data.lastLogin
        };

        // Tambahkan password jika diminta
        if (includePassword && data.password) {
          kaprodiData.password = data.password;
        }

        return kaprodiData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting kaprodi by ID:', error);
      throw new Error('Gagal mengambil data kaprodi: ' + error.message);
    }
  }

  /**
   * Mengambil statistik kaprodi
   * @returns {Object} Statistik kaprodi
   */
  async getKaprodiStatistics() {
    try {
      const kaprodiList = await this.getAllKaprodiData(false);
      
      const stats = {
        totalKaprodi: kaprodiList.length,
        totalTKJ: kaprodiList.filter(k => k.role === 'kaprodi_tkj').length,
        totalTKR: kaprodiList.filter(k => k.role === 'kaprodi_tkr').length,
        totalAktif: kaprodiList.filter(k => k.status === 'aktif').length,
        totalTidakAktif: kaprodiList.filter(k => k.status === 'tidak_aktif').length
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting kaprodi statistics:', error);
      return {
        totalKaprodi: 0,
        totalTKJ: 0,
        totalTKR: 0,
        totalAktif: 0,
        totalTidakAktif: 0
      };
    }
  }

  /**
   * Mendapatkan department dari role
   * @param {string} role - Role kaprodi
   * @returns {string} Department (TKJ/TKR)
   */
  getDepartmentFromRole(role) {
    switch (role) {
      case 'kaprodi_tkj':
        return 'TKJ';
      case 'kaprodi_tkr':
        return 'TKR';
      default:
        return '';
    }
  }

  /**
   * Mendapatkan nama jabatan yang user-friendly
   * @param {string} role - Role kaprodi
   * @returns {string} Nama jabatan
   */
  getRoleDisplayName(role) {
    switch (role) {
      case 'kaprodi_tkj':
        return 'Kepala Program Studi TKJ';
      case 'kaprodi_tkr':
        return 'Kepala Program Studi TKR';
      default:
        return 'Kaprodi';
    }
  }

  /**
   * Memformat data untuk export PDF
   * @param {Array} kaprodiList - List data kaprodi
   * @param {boolean} includePasswords - Apakah password disertakan
   * @returns {Object} Data terformat untuk export
   */
  formatDataForExport(kaprodiList, includePasswords = false) {
    const columns = [
      { key: 'namaLengkap', header: 'Nama Lengkap' },
      { key: 'username', header: 'Username' },
      { key: 'email', header: 'Email' },
      { 
        key: 'role', 
        header: 'Jabatan',
        format: (value) => this.getRoleDisplayName(value)
      },
      { key: 'department', header: 'Jurusan' },
      { key: 'nip', header: 'NIP' },
      { key: 'noTelepon', header: 'No. Telepon' },
      { 
        key: 'jenisKelamin', 
        header: 'Jenis Kelamin',
        format: (value) => value === 'L' ? 'Laki-laki' : value === 'P' ? 'Perempuan' : value
      },
      { key: 'tanggalLahir', header: 'Tanggal Lahir' },
      { key: 'pendidikanTerakhir', header: 'Pendidikan Terakhir' },
      { key: 'bidangKeahlian', header: 'Bidang Keahlian' },
      { key: 'alamat', header: 'Alamat' },
      { 
        key: 'status', 
        header: 'Status',
        format: (value) => value === 'aktif' ? 'Aktif' : 'Tidak Aktif'
      },
      { 
        key: 'createdAt', 
        header: 'Tanggal Dibuat',
        format: (value) => {
          if (!value) return '-';
          try {
            // Handle Firestore Timestamp
            if (value && typeof value.toDate === 'function') {
              return value.toDate().toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            }
            // Handle ISO string or regular Date
            if (typeof value === 'string' || value instanceof Date) {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }
            }
            return '-';
          } catch (error) {
            console.error('Error formatting date:', error, value);
            return '-';
          }
        }
      }
    ];

    // Tambahkan kolom password jika diminta
    if (includePasswords) {
      columns.splice(3, 0, { key: 'password', header: 'Password' });
    }

    return {
      data: kaprodiList,
      columns: columns
    };
  }

  /**
   * Export data kaprodi ke PDF
   * @param {boolean} includePasswords - Apakah password disertakan
   * @param {string} filterDepartment - Filter berdasarkan department (optional)
   * @returns {boolean} Status berhasil atau tidak
   */
  async exportKaprodiToPDF(includePasswords = false, filterDepartment = null) {
    try {
      // Ambil data kaprodi
      let kaprodiList = await this.getAllKaprodiData(includePasswords);
      
      // Filter berdasarkan department jika ada
      if (filterDepartment) {
        kaprodiList = kaprodiList.filter(k => k.department === filterDepartment);
      }

      if (kaprodiList.length === 0) {
        throw new Error('Tidak ada data kaprodi untuk diexport');
      }

      // Get current admin name untuk informasi export
      const userData = await AsyncStorage.getItem('userData');
      const currentAdminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';

      // Format data untuk export
      const { data, columns } = this.formatDataForExport(kaprodiList, includePasswords);

      // Tentukan judul berdasarkan filter
      let title = `Data Kaprodi SMK eBisa (${data.length} data)`;
      if (filterDepartment) {
        title = `Data Kaprodi ${filterDepartment} (${data.length} data)`;
      }

      // Subtitle dengan informasi export
      const passwordInfo = includePasswords ? ' (termasuk password)' : '';
      const subtitle = `Export oleh: ${currentAdminName} • ${new Date().toLocaleDateString('id-ID')}${passwordInfo}`;

      // Import ExportService untuk melakukan export
      const ExportService = (await import('./ExportService')).default;
      
      // Export menggunakan ExportService
      const filename = `data-kaprodi${filterDepartment ? `-${filterDepartment.toLowerCase()}` : ''}${includePasswords ? '-with-password' : ''}`;
      const success = await ExportService.exportCustomData(data, columns, title, filename, subtitle);
      
      return success;
    } catch (error) {
      console.error('Error exporting kaprodi to PDF:', error);
      throw error;
    }
  }

  /**
   * Validasi apakah user memiliki akses untuk export dengan password
   * @param {string} userRole - Role user yang melakukan export
   * @returns {boolean} Apakah memiliki akses
   */
  hasPasswordExportAccess(userRole) {
    // Hanya admin yang bisa export dengan password
    return userRole === 'admin';
  }
}

export default new KaprodiService();
