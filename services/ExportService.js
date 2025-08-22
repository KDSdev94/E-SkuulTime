import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

class ExportService {
  
  // Generate HTML template for PDF
  static generateHTMLTemplate(title, data, columns, subtitle = '') {
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const tableHeaders = columns.map(col => `<th>${col.header}</th>`).join('');
    const tableRows = data.map(item => {
      const cells = columns.map(col => {
        let value = item[col.key] || '-';
        if (col.format && typeof col.format === 'function') {
          value = col.format(value, item);
        }
        return `<td>${value}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4A90E2;
            padding-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin: 0;
          }
          .subtitle {
            font-size: 16px;
            color: #7f8c8d;
            margin: 5px 0;
          }
          .date {
            font-size: 12px;
            color: #95a5a6;
            margin-top: 10px;
          }
          .info-section {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #4A90E2;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
          }
          .stat-item {
            text-align: center;
            padding: 10px;
            background-color: #ecf0f1;
            border-radius: 6px;
            min-width: 100px;
          }
          .stat-number {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            display: block;
          }
          .stat-label {
            font-size: 12px;
            color: #7f8c8d;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background-color: #4A90E2;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
          }
          td {
            padding: 10px 8px;
            border-bottom: 1px solid #ecf0f1;
            font-size: 11px;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          tr:hover {
            background-color: #e3f2fd;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #95a5a6;
            border-top: 1px solid #ecf0f1;
            padding-top: 15px;
          }
          .watermark {
            position: fixed;
            bottom: 20px;
            right: 20px;
            font-size: 10px;
            color: #bdc3c7;
            transform: rotate(-45deg);
            opacity: 0.3;
          }
          @media print {
            body { print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${title}</h1>
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
          <p class="date">Tanggal Export: ${currentDate}</p>
        </div>
        
        <div class="info-section">
          <div class="stats">
            <div class="stat-item">
              <span class="stat-number">${data.length}</span>
              <span class="stat-label">Total Data</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${new Date().getFullYear()}</span>
              <span class="stat-label">Tahun Akademik</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <p>Dokumen ini digenerate secara otomatis oleh Sistem E-SkuulTime</p>
          <p>© ${new Date().getFullYear()} E-SkuulTime - Sistem Informasi Penjadwalan</p>
        </div>

        <div class="watermark">E-SkuulTime</div>
      </body>
      </html>
    `;
  }

  // Export Students Data
  static async exportStudentsData(studentsData, title = "Data Siswa") {
    try {
      const columns = [
        { key: 'nis', header: 'NIS' },
        { key: 'namaLengkap', header: 'Nama Lengkap' },
        { key: 'kelas', header: 'Kelas' },
        { key: 'jurusan', header: 'Jurusan' },
        { key: 'email', header: 'Email' },
        { key: 'jenisKelamin', header: 'L/P' },
        { key: 'statusSiswa', header: 'Status' },
        { 
          key: 'tanggalLahir', 
          header: 'Tanggal Lahir',
          format: (value) => {
            if (!value) return '-';
            try {
              return new Date(value).toLocaleDateString('id-ID');
            } catch {
              return value;
            }
          }
        }
      ];

      const subtitle = `Laporan Data Siswa - Total: ${studentsData.length} siswa`;
      const html = this.generateHTMLTemplate(title, studentsData, columns, subtitle);
      
      return await this.generateAndSharePDF(html, 'data-siswa');
    } catch (error) {
      console.error('Error exporting students data:', error);
      Alert.alert('Error', 'Gagal mengexport data siswa');
      return false;
    }
  }


  // Export Teachers Data
  static async exportTeachersData(teachersData, title = "Data Guru") {
    try {
      const columns = [
        { key: 'nip', header: 'NIP' },
        { key: 'namaLengkap', header: 'Nama Lengkap' },
        { key: 'mataPelajaran', header: 'Mata Pelajaran' },
        { key: 'jenisKelamin', header: 'L/P' },
        { key: 'statusKepegawaian', header: 'Status Kepegawaian' },
        { key: 'pendidikan', header: 'Pendidikan' },
        { key: 'nomorHP', header: 'No. HP' },
        { key: 'email', header: 'Email' }
      ];

      const subtitle = `Laporan Data Guru - Total: ${teachersData.length} guru`;
      const html = this.generateHTMLTemplate(title, teachersData, columns, subtitle);
      
      return await this.generateAndSharePDF(html, 'data-guru');
    } catch (error) {
      console.error('Error exporting teachers data:', error);
      Alert.alert('Error', 'Gagal mengexport data guru');
      return false;
    }
  }

  // Export Subjects Data
  static async exportSubjectsData(subjectsData, title = "Data Mata Pelajaran") {
    try {
      const columns = [
        { key: 'kode', header: 'Kode' },
        { key: 'nama', header: 'Nama Mata Pelajaran' },
        { key: 'kategori', header: 'Kategori' },
        { key: 'jurusan', header: 'Jurusan' },
        { key: 'jamPelajaran', header: 'Jam/Minggu' },
        { key: 'semester', header: 'Semester' },
        { key: 'tingkat', header: 'Tingkat' },
        { key: 'deskripsi', header: 'Deskripsi' }
      ];

      const subtitle = `Laporan Data Mata Pelajaran - Total: ${subjectsData.length} mata pelajaran`;
      const html = this.generateHTMLTemplate(title, subjectsData, columns, subtitle);
      
      return await this.generateAndSharePDF(html, 'data-mata-pelajaran');
    } catch (error) {
      console.error('Error exporting subjects data:', error);
      Alert.alert('Error', 'Gagal mengexport data mata pelajaran');
      return false;
    }
  }

  // Export Program Study Data
  static async exportProdiData(prodiData, title = "Data Program Studi") {
    try {
      const columns = [
        { key: 'kodeProdi', header: 'Kode Prodi' },
        { key: 'namaProdi', header: 'Nama Program Studi' },
        { key: 'namaLengkap', header: 'Koordinator' },
        { key: 'email', header: 'Email' },
        { key: 'nomorHP', header: 'No. HP' },
        { key: 'deskripsi', header: 'Deskripsi' },
        { key: 'status', header: 'Status' }
      ];

      const subtitle = `Laporan Data Program Studi - Total: ${prodiData.length} program studi`;
      const html = this.generateHTMLTemplate(title, prodiData, columns, subtitle);
      
      return await this.generateAndSharePDF(html, 'data-program-studi');
    } catch (error) {
      console.error('Error exporting prodi data:', error);
      Alert.alert('Error', 'Gagal mengexport data program studi');
      return false;
    }
  }

  // Export Kaprodi Data with Password (SENSITIVE DATA - Handle with care)
  static async exportKaprodiData(kaprodiData, title = "Data Kaprodi", includePassword = false, exportedBy = 'Administrator') {
    try {
      // PERINGATAN: Data sensitif - hanya untuk keperluan administrasi internal
      const columns = [
        { key: 'namaLengkap', header: 'Nama Lengkap' },
        { key: 'username', header: 'Username' },
        { key: 'email', header: 'Email' },
        { key: 'nip', header: 'NIP' },
        { key: 'department', header: 'Department' },
        { key: 'jabatan', header: 'Jabatan' },
        { key: 'noTelepon', header: 'No. Telepon' },
        { key: 'jenisKelamin', header: 'L/P', format: (value) => value === 'L' ? 'Laki-laki' : value === 'P' ? 'Perempuan' : value },
        { key: 'pendidikanTerakhir', header: 'Pendidikan Terakhir' },
        { key: 'bidangKeahlian', header: 'Bidang Keahlian' },
        { key: 'alamat', header: 'Alamat' },
        {
          key: 'tanggalLahir',
          header: 'Tanggal Lahir',
          format: (value) => {
            if (!value) return '-';
            try {
              if (value && typeof value.toDate === 'function') {
                return value.toDate().toLocaleDateString('id-ID');
              }
              return new Date(value).toLocaleDateString('id-ID');
            } catch {
              return value;
            }
          }
        },
        {
          key: 'status',
          header: 'Status',
          format: (value) => value || 'aktif'
        },
        {
          key: 'createdAt',
          header: 'Tanggal Dibuat',
          format: (value) => {
            if (!value) return '-';
            try {
              if (value && typeof value.toDate === 'function') {
                return value.toDate().toLocaleDateString('id-ID');
              }
              return new Date(value).toLocaleDateString('id-ID');
            } catch {
              return '-';
            }
          }
        }
      ];

      // Tambahkan kolom password jika diminta (HANYA UNTUK KEPERLUAN ADMINISTRASI)
      if (includePassword) {
        columns.splice(2, 0, { 
          key: 'password', 
          header: '🔐 Password',
          format: (value) => value || '[Encrypted]'
        });
      }

      const securityNotice = includePassword 
        ? '⚠️ DOKUMEN RAHASIA - Berisi informasi login sensitif. Jangan disebarluaskan!' 
        : 'Dokumen ini tidak berisi informasi password untuk keamanan.';
      
      const subtitle = `${securityNotice}\nTotal: ${kaprodiData.length} akun kaprodi • Diekspor oleh: ${exportedBy} • ${new Date().toLocaleDateString('id-ID')}`;
      const html = this.generateKaprodiHTMLTemplate(title, kaprodiData, columns, subtitle, includePassword);
      
      const filename = includePassword ? 'data-kaprodi-with-passwords' : 'data-kaprodi';
      return await this.generateAndSharePDF(html, filename);
    } catch (error) {
      console.error('Error exporting kaprodi data:', error);
      Alert.alert('Error', 'Gagal mengexport data kaprodi');
      return false;
    }
  }

  // Generate HTML template khusus untuk data kaprodi dengan security warning
  static generateKaprodiHTMLTemplate(title, data, columns, subtitle = '', includePassword = false) {
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const tableHeaders = columns.map(col => `<th>${col.header}</th>`).join('');
    const tableRows = data.map(item => {
      const cells = columns.map(col => {
        let value = item[col.key] || '-';
        if (col.format && typeof col.format === 'function') {
          value = col.format(value, item);
        }
        // Special styling for password column
        if (col.key === 'password' && includePassword) {
          return `<td style="background-color: #ffecec; font-family: monospace; font-size: 10px; color: #d63031;">${value}</td>`;
        }
        return `<td>${value}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const securityBanner = includePassword ? `
      <div style="background-color: #ff6b6b; color: white; padding: 15px; margin: 20px 0; border-radius: 8px; text-align: center; font-weight: bold;">
        🔒 DOKUMEN RAHASIA - INFORMASI LOGIN SENSITIF 🔒
        <br><small>Dokumen ini berisi password dalam bentuk plain text. Harap simpan dengan aman dan jangan disebarluaskan!</small>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid ${includePassword ? '#ff6b6b' : '#4A90E2'};
            padding-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: ${includePassword ? '#d63031' : '#2c3e50'};
            margin: 0;
          }
          .subtitle {
            font-size: 14px;
            color: #7f8c8d;
            margin: 5px 0;
            white-space: pre-line;
          }
          .date {
            font-size: 12px;
            color: #95a5a6;
            margin-top: 10px;
          }
          .info-section {
            background-color: ${includePassword ? '#fff5f5' : '#f8f9fa'};
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid ${includePassword ? '#ff6b6b' : '#4A90E2'};
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
          }
          .stat-item {
            text-align: center;
            padding: 10px;
            background-color: #ecf0f1;
            border-radius: 6px;
            min-width: 100px;
          }
          .stat-number {
            font-size: 20px;
            font-weight: bold;
            color: ${includePassword ? '#d63031' : '#2c3e50'};
            display: block;
          }
          .stat-label {
            font-size: 12px;
            color: #7f8c8d;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background-color: ${includePassword ? '#ff6b6b' : '#4A90E2'};
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
          }
          td {
            padding: 8px 6px;
            border-bottom: 1px solid #ecf0f1;
            font-size: 10px;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          tr:hover {
            background-color: ${includePassword ? '#ffe3e3' : '#e3f2fd'};
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #95a5a6;
            border-top: 1px solid #ecf0f1;
            padding-top: 15px;
          }
          .watermark {
            position: fixed;
            bottom: 20px;
            right: 20px;
            font-size: 10px;
            color: #bdc3c7;
            transform: rotate(-45deg);
            opacity: 0.3;
          }
          .security-warning {
            background-color: #ff6b6b;
            color: white;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-size: 12px;
            text-align: center;
            font-weight: bold;
          }
          @media print {
            body { print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${title}</h1>
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
          <p class="date">Tanggal Export: ${currentDate}</p>
        </div>
        
        ${securityBanner}
        
        <div class="info-section">
          <div class="stats">
            <div class="stat-item">
              <span class="stat-number">${data.length}</span>
              <span class="stat-label">Total Kaprodi</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${new Date().getFullYear()}</span>
              <span class="stat-label">Tahun Akademik</span>
            </div>
            ${includePassword ? '<div class="stat-item"><span class="stat-number">🔐</span><span class="stat-label">With Passwords</span></div>' : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        ${includePassword ? '<div class="security-warning">⚠️ PERINGATAN: Dokumen ini berisi informasi password. Simpan dengan aman dan jangan bagikan kepada pihak yang tidak berwenang! ⚠️</div>' : ''}

        <div class="footer">
          <p>Dokumen ini digenerate secara otomatis oleh Sistem E-SkuulTime</p>
          <p>© ${new Date().getFullYear()} E-SkuulTime - Sistem Informasi Penjadwalan${includePassword ? ' | CONFIDENTIAL DOCUMENT' : ''}</p>
        </div>

        <div class="watermark">E-SkuulTime${includePassword ? ' CONFIDENTIAL' : ''}</div>
      </body>
      </html>
    `;
  }

  // Export Schedule Data
  static async exportScheduleData(scheduleData, title = "Data Jadwal Pelajaran") {
    try {
      const columns = [
        { key: 'hari', header: 'Hari' },
        { key: 'jamMulai', header: 'Jam Mulai' },
        { key: 'jamSelesai', header: 'Jam Selesai' },
        { key: 'namaMataPelajaran', header: 'Mata Pelajaran' },
        { key: 'namaGuru', header: 'Guru' },
        { key: 'namaKelas', header: 'Kelas' },
        { key: 'ruang', header: 'Ruang' },
        { key: 'semester', header: 'Semester' }
      ];

      const subtitle = `Laporan Jadwal Pelajaran - Total: ${scheduleData.length} jadwal`;
      const html = this.generateHTMLTemplate(title, scheduleData, columns, subtitle);
      
      return await this.generateAndSharePDF(html, 'jadwal-pelajaran');
    } catch (error) {
      console.error('Error exporting schedule data:', error);
      Alert.alert('Error', 'Gagal mengexport data jadwal');
      return false;
    }
  }

  // Generate and share PDF
  static async generateAndSharePDF(html, filename) {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const finalFilename = `${filename}-${timestamp}.pdf`;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        },
      });

      // Create a permanent copy
      const pdfDir = `${FileSystem.documentDirectory}exports/`;
      await FileSystem.makeDirectoryAsync(pdfDir, { intermediates: true });
      const pdfPath = `${pdfDir}${finalFilename}`;
      await FileSystem.moveAsync({
        from: uri,
        to: pdfPath,
      });

      // Share the PDF using dynamic import to avoid bundling issues
      try {
        const Sharing = await import('expo-sharing');
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(pdfPath, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export Data Penjadwalan',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert(
            'Export Berhasil', 
            `File PDF telah disimpan di: ${pdfPath}`,
            [{ text: 'OK' }]
          );
        }
      } catch (sharingError) {
        console.log('Sharing not available:', sharingError);
        Alert.alert(
          'Export Berhasil', 
          `File PDF telah disimpan di: ${pdfPath}\n\nCatatan: Fitur sharing tidak tersedia pada build ini.`,
          [{ text: 'OK' }]
        );
      }

      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Gagal membuat file PDF');
      return false;
    }
  }


  // Export custom data with custom columns
  static async exportCustomData(data, columns, title, filename, subtitle = '') {
    try {
      const html = this.generateHTMLTemplate(title, data, columns, subtitle);
      return await this.generateAndSharePDF(html, filename);
    } catch (error) {
      console.error('Error exporting custom data:', error);
      Alert.alert('Error', 'Gagal mengexport data');
      return false;
    }
  }

  // Export generic data to PDF (backward compatibility)
  static async exportToPDF(data, title, type = 'generic') {
    try {
      let columns = [];
      let subtitle = '';
      
      switch (type) {
        case 'students':
        case 'murid':
          return await this.exportStudentsData(data, title);
        case 'teachers':
        case 'guru':
          return await this.exportTeachersData(data, title);
        case 'subjects':
        case 'mapel':
          return await this.exportSubjectsData(data, title);
        case 'prodi':
          return await this.exportProdiData(data, title);
        case 'schedule':
        case 'jadwal':
          return await this.exportScheduleData(data, title);
        default:
          // Generic export for any data
          if (data.length > 0) {
            const firstItem = data[0];
            columns = Object.keys(firstItem).map(key => ({
              key: key,
              header: key.charAt(0).toUpperCase() + key.slice(1)
            }));
          }
          subtitle = `Total: ${data.length} item`;
          break;
      }
      
      return await this.exportCustomData(data, columns, title, type, subtitle);
    } catch (error) {
      console.error('Error in exportToPDF:', error);
      Alert.alert('Error', 'Gagal mengexport data ke PDF');
      return false;
    }
  }

  // Get export statistics
  static async getExportStatistics() {
    try {
      const exportDir = `${FileSystem.documentDirectory}exports/`;
      const dirInfo = await FileSystem.getInfoAsync(exportDir);
      
      if (!dirInfo.exists) {
        return { totalExports: 0, totalSize: 0 };
      }

      const files = await FileSystem.readDirectoryAsync(exportDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf'));
      
      let totalSize = 0;
      for (const file of pdfFiles) {
        const fileInfo = await FileSystem.getInfoAsync(`${exportDir}${file}`);
        if (fileInfo.exists) {
          totalSize += fileInfo.size || 0;
        }
      }

      return {
        totalExports: pdfFiles.length,
        totalSize: totalSize,
        exportDir: exportDir
      };
    } catch (error) {
      console.error('Error getting export statistics:', error);
      return { totalExports: 0, totalSize: 0 };
    }
  }

  // Clean old exports (older than 30 days)
  static async cleanOldExports() {
    try {
      const exportDir = `${FileSystem.documentDirectory}exports/`;
      const dirInfo = await FileSystem.getInfoAsync(exportDir);
      
      if (!dirInfo.exists) return 0;

      const files = await FileSystem.readDirectoryAsync(exportDir);
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = `${exportDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && fileInfo.modificationTime && fileInfo.modificationTime < thirtyDaysAgo) {
          await FileSystem.deleteAsync(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning old exports:', error);
      return 0;
    }
  }
}

export default ExportService;
