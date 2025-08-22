import KelasJurusanService from '../../../services/KelasJurusanService';

export const getJamPelajaranData = () => ({
  reguler: {
    0: { jamMulai: '07:00', jamSelesai: '07:15', label: 'MC', isSpecial: true },
    1: { jamMulai: '07:15', jamSelesai: '07:55', label: 'Jam 1' },
    2: { jamMulai: '07:55', jamSelesai: '08:35', label: 'Jam 2' },
    3: { jamMulai: '08:35', jamSelesai: '09:15', label: 'Jam 3' },
    4: { jamMulai: '09:15', jamSelesai: '09:55', label: 'Jam 4' },
    'istirahat1': { jamMulai: '09:55', jamSelesai: '10:15', label: 'Istirahat', isSpecial: true },
    5: { jamMulai: '10:15', jamSelesai: '10:55', label: 'Jam 5' },
    6: { jamMulai: '10:55', jamSelesai: '11:35', label: 'Jam 6' },
    7: { jamMulai: '11:35', jamSelesai: '12:15', label: 'Jam 7' },
    'istirahat2': { jamMulai: '12:15', jamSelesai: '12:55', label: 'Istirahat', isSpecial: true },
    8: { jamMulai: '12:55', jamSelesai: '13:35', label: 'Jam 8' },
    9: { jamMulai: '13:35', jamSelesai: '14:15', label: 'Jam 9' },
    10: { jamMulai: '14:15', jamSelesai: '14:55', label: 'Jam 10' },
    11: { jamMulai: '14:55', jamSelesai: '15:35', label: 'Jam 11' },
  },
  jumat: {
    0: { jamMulai: '07:00', jamSelesai: '07:40', label: 'Feed Back', isSpecial: true },
    'greenClean': { jamMulai: '07:40', jamSelesai: '08:40', label: 'Green & Clean', isSpecial: true },
    'istirahat1': { jamMulai: '08:40', jamSelesai: '09:20', label: 'Istirahat', isSpecial: true },
    1: { jamMulai: '09:20', jamSelesai: '10:00', label: 'Jam 1' },
    2: { jamMulai: '10:00', jamSelesai: '10:40', label: 'Jam 2' },
    3: { jamMulai: '10:40', jamSelesai: '11:20', label: 'Jam 3' },
    'istirahat2': { jamMulai: '11:20', jamSelesai: '13:00', label: 'Istirahat', isSpecial: true },
    4: { jamMulai: '13:00', jamSelesai: '13:40', label: 'Jam 4' },
    5: { jamMulai: '13:40', jamSelesai: '14:20', label: 'Jam 5' },
    6: { jamMulai: '14:20', jamSelesai: '15:00', label: 'Jam 6' },
    7: { jamMulai: '15:00', jamSelesai: '16:00', label: 'Jam 7' },
  }
});

export const getRuangKelasData = () => ({
  kelas: [
    'X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2', 'XII TKJ 1', 'XII TKJ 2',
    'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'
  ],
  ruanganLain: [
    { nama: 'Lab. TKJ', color: '#FBBF24' },
    { nama: 'Lab. IoT', color: '#7C3AED' },
    { nama: 'Outdoor', color: '#FB923C' },
    { nama: 'R. Teater', color: '#DC2626' },
    { nama: 'Bengkel 1', color: '#10B981' },
    { nama: 'Bengkel 2', color: '#10B981' },
    { nama: 'Perpustakaan', color: '#3B82F6' },
    { nama: 'Aula', color: '#F59E0B' },
    { nama: 'Mushola', color: '#6B7280' },
  ]
});

// Static fallback data (will be replaced by dynamic data)
const FALLBACK_CLASS_DATA = {
  jurusan: ['TKJ', 'TKR'],
  kelas: {
    'TKJ': ['X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2', 'XII TKJ 1', 'XII TKJ 2'],
    'TKR': ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2']
  }
};

// Get dynamic class data from database
export const getStaticClassData = async () => {
  try {
    const data = await KelasJurusanService.getKelasJurusanData();
    
    if (data.jurusan.length === 0) {
      console.log('No dynamic data found, using fallback data');
      return FALLBACK_CLASS_DATA;
    }
    
    return {
      jurusan: data.jurusan,
      kelas: data.kelas,
      jurusanDetail: data.jurusanDetail,
      kelasDetail: data.kelasDetail
    };
  } catch (error) {
    console.error('Error getting dynamic class data:', error);
    return FALLBACK_CLASS_DATA;
  }
};

// Synchronous version for backward compatibility (deprecated)
export const getStaticClassDataSync = () => FALLBACK_CLASS_DATA;

export const DAYS = [
  { key: 'Senin', label: 'Senin' },
  { key: 'Selasa', label: 'Selasa' },
  { key: 'Rabu', label: 'Rabu' },
  { key: 'Kamis', label: 'Kamis' },
  { key: 'Jumat', label: 'Jumat' },
  { key: 'Sabtu', label: 'Sabtu' }
];

export const FORM_INITIAL_STATE = {
  namaMataPelajaran: '',
  namaGuru: '',
  guruId: '',
  jurusan: '',
  namaKelas: '',
  hari: '',
  jamKe: '',
  ruangKelas: '',
  jenisAktivitas: '',
  deskripsi: '',
  tahunAjaran: '2024/2025',
  semester: 'Ganjil',
  statusJadwal: 'Aktif',
};
