import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';

/**
 * Export data to CSV format and share the file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} options - Export options
 */
export const exportToCSV = async (data, filename, options = {}) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const { headers, transformData } = options;
    
    // Transform data if transformation function is provided
    const processedData = transformData ? transformData(data) : data;
    
    // Convert to CSV using Papa Parse
    const csv = Papa.unparse(processedData, {
      header: true,
      delimiter: ',',
      newline: '\n',
    });

    // Create file path
    const fileUri = FileSystem.documentDirectory + `${filename}.csv`;
    
    // Write CSV to file
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Export ${filename}`,
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    return {
      success: true,
      fileUri,
      recordCount: processedData.length
    };
  } catch (error) {
    console.error('Export to CSV error:', error);
    throw error;
  }
};

/**
 * Transform schedule data for export
 * @param {Array} schedules - Array of schedule objects
 */
export const transformScheduleDataForExport = (schedules) => {
  return schedules.map((schedule, index) => ({
    'No': index + 1,
    'ID Jadwal': schedule.id || '',
    'Mata Pelajaran': schedule.namaMataPelajaran || '',
    'Guru': schedule.namaGuru || '',
    'ID Guru': schedule.guruId || '',
    'Kelas': schedule.namaKelas || '',
    'Jurusan': schedule.jurusan || '',
    'Hari': schedule.hari || '',
    'Jam Ke': schedule.jamKe || '',
    'Jam Mulai': schedule.jamMulai || '',
    'Jam Selesai': schedule.jamSelesai || '',
    'Ruang Kelas': schedule.ruangKelas || '',
    'Jenis Aktivitas': schedule.jenisAktivitas || 'pembelajaran',
    'Tahun Ajaran': schedule.tahunAjaran || '',
    'Semester': schedule.semester || '',
    'Status': schedule.statusJadwal || 'Aktif',
    'Mapel Guru ID': schedule.mapelGuruId || '',
    'Dibuat': schedule.createdAt ? new Date(schedule.createdAt).toLocaleString('id-ID') : '',
    'Diubah': schedule.updatedAt ? new Date(schedule.updatedAt).toLocaleString('id-ID') : '',
  }));
};

/**
 * Transform subject (mata pelajaran) data for export
 * @param {Array} subjects - Array of subject objects
 * @param {Array} teachers - Array of teacher objects for reference
 */
export const transformSubjectDataForExport = (subjects, teachers = []) => {
  return subjects.map((subject, index) => {
    // Find teachers who teach this subject
    const teachingTeachers = teachers.filter(teacher => {
      if (Array.isArray(teacher.mataPelajaran)) {
        return teacher.mataPelajaran.includes(subject.nama);
      } else if (typeof teacher.mataPelajaran === 'string') {
        return teacher.mataPelajaran === subject.nama;
      }
      return false;
    });

    // Get all classes taught by these teachers
    const allClasses = new Set();
    teachingTeachers.forEach(teacher => {
      if (Array.isArray(teacher.kelasAmpu)) {
        teacher.kelasAmpu.forEach(kelas => {
          if (kelas && kelas.trim()) {
            allClasses.add(kelas.trim());
          }
        });
      }
    });

    return {
      'No': index + 1,
      'ID Mata Pelajaran': subject.id || '',
      'Nama Mata Pelajaran': subject.nama || '',
      'Kelompok': subject.kelompok || '',
      'Kategori': subject.kategori || '',
      'Jurusan': Array.isArray(subject.jurusan) ? subject.jurusan.join(', ') : (subject.jurusan || ''),
      'Deskripsi': subject.deskripsi || '',
      'Status': subject.aktif ? 'Aktif' : 'Tidak Aktif',
      'Jumlah Guru Pengampu': teachingTeachers.length,
      'Guru Pengampu': teachingTeachers.map(t => t.namaLengkap).join('; ') || 'Belum ada guru',
      'Kelas yang Diajar': Array.from(allClasses).sort().join('; ') || 'Belum ada kelas',
      'Icon URL': subject.iconUrl || '',
      'Dibuat': subject.createdAt ? new Date(subject.createdAt).toLocaleString('id-ID') : '',
      'Diubah': subject.updatedAt ? new Date(subject.updatedAt).toLocaleString('id-ID') : '',
    };
  });
};

/**
 * Transform teacher data for export
 * @param {Array} teachers - Array of teacher objects
 */
export const transformTeacherDataForExport = (teachers) => {
  return teachers.map((teacher, index) => ({
    'No': index + 1,
    'ID Guru': teacher.id || '',
    'Nama Lengkap': teacher.namaLengkap || '',
    'NIP': teacher.nip || '',
    'Email': teacher.email || '',
    'No Telepon': teacher.noTelepon || '',
    'Mata Pelajaran': Array.isArray(teacher.mataPelajaran) ? teacher.mataPelajaran.join('; ') : (teacher.mataPelajaran || ''),
    'Kelas Ampu': Array.isArray(teacher.kelasAmpu) ? teacher.kelasAmpu.join('; ') : (teacher.kelasAmpu || ''),
    'Status Kepegawaian': teacher.statusKepegawaian || '',
    'Alamat': teacher.alamat || '',
    'Tanggal Lahir': teacher.tanggalLahir || '',
    'Jenis Kelamin': teacher.jenisKelamin || '',
    'Agama': teacher.agama || '',
    'Foto Profile': teacher.fotoProfile || '',
    'Dibuat': teacher.createdAt ? new Date(teacher.createdAt).toLocaleString('id-ID') : '',
    'Diubah': teacher.updatedAt ? new Date(teacher.updatedAt).toLocaleString('id-ID') : '',
  }));
};

/**
 * Export schedule data with filtering options
 * @param {Array} schedules - Array of schedule objects
 * @param {Object} filters - Filter options
 */
export const exportScheduleData = async (schedules, filters = {}) => {
  try {
    let filteredData = [...schedules];
    
    // Apply filters
    if (filters.kelas) {
      filteredData = filteredData.filter(schedule => schedule.namaKelas === filters.kelas);
    }
    
    if (filters.jurusan) {
      filteredData = filteredData.filter(schedule => schedule.jurusan === filters.jurusan);
    }
    
    if (filters.hari) {
      filteredData = filteredData.filter(schedule => schedule.hari === filters.hari);
    }
    
    if (filters.guru) {
      filteredData = filteredData.filter(schedule => schedule.guruId === filters.guru);
    }

    // Generate filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    let filename = `jadwal_${dateStr}_${timeStr}`;
    
    if (filters.kelas) {
      filename = `jadwal_${filters.kelas.replace(/\s+/g, '_')}_${dateStr}_${timeStr}`;
    } else if (filters.jurusan) {
      filename = `jadwal_${filters.jurusan}_${dateStr}_${timeStr}`;
    }

    // Transform and export data
    const result = await exportToCSV(filteredData, filename, {
      transformData: transformScheduleDataForExport
    });

    return {
      ...result,
      filters: filters,
      originalCount: schedules.length,
      filteredCount: filteredData.length
    };
  } catch (error) {
    console.error('Export schedule data error:', error);
    throw error;
  }
};

/**
 * Export subject data with teacher information
 * @param {Array} subjects - Array of subject objects
 * @param {Array} teachers - Array of teacher objects
 */
export const exportSubjectData = async (subjects, teachers = []) => {
  try {
    // Generate filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `mata_pelajaran_${dateStr}_${timeStr}`;

    // Transform and export data
    const result = await exportToCSV(subjects, filename, {
      transformData: (data) => transformSubjectDataForExport(data, teachers)
    });

    return {
      ...result,
      subjectCount: subjects.length,
      teacherCount: teachers.length
    };
  } catch (error) {
    console.error('Export subject data error:', error);
    throw error;
  }
};

/**
 * Get export summary for schedules
 * @param {Array} schedules - Array of schedule objects
 */
export const getScheduleExportSummary = (schedules) => {
  const summary = {
    total: schedules.length,
    byDay: {},
    byClass: {},
    bySubject: {},
    byTeacher: {}
  };

  schedules.forEach(schedule => {
    // Count by day
    summary.byDay[schedule.hari] = (summary.byDay[schedule.hari] || 0) + 1;
    
    // Count by class
    summary.byClass[schedule.namaKelas] = (summary.byClass[schedule.namaKelas] || 0) + 1;
    
    // Count by subject
    summary.bySubject[schedule.namaMataPelajaran] = (summary.bySubject[schedule.namaMataPelajaran] || 0) + 1;
    
    // Count by teacher
    summary.byTeacher[schedule.namaGuru] = (summary.byTeacher[schedule.namaGuru] || 0) + 1;
  });

  return summary;
};

/**
 * Get export summary for subjects
 * @param {Array} subjects - Array of subject objects
 * @param {Array} teachers - Array of teacher objects
 */
export const getSubjectExportSummary = (subjects, teachers = []) => {
  const summary = {
    total: subjects.length,
    byGroup: {},
    byCategory: {},
    byDepartment: {},
    activeCount: 0,
    inactiveCount: 0,
    withTeachers: 0,
    withoutTeachers: 0
  };

  subjects.forEach(subject => {
    // Count by group
    summary.byGroup[subject.kelompok] = (summary.byGroup[subject.kelompok] || 0) + 1;
    
    // Count by category
    summary.byCategory[subject.kategori] = (summary.byCategory[subject.kategori] || 0) + 1;
    
    // Count by department
    const jurusan = Array.isArray(subject.jurusan) ? subject.jurusan.join(', ') : subject.jurusan;
    summary.byDepartment[jurusan] = (summary.byDepartment[jurusan] || 0) + 1;
    
    // Count active/inactive
    if (subject.aktif) {
      summary.activeCount++;
    } else {
      summary.inactiveCount++;
    }
    
    // Count subjects with/without teachers
    const hasTeachers = teachers.some(teacher => {
      if (Array.isArray(teacher.mataPelajaran)) {
        return teacher.mataPelajaran.includes(subject.nama);
      } else if (typeof teacher.mataPelajaran === 'string') {
        return teacher.mataPelajaran === subject.nama;
      }
      return false;
    });
    
    if (hasTeachers) {
      summary.withTeachers++;
    } else {
      summary.withoutTeachers++;
    }
  });

  return summary;
};

export default {
  exportToCSV,
  exportScheduleData,
  exportSubjectData,
  transformScheduleDataForExport,
  transformSubjectDataForExport,
  transformTeacherDataForExport,
  getScheduleExportSummary,
  getSubjectExportSummary
};
