import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Picker } from '@react-native-picker/picker';
import JadwalService from '../../services/JadwalService';
import GuruService from '../../services/GuruService';
import { createNotification } from '../../services/notificationService';
import { getSafeFont } from '../../utils/fontUtils';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');
const CELL_WIDTH = (width - 32) / 2.5;

const START_OF_WEEK = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const JAM_PELAJARAN_DATA = {
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
};

const RUANG_KELAS_DATA = {
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
};

const STATIC_CLASS_DATA = {
  jurusan: ['TKJ', 'TKR'],
  kelas: {
    'TKJ': ['X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2', 'XII TKJ 1', 'XII TKJ 2'],
    'TKR': ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2']
  }
};

const getScheduleItemColor = (schedule) => {
  if (!schedule) return '#F3F4F6';
  
  const colorMap = {
    'mc': '#3B82F6',
    'feedBack': '#3B82F6',
    'istirahat': '#EF4444',
    'greenClean': '#10B981'
  };
  
  if (colorMap[schedule.jenisAktivitas]) {
    return colorMap[schedule.jenisAktivitas];
  }
  
  const ruangan = RUANG_KELAS_DATA.ruanganLain.find(r => r.nama === schedule.ruangKelas);
  return ruangan?.color || 'transparent';
};

const getTextColor = (schedule) => getScheduleItemColor(schedule) === 'transparent' ? '#000' : '#FFFFFF';

const sendNotificationToStudents = async (namaKelas, message, actionType = 'update') => {
  try {
    console.log(`📧 Mengirim notifikasi ${actionType} untuk kelas:`, namaKelas);
    const MuridService = await import('../../services/MuridService');
    const studentsInClass = await MuridService.default.getMuridByKelas(namaKelas);
    
    console.log('👥 Ditemukan', studentsInClass.length, 'murid di kelas', namaKelas);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const student of studentsInClass) {
      try {
        await createNotification(student.id, message);
        console.log(`✅ Berhasil kirim notifikasi ${actionType} ke:`, student.namaLengkap);
        successCount++;
      } catch (notifError) {
        console.error(`❌ Gagal kirim notifikasi ${actionType} ke:`, student.namaLengkap, notifError);
        errorCount++;
      }
    }
    
    console.log(`📊 Notifikasi ${actionType} - Berhasil: ${successCount}, Gagal: ${errorCount}`);
    if (successCount > 0) {
      Alert.alert('Info', `Notifikasi berhasil dikirim ke ${successCount} murid`);
    }
  } catch (error) {
    console.error(`🚨 Error saat mengirim notifikasi ${actionType}:`, error);
  }
};

const createJadwalData = (formData) => ({
  ...formData,
  jamKe: isNaN(formData.jamKe) ? formData.jamKe : parseInt(formData.jamKe),
  tahunAjaran: '2024/2025',
  semester: 'Ganjil',
  statusJadwal: 'Aktif',
});

const getJurusanFromKelas = (namaKelas) => {
  if (namaKelas?.includes('TKJ')) return 'TKJ';
  if (namaKelas?.includes('TKR')) return 'TKR';
  return '';
};

// Helper function untuk deteksi jurusan prodi dengan akurat
const detectProdiJurusan = (user) => {
  if (!user || user.userType !== 'prodi') return null;
  
  // Prioritas 1: Field langsung dari database
  if (user.jurusan && (user.jurusan === 'TKJ' || user.jurusan === 'TKR')) {
    console.log('🎯 Detected jurusan from user.jurusan:', user.jurusan);
    return user.jurusan;
  }
  
  if (user.kodeProdi && (user.kodeProdi === 'TKJ' || user.kodeProdi === 'TKR')) {
    console.log('🎯 Detected jurusan from user.kodeProdi:', user.kodeProdi);
    return user.kodeProdi;
  }
  
  if (user.programStudi && (user.programStudi === 'TKJ' || user.programStudi === 'TKR')) {
    console.log('🎯 Detected jurusan from user.programStudi:', user.programStudi);
    return user.programStudi;
  }
  
  // Prioritas 2: Deteksi dari role (untuk backward compatibility)
  if (user.role) {
    if (user.role.includes('kaprodi_tkj') || user.role === 'kaprodi_tkj') {
      console.log('🎯 Detected TKJ from user.role:', user.role);
      return 'TKJ';
    }
    if (user.role.includes('kaprodi_tkr') || user.role === 'kaprodi_tkr') {
      console.log('🎯 Detected TKR from user.role:', user.role);
      return 'TKR';
    }
  }
  
  // Prioritas 3: Deteksi dari NIP (berdasarkan sample data yang digenerate)
  if (user.nip) {
    // Sample NIPs from generate function:
    // TKR: '198505151234567890'
    // TKJ: '199002201234567891'
    if (user.nip === '198505151234567890') {
      console.log('🎯 Detected TKR from known NIP:', user.nip);
      return 'TKR';
    }
    if (user.nip === '199002201234567891') {
      console.log('🎯 Detected TKJ from known NIP:', user.nip);
      return 'TKJ';
    }
  }
  
  // Prioritas 4: Deteksi dari nama lengkap
  if (user.namaLengkap) {
    const namaLower = user.namaLengkap.toLowerCase();
    
    // Cek keywords untuk TKJ
    if (namaLower.includes('tkj') || namaLower.includes('komputer') || 
        namaLower.includes('jaringan') || namaLower.includes('informasi')) {
      console.log('🎯 Detected TKJ from namaLengkap keywords:', user.namaLengkap);
      return 'TKJ';
    }
    
    // Cek keywords untuk TKR
    if (namaLower.includes('tkr') || namaLower.includes('kendaraan') || 
        namaLower.includes('otomotif') || namaLower.includes('motor')) {
      console.log('🎯 Detected TKR from namaLengkap keywords:', user.namaLengkap);
      return 'TKR';
    }
  }
  
  console.warn('⚠️ Cannot detect jurusan for prodi user:', user);
  return null;
};

// Helper function untuk check apakah user adalah prodi/kapordi
const isKapordiUser = (user) => {
  if (!user) return false;
  
  // Check userType
  if (user.userType === 'prodi') return true;
  
  // Check role
  if (user.role && (user.role.includes('kaprodi') || user.role === 'kaprodi_tkj' || user.role === 'kaprodi_tkr')) {
    return true;
  }
  
  return false;
};

// Helper function untuk check permission edit/delete jadwal
const canEditDeleteSchedule = (user, schedule) => {
  if (!user || !schedule) return false;
  
  // Admin dapat mengedit semua jadwal
  if (user.userType === 'admin' || user.role === 'admin' || user.role === 'super_admin') {
    return true;
  }
  
  // Kapordi hanya dapat mengedit jadwal dari jurusan mereka
  if (isKapordiUser(user)) {
    const userJurusan = detectProdiJurusan(user);
    if (userJurusan && schedule.namaKelas) {
      return schedule.namaKelas.includes(userJurusan);
    }
  }
  
  return false;
};

// Helper function untuk validasi permission sebelum action
const validateKapordiPermission = (user, schedule, actionType = 'action') => {
  if (!isKapordiUser(user)) return true; // Non-kapordi users bypass this check
  
  const userJurusan = detectProdiJurusan(user);
  if (!userJurusan) {
    Alert.alert('Error', 'Data jurusan tidak ditemukan. Silakan hubungi administrator.');
    return false;
  }
  
  if (schedule && schedule.namaKelas && !schedule.namaKelas.includes(userJurusan)) {
    Alert.alert('Error', `Anda hanya dapat ${actionType} jadwal kelas ${userJurusan}`);
    return false;
  }
  
  return true;
};

export default function JadwalManagementPage({ onGoBack }) {
  const { user } = useUser();
  const [schedules, setSchedules] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const [selectedJurusan, setSelectedJurusan] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState(null);

  const [weekStartDate, setWeekStartDate] = useState(START_OF_WEEK(new Date()));

  const [jurusanList, setJurusanList] = useState([]);
  const [kelasList, setKelasList] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [guruList, setGuruList] = useState([]);
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [availableMapel, setAvailableMapel] = useState([]);
  const [availableKelas, setAvailableKelas] = useState([]);
  
  const [availableJamList, setAvailableJamList] = useState([]);
  const [isSpecialActivity, setIsSpecialActivity] = useState(false);
  
  const [formData, setFormData] = useState({
    namaMataPelajaran: '',
    namaGuru: '',
    guruId: '',
    jurusan: '',
    namaKelas: '',
    hari: '',
    jamKe: '',
    jamMulai: '',
    jamSelesai: '',
    ruangKelas: '',
    jenisAktivitas: 'pembelajaran', // 'pembelajaran', 'mc', 'istirahat', 'feedBack', 'greenClean'
  });

  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const getJamPelajaranData = () => {
    return {
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
    };
  };

  const getRuangKelasData = () => {
    return {
      kelas: [
        'X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2', 'XII TKJ 1', 'XII TKJ 2',
        'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'
      ],
      ruanganLain: [
        { nama: 'Lab. TKJ', color: '#FBBF24' }, // Kuning
        { nama: 'Lab. IoT', color: '#7C3AED' }, // Ungu
        { nama: 'Outdoor', color: '#FB923C' }, // Orange
        { nama: 'R. Teater', color: '#DC2626' }, // Merah
        { nama: 'Bengkel 1', color: '#10B981' }, // Hijau
        { nama: 'Bengkel 2', color: '#10B981' }, // Hijau
        { nama: 'Perpustakaan', color: '#3B82F6' }, // Biru
        { nama: 'Aula', color: '#F59E0B' }, // Amber
        { nama: 'Mushola', color: '#6B7280' }, // Abu
      ]
    };
  };

  const getScheduleItemColor = (schedule) => {
    if (!schedule) return '#F3F4F6';
    
    switch (schedule.jenisAktivitas) {
      case 'mc':
      case 'feedBack':
        return '#3B82F6'; // Biru
      case 'istirahat':
        return '#EF4444'; // Merah untuk istirahat
      case 'greenClean':
        return '#10B981'; // Hijau
      default:
        const ruangData = getRuangKelasData();
        const ruangan = ruangData.ruanganLain.find(r => r.nama === schedule.ruangKelas);
        if (ruangan) {
          return ruangan.color;
        }
        return 'transparent'; // Tidak ada warna jika tidak ada ruangan khusus
    }
  };

  const getTextColor = (schedule) => {
    const bgColor = getScheduleItemColor(schedule);
    if (bgColor === 'transparent' || !bgColor) {
      return '#000';
    }
    return '#FFFFFF';
  };

  const getStaticClassData = () => {
    return {
      jurusan: ['TKJ', 'TKR'],
      kelas: {
        'TKJ': ['X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2', 'XII TKJ 1', 'XII TKJ 2'],
        'TKR': ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2']
      }
    };
  };

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      
      
      const allSchedules = await JadwalService.getAllJadwal();
      
      // Filter schedules based on user role (prodi)
      let filteredSchedules = allSchedules;
      let userJurusan = null;
      
      if (user?.userType === 'prodi') {
        // Try multiple ways to get jurusan for prodi
        userJurusan = user?.jurusan || user?.kodeProdi || user?.programStudi;
        
        // If still no jurusan, try to detect from user name or other fields
        if (!userJurusan && user?.namaLengkap) {
          const namaLower = user.namaLengkap.toLowerCase();
          if (namaLower.includes('tkr') || namaLower.includes('kendaraan')) {
            userJurusan = 'TKR';
          } else if (namaLower.includes('tkj') || namaLower.includes('komputer') || namaLower.includes('jaringan')) {
            userJurusan = 'TKJ';
          }
        }
        
        
        if (userJurusan) {
          // Filter schedules by their program studi
          filteredSchedules = allSchedules.filter(schedule => {
            return schedule.namaKelas && schedule.namaKelas.includes(userJurusan);
          });
        } else {
          // Show all schedules as fallback but add warning
          Alert.alert('Peringatan', 'Data jurusan tidak ditemukan. Silakan hubungi administrator untuk memperbarui data Anda.');
        }
      } else {
      }
      
      setSchedules(filteredSchedules);

      const staticData = getStaticClassData();
      let availableJurusan = staticData.jurusan;
      
      // If user is prodi, limit jurusan options to their program studi
      if (user?.userType === 'prodi' && userJurusan) {
        availableJurusan = [userJurusan];
      }
      
      setJurusanList(availableJurusan);

      // Set initial jurusan and kelas selection
      if (availableJurusan.length > 0) {
        const initialJurusan = availableJurusan[0];
        
        // Always set jurusan for prodi users, or if not selected for admin
        if (user?.userType === 'prodi' || !selectedJurusan) {
          setSelectedJurusan(initialJurusan);
          const availableKelasList = staticData.kelas[initialJurusan] || [];
          setKelasList(availableKelasList);
          
          // Set initial kelas for prodi or if not selected
          if (availableKelasList.length > 0 && (!selectedKelas || !availableKelasList.includes(selectedKelas))) {
            setSelectedKelas(availableKelasList[0]);
          }
        }
      }

      // Filter guru based on prodi role
      const allGuru = await GuruService.getAllGuru();
      let filteredGuru = allGuru;
      if (user?.userType === 'prodi' && userJurusan) {
        // Filter guru that teach classes in this program studi
        filteredGuru = allGuru.filter(guru => {
          if (!guru.kelasAmpu || !Array.isArray(guru.kelasAmpu)) return true; // Show all guru if no kelasAmpu data
          return guru.kelasAmpu.some(kelas => kelas.includes(userJurusan));
        });
      }
      setGuruList(filteredGuru);

    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data jadwal');
    } finally {
      setLoading(false);
    }
  }, [selectedJurusan, selectedKelas, user]);

  useEffect(() => {
    fetchSchedules();
  }, [user]); // Re-run when user data changes
  
  // Force re-filter when user role changes
  useEffect(() => {
    if (user?.userType === 'prodi') {
      // Try multiple ways to get jurusan for prodi
      let userJurusan = user?.jurusan || user?.kodeProdi || user?.programStudi;
      
      // If still no jurusan, try to detect from user name or other fields
      if (!userJurusan && user?.namaLengkap) {
        const namaLower = user.namaLengkap.toLowerCase();
        if (namaLower.includes('tkr') || namaLower.includes('kendaraan')) {
          userJurusan = 'TKR';
        } else if (namaLower.includes('tkj') || namaLower.includes('komputer') || namaLower.includes('jaringan')) {
          userJurusan = 'TKJ';
        }
      }
      
      if (userJurusan) {
        console.log(`🔧 Force setting prodi filter to: ${userJurusan}`);
        
        setSelectedJurusan(userJurusan);
        const staticData = getStaticClassData();
        const availableKelasList = staticData.kelas[userJurusan] || [];
        setKelasList(availableKelasList);
        
        if (availableKelasList.length > 0) {
          setSelectedKelas(availableKelasList[0]);
        }
      }
    }
  }, [user?.userType, user?.jurusan, user?.kodeProdi, user?.programStudi, user?.namaLengkap]);

  useEffect(() => {
    if (selectedJurusan) {
      const staticData = getStaticClassData();
      const newKelasList = staticData.kelas[selectedJurusan] || [];
      
      setKelasList(newKelasList);

      if (newKelasList.length > 0) {
        if (!newKelasList.includes(selectedKelas)) {
            setSelectedKelas(newKelasList[0]);
        }
      } else {
        setSelectedKelas(null);
      }
    }
  }, [selectedJurusan]);

  const processDataForTable = useCallback(() => {
    if (!selectedKelas) {
      setTableData([]);
      return;
    }

    setIsFiltering(true);
    const classSchedules = schedules.filter(s => s.namaKelas === selectedKelas);

    const groupedByJam = classSchedules.reduce((acc, curr) => {
      const jamKey = curr.jamKe;
      if (!acc[jamKey]) {
        acc[jamKey] = { 
          jamKe: jamKey, 
          waktu: `${curr.jamMulai} - ${curr.jamSelesai}`,
          Senin: null, Selasa: null, Rabu: null, Kamis: null, Jumat: null 
        };
      }
      acc[jamKey][curr.hari] = curr;
      return acc;
    }, {});

    const sortedTableData = Object.values(groupedByJam).sort((a, b) => a.jamKe - b.jamKe);
    setTableData(sortedTableData);
    setIsFiltering(false);
  }, [schedules, selectedKelas]);

  useEffect(() => {
    processDataForTable();
  }, [schedules, selectedKelas, processDataForTable]);

  const changeWeek = (direction) => {
    setWeekStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction * 7));
      return newDate;
    });
  };

  const resetForm = () => {
    setFormData({
      namaMataPelajaran: '',
      namaGuru: '',
      guruId: '',
      jurusan: '',
      namaKelas: '',
      hari: '',
      jamKe: '',
      jamMulai: '',
      jamSelesai: '',
      ruangKelas: '',
      jenisAktivitas: 'pembelajaran',
    });
    setSelectedGuru(null);
    setAvailableMapel([]);
    setAvailableKelas([]);
    setAvailableJamList([]);
    setIsSpecialActivity(false);
    setEditingSchedule(null);
  };

  const handleJurusanChange = (jurusan) => {
    // Validate if prodi user can only select their program studi
    if (user?.userType === 'prodi') {
      let userJurusan = user?.jurusan || user?.kodeProdi || user?.programStudi;
      
      // If still no jurusan, try to detect from user name
      if (!userJurusan && user?.namaLengkap) {
        const namaLower = user.namaLengkap.toLowerCase();
        if (namaLower.includes('tkr') || namaLower.includes('kendaraan')) {
          userJurusan = 'TKR';
        } else if (namaLower.includes('tkj') || namaLower.includes('komputer') || namaLower.includes('jaringan')) {
          userJurusan = 'TKJ';
        }
      }
      
      if (userJurusan && jurusan !== userJurusan) {
        Alert.alert('Akses Ditolak', `Anda hanya dapat mengelola jadwal untuk program studi ${userJurusan}`);
        return;
      }
    }
    
    const staticData = getStaticClassData();
    const newKelasList = staticData.kelas[jurusan] || [];
    
    setAvailableKelas(newKelasList);
    setFormData({
      ...formData,
      jurusan,
      namaKelas: '', // Reset kelas when jurusan changes
    });
  };

  const updateAvailableJam = (hari) => {
    const jamData = getJamPelajaranData();
    const selectedSchedule = hari === 'Jumat' ? jamData.jumat : jamData.reguler;
    
    const jamList = Object.entries(selectedSchedule).map(([key, value]) => ({
      key,
      ...value,
      jamKe: isNaN(key) ? key : parseInt(key)
    }));
    
    setAvailableJamList(jamList);
  };

  const handleHariChange = (hari) => {
    setFormData({
      ...formData,
      hari,
      jamKe: '',
      jamMulai: '',
      jamSelesai: '',
    });
    updateAvailableJam(hari);
  };

  const handleJamKeChange = (jamKey) => {
    const selectedJam = availableJamList.find(jam => jam.key === jamKey);
    if (selectedJam) {
      const isSpecial = selectedJam.isSpecial || false;
      setIsSpecialActivity(isSpecial);
      
      let jenisAktivitas = 'pembelajaran';
      let namaMataPelajaran = '';
      let namaGuru = '';
      let guruId = '';
      
      if (isSpecial) {
        if (selectedJam.label === 'MC') {
          jenisAktivitas = 'mc';
          namaMataPelajaran = 'MC';
        } else if (selectedJam.label === 'Istirahat') {
          jenisAktivitas = 'istirahat';
          namaMataPelajaran = 'Istirahat';
        } else if (selectedJam.label === 'Feed Back') {
          jenisAktivitas = 'feedBack';
          namaMataPelajaran = 'Feed Back';
        } else if (selectedJam.label === 'Green & Clean') {
          jenisAktivitas = 'greenClean';
          namaMataPelajaran = 'Green & Clean';
        }
      }
      
      setFormData({
        ...formData,
        jamKe: jamKey,
        jamMulai: selectedJam.jamMulai,
        jamSelesai: selectedJam.jamSelesai,
        jenisAktivitas,
        namaMataPelajaran: isSpecial ? namaMataPelajaran : formData.namaMataPelajaran,
        namaGuru: isSpecial ? namaGuru : formData.namaGuru,
        guruId: isSpecial ? guruId : formData.guruId,
      });
      
      if (isSpecial) {
        setSelectedGuru(null);
        setAvailableMapel([]);
      }
    }
  };

  const handleGuruChange = (guruId) => {
    const guru = guruList.find(g => g.id === guruId);
    if (guru) {
      setSelectedGuru(guru);
      setAvailableMapel(guru.mataPelajaran || []);
      setAvailableKelas(guru.kelasAmpu || []);
      setFormData({
        ...formData,
        guruId: guru.id,
        namaGuru: guru.namaLengkap,
        namaMataPelajaran: '', // Reset mapel when guru changes
        namaKelas: '', // Reset kelas when guru changes
      });
    } else {
      setSelectedGuru(null);
      setAvailableMapel([]);
      setAvailableKelas([]);
      setFormData({
        ...formData,
        guruId: '',
        namaGuru: '',
        namaMataPelajaran: '',
        namaKelas: '',
      });
    }
  };

const handleSaveSchedule = async () => {
    // Validasi permission menggunakan helper function
    if (!validateKapordiPermission(user, { namaKelas: formData.namaKelas }, 'mengelola')) {
      return;
    }
    
    let requiredFields = ['namaMataPelajaran', 'namaKelas', 'hari', 'jamKe', 'jamMulai', 'jamSelesai'];

    if (formData.jenisAktivitas === 'pembelajaran') {
      requiredFields.push('namaGuru', 'guruId', 'ruangKelas');
    }
    else {
      if (!formData.ruangKelas) formData.ruangKelas = '-';
      // For special activities, we still need a valid teacher assignment
      // Don't set guruId and namaGuru to '-' automatically
      if (!formData.namaGuru || !formData.guruId) {
        Alert.alert('Error', 'Guru harus dipilih untuk semua jenis aktivitas jadwal');
        return;
      }
    }
    
    const emptyFields = requiredFields.filter(field => !formData[field]);
    
    if (emptyFields.length > 0) {
      Alert.alert('Error', `Field berikut harus diisi: ${emptyFields.join(', ')}` );
      return;
    }

    setIsSubmitting(true);
    try {
      const jadwalData = {
        ...formData,
        jamKe: isNaN(formData.jamKe) ? formData.jamKe : parseInt(formData.jamKe),
        tahunAjaran: '2024/2025',
        semester: 'Ganjil',
        statusJadwal: 'Aktif',
      };

      if (editingSchedule) {
        await JadwalService.updateJadwal(editingSchedule.id, jadwalData);
        Alert.alert('Sukses', 'Jadwal berhasil diperbarui dan telah masuk ke laporan untuk persetujuan admin sebelum dikirim ke murid dan guru!');
        const userName = user?.namaLengkap || user?.username || (user?.userType === 'prodi' ? 'Prodi' : 'Admin');
        const userJurusan = user?.jurusan || user?.kodeProdi || '';
        const userTitle = user?.userType === 'prodi' ? `Prodi ${userJurusan}` : 'Admin';
        const message = `Jadwal untuk Kelas ${jadwalData.namaKelas} pada hari ${jadwalData.hari} jam ke-${jadwalData.jamKe} telah diperbarui oleh ${userTitle} ${userName}. Mata Pelajaran: ${jadwalData.namaMataPelajaran}`;
        createNotification('admin', message);
        
        // Jadwal disimpan ke database dan akan masuk laporan untuk persetujuan admin
        // Tidak langsung dikirim ke murid dan guru
        
        // Hanya kirim notifikasi ke admin tentang perubahan jadwal
        console.log('💾 Jadwal berhasil diupdate dan menunggu persetujuan admin untuk distribusi ke murid dan guru');
        
        // Optional: Buat entry laporan jadwal otomatis untuk perubahan ini
        try {
          const ScheduleReportService = await import('../../services/ScheduleReportService');
          const reportData = {
            title: `Update Jadwal ${jadwalData.namaKelas} - ${jadwalData.namaMataPelajaran}`,
            jurusan: jadwalData.jurusan || (jadwalData.namaKelas.includes('TKJ') ? 'TKJ' : 'TKR'),
            periode: `${jadwalData.tahunAjaran} ${jadwalData.semester}`,
            description: `Jadwal ${jadwalData.namaMataPelajaran} untuk kelas ${jadwalData.namaKelas} telah diperbarui oleh ${userTitle} ${userName}`,
            schedules: [jadwalData],
            scheduleCount: 1,
            createdBy: user?.id || 'system',
            submittedBy: user?.id,
            submittedByName: userName
          };
          
          await ScheduleReportService.createScheduleReport(reportData);
          console.log('📋 Laporan perubahan jadwal otomatis telah dibuat');
        } catch (reportError) {
          console.error('⚠️ Gagal membuat laporan otomatis:', reportError);
        }
      } else {
        await JadwalService.createJadwal(jadwalData);
        Alert.alert('Sukses', 'Jadwal berhasil ditambahkan dan telah masuk ke laporan untuk persetujuan admin sebelum dikirim ke murid dan guru!');
        const userName = user?.namaLengkap || user?.username || (user?.userType === 'prodi' ? 'Prodi' : 'Admin');
        const userJurusan = user?.jurusan || user?.kodeProdi || '';
        const userTitle = user?.userType === 'prodi' ? `Prodi ${userJurusan}` : 'Admin';
        const message = `Jadwal Baru untuk Kelas ${jadwalData.namaKelas} pada hari ${jadwalData.hari} jam ke-${jadwalData.jamKe} telah ditambahkan oleh ${userTitle} ${userName}. Mata Pelajaran: ${jadwalData.namaMataPelajaran}`;
        createNotification('admin', message);
        
        // Jadwal disimpan ke database dan akan masuk laporan untuk persetujuan admin
        // Tidak langsung dikirim ke murid dan guru
        
        // Hanya kirim notifikasi ke admin tentang jadwal baru
        console.log('💾 Jadwal baru berhasil ditambahkan dan menunggu persetujuan admin untuk distribusi ke murid dan guru');
        
        // Optional: Buat entry laporan jadwal otomatis untuk jadwal baru
        try {
          const ScheduleReportService = await import('../../services/ScheduleReportService');
          const reportData = {
            title: `Jadwal Baru ${jadwalData.namaKelas} - ${jadwalData.namaMataPelajaran}`,
            jurusan: jadwalData.jurusan || (jadwalData.namaKelas.includes('TKJ') ? 'TKJ' : 'TKR'),
            periode: `${jadwalData.tahunAjaran} ${jadwalData.semester}`,
            description: `Jadwal baru ${jadwalData.namaMataPelajaran} untuk kelas ${jadwalData.namaKelas} telah ditambahkan oleh ${userTitle} ${userName}`,
            schedules: [jadwalData],
            scheduleCount: 1,
            createdBy: user?.id || 'system',
            submittedBy: user?.id,
            submittedByName: userName
          };
          
          await ScheduleReportService.createScheduleReport(reportData);
          console.log('📋 Laporan jadwal baru otomatis telah dibuat');
        } catch (reportError) {
          console.error('⚠️ Gagal membuat laporan otomatis:', reportError);
        }
      }

      setShowAddModal(false);
      resetForm();
      await fetchSchedules();
    } catch (error) {
      
      Alert.alert('Error', 'Gagal menyimpan jadwal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = (dayOfWeek = null, jamKe = null, waktu = null) => {
    resetForm();
    
    // Auto-set jurusan for prodi users
    let userJurusan = null;
    let initialJurusan = '';
    let initialKelas = '';
    
    if (user?.userType === 'prodi') {
      // Try multiple ways to get jurusan for prodi
      userJurusan = user?.jurusan || user?.kodeProdi || user?.programStudi;
      
      // If still no jurusan, try to detect from user name
      if (!userJurusan && user?.namaLengkap) {
        const namaLower = user.namaLengkap.toLowerCase();
        if (namaLower.includes('tkr') || namaLower.includes('kendaraan')) {
          userJurusan = 'TKR';
        } else if (namaLower.includes('tkj') || namaLower.includes('komputer') || namaLower.includes('jaringan')) {
          userJurusan = 'TKJ';
        }
      }
      
      if (userJurusan) {
        initialJurusan = userJurusan;
        initialKelas = selectedKelas || '';
      }
    } else if (dayOfWeek && jamKe && selectedKelas) {
      if (selectedKelas.includes('TKJ')) {
        initialJurusan = 'TKJ';
      } else if (selectedKelas.includes('TKR')) {
        initialJurusan = 'TKR';
      }
      initialKelas = selectedKelas;
    }
    
    if (dayOfWeek) {
      updateAvailableJam(dayOfWeek);
    }
    
    setFormData({
      ...formData,
      hari: dayOfWeek || '',
      jamKe: jamKe || '',
      jamMulai: waktu ? waktu.split(' - ')[0] : '',
      jamSelesai: waktu ? waktu.split(' - ')[1] : '',
      namaKelas: initialKelas,
      jurusan: initialJurusan
    });
    
    // Set available kelas based on jurusan
    if (initialJurusan) {
      const staticData = getStaticClassData();
      const newKelasList = staticData.kelas[initialJurusan] || [];
      setAvailableKelas(newKelasList);
    }
    
    setShowAddModal(true);
  };

  const handleDeleteAllSchedules = () => {
    // Batasi prodi untuk menghapus hanya jadwal jurusan mereka
    if (user?.userType === 'prodi') {
      return handleDeleteJurusanSchedules();
    }
    
    Alert.alert(
      'Konfirmasi Hapus Semua',
      'Apakah Anda yakin ingin menghapus SEMUA data jadwal? Tindakan ini tidak dapat dibatalkan.',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const deletedCount = await JadwalService.deleteAllJadwal();
              Alert.alert('Sukses', `Berhasil menghapus ${deletedCount} data jadwal`);
              const userName = user?.namaLengkap || user?.username || (user?.userType === 'prodi' ? 'Prodi' : 'Admin');
              const userJurusan = user?.jurusan || user?.kodeProdi || '';
              const userTitle = user?.userType === 'prodi' ? `Prodi ${userJurusan}` : 'Admin';
              createNotification('admin', `Semua data jadwal telah dihapus oleh ${userTitle} ${userName}.`);
              fetchSchedules(); // Refresh data
            } catch (error) {
              
              Alert.alert('Error', 'Gagal menghapus semua data jadwal');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteJurusanSchedules = () => {
    // Fitur ini khusus untuk prodi - deteksi jurusan prodi
    if (user?.userType !== 'prodi') {
      Alert.alert('Error', 'Fitur hapus jadwal jurusan hanya tersedia untuk prodi');
      return;
    }
    
    const userJurusan = detectProdiJurusan(user);
    if (!userJurusan) {
      Alert.alert('Error', 'Tidak dapat mendeteksi jurusan Anda. Pastikan profil prodi sudah lengkap.');
      return;
    }
    
    Alert.alert(
      'Hapus Semua Jadwal',
      `Sebagai Prodi ${userJurusan}, Anda akan menghapus SEMUA jadwal jurusan ${userJurusan} (semua kelas ${userJurusan}). Tindakan ini tidak dapat dibatalkan.\n\nLanjutkan?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: `Hapus Semua ${userJurusan}`,
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const userName = user?.namaLengkap || user?.username || 'Prodi';
              const prodiTitle = `Prodi ${userJurusan}`;
              
              const result = await JadwalService.deleteJadwalByJurusan(userJurusan, prodiTitle);
              
              if (result.success) {
                Alert.alert('Sukses', result.message);
                
                // Kirim notifikasi ke admin
                const adminMessage = `${prodiTitle} ${userName} telah menghapus ${result.deletedCount} jadwal jurusan ${userJurusan}.`;
                createNotification('admin', adminMessage);
                
                // Kirim notifikasi ke guru yang mengajar di jurusan tersebut
                try {
                  console.log(`📧 Mengirim notifikasi hapus jadwal ke guru ${userJurusan}`);
                  const GuruService = await import('../../services/GuruService');
                  const allGurus = await GuruService.default.getAllGuru();
                  
                  // Filter guru yang mengajar di jurusan yang dihapus berdasarkan deleted schedules
                  const affectedGuruIds = new Set();
                  result.deletedSchedules.forEach(schedule => {
                    if (schedule.guruId && schedule.guruId !== '-') {
                      affectedGuruIds.add(schedule.guruId);
                    }
                  });
                  
                  const affectedGurus = allGurus.filter(guru => affectedGuruIds.has(guru.id));
                  console.log('👨‍🏫 Ditemukan', affectedGurus.length, `guru yang terpengaruh`);
                  
                  const guruMessage = `📚 Semua jadwal mengajar Anda untuk jurusan ${userJurusan} telah dihapus oleh ${prodiTitle} ${userName}. Silakan tunggu jadwal baru.`;
                  
                  let guruSuccessCount = 0;
                  let guruErrorCount = 0;
                  
                  for (const guru of affectedGurus) {
                    try {
                      await createNotification(guru.id, guruMessage);
                      console.log('✅ Berhasil kirim notifikasi hapus jurusan ke guru:', guru.namaLengkap);
                      guruSuccessCount++;
                    } catch (notifError) {
                      console.error('❌ Gagal kirim notifikasi hapus jurusan ke guru:', guru.namaLengkap, notifError);
                      guruErrorCount++;
                    }
                  }
                  
                  console.log(`📊 Notifikasi Guru Hapus Jurusan - Berhasil: ${guruSuccessCount}, Gagal: ${guruErrorCount}`);
                } catch (error) {
                  console.error('🚨 Error saat mengirim notifikasi hapus jurusan ke guru:', error);
                }
                
                // Kirim notifikasi ke semua murid di jurusan tersebut
                try {
                  console.log(`🗑️ Mengirim notifikasi hapus jadwal jurusan ${userJurusan}`);
                  const MuridService = await import('../../services/MuridService');
                  const allStudents = await MuridService.default.getAllMurid();
                  const jurusanStudents = allStudents.filter(student => 
                    student.jurusan === userJurusan || 
                    (student.namaKelas && student.namaKelas.includes(userJurusan))
                  );
                  
                  console.log('👥 Ditemukan', jurusanStudents.length, `murid ${userJurusan} untuk notifikasi`);
                  
                  const studentMessage = `🗑️ Semua jadwal jurusan ${userJurusan} telah dihapus oleh ${prodiTitle} ${userName}. Silakan tunggu jadwal baru.`;
                  
                  let successCount = 0;
                  let errorCount = 0;
                  
                  for (const student of jurusanStudents) {
                    try {
                      await createNotification(student.id, studentMessage);
                      console.log('✅ Berhasil kirim notifikasi hapus jurusan ke:', student.namaLengkap);
                      successCount++;
                    } catch (notifError) {
                      console.error('❌ Gagal kirim notifikasi hapus jurusan ke:', student.namaLengkap, notifError);
                      errorCount++;
                    }
                  }
                  
                  console.log(`📊 Notifikasi Hapus Jurusan - Berhasil: ${successCount}, Gagal: ${errorCount}`);
                  if (successCount > 0) {
                    Alert.alert('Info', `Notifikasi berhasil dikirim ke ${successCount} murid ${userJurusan}`);
                  }
                } catch (error) {
                  console.error('🚨 Error saat mengirim notifikasi hapus jurusan:', error);
                }
                
                fetchSchedules(); // Refresh data
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('❌ Error saat hapus jadwal jurusan:', error);
              Alert.alert('Error', 'Gagal menghapus jadwal jurusan');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };


  const handleDeleteSchedule = async (schedule) => {
    // Validasi permission menggunakan helper function
    if (!canEditDeleteSchedule(user, schedule)) {
      const userJurusan = detectProdiJurusan(user);
      Alert.alert('Error', userJurusan ? `Anda hanya dapat menghapus jadwal kelas ${userJurusan}` : 'Anda tidak memiliki izin untuk menghapus jadwal ini');
      return;
    }
    
    Alert.alert(
      'Hapus Jadwal',
      `Apakah Anda yakin ingin menghapus jadwal ${schedule.namaMataPelajaran} untuk kelas ${schedule.namaKelas} pada hari ${schedule.hari} jam ke-${schedule.jamKe}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              await JadwalService.deleteJadwal(schedule.id);
              
              const userName = user?.namaLengkap || user?.username || (user?.userType === 'prodi' ? 'Prodi' : 'Admin');
              const userJurusan = user?.jurusan || user?.kodeProdi || '';
              const userTitle = user?.userType === 'prodi' ? `Prodi ${userJurusan}` : 'Admin';
              const adminMessage = `Jadwal ${schedule.namaMataPelajaran} untuk Kelas ${schedule.namaKelas} pada hari ${schedule.hari} jam ke-${schedule.jamKe} telah dihapus oleh ${userTitle} ${userName}.`;
              createNotification('admin', adminMessage);
              
              // Jadwal dihapus dan akan masuk laporan untuk persetujuan admin
              // Tidak langsung mengirim notifikasi ke murid dan guru
              
              console.log('🗑️ Jadwal berhasil dihapus dan menunggu persetujuan admin untuk notifikasi ke murid dan guru');
              
              // Optional: Buat entry laporan jadwal otomatis untuk penghapusan
              try {
                const ScheduleReportService = await import('../../services/ScheduleReportService');
                const reportData = {
                  title: `Penghapusan Jadwal ${schedule.namaKelas} - ${schedule.namaMataPelajaran}`,
                  jurusan: schedule.jurusan || (schedule.namaKelas.includes('TKJ') ? 'TKJ' : 'TKR'),
                  periode: `${schedule.tahunAjaran || '2024/2025'} ${schedule.semester || 'Ganjil'}`,
                  description: `Jadwal ${schedule.namaMataPelajaran} untuk kelas ${schedule.namaKelas} pada hari ${schedule.hari} jam ke-${schedule.jamKe} telah dihapus oleh ${userTitle} ${userName}`,
                  schedules: [],
                  scheduleCount: 0,
                  deletedSchedule: schedule,
                  createdBy: user?.id || 'system',
                  submittedBy: user?.id,
                  submittedByName: userName
                };
                
                await ScheduleReportService.createScheduleReport(reportData);
                console.log('📋 Laporan penghapusan jadwal otomatis telah dibuat');
              } catch (reportError) {
                console.error('⚠️ Gagal membuat laporan penghapusan otomatis:', reportError);
              }
              
              setShowAddModal(false);
              resetForm();
              await fetchSchedules();
              
              Alert.alert('Sukses', 'Jadwal berhasil dihapus!');
            } catch (error) {
              console.error('❌ Error saat hapus jadwal:', error);
              Alert.alert('Error', 'Gagal menghapus jadwal');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };


  const openEditModal = (schedule) => {
    // Validasi permission menggunakan helper function
    if (!canEditDeleteSchedule(user, schedule)) {
      const userJurusan = detectProdiJurusan(user);
      Alert.alert('Error', userJurusan ? `Anda hanya dapat mengedit jadwal kelas ${userJurusan}` : 'Anda tidak memiliki izin untuk mengedit jadwal ini');
      return;
    }
    
    setEditingSchedule(schedule);
    const isSpecial = schedule.jenisAktivitas !== 'pembelajaran';
    setIsSpecialActivity(isSpecial);

    updateAvailableJam(schedule.hari);

    let jurusan = '';
    if (schedule.namaKelas?.includes('TKJ')) {
      jurusan = 'TKJ';
    } else if (schedule.namaKelas?.includes('TKR')) {
      jurusan = 'TKR';
    }

    setFormData({
      namaMataPelajaran: schedule.namaMataPelajaran || '',
      namaGuru: schedule.namaGuru || '',
      guruId: schedule.guruId || '',
      jurusan: jurusan,
      namaKelas: schedule.namaKelas || '',
      hari: schedule.hari || '',
      jamKe: schedule.jamKe || '',
      jamMulai: schedule.jamMulai || '',
      jamSelesai: schedule.jamSelesai || '',
      ruangKelas: schedule.ruangKelas || '',
      jenisAktivitas: schedule.jenisAktivitas || 'pembelajaran',
    });

    if (!isSpecial && schedule.guruId) {
      const guru = guruList.find(g => g.id === schedule.guruId);
      if (guru) {
        setSelectedGuru(guru);
        setAvailableMapel(guru.mataPelajaran || []);
        setAvailableKelas(guru.kelasAmpu || []);
      }
    }

    setShowAddModal(true);
  };


  const renderWeekDays = () => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const dayViews = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + i);
      dayViews.push(
        <View key={days[i]} style={styles.dayHeaderCell}>
          <Text style={styles.dayHeaderText}>{days[i]}</Text>
          <Text style={styles.dateHeaderText}>{`${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`}</Text>
        </View>
      );
    }
    return dayViews;
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Memuat Jadwal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>
              {user?.userType === 'prodi' ? `Kelola Jadwal Program Studi ${selectedJurusan || 'Loading...'}` : 'Pilih Kriteria'}
            </Text>
        </View>
        <View style={styles.pickerRow}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Jurusan</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedJurusan}
                onValueChange={(itemValue) => setSelectedJurusan(itemValue)}
                style={styles.picker}
                enabled={jurusanList.length > 0 && user?.userType !== 'prodi'}
              >
                {jurusanList.map(jurusan => <Picker.Item key={jurusan} label={jurusan} value={jurusan} />)}
              </Picker>
            </View>
          </View>
          <View style={[styles.pickerContainer, { flex: 1.2 }]}>
            <Text style={styles.pickerLabel}>Kelas</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedKelas}
                onValueChange={(itemValue) => setSelectedKelas(itemValue)}
                style={styles.picker}
                enabled={kelasList.length > 0}
              >
                {kelasList.map(kelas => <Picker.Item key={kelas} label={kelas} value={kelas} />)}
              </Picker>
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={processDataForTable}>
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekNavigator}>
        <TouchableOpacity onPress={() => changeWeek(-1)}>
          <Ionicons name="chevron-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.weekText}>
          {`${weekStartDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} Ke ${new Date(new Date(weekStartDate).setDate(weekStartDate.getDate() + 4)).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
        </Text>
        <TouchableOpacity onPress={() => changeWeek(1)}>
          <Ionicons name="chevron-forward" size={24} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.tableHeader}>
            <View style={styles.timeHeaderCell}>
              <Text style={styles.timeHeaderText}>Waktu</Text>
            </View>
            {renderWeekDays()}
          </View>
          {isFiltering ? (
            <ActivityIndicator style={{marginTop: 20}} size="large" color="#1E3A8A" />
          ) : tableData.length === 0 ? (
            <View style={styles.emptyDataContainer}>
                <Ionicons name="calendar-outline" size={60} color="#ccc" />
                <Text style={styles.emptyDataText}>Jadwal untuk kelas {selectedKelas} tidak ditemukan.</Text>
            </View>
          ) : (
            <View>
              {tableData.map(rowData => (
                <View key={rowData.jamKe} style={styles.tableRow}>
                  <View style={styles.timeCell}>
                    <Text style={styles.jamKeText}>Jam ke-{rowData.jamKe}</Text>
                    <Text style={styles.waktuText}>{rowData.waktu}</Text>
                  </View>
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => (
                    <Pressable 
                      key={day} 
                      style={({ pressed }) => [
                        styles.scheduleCell,
                        pressed && !rowData[day] && styles.scheduleCellPressed
                      ]}
                      onPress={() => {
                        if (rowData[day]) {
                          openEditModal(rowData[day]);
                        } else {
          // Prevent kaprodi from adding new schedules
          if (isKapordiUser(user)) {
            Alert.alert('Akses Ditolak', 'Anda tidak memiliki izin untuk menambah jadwal baru.');
            return;
          }
                          openAddModal(day, rowData.jamKe, rowData.waktu);
                        }
                      }}
                    >
                      {({ pressed }) => (
                        <>
                          {rowData[day] ? (
                            <View style={[styles.scheduleItem, {backgroundColor: getScheduleItemColor(rowData[day])}]}>
                              <View style={styles.scheduleItemHeader}>
                                <Text style={[styles.subjectText, {color: getTextColor(rowData[day])}]} numberOfLines={1}>{rowData[day].namaMataPelajaran || 'Mata Pelajaran Tidak Diketahui'}</Text>
                                {rowData[day].mapelGuruId && (
                                  <View style={[styles.idBadge, {backgroundColor: getTextColor(rowData[day]) === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}]}>
                                    <Text style={[styles.idBadgeText, {color: getTextColor(rowData[day])}]}>{rowData[day].mapelGuruId}</Text>
                                  </View>
                                )}
                              </View>
                              {rowData[day].jenisAktivitas === 'pembelajaran' && (
                                <>
                                  <Text style={[styles.teacherText, {color: getTextColor(rowData[day])}]} numberOfLines={1}>
                                    {rowData[day].namaGuru || 'Guru Tidak Diketahui'}
                                    {rowData[day].guruId && rowData[day].guruId !== '-' && (
                                      <Text style={[styles.guruIdText, {color: getTextColor(rowData[day])}]}> ({rowData[day].guruId.substring(0, 8)}...)</Text>
                                    )}
                                  </Text>
                                  <Text style={[styles.roomText, {color: getTextColor(rowData[day])}]}>Ruang: {rowData[day].ruangKelas || 'Ruang Tidak Diketahui'}</Text>
                                </>
                              )}
                            </View>
                          ) : (
                            <View style={[
                              styles.noScheduleItem,
                              pressed && styles.noScheduleItemPressed
                            ]}>
                              {user?.role !== 'kaprodi' ? (
                                <>
                                  <Ionicons 
                                    name="add-circle-outline" 
                                    size={20} 
                                    color={pressed ? "#1D4ED8" : "#3B82F6"} 
                                  />
                                  <Text style={[
                                    styles.noScheduleText,
                                    pressed && styles.noScheduleTextPressed
                                  ]}>Tambah Jadwal</Text>
                                </>
                              ) : (
                                <>
                                  <Ionicons 
                                    name="eye-outline" 
                                    size={20} 
                                    color="#9CA3AF" 
                                  />
                                  <Text style={[
                                    styles.noScheduleText,
                                    { color: '#9CA3AF' }
                                  ]}>Tidak Ada Jadwal</Text>
                                </>
                              )}
                            </View>
                          )}
                        </>
                      )}
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      </ScrollView>

{/* Floating Action Buttons Container */}
      <View style={styles.fabContainer}>
        {/* Tombol hapus jadwal - untuk admin (semua) dan prodi (jurusan saja) */}
        {!isKapordiUser(user) && (
          <TouchableOpacity 
            style={[styles.fab, styles.fabDanger]} 
            onPress={handleDeleteAllSchedules}
          >
          <Ionicons 
            name={user?.userType === 'prodi' ? "library" : "trash"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
        )}

        {!isKapordiUser(user) && (
          <TouchableOpacity 
            style={[styles.fab, styles.fabPrimary]} 
            onPress={openAddModal}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Add Schedule Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowAddModal(false)}
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Nama Guru - Hidden for special activities */}
            {!isSpecialActivity && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pilih Guru *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.guruId}
                    onValueChange={handleGuruChange}
                    style={styles.formPicker}
                  >
                    <Picker.Item label="Pilih Guru" value="" />
                    {guruList.map(guru => 
                      <Picker.Item 
                        key={guru.id} 
                        label={`${guru.namaLengkap} - ${guru.mataPelajaran ? guru.mataPelajaran.join(', ') : 'No Subject'}`} 
                        value={guru.id} 
                      />
                    )}
                  </Picker>
                </View>
              </View>
            )}

            {/* Mata Pelajaran - Auto populated or special activity */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mata Pelajaran *</Text>
              {isSpecialActivity ? (
                <View style={styles.specialActivityDisplay}>
                  <Text style={styles.specialActivityText}>{formData.namaMataPelajaran}</Text>
                  <Text style={styles.specialActivitySubtext}>Aktivitas Khusus</Text>
                </View>
              ) : (
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.namaMataPelajaran}
                    onValueChange={(itemValue) => setFormData({...formData, namaMataPelajaran: itemValue})}
                    style={styles.formPicker}
                    enabled={availableMapel.length > 0}
                  >
                    <Picker.Item label={availableMapel.length > 0 ? "Pilih Mata Pelajaran" : "Pilih guru terlebih dahulu"} value="" />
                    {availableMapel.map(mapel => 
                      <Picker.Item key={mapel} label={mapel} value={mapel} />
                    )}
                  </Picker>
                </View>
              )}
              {selectedGuru && !isSpecialActivity && (
                <Text style={styles.helperText}>
                  Guru: {selectedGuru.namaLengkap}
                </Text>
              )}
            </View>

            {/* Jurusan */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Jurusan *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.jurusan}
                  onValueChange={handleJurusanChange}
                  style={styles.formPicker}
                  enabled={user?.userType !== 'prodi'}
                >
                  <Picker.Item label="Pilih Jurusan" value="" />
                  {jurusanList.map(jurusan => (
                    <Picker.Item 
                      key={jurusan}
                      label={`${jurusan} (${jurusan === 'TKJ' ? 'Teknik Komputer dan Jaringan' : 'Teknik Kendaraan Ringan'})`} 
                      value={jurusan} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Kelas */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Kelas *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.namaKelas}
                  onValueChange={(itemValue) => setFormData({...formData, namaKelas: itemValue})}
                  style={styles.formPicker}
                  enabled={isSpecialActivity || availableKelas.length > 0}
                >
                  <Picker.Item 
                    label={isSpecialActivity ? "Pilih Kelas" : (availableKelas.length > 0 ? "Pilih Kelas" : "Pilih jurusan/guru terlebih dahulu")} 
                    value="" 
                  />
                  {isSpecialActivity ? (
                    jurusanList.map(jurusan => 
                      getStaticClassData().kelas[jurusan]?.map(kelas => 
                        <Picker.Item key={kelas} label={kelas} value={kelas} />
                      )
                    ).flat()
                  ) : (
                    (selectedGuru ? availableKelas : getStaticClassData().kelas[formData.jurusan] || []).map(kelas => 
                      <Picker.Item key={kelas} label={kelas} value={kelas} />
                    )
                  )}
                </Picker>
              </View>
              {isSpecialActivity && (
                <Text style={styles.specialHelperText}>
                  Aktivitas khusus: {formData.namaMataPelajaran} - Guru tidak wajib
                </Text>
              )}
              {selectedGuru && !isSpecialActivity && availableKelas.length > 0 && (
                <Text style={styles.helperText}>
                  Kelas yang diampu: {availableKelas.join(', ')}
                </Text>
              )}
            </View>

            {/* Row: Hari dan Jam Ke */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Hari *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.hari}
                    onValueChange={handleHariChange}
                    style={styles.formPicker}
                  >
                    <Picker.Item label="Pilih Hari" value="" />
                    <Picker.Item label="Senin" value="Senin" />
                    <Picker.Item label="Selasa" value="Selasa" />
                    <Picker.Item label="Rabu" value="Rabu" />
                    <Picker.Item label="Kamis" value="Kamis" />
                    <Picker.Item label="Jumat" value="Jumat" />
                  </Picker>
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Jam Ke *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.jamKe}
                    onValueChange={handleJamKeChange}
                    style={styles.formPicker}
                    enabled={availableJamList.length > 0}
                  >
                    <Picker.Item 
                      label={availableJamList.length > 0 ? "Pilih Jam" : "Pilih hari terlebih dahulu"} 
                      value="" 
                    />
                    {availableJamList.map(jam => 
                      <Picker.Item 
                        key={jam.key} 
                        label={`${jam.label} (${jam.jamMulai} - ${jam.jamSelesai})`} 
                        value={jam.key} 
                      />
                    )}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Row: Jam Mulai dan Jam Selesai - Auto filled */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Jam Mulai *</Text>
                <View style={styles.timeDisplayContainer}>
                  <Text style={styles.timeDisplayText}>
                    {formData.jamMulai || 'Pilih jam ke terlebih dahulu'}
                  </Text>
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Jam Selesai *</Text>
                <View style={styles.timeDisplayContainer}>
                  <Text style={styles.timeDisplayText}>
                    {formData.jamSelesai || 'Pilih jam ke terlebih dahulu'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Ruang Kelas - Dropdown */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Ruang Kelas {isSpecialActivity ? '(Opsional)' : '*'}
              </Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.ruangKelas}
                  onValueChange={(itemValue) => setFormData({...formData, ruangKelas: itemValue})}
                  style={styles.formPicker}
                >
                  <Picker.Item label="Pilih Ruang Kelas" value="" />
                  
                  {/* Kelas sebagai ruangan (prioritas utama) */}
                  <Picker.Item label={`--- ${formData.namaKelas || 'Kelas'} ---`} value={formData.namaKelas} enabled={!!formData.namaKelas} />
                  
                  {/* Separator */}
                  <Picker.Item label="--- Ruangan Lain ---" value="" enabled={false} />
                  
                  {/* Ruangan lain */}
                  {getRuangKelasData().ruanganLain.map(ruang => 
                    <Picker.Item key={ruang.nama} label={ruang.nama} value={ruang.nama} />
                  )}
                </Picker>
              </View>
              {isSpecialActivity && (
                <Text style={styles.optionalHelperText}>
                  Untuk aktivitas khusus, ruang kelas bersifat opsional
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtonContainer}>
              {editingSchedule && !isKapordiUser(user) && (
                <TouchableOpacity 
                  style={[styles.deleteButton, isSubmitting && styles.deleteButtonDisabled]}
                  onPress={() => handleDeleteSchedule(editingSchedule)}
                  disabled={isSubmitting}
                >
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.deleteButtonText}>Hapus</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSaveSchedule}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>{editingSchedule ? 'Update' : 'Simpan'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#1E3A8A',
  },
  filterCard: {
    backgroundColor: '#fff',
    padding: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1E293B',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1D4ED8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontFamily: 'Nunito_600SemiBold',
    marginLeft: 6,
    fontSize: 14,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flex: 1,
    marginRight: 8,
  },
  pickerLabel: {
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  pickerWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    height: 44,
  },
  picker: {
    width: '100%',
    color: '#1e293b',
  },
  searchButton: {
    backgroundColor: '#1D4ED8',
    width: 44, // Square button
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginLeft: 8,
  },
  weekNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  weekText: {
    fontFamily: getSafeFont('Nunito_700Bold'),
    fontSize: 16,
    color: '#1E3A8A',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
  },
  dayHeaderCell: {
    width: CELL_WIDTH,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5E1',
  },
  dayHeaderText: {
    fontFamily: getSafeFont('Nunito_700Bold'),
    fontSize: 14,
    color: '#1E293B',
  },
  dateHeaderText: {
    fontFamily: getSafeFont('Nunito_400Regular'),
    fontSize: 12,
    color: '#475569',
  },
  timeHeaderCell: {
    width: 100,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
    borderTopLeftRadius: 8,
  },
  timeHeaderText: {
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  timeCell: {
    width: 100,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  jamKeText: {
    fontFamily: getSafeFont('Nunito_700Bold'),
    fontSize: 14,
    color: '#334155',
  },
  waktuText: {
    fontFamily: getSafeFont('Nunito_400Regular'),
    fontSize: 12,
    color: '#64748B',
  },
  scheduleCell: {
    width: CELL_WIDTH,
    padding: 8,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    minHeight: 80,
  },
  scheduleCellPressed: {
    backgroundColor: '#F1F5F9',
    transform: [{ scale: 0.98 }],
  },
  scheduleItem: {
    backgroundColor: '#E0E7FF',
    borderRadius: 6,
    padding: 8,
    flex: 1,
  },
  scheduleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  idBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    marginLeft: 4,
  },
  idBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  subjectText: {
    fontFamily: getSafeFont('Nunito_700Bold'),
    fontSize: 13,
    color: '#3730A3',
    flex: 1,
  },
  teacherText: {
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    fontSize: 12,
    color: '#4338CA',
    marginVertical: 2,
  },
  guruIdText: {
    fontFamily: getSafeFont('Nunito_400Regular'),
    fontSize: 10,
    fontStyle: 'italic',
  },
  roomText: {
    fontFamily: getSafeFont('Nunito_400Regular'),
    fontSize: 11,
    color: '#64748B',
  },
  noScheduleItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 8,
    transition: 'all 0.2s ease',
  },
  noScheduleText: {
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    fontSize: 10,
    color: '#3B82F6',
    marginTop: 4,
    textAlign: 'center',
  },
  noScheduleItemPressed: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
    transform: [{ scale: 0.95 }],
  },
  noScheduleTextPressed: {
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  emptyDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    width: width,
  },
  emptyDataText: {
    marginTop: 16,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center'
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  fabPrimary: {
    backgroundColor: '#1D4ED8',
  },
  fabDanger: {
    backgroundColor: '#DC2626',
  },
  fabJurusan: {
    backgroundColor: '#7C3AED',
  },
  fabGenerate: {
    backgroundColor: '#F59E0B',
  },
  fabDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  formLabel: {
    fontSize: 14,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#1F2937',
  },
  formPicker: {
    color: '#1F2937',
    fontFamily: getSafeFont('Nunito_400Regular'),
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    minHeight: 50,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: getSafeFont('Nunito_700Bold'),
    marginLeft: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  helperText: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#059669',
    marginTop: 4,
  },
  specialActivityDisplay: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  specialActivityText: {
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: '#92400E',
  },
  specialActivitySubtext: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#A16207',
    marginTop: 2,
  },
  timeDisplayContainer: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  timeDisplayText: {
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#6B7280',
  },
  specialHelperText: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#F59E0B',
    marginTop: 4,
  },
  optionalHelperText: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Generate Modal Styles
  jurusanCheckboxContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  jurusanCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  jurusanCheckboxActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
  },
  jurusanCheckboxText: {
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: '#374151',
    marginLeft: 8,
  },
  prodiInfo: {
    backgroundColor: '#EBF4FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  prodiInfoText: {
    fontSize: 14,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: '#1D4ED8',
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkboxContainerActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
  },
  checkboxText: {
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: '#374151',
    marginLeft: 8,
  },
  generateActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  previewButton: {
    flex: 1,
    backgroundColor: '#EBF4FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  previewButtonText: {
    color: '#1D4ED8',
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    marginLeft: 8,
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    marginLeft: 8,
  },
  // Modal Button Container Styles
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  deleteButton: {
    flex: 0.35,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    minHeight: 50,
  },
  deleteButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
    shadowOpacity: 0,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: getSafeFont('Nunito_700Bold'),
    marginLeft: 6,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
