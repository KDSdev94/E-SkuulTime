import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeStatusBar } from '../../utils/statusBarUtils';
import { Picker } from '@react-native-picker/picker';
import RegistrationService from '../../services/RegistrationService';
import MuridService from '../../services/MuridService';
import GuruService from '../../services/GuruService';
import MataPelajaranService from '../../services/MataPelajaranService';
import KelasJurusanService from '../../services/KelasJurusanService';
import JadwalService from '../../services/JadwalService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import TopBar from './dashboard_components/TopBar';
import PermissionService from '../../services/PermissionService';
import LaporanService from '../../services/LaporanService';
import LaporanJadwalServiceClass from '../../services/LaporanJadwalService';
import ExportService from '../../services/ExportService';

// Create instance of LaporanJadwalService
const LaporanJadwalService = new LaporanJadwalServiceClass();

const { width } = Dimensions.get('window');

// Jenis-jenis laporan yang tersedia
const REPORT_TYPES = [
  {
    id: 'penjadwalan',
    title: 'Laporan Penjadwalan',
    titleKaprodi: 'Review Jadwal',
    description: 'Status persetujuan jadwal dari kaprodi',
    descriptionKaprodi: 'Review dan persetujuan jadwal kelas',
    icon: 'document-text-outline',
    color: '#EC4899',
    gradientColors: ['#EC4899', '#F472B6'],
  },
  {
    id: 'data_pengguna',
    title: 'Laporan Data Pengguna',
    description: 'Data guru, murid, dan kaprodi',
    icon: 'people-outline',
    color: '#3B82F6',
    gradientColors: ['#3B82F6', '#60A5FA'],
  },
  {
    id: 'data_master',
    title: 'Laporan Data Master',
    description: 'Data mata pelajaran, kelas dan jurusan',
    icon: 'library-outline',
    color: '#10B981',
    gradientColors: ['#10B981', '#34D399'],
  },
];

const ReportCard = ({ item, onPress, userRole }) => {
  const isKaprodi = userRole && (userRole === 'kaprodi_tkj' || userRole === 'kaprodi_tkr' || userRole.includes('kaprodi'));
  
  // Use different title and description for kaprodi
  const displayTitle = isKaprodi && item.titleKaprodi ? item.titleKaprodi : item.title;
  const displayDescription = isKaprodi && item.descriptionKaprodi ? item.descriptionKaprodi : item.description;
  
  return (
    <TouchableOpacity 
      style={[styles.reportCard, { borderLeftColor: item.color }]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <LinearGradient
          colors={item.gradientColors}
          style={styles.iconContainer}
        >
          <Ionicons name={item.icon} size={24} color="#fff" />
        </LinearGradient>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{displayTitle}</Text>
          <Text style={styles.cardDescription}>{displayDescription}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );
};

export default function LaporanPageNew({ onGoBack, onOpenSidebar }) {
  const navigation = useNavigation(); // Add navigation hook for standalone usage
  const isStandalone = !onGoBack; // Determine if this is used as standalone page
  
  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [selectedJurusan, setSelectedJurusan] = useState(''); // For filtering penjadwalan by jurusan
  const [jurusanList, setJurusanList] = useState(['TKJ', 'TKR']); // Available jurusan
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReportType, setDeleteReportType] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingScheduleId, setRejectingScheduleId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);
  const [selectedUserDataFilter, setSelectedUserDataFilter] = useState(''); // For filtering data pengguna by type

  // Load user role on component mount
  useFocusEffect(
    useCallback(() => {
      const loadUserRole = async () => {
        try {
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const user = JSON.parse(userData);
            setUserRole(user.role);
            
            // Auto-redirect Kaprodi to penjadwalan report (simplified)
            const isKaprodi = user.role === 'kaprodi_tkj' || user.role === 'kaprodi_tkr' || (user.role && user.role.includes('kaprodi'));
            if (isKaprodi) {
              const penjadwalanReport = REPORT_TYPES.find(report => report.id === 'penjadwalan');
              if (penjadwalanReport) {
                // Directly set the report without opening modal
                setSelectedReport(penjadwalanReport);
                setIsDetailModalVisible(true);
                loadReportData('penjadwalan');
              }
            }
          }
        } catch (error) {
          console.error('Error loading user role:', error);
        }
      };
      loadUserRole();
    }, [])
  );


  const loadReportData = async (reportType) => {
    try {
      setLoading(true);
      let data = {};

      switch (reportType) {

        case 'penjadwalan':
          const penjadwalanStats = await LaporanJadwalService.getStatistics();
          let penjadwalanList = await LaporanJadwalService.getAllLaporanJadwal();
          
          // Role-based filtering for kaprodi users
          const isKaprodiTKJ = userRole === 'kaprodi_tkj';
          const isKaprodiTKR = userRole === 'kaprodi_tkr';
          const isKaprodi = isKaprodiTKJ || isKaprodiTKR || (userRole && userRole.includes('kaprodi'));
          
          // For Kaprodi users, force the filter department based directly on role regardless of selectedJurusan
          const filterJurusan = isKaprodiTKJ ? 'TKJ' : isKaprodiTKR ? 'TKR' : selectedJurusan;
          
          // Apply filtering based on the determined filter department
          if (filterJurusan) {
            penjadwalanList = penjadwalanList.filter(item => 
              item.jurusan === filterJurusan || 
              (item.kelas && item.kelas.includes(filterJurusan))
            );
          }
          
          // Update the selectedJurusan state for UI consistency if it differs for Kaprodi
          if (isKaprodi && selectedJurusan !== filterJurusan) {
            setSelectedJurusan(filterJurusan);
          }
          
          data = {
            stats: penjadwalanStats,
            list: penjadwalanList,
            type: 'Laporan Penjadwalan',
            showJurusanFilter: !isKaprodi, // Hide filter for kaprodi users since it's auto-set
            isKaprodiFiltered: isKaprodi,
            kaprodiDepartment: isKaprodiTKJ ? 'TKJ' : isKaprodiTKR ? 'TKR' : null
          };
          break;

        case 'data_pengguna':
          // Mengambil data pengguna: guru, murid, dan admin/kaprodi
          const [
            guruListPengguna,
            muridListPengguna,
            adminListPengguna
          ] = await Promise.all([
            GuruService.getAllGuru(),
            MuridService.getAllMurid(),
            (async () => {
              try {
                const AdminService = (await import('../../services/AdminService')).default;
                const adminData = await AdminService.getAllAdmin();
                return adminData.filter(admin => 
                  admin.role === 'kaprodi_tkj' || admin.role === 'kaprodi_tkr' || admin.role === 'admin'
                );
              } catch (error) {
                console.error('Error loading admin data:', error);
                return [];
              }
            })()
          ]);

          // Hitung statistik untuk data pengguna
          const guruStatsPengguna = {
            total: guruListPengguna.length,
            aktif: guruListPengguna.filter(g => g.statusAktif === 'Aktif' || !g.statusAktif).length,
            pns: guruListPengguna.filter(g => g.statusKepegawaian === 'PNS').length,
            honorer: guruListPengguna.filter(g => g.statusKepegawaian === 'Honorer').length
          };

          const muridStatsPengguna = {
            total: muridListPengguna.length,
            aktif: muridListPengguna.filter(m => m.statusSiswa === 'Aktif' || !m.statusSiswa).length,
            tkj: muridListPengguna.filter(m => m.jurusan === 'TKJ').length,
            tkr: muridListPengguna.filter(m => m.jurusan === 'TKR').length
          };

          const adminStatsPengguna = {
            total: adminListPengguna.length,
            admin: adminListPengguna.filter(a => a.role === 'admin').length,
            kaprodi_tkj: adminListPengguna.filter(a => a.role === 'kaprodi_tkj').length,
            kaprodi_tkr: adminListPengguna.filter(a => a.role === 'kaprodi_tkr').length
          };

          // Gabungkan data pengguna untuk ditampilkan dalam list
          let penggunaDataList = [
            // Data Guru
            ...guruListPengguna.map(guru => ({
              ...guru,
              dataType: 'Guru',
              primaryText: guru.namaLengkap || guru.nama || 'Guru',
              secondaryText: `NIP: ${guru.nip || '-'} • ${guru.statusKepegawaian || 'Status tidak diketahui'}`
            })),
            // Data Murid
            ...muridListPengguna.map(murid => ({
              ...murid,
              dataType: 'Murid',
              primaryText: murid.namaLengkap || murid.nama || 'Murid',
              secondaryText: `${murid.kelas || '-'} • ${murid.jurusan || '-'} • ${murid.statusSiswa || 'Aktif'}`
            })),
            // Data Kaprodi/Admin
            ...adminListPengguna.map(admin => ({
              ...admin,
              dataType: 'Kaprodi/Admin',
              primaryText: admin.namaLengkap || admin.nama || 'Admin',
              secondaryText: `${admin.role === 'kaprodi_tkj' ? 'Kaprodi TKJ' : admin.role === 'kaprodi_tkr' ? 'Kaprodi TKR' : 'Administrator'} • ${admin.email || 'Email tidak tersedia'}`
            }))
          ];

          // Filter data berdasarkan selectedUserDataFilter
          if (selectedUserDataFilter) {
            penggunaDataList = penggunaDataList.filter(item => {
              if (selectedUserDataFilter === 'Guru') {
                return item.dataType === 'Guru';
              } else if (selectedUserDataFilter === 'Murid') {
                return item.dataType === 'Murid';
              } else if (selectedUserDataFilter === 'Kaprodi/Admin') {
                return item.dataType === 'Kaprodi/Admin';
              }
              return true;
            });
          }

          data = {
            stats: {
              totalGuru: guruStatsPengguna.total,
              totalMurid: muridStatsPengguna.total,
              totalAdmin: adminStatsPengguna.total,
              totalPengguna: guruStatsPengguna.total + muridStatsPengguna.total + adminStatsPengguna.total,
              // Detail stats untuk card
              guru: guruStatsPengguna,
              murid: muridStatsPengguna,
              admin: adminStatsPengguna
            },
            list: penggunaDataList,
            type: 'Laporan Data Pengguna',
            rawData: {
              guru: guruListPengguna,
              murid: muridListPengguna,
              admin: adminListPengguna
            }
          };
          break;

        case 'data_master':
          // Mengambil data master (mata pelajaran, kelas, jurusan) - guru dan murid dipindah ke laporan data pengguna
          const [
            mataPelajaranList,
            jurusanList,
            kelasList
          ] = await Promise.all([
            MataPelajaranService.getMataPelajaranFromFirestore(),
            KelasJurusanService.getAllJurusan(),
            KelasJurusanService.getAllKelas()
          ]);

          // Debug logging untuk memeriksa data kelas
          console.log('=== DEBUG KELAS DATA ===');
          console.log('Kelas List Length:', kelasList.length);
          console.log('Kelas List Data:', kelasList);
          console.log('First Kelas Item:', kelasList[0]);
          console.log('========================');

          // Hitung statistik untuk data master saja (tanpa guru dan murid)

          const mataPelajaranStats = {
            total: mataPelajaranList.length,
            kelompok_a: mataPelajaranList.filter(m => m.kelompok === 'A').length,
            kelompok_b: mataPelajaranList.filter(m => m.kelompok === 'B').length,
            kelompok_c: mataPelajaranList.filter(m => m.kelompok === 'C').length
          };

          const jurusanStats = {
            total: jurusanList.length,
            aktif: jurusanList.filter(j => j.aktif !== false).length
          };

          const kelasStats = {
            total: kelasList.length,
            aktif: kelasList.filter(k => k.aktif !== false).length
          };

          // Gabungkan data master (tanpa guru dan murid)
          const masterDataList = [
            // Data Mata Pelajaran
            ...mataPelajaranList.map(mapel => ({
              ...mapel,
              dataType: 'Mata Pelajaran',
              primaryText: mapel.nama || 'Mata Pelajaran',
              secondaryText: `Kelompok ${mapel.kelompok || '-'} • ${mapel.kategori || '-'}`
            })),
            // Data Jurusan
            ...jurusanList.map(jurusan => ({
              ...jurusan,
              dataType: 'Jurusan',
              primaryText: jurusan.nama || 'Jurusan',
              secondaryText: `Kode: ${jurusan.kode || '-'} • ${jurusan.aktif !== false ? 'Aktif' : 'Tidak Aktif'}`
            })),
            // Data Kelas
            ...kelasList.map(kelas => ({
              ...kelas,
              dataType: 'Kelas',
              primaryText: kelas.nama || 'Kelas',
              secondaryText: `${kelas.tingkat || ''} • ${kelas.aktif !== false ? 'Aktif' : 'Tidak Aktif'}`
            }))
          ];

          data = {
            stats: {
              totalMataPelajaran: mataPelajaranStats.total,
              totalJurusan: jurusanStats.total,
              totalKelas: kelasStats.total,
              // Detail stats untuk card
              mataPelajaran: mataPelajaranStats,
              jurusan: jurusanStats,
              kelas: kelasStats
            },
            list: masterDataList,
            type: 'Laporan Data Master',
            rawData: {
              mataPelajaran: mataPelajaranList,
              jurusan: jurusanList,
              kelas: kelasList
            }
          };
          break;

        default:
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleSendJadwalToAdmin = async (jadwalId) => {
    try {
      const jadwal = await JadwalService.getJadwalById(jadwalId);
      if (jadwal) {
        const laporanData = {
          userId: userRole, // contoh userId
          kategori: 'Jadwal Kelas',
          deskripsi: `Permintaan publikasi jadwal untuk ${jadwal.namaKelas}`,
          prioritas: 'tinggi',
          dataTerkait: jadwal
        };
        await LaporanService.createLaporan(laporanData);
        Alert.alert('Sukses', 'Jadwal berhasil dikirim ke admin untuk diproses.');
      }
    } catch (error) {
      console.error('Error sending jadwal to admin:', error);
      Alert.alert('Error', 'Gagal mengirim jadwal ke admin.');
    }
  };

  // Handler untuk mengirim jadwal ke kaprodi dengan pilihan (dengan filter jurusan)
  const handleSendToKaprodi = async (laporanId) => {
    try {
      // Ambil data laporan untuk mengetahui jurusan
      const laporan = await LaporanJadwalService.getLaporanJadwalById(laporanId);
      
      if (!laporan) {
        Alert.alert('Error', 'Data laporan tidak ditemukan');
        return;
      }

      // Deteksi jurusan dari kelas atau jurusan laporan
      let detectedJurusan = '';
      if (laporan.jurusan) {
        detectedJurusan = laporan.jurusan;
      } else if (laporan.kelas) {
        // Deteksi dari nama kelas (misal: "XII TKJ 1" atau "XI TKR 2")
        if (laporan.kelas.includes('TKJ')) {
          detectedJurusan = 'TKJ';
        } else if (laporan.kelas.includes('TKR')) {
          detectedJurusan = 'TKR';
        }
      }

      // Jika berhasil mendeteksi jurusan, langsung kirim ke kaprodi yang sesuai
      if (detectedJurusan === 'TKJ') {
        Alert.alert(
          'Konfirmasi Pengiriman',
          `Jadwal kelas ${laporan.kelas} (${detectedJurusan}) akan dikirim ke Kaprodi TKJ untuk persetujuan.`,
          [
            {
              text: 'Batal',
              style: 'cancel',
            },
            {
              text: 'Kirim ke Kaprodi TKJ',
              onPress: () => sendToSpecificKaprodi(laporanId, 'TKJ'),
            },
          ]
        );
      } else if (detectedJurusan === 'TKR') {
        Alert.alert(
          'Konfirmasi Pengiriman',
          `Jadwal kelas ${laporan.kelas} (${detectedJurusan}) akan dikirim ke Kaprodi TKR untuk persetujuan.`,
          [
            {
              text: 'Batal',
              style: 'cancel',
            },
            {
              text: 'Kirim ke Kaprodi TKR',
              onPress: () => sendToSpecificKaprodi(laporanId, 'TKR'),
            },
          ]
        );
      } else {
        // Fallback: tampilkan pilihan manual jika tidak bisa mendeteksi
        Alert.alert(
          'Pilih Kaprodi',
          `Tidak dapat mendeteksi jurusan dari kelas "${laporan.kelas}". Pilih Kaprodi yang akan menerima laporan jadwal:`,
          [
            {
              text: 'Batal',
              style: 'cancel',
            },
            {
              text: 'Kaprodi TKJ',
              onPress: () => sendToSpecificKaprodi(laporanId, 'TKJ'),
            },
            {
              text: 'Kaprodi TKR',
              onPress: () => sendToSpecificKaprodi(laporanId, 'TKR'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error loading laporan data:', error);
      Alert.alert('Error', 'Gagal memuat data laporan');
    }
  };

  // Function untuk mengirim ke kaprodi spesifik
  const sendToSpecificKaprodi = async (laporanId, jurusan) => {
    try {
      // Get admin name from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const adminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';
      
      // Update laporan dengan informasi kaprodi yang dituju
      await LaporanJadwalService.sendToKaprodi(laporanId, jurusan, adminName);
      Alert.alert(
        'Berhasil', 
        `Jadwal berhasil dikirim ke Kaprodi ${jurusan} untuk persetujuan`
      );
      if (selectedReport) {
        await loadReportData(selectedReport.id);
      }
    } catch (error) {
      console.error('Error sending to Kaprodi:', error);
      Alert.alert('Error', `Gagal mengirim jadwal ke Kaprodi ${jurusan}`);
    }
  };

  // Handler untuk approve jadwal (Kaprodi)
  const handleApproveSchedule = async (itemId) => {
    try {
      // Get kaprodi name from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const kaprodiName = userData ? JSON.parse(userData).namaLengkap || 'Kaprodi' : 'Kaprodi';
      
      // Cek apakah ini laporan jadwal atau jadwal individual
      const reportItem = reportData.list?.find(item => item.id === itemId);
      
      if (reportItem && reportItem.status) {
        // Ini adalah laporan jadwal - gunakan LaporanJadwalService
        await LaporanJadwalService.approveLaporanJadwal(itemId, kaprodiName, userRole);
        Alert.alert('Berhasil', 'Laporan jadwal berhasil disetujui');
      } else {
        // Ini adalah jadwal individual - gunakan JadwalService
        await JadwalService.approveSchedules([itemId], kaprodiName, userRole);
        Alert.alert('Berhasil', 'Jadwal berhasil disetujui');
      }
      
      if (selectedReport) {
        await loadReportData(selectedReport.id);
      }
    } catch (error) {
      console.error('Error approving schedule:', error);
      Alert.alert('Error', 'Gagal menyetujui jadwal');
    }
  };

  // Handler untuk reject jadwal (Kaprodi)
  const handleRejectSchedule = (itemId) => {
    setRejectingScheduleId(itemId);
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    setIsSubmittingRejection(true);
    try {
      // Get kaprodi name from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const kaprodiName = userData ? JSON.parse(userData).namaLengkap || 'Kaprodi' : 'Kaprodi';
      
      // Cek apakah ini laporan jadwal atau jadwal individual
      const reportItem = reportData.list?.find(item => item.id === rejectingScheduleId);
      
      if (reportItem && reportItem.status) {
        // Ini adalah laporan jadwal - gunakan LaporanJadwalService
        await LaporanJadwalService.rejectLaporanJadwal(rejectingScheduleId, kaprodiName, userRole, rejectionReason, rejectionNotes);
        Alert.alert('Berhasil', 'Laporan jadwal berhasil ditolak');
      } else {
        // Ini adalah jadwal individual - perlu implementasi reject untuk JadwalService
        // Untuk sementara, kita tidak support reject jadwal individual
        Alert.alert('Info', 'Fitur penolakan jadwal individual belum tersedia. Hubungi admin untuk bantuan.');
        return;
      }
      
      if (selectedReport) {
        await loadReportData(selectedReport.id);
      }
    } catch (error) {
      console.error('Error rejecting schedule:', error);
      Alert.alert('Error', 'Gagal menolak jadwal');
    } finally {
      // Reset modal and clear data
      setIsSubmittingRejection(false);
      setRejectModalVisible(false);
      setRejectingScheduleId(null);
      setRejectionReason('');
      setRejectionNotes('');
    }
  };

  const handleCancelReject = () => {
    setRejectModalVisible(false);
    setRejectingScheduleId(null);
    setRejectionReason('');
    setRejectionNotes('');
  };

  // Handler untuk publish jadwal (Admin)
  const handlePublishSchedule = async (laporanId) => {
    try {
      // Get admin name from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const adminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';
      
      await LaporanJadwalService.publishSchedule(laporanId, adminName);
      Alert.alert('Berhasil', 'Jadwal berhasil dipublikasi ke guru dan siswa');
      if (selectedReport) {
        await loadReportData(selectedReport.id);
      }
    } catch (error) {
      console.error('Error publishing schedule:', error);
      Alert.alert('Error', 'Gagal mempublikasi jadwal');
    }
  };

  // Handler untuk approve pendaftaran murid (Admin)
  const handleApproveRegistration = async (registrationId) => {
    try {
      // Get admin name from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const adminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';
      
      await RegistrationService.approveRegistration(registrationId, adminName);
      Alert.alert('Berhasil', 'Pendaftaran murid berhasil disetujui');
      if (selectedReport) {
        await loadReportData(selectedReport.id);
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      Alert.alert('Error', 'Gagal menyetujui pendaftaran: ' + error.message);
    }
  };

  // Handler untuk reject pendaftaran murid (Admin)
  const handleRejectRegistration = async (registrationId) => {
    Alert.prompt(
      'Tolak Pendaftaran',
      'Masukkan alasan penolakan:',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Tolak',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              // Get admin name from AsyncStorage
              const userData = await AsyncStorage.getItem('userData');
              const adminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';
              
              await RegistrationService.rejectRegistration(registrationId, adminName, reason || 'Tidak ada alasan');
              Alert.alert('Berhasil', 'Pendaftaran murid berhasil ditolak');
              if (selectedReport) {
                await loadReportData(selectedReport.id);
              }
            } catch (error) {
              console.error('Error rejecting registration:', error);
              Alert.alert('Error', 'Gagal menolak pendaftaran: ' + error.message);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Handler untuk export jadwal
  const handleExportSchedule = async () => {
    try {
      setIsExporting(true);
      
      if (!selectedReport || !reportData.list || reportData.list.length === 0) {
        Alert.alert('Peringatan', 'Tidak ada data jadwal untuk diexport');
        return;
      }

      // Siapkan data jadwal untuk export
      let scheduleData = [];
      
      if (selectedReport.id === 'penjadwalan') {
        // Ambil semua jadwal dari laporan penjadwalan
        for (const laporan of reportData.list) {
          try {
            const jadwalList = await JadwalService.getJadwalByKelas(laporan.kelas);
            scheduleData = [...scheduleData, ...jadwalList];
          } catch (error) {
            console.error('Error loading schedule for class:', laporan.kelas, error);
          }
        }
      }
      
      if (scheduleData.length === 0) {
        Alert.alert('Peringatan', 'Tidak ada data jadwal yang dapat diexport');
        return;
      }

      const title = selectedJurusan 
        ? `Jadwal Pelajaran ${selectedJurusan} (${scheduleData.length} jadwal)`
        : `Jadwal Pelajaran (${scheduleData.length} jadwal)`;
      
      // Export menggunakan ExportService
      const success = await ExportService.exportScheduleData(scheduleData, title);
      
      if (success) {
        Alert.alert(
          'Export Berhasil', 
          `Data ${scheduleData.length} jadwal berhasil diexport ke PDF.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error exporting schedule:', error);
      Alert.alert('Error', 'Gagal mengexport jadwal');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler untuk export data berdasarkan tipe user yang dipilih
  const handleExportSelectedData = async (filteredData, userType) => {
    try {
      setIsExporting(true);
      
      if (!filteredData || filteredData.length === 0) {
        Alert.alert('Peringatan', `Tidak ada data ${userType} untuk diexport`);
        return;
      }

      // Get current admin name for report creator info
      const userData = await AsyncStorage.getItem('userData');
      const currentAdminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';

      let title = '';
      let columns = [];
      
      if (userType === 'Guru') {
        title = `Data Guru (${filteredData.length} guru)`;
columns = [
          { key: 'namaLengkap', header: 'Nama Lengkap' },
          { key: 'nip', header: 'NIP' },
          { key: 'email', header: 'Email' },
          { key: 'username', header: 'Username' },
          { key: 'password', header: 'Password' },
          { key: 'mataPelajaran', header: 'Mata Pelajaran' },
          { key: 'jenisKelamin', header: 'Jenis Kelamin' },
          { key: 'alamat', header: 'Alamat' },
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
      } else if (userType === 'Murid') {
        title = `Data Murid (${filteredData.length} murid)`;
columns = [
          { key: 'namaLengkap', header: 'Nama Lengkap' },
          { key: 'nis', header: 'NIS' },
          { key: 'kelas', header: 'Kelas' },
          { key: 'jurusan', header: 'Jurusan' },
          { key: 'jenisKelamin', header: 'Jenis Kelamin' },
          { key: 'email', header: 'Email' },
          { key: 'username', header: 'Username' },
          { key: 'password', header: 'Password' },
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
      } else if (userType === 'Kaprodi/Admin') {
        title = `Data Kaprodi/Admin (${filteredData.length} pengguna)`;
        columns = [
          { key: 'namaLengkap', header: 'Nama Lengkap' },
          { key: 'username', header: 'Username' },
          { key: 'email', header: 'Email' },
          { key: 'password', header: 'Password' },
          { 
            key: 'role', 
            header: 'Role',
            format: (value) => {
              if (value === 'kaprodi_tkj') return 'Kaprodi TKJ';
              if (value === 'kaprodi_tkr') return 'Kaprodi TKR';
              if (value === 'admin') return 'Administrator';
              return value || '-';
            }
          },
          { key: 'nip', header: 'NIP' },
          { key: 'noTelepon', header: 'No. Telepon' },
          { key: 'status', header: 'Status' }
        ];
      }
      
      const subtitle = `Total: ${filteredData.length} ${userType.toLowerCase()} • Diekspor oleh: ${currentAdminName} • ${new Date().toLocaleDateString('id-ID')}`;
      
      // Export menggunakan ExportService
      const success = await ExportService.exportCustomData(filteredData, columns, title, `data-${userType.toLowerCase().replace('/', '-')}`, subtitle);
      
      if (success) {
        Alert.alert(
          'Export Berhasil', 
          `Data ${filteredData.length} ${userType.toLowerCase()} berhasil diexport ke PDF.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error exporting selected data:', error);
      Alert.alert('Error', `Gagal mengexport data ${userType}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handler untuk export data laporan
  const handleExportReportData = async () => {
    try {
      setIsExporting(true);
      
      if (!selectedReport || !reportData.list || reportData.list.length === 0) {
        Alert.alert('Peringatan', 'Tidak ada data untuk diexport');
        return;
      }

      // Get current admin name for report creator info
      const userData = await AsyncStorage.getItem('userData');
      const currentAdminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';

      let title = '';
      let columns = [];
      let dataToExport = reportData.list;
      
      if (selectedReport.id === 'pendaftaran') {
        title = `Laporan Daftar Akun Murid (${dataToExport.length} pendaftaran)`;
        columns = [
          { key: 'namaLengkap', header: 'Nama Lengkap' },
          { key: 'email', header: 'Email' },
          { key: 'kelas', header: 'Kelas' },
          { key: 'jurusan', header: 'Jurusan' },
          { key: 'status', header: 'Status' },
          { 
            key: 'tanggalDaftar', 
            header: 'Tanggal Daftar',
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
      } else if (selectedReport.id === 'penjadwalan') {
        title = selectedJurusan 
          ? `Laporan Penjadwalan ${selectedJurusan} (${dataToExport.length} laporan)`
          : `Laporan Penjadwalan (${dataToExport.length} laporan)`;
        columns = [
          { key: 'kelas', header: 'Kelas' },
          { key: 'jurusan', header: 'Jurusan' },
          { key: 'status', header: 'Status' },
          { key: 'totalJadwal', header: 'Total Jadwal' },
          { 
            key: 'createdAt', 
            header: 'Tanggal Buat',
            format: (value) => {
              if (!value) return '-';
              try {
                // Handle Firestore Timestamp
                if (value && typeof value.toDate === 'function') {
                  return value.toDate().toLocaleDateString('id-ID', {
                    weekday: 'long',
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
                      weekday: 'long',
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
          },
          { 
            key: 'createdBy', 
            header: 'Dibuat Oleh',
            format: (value, item) => {
              // Use createdBy field from the laporan data (nama admin yang buat laporan)
              if (value && value !== '-' && value !== 'system' && value !== 'Admin') {
                return value;
              }
              // Fallback ke field lain jika createdBy kosong
              if (item.submittedBy && item.submittedBy !== '-' && item.submittedBy !== 'Admin') {
                return item.submittedBy;
              }
              if (item.approvedBy && item.approvedBy !== '-') {
                return item.approvedBy;
              }
              if (item.publishedBy && item.publishedBy !== '-') {
                return item.publishedBy;
              }
              // Default fallback - use current admin name untuk laporan yang baru dibuat
              return currentAdminName;
            }
          }
        ];
      } else if (selectedReport.id === 'data_master') {
        title = `Laporan Data Master (${dataToExport.length} data)`;
        columns = [
          { key: 'dataType', header: 'Jenis Data' },
          { key: 'primaryText', header: 'Nama/Kode' },
          { key: 'secondaryText', header: 'Detail' },
          { 
            key: 'createdAt', 
            header: 'Tanggal Dibuat',
            format: (value) => {
              if (!value) return '-';
              try {
                if (value.toDate) {
                  return value.toDate().toLocaleDateString('id-ID');
                }
                return new Date(value).toLocaleDateString('id-ID');
              } catch {
                return '-';
              }
            }
          }
        ];
      }
      
      const subtitle = `Total: ${dataToExport.length} data • Diekspor oleh: ${currentAdminName} • ${new Date().toLocaleDateString('id-ID')}`;
      
      // Export menggunakan ExportService
      const success = await ExportService.exportCustomData(dataToExport, columns, title, 'laporan-data', subtitle);
      
      if (success) {
        Alert.alert(
          'Export Berhasil', 
          `Data ${dataToExport.length} laporan berhasil diexport ke PDF.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error exporting report data:', error);
      Alert.alert('Error', 'Gagal mengexport data laporan');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler untuk membuat laporan jadwal dari data jadwal existing
  const handleCreateReportFromSchedule = async () => {
    try {
      // Ambil semua kelas yang ada jadwalnya
      const allJadwal = await JadwalService.getAllJadwal();
      const kelasWithSchedule = [...new Set(allJadwal.map(jadwal => jadwal.namaKelas))].filter(Boolean);
      
      if (kelasWithSchedule.length === 0) {
        Alert.alert('Tidak Ada Data', 'Tidak ada jadwal yang tersedia untuk dibuat laporan.');
        return;
      }

      // Langsung tampilkan pilihan kaprodi
      Alert.alert(
        'Pilih Kaprodi Tujuan',
        'Pilih Kaprodi yang akan menerima laporan jadwal:',
        [
          {
            text: 'Batal',
            style: 'cancel',
          },
          {
            text: 'Kaprodi TKJ',
            onPress: () => createReportForDepartment('TKJ', allJadwal),
          },
          {
            text: 'Kaprodi TKR',
            onPress: () => createReportForDepartment('TKR', allJadwal),
          },
        ]
      );
    } catch (error) {
      console.error('Error getting schedule data:', error);
      Alert.alert('Error', 'Gagal mengambil data jadwal');
    }
  };

  // Handler untuk membuat laporan jadwal berdasarkan departemen/jurusan
  const createReportForDepartment = async (jurusan, allJadwal) => {
    try {
      // Get admin name from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const adminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';
      
      // Filter jadwal berdasarkan jurusan
      const jadwalByJurusan = allJadwal.filter(jadwal => {
        // Asumsi bahwa nama kelas mengandung kode jurusan (misal: "XII TKJ 1", "XI TKR 2")
        return jadwal.namaKelas && jadwal.namaKelas.includes(jurusan);
      });
      
      if (jadwalByJurusan.length === 0) {
        Alert.alert('Tidak Ada Data', `Tidak ada jadwal yang tersedia untuk jurusan ${jurusan}.`);
        return;
      }
      
      // Ambil semua kelas unik untuk jurusan ini
      const kelasUnik = [...new Set(jadwalByJurusan.map(jadwal => jadwal.namaKelas))].filter(Boolean);
      
      let createdReports = 0;
      let errorCount = 0;
      
      // Buat laporan untuk masing-masing kelas dalam jurusan
      for (const namaKelas of kelasUnik) {
        try {
          const laporanId = await LaporanJadwalService.createLaporanFromExistingSchedule({ 
            namaKelas: namaKelas
          }, adminName);
          createdReports++;
        } catch (error) {
          console.error(`Error creating report for class ${namaKelas}:`, error);
          errorCount++;
        }
      }
      
      if (createdReports > 0) {
        Alert.alert(
          'Berhasil!',
          `${createdReports} laporan jadwal untuk jurusan ${jurusan} telah dibuat dengan status draft. Anda dapat mengirimnya ke Kaprodi untuk persetujuan.${errorCount > 0 ? `\n\nGagal membuat ${errorCount} laporan.` : ''}`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (selectedReport?.id === 'penjadwalan') {
                  loadReportData('penjadwalan');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', `Gagal membuat laporan untuk jurusan ${jurusan}. Tidak ada kelas yang berhasil diproses.`);
      }
    } catch (error) {
      console.error('Error creating report for department:', error);
      Alert.alert('Error', `Gagal membuat laporan jadwal untuk jurusan ${jurusan}: ` + error.message);
    }
  };

  const createReportForClass = async (namaKelas) => {
    try {
      // Get admin name from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const adminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';
      
      const laporanId = await LaporanJadwalService.createLaporanFromExistingSchedule({ namaKelas }, adminName);
      
      Alert.alert(
        'Berhasil!',
        `Laporan jadwal untuk kelas ${namaKelas} telah dibuat dengan status draft. Anda dapat mengirimnya ke Kaprodi untuk persetujuan.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (selectedReport?.id === 'penjadwalan') {
                loadReportData('penjadwalan');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating report:', error);
      Alert.alert('Error', 'Gagal membuat laporan jadwal: ' + error.message);
    }
  };

  // Handler untuk menghapus data laporan berdasarkan jenis yang sedang dilihat
  const handleDeleteCurrentReportData = async () => {
    if (!selectedReport) {
      return;
    }
    
    let reportTypeName = '';
    let confirmMessage = '';
    
    if (selectedReport.id === 'pendaftaran') {
      reportTypeName = 'Daftar Akun Murid';
      confirmMessage = 'Apakah Anda yakin ingin menghapus SEMUA data pendaftaran murid?\n\nTindakan ini akan menghapus:\n• Semua data pendaftaran siswa baru\n• Histori persetujuan dan penolakan\n• Status pendaftaran\n\nData yang dihapus TIDAK DAPAT dikembalikan!';
    } else if (selectedReport.id === 'penjadwalan') {
      reportTypeName = 'Laporan Penjadwalan';
      confirmMessage = 'Apakah Anda yakin ingin menghapus SEMUA data penjadwalan?\n\nTindakan ini akan menghapus:\n• Semua laporan jadwal kelas\n• Data persetujuan dari kaprodi\n• Status penjadwalan\n\nData yang dihapus TIDAK DAPAT dikembalikan!';
    }
    
    Alert.alert(
      '⚠️ Peringatan!',
      confirmMessage,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: `Ya, Hapus Data ${reportTypeName}`,
          style: 'destructive',
          onPress: () => confirmDeleteCurrentReportData(),
        },
      ]
    );
  };

  // Konfirmasi kedua untuk keamanan - khusus untuk jenis laporan yang sedang dilihat
  const confirmDeleteCurrentReportData = () => {
    if (!selectedReport) return;
    
    let reportTypeName = '';
    if (selectedReport.id === 'pendaftaran') {
      reportTypeName = 'Pendaftaran';
    } else if (selectedReport.id === 'penjadwalan') {
      reportTypeName = 'Penjadwalan';
    }
    
    setDeleteReportType(reportTypeName);
    setDeleteConfirmText('');
    setDeleteConfirmModalVisible(true);
  };

  // Handle konfirmasi penghapusan dari modal
  const handleConfirmDelete = () => {
    if (deleteConfirmText === 'HAPUS') {
      setDeleteConfirmModalVisible(false);
      executeDeleteCurrentReportData();
    } else {
      Alert.alert('Dibatalkan', 'Teks yang dimasukkan tidak sesuai. Ketik "HAPUS" dengan huruf kapital.');
    }
  };

  // Eksekusi penghapusan data laporan berdasarkan jenis yang dipilih
  const executeDeleteCurrentReportData = async () => {
    if (!selectedReport) return;
    
    try {
      setLoading(true);
      
      // Get admin name from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const adminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';
      
      let deletedCount = 0;
      let errorCount = 0;
      let reportTypeName = '';
      
      if (selectedReport.id === 'pendaftaran') {
        reportTypeName = 'Pendaftaran';
        try {
          const deletedRegistrationCount = await RegistrationService.deleteAllRegistrations();
          deletedCount += deletedRegistrationCount;
        } catch (error) {
          console.error('Error deleting registration data:', error);
          errorCount++;
        }
      } else if (selectedReport.id === 'penjadwalan') {
        reportTypeName = 'Penjadwalan';
        // Hapus data laporan penjadwalan
        try {
          const penjadwalanReports = await LaporanJadwalService.getAllLaporanJadwal();
          for (const report of penjadwalanReports) {
            try {
              await LaporanJadwalService.deleteLaporanJadwal(report.id);
              deletedCount++;
            } catch (error) {
              console.error(`Error deleting penjadwalan report ${report.id}:`, error);
              errorCount++;
            }
          }
        } catch (error) {
          console.error('Error deleting penjadwalan reports:', error);
          errorCount++;
        }
      }
      Alert.alert(
        '✅ Berhasil!',
        `Data ${reportTypeName} telah dihapus.\n\n📊 Statistik:\n• Berhasil dihapus: ${deletedCount} data\n• Gagal dihapus: ${errorCount} data\n\nOleh: ${adminName}\nWaktu: ${new Date().toLocaleString('id-ID')}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh data jika ada report yang sedang dibuka
              if (selectedReport) {
                loadReportData(selectedReport.id);
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error in executeDeleteCurrentReportData:', error);
      Alert.alert(
        '❌ Error',
        'Terjadi kesalahan saat menghapus data laporan:\n\n' + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Eksekusi penghapusan semua data laporan (legacy function - tidak digunakan lagi)
  const executeDeleteAllReports = async () => {
    try {
      setLoading(true);
      
      // Get admin name from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const adminName = userData ? JSON.parse(userData).namaLengkap || 'Administrator' : 'Administrator';
      let deletedCount = 0;
      let errorCount = 0;
      
      // Hapus semua data laporan pendaftaran (daftar akun murid)
      try {
        const deletedRegistrationCount = await RegistrationService.deleteAllRegistrations();
        deletedCount += deletedRegistrationCount;
      } catch (error) {
        console.error('Error deleting registration data:', error);
        errorCount++;
      }
      
      // Hapus semua data jadwal (laporan penjadwalan)
      try {
        const deletedJadwalCount = await JadwalService.deleteAllJadwal();
        deletedCount += deletedJadwalCount;
      } catch (error) {
        console.error('Error deleting jadwal data:', error);
        errorCount++;
      }
      
      // Hapus semua data laporan penjadwalan
      try {
        const penjadwalanReports = await LaporanJadwalService.getAllLaporanJadwal();
        for (const report of penjadwalanReports) {
          try {
            await LaporanJadwalService.deleteLaporanJadwal(report.id);
            deletedCount++;
          } catch (error) {
            console.error(`Error deleting penjadwalan report ${report.id}:`, error);
            errorCount++;
          }
        }
      } catch (error) {
        console.error('Error deleting penjadwalan reports:', error);
        errorCount++;
      }
      
      // Hapus semua data laporan umum (jika ada service terpisah)
      try {
        const generalReports = await LaporanService.getAllLaporan();
        for (const report of generalReports) {
          try {
            await LaporanService.deleteLaporan(report.id);
            deletedCount++;
          } catch (error) {
            console.error(`Error deleting general report ${report.id}:`, error);
            errorCount++;
          }
        }
      } catch (error) {
        console.error('Error deleting general reports (might not exist):', error);
        // Tidak menambah errorCount karena service ini mungkin tidak ada
      }
      Alert.alert(
        '✅ Berhasil!',
        `Semua data laporan telah dihapus.\n\n📊 Statistik:\n• Berhasil dihapus: ${deletedCount} data\n• Gagal dihapus: ${errorCount} data\n\nOleh: ${adminName}\nWaktu: ${new Date().toLocaleString('id-ID')}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh data jika ada report yang sedang dibuka
              if (selectedReport) {
                loadReportData(selectedReport.id);
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error in executeDeleteAllReports:', error);
      Alert.alert(
        '❌ Error',
        'Terjadi kesalahan saat menghapus data laporan:\n\n' + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const renderSendToAdminButton = (jadwalId) => {
    return (
      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => handleSendJadwalToAdmin(jadwalId)}
      >
        <Text style={styles.sendButtonText}>Kirim ke Admin</Text>
      </TouchableOpacity>
    );
  };

  const renderCreateReportButton = () => {
    const isAdmin = userRole && userRole.includes('admin');
    
    if (!isAdmin) return null;
    
    return (
      <TouchableOpacity
        style={styles.createReportButton}
        onPress={handleCreateReportFromSchedule}
      >
        <Ionicons name="add-circle" size={16} color="#fff" />
        <Text style={styles.createReportButtonText}>Buat Laporan Jadwal</Text>
      </TouchableOpacity>
    );
  };

  // Render tombol export untuk laporan
  const renderExportButtons = () => {
    const isAdmin = userRole && userRole.includes('admin');

      // Hanya tampilkan untuk admin dengan data
      if (!isAdmin || !selectedReport || !reportData.list || reportData.list.length === 0) {
        return null;
      }

      // Function to handle export options
      const handleExportOption = (type) => {
        let dataToExport = reportData.list;

        if (type === 'Guru') {
          dataToExport = dataToExport.filter(item => item.dataType === 'Guru');
        } else if (type === 'Murid') {
          dataToExport = dataToExport.filter(item => item.dataType === 'Murid');
        } else if (type === 'Kaprodi/Admin') {
          dataToExport = dataToExport.filter(item => item.dataType === 'Kaprodi/Admin');
        }

        handleExportSelectedData(dataToExport, type);
      }

    return (
      <View style={styles.exportSection}>
        <View style={styles.exportSectionHeader}>
          <Ionicons name="download" size={20} color="#0891b2" />
          <Text style={styles.exportSectionTitle}>Export Data</Text>
        </View>
        
        <View style={styles.exportButtonsContainer}>
          {selectedReport.id === 'penjadwalan' && (
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportReportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="document-text" size={18} color="#fff" />
                  <Text style={styles.exportButtonText}>Laporan Penjadwalan</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {selectedReport.id === 'data_pengguna' && (
            <>
              <TouchableOpacity
                style={[styles.exportButton, styles.exportButtonGuru]}
                onPress={() => handleExportOption('Guru')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="school" size={18} color="#fff" />
                    <Text style={styles.exportButtonText}>Data Guru</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportButton, styles.exportButtonMurid]}
                onPress={() => handleExportOption('Murid')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="people" size={18} color="#fff" />
                    <Text style={styles.exportButtonText}>Data Murid</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportButton, styles.exportButtonAdmin]}
                onPress={() => handleExportOption('Kaprodi/Admin')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="briefcase" size={18} color="#fff" />
                    <Text style={styles.exportButtonText}>Data Admin</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
          
          {selectedReport.id === 'data_master' && (
            <TouchableOpacity
              style={[styles.exportButton, styles.exportButtonMaster]}
              onPress={handleExportReportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="library" size={18} color="#fff" />
                  <Text style={styles.exportButtonText}>Data Master</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render tombol hapus data laporan berdasarkan jenis yang sedang dilihat (khusus admin)
  const renderDeleteAllReportsButton = () => {
    const isAdmin = userRole && userRole.includes('admin');
    
    if (!isAdmin || !selectedReport) return null;
    
    let buttonText = 'Hapus Data Laporan';
    if (selectedReport.id === 'pendaftaran') {
      buttonText = 'Hapus Data Pendaftaran';
    } else if (selectedReport.id === 'penjadwalan') {
      buttonText = 'Hapus Data Penjadwalan';
    }
    
    return (
      <TouchableOpacity
        style={styles.deleteAllButton}
        onPress={handleDeleteCurrentReportData}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={styles.deleteAllButtonText}>{buttonText}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render tombol aksi berdasarkan status dan role user
  const renderScheduleActionButtons = (item) => {
    const { status, id } = item;
    const isKaprodi = userRole && (userRole.includes('kaprodi') || userRole === 'kaprodi_tkj' || userRole === 'kaprodi_tkr');
    const isAdmin = userRole && userRole.includes('admin');

    return (
      <View style={styles.actionButtonsContainer}>
        {/* Admin: Kirim ke Kaprodi (hanya untuk status draft) */}
        {isAdmin && status === 'draft' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.sendKaprodiButton]}
            onPress={() => handleSendToKaprodi(id)}
          >
            <Ionicons name="send" size={12} color="#fff" />
            <Text style={styles.actionButtonText}>Kirim ke Kaprodi</Text>
          </TouchableOpacity>
        )}

        {/* Kaprodi: Approve/Reject (untuk jadwal individual dan laporan penjadwalan) */}
        {isKaprodi && (
          // Untuk laporan penjadwalan dengan status menunggu_persetujuan
          (status === 'menunggu_persetujuan') ||
          // Untuk jadwal individual dengan approvalStatus pending
          (item.approvalStatus === 'pending')
        ) && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApproveSchedule(id)}
            >
              <Ionicons name="checkmark" size={12} color="#fff" />
              <Text style={styles.actionButtonText}>Setujui</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectSchedule(id)}
            >
              <Ionicons name="close" size={12} color="#fff" />
              <Text style={styles.actionButtonText}>Tolak</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Admin: Publish (hanya untuk status disetujui) */}
        {isAdmin && status === 'disetujui' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.publishButton]}
            onPress={() => handlePublishSchedule(id)}
          >
            <Ionicons name="megaphone" size={12} color="#fff" />
            <Text style={styles.actionButtonText}>Publikasi ke Guru & Murid</Text>
          </TouchableOpacity>
        )}

        {/* Status indicator for published schedules */}
        {status === 'dipublikasi' && (
          <View style={[styles.actionButton, styles.publishedIndicator]}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
            <Text style={styles.actionButtonText}>Telah Dipublikasi</Text>
          </View>
        )}
      </View>
    );
  };

  // Render tombol aksi untuk pendaftaran murid
  const renderRegistrationActionButtons = (item) => {
    const { status, id } = item;
    const isAdmin = userRole && userRole.includes('admin');

    // Hanya tampilkan untuk admin dan status pending
    if (!isAdmin || status !== 'pending') {
      return null;
    }

    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApproveRegistration(id)}
        >
          <Ionicons name="checkmark" size={12} color="#fff" />
          <Text style={styles.actionButtonText}>Setujui</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectRegistration(id)}
        >
          <Ionicons name="close" size={12} color="#fff" />
          <Text style={styles.actionButtonText}>Tolak</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render data detail terpisah berdasarkan jenis untuk data master
  const renderDataMasterSeparated = () => {
    if (!reportData.rawData) return null;

    const { guru, murid, mataPelajaran, jurusan, kelas } = reportData.rawData;
    
    const renderSection = (title, data, icon, color) => {
      if (!data || data.length === 0) return null;
      
      return (
        <View style={styles.dataMasterSection} key={title}>
          <View style={[styles.sectionHeader, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={20} color={color} />
            <Text style={[styles.sectionTitle, { color }]}>{title} ({data.length})</Text>
          </View>
          {data.slice(0, 10).map((item, index) => {
            let primaryText = '';
            let secondaryText = '';
            
            if (title === 'Data Guru') {
              primaryText = item.namaLengkap || item.nama || 'Guru';
              secondaryText = `NIP: ${item.nip || '-'} • ${item.statusKepegawaian || 'Status tidak diketahui'}`;
            } else if (title === 'Data Murid') {
              primaryText = item.namaLengkap || item.nama || 'Murid';
              secondaryText = `${item.kelas || '-'} • ${item.jurusan || '-'} • ${item.statusSiswa || 'Aktif'}`;
            } else if (title === 'Data Mata Pelajaran') {
              primaryText = item.nama || 'Mata Pelajaran';
              secondaryText = `Kelompok ${item.kelompok || '-'} • ${item.kategori || '-'}`;
            } else if (title === 'Data Jurusan') {
              primaryText = item.nama || 'Jurusan';
              secondaryText = `Kode: ${item.kode || '-'} • ${item.aktif !== false ? 'Aktif' : 'Tidak Aktif'}`;
            } else if (title === 'Data Kelas') {
              primaryText = item.nama || 'Kelas';
              secondaryText = `${item.tingkat || ''} • ${item.aktif !== false ? 'Aktif' : 'Tidak Aktif'}`;
            }
            
            return (
              <View key={`${title}-${index}`} style={styles.dataItem}>
                <Text style={styles.dataItemText}>{primaryText}</Text>
                <Text style={styles.dataItemSubtext}>{secondaryText}</Text>
              </View>
            );
          })}
          {data.length > 10 && (
            <Text style={styles.moreDataText}>
              +{data.length - 10} data lainnya...
            </Text>
          )}
        </View>
      );
    };

    return (
      <View style={styles.dataListContainer}>
        {renderSection('Data Guru', guru, 'people', '#3B82F6')}
        {renderSection('Data Murid', murid, 'school', '#10B981')}
        {renderSection('Data Mata Pelajaran', mataPelajaran, 'book', '#F59E0B')}
        {renderSection('Data Jurusan', jurusan, 'business', '#8B5CF6')}
        {renderSection('Data Kelas', kelas, 'home', '#EC4899')}
      </View>
    );
  };

  const renderDataList = () => {
    let dataList = [];
    
    if (reportData.list) {
      dataList = reportData.list;
    } else if (reportData.kelas) {
      dataList = [...reportData.kelas, ...reportData.jurusan];
    }

    if (!dataList || dataList.length === 0) return null;

    // Untuk data master, gunakan tampilan terpisah
    if (selectedReport?.id === 'data_master') {
      return renderDataMasterSeparated();
    }

    return (
      <View style={styles.dataListContainer}>
        {dataList.map((item, index) => {
          let primaryText = '';
          let secondaryText = '';
          
          if (selectedReport?.id === 'jadwal') {
            primaryText = `Jadwal ${item.namaMataPelajaran || 'Mata Pelajaran'} untuk ${item.namaKelas || 'Kelas'}`;
            secondaryText = `${item.hari || 'Hari'} - Jam ke-${item.jamKe || '?'} (${item.namaGuru || 'Belum ada guru'})`;
          } else if (selectedReport?.id === 'penjadwalan') {
            primaryText = `Laporan Jadwal ${item.kelas || 'Kelas'} - ${item.jurusan || 'Jurusan'}`;
            const statusColor = item.status === 'disetujui' ? '#10B981' : 
                               item.status === 'ditolak' ? '#EF4444' : 
                               item.status === 'draft' ? '#6B7280' : '#F59E0B';
            secondaryText = `Status: ${item.status || 'Menunggu'} • Total: ${item.totalJadwal || 0} jadwal`;
          } else if (selectedReport?.id === 'pendaftaran') {
            primaryText = item.namaLengkap || item.nama || 'Pendaftar';
            const statusText = item.status === 'pending' ? 'Menunggu Persetujuan' :
                              item.status === 'approved' ? 'Disetujui' :
                              item.status === 'rejected' ? 'Ditolak' : item.status;
            secondaryText = `${statusText} • ${item.email || 'Email tidak tersedia'}`;
          } else {
            primaryText = item.namaLengkap || item.nama || item.title || item.kode || 'Data';
            secondaryText = item.status || item.jurusan || item.singkatan || item.email || '';
          }
          
          return (
            <View key={index} style={styles.dataItem}>
              <Text style={styles.dataItemText}>{primaryText}</Text>
              <Text style={styles.dataItemSubtext}>{secondaryText}</Text>
              {selectedReport?.id === 'jadwal' && renderSendToAdminButton(item.id)}
              {selectedReport?.id === 'penjadwalan' && renderScheduleActionButtons(item)}
              {selectedReport?.id === 'pendaftaran' && renderRegistrationActionButtons(item)}
            </View>
          );
        })}
      </View>
    );
  };

  const handleReportPress = async (report) => {
    setSelectedReport(report);
    setIsDetailModalVisible(true);
    loadReportData(report.id);
  };

  const onRefresh = useCallback(async () => {
    if (selectedReport) {
      setRefreshing(true);
      await loadReportData(selectedReport.id);
      setRefreshing(false);
    }
  }, [selectedReport, selectedJurusan]);

  const handleJurusanFilterChange = async (jurusan) => {
    setSelectedJurusan(jurusan);
    if (selectedReport) {
      await loadReportData(selectedReport.id);
    }
  };

  const handleUserDataFilterChange = async (filter) => {
    setSelectedUserDataFilter(filter);
    
    // Immediately filter the existing data without reloading from server
    if (selectedReport && reportData.rawData) {
      const { guru, murid, admin } = reportData.rawData;
      
      // Gabungkan data pengguna untuk ditampilkan dalam list
      let penggunaDataList = [
        // Data Guru
        ...guru.map(guru => ({
          ...guru,
          dataType: 'Guru',
          primaryText: guru.namaLengkap || guru.nama || 'Guru',
          secondaryText: `NIP: ${guru.nip || '-'} • ${guru.statusKepegawaian || 'Status tidak diketahui'}`
        })),
        // Data Murid
        ...murid.map(murid => ({
          ...murid,
          dataType: 'Murid',
          primaryText: murid.namaLengkap || murid.nama || 'Murid',
          secondaryText: `${murid.kelas || '-'} • ${murid.jurusan || '-'} • ${murid.statusSiswa || 'Aktif'}`
        })),
        // Data Kaprodi/Admin
        ...admin.map(admin => ({
          ...admin,
          dataType: 'Kaprodi/Admin',
          primaryText: admin.namaLengkap || admin.nama || 'Admin',
          secondaryText: `${admin.role === 'kaprodi_tkj' ? 'Kaprodi TKJ' : admin.role === 'kaprodi_tkr' ? 'Kaprodi TKR' : 'Administrator'} • ${admin.email || 'Email tidak tersedia'}`
        }))
      ];

      // Filter data berdasarkan selectedUserDataFilter
      if (filter) {
        penggunaDataList = penggunaDataList.filter(item => {
          if (filter === 'Guru') {
            return item.dataType === 'Guru';
          } else if (filter === 'Murid') {
            return item.dataType === 'Murid';
          } else if (filter === 'Kaprodi/Admin') {
            return item.dataType === 'Kaprodi/Admin';
          }
          return true;
        });
      }
      
      // Update reportData with filtered list
      setReportData(prevData => ({
        ...prevData,
        list: penggunaDataList
      }));
    }
  };

  const renderJurusanFilter = () => {
    // Don't render the filter for Kaprodi users
    const isKaprodi = userRole && (userRole === 'kaprodi_tkj' || userRole === 'kaprodi_tkr' || userRole.includes('kaprodi'));
    
    if (isKaprodi) {
      return null; // Hide filter completely for Kaprodi
    }
    
    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter Jurusan</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedJurusan}
            onValueChange={handleJurusanFilterChange}
            style={styles.picker}
          >
            <Picker.Item label="Semua Jurusan" value="" />
            {jurusanList.map((jurusan) => (
              <Picker.Item key={jurusan} label={jurusan} value={jurusan} />
            ))}
          </Picker>
        </View>
      </View>
    );
  };

  const renderUserDataFilter = () => {
    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter Jenis Pengguna</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedUserDataFilter}
            onValueChange={handleUserDataFilterChange}
            style={styles.picker}
          >
            <Picker.Item label="Semua Pengguna" value="" />
            <Picker.Item label="Guru" value="Guru" />
            <Picker.Item label="Murid" value="Murid" />
            <Picker.Item label="Kaprodi/Admin" value="Kaprodi/Admin" />
          </Picker>
        </View>
      </View>
    );
  };

  const renderReportDetail = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Memuat data laporan...</Text>
        </View>
      );
    }

    if (!reportData.type) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Tidak ada data untuk ditampilkan</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.detailContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.detailHeader}>
          <Text style={styles.detailSubtitle}>
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {selectedReport?.id === 'data_pengguna' && renderUserDataFilter()}
        {selectedReport?.id === 'penjadwalan' && renderCreateReportButton()}
        {renderExportButtons()}
        {renderDeleteAllReportsButton()}
        {renderStatCards()}
        {renderDataList()}
      </ScrollView>
    );
  };

  const renderStatCards = () => {
    if (!reportData.stats && !reportData.siswa) return null;

    const stats = reportData.stats || reportData;
    const cards = [];
    

    if (selectedReport?.id === 'pendaftaran') {
      cards.push(
        { label: 'Total Pendaftaran', value: stats.total || 0, color: '#3B82F6' },
        { label: 'Menunggu Persetujuan', value: stats.pending || 0, color: '#F59E0B' },
        { label: 'Disetujui', value: stats.approved || 0, color: '#10B981' },
        { label: 'Ditolak', value: stats.rejected || 0, color: '#EF4444' }
      );
    } else if (selectedReport?.id === 'penjadwalan') {
      cards.push(
        { label: 'Total Laporan', value: stats.total || 0, color: '#EC4899' },
        { label: 'Draft', value: stats.draft || 0, color: '#6B7280' },
        { label: 'Menunggu Persetujuan', value: stats.menunggu_persetujuan || 0, color: '#F59E0B' },
        { label: 'Disetujui', value: stats.disetujui || 0, color: '#10B981' },
        { label: 'Ditolak', value: stats.ditolak || 0, color: '#EF4444' },
        { label: 'Dipublikasi', value: stats.dipublikasi || 0, color: '#8B5CF6' }
      );
    } else if (selectedReport?.id === 'data_master') {
      // Card utama untuk data master (tanpa guru dan murid)
      cards.push(
        { label: 'Total Mata Pelajaran', value: stats.totalMataPelajaran || 0, color: '#F59E0B' },
        { label: 'Total Kelas', value: stats.totalKelas || 0, color: '#EC4899' },
        { label: 'Total Jurusan', value: stats.totalJurusan || 2, color: '#8B5CF6' } // Default 2 jurusan (TKJ, TKR)
      );
      
      // Card detail statistik mata pelajaran per kelompok
      if (stats.mataPelajaran) {
        cards.push(
          { label: 'Kelompok A', value: stats.mataPelajaran.kelompok_a || 0, color: '#0EA5E9' },
          { label: 'Kelompok B', value: stats.mataPelajaran.kelompok_b || 0, color: '#F97316' },
          { label: 'Kelompok C', value: stats.mataPelajaran.kelompok_c || 0, color: '#059669' }
        );
      }
      
      // Card detail untuk kelas dan jurusan aktif
      cards.push(
        { label: 'Kelas Aktif', value: stats.kelas?.aktif || stats.totalKelas || 0, color: '#10B981' },
        { label: 'Jurusan Aktif', value: stats.jurusan?.aktif || stats.totalJurusan || 0, color: '#8B5CF6' }
      );
    }

    return (
      <View style={styles.statsContainer}>
        {cards.map((card, index) => (
          <View key={index} style={[styles.statCard, { borderLeftColor: card.color }]}>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Check if user is Kaprodi to decide whether to show main content
  const isKaprodi = userRole && (userRole === 'kaprodi_tkj' || userRole === 'kaprodi_tkr' || userRole.includes('kaprodi'));

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (isStandalone) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'PilihLogin' }],
      });
    }
  };

  const handleOpenSidebar = () => {
    if (onOpenSidebar) {
      onOpenSidebar();
    } else if (isStandalone) {
      // For standalone mode, redirect to login since we don't have a sidebar
      console.log('Sidebar not available in standalone mode');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <SafeStatusBar style="light" />
      
      <TopBar
        title={isKaprodi ? "Review Jadwal" : "Laporan Sekolah"}
        onMenuPress={handleOpenSidebar}
        notifications={[]}
        showBackButton={!!onGoBack || isStandalone}
        onBackPress={handleGoBack}
      />

      {/* Show main content - filtered for kaprodi users */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.reportsGrid}>
        {REPORT_TYPES
          .filter((report) => {
            // Filter out 'pendaftaran' report for kaprodi users
            if (isKaprodi && report.id === 'pendaftaran') {
              return false; // Hide 'Laporan Daftar Akun Murid' from kaprodi
            }
            
            return true; // Show all other reports
          })
          .map((report) => {
            return (
              <ReportCard
                key={report.id}
                item={report}
                onPress={handleReportPress}
                userRole={userRole}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Report Detail Modal */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['right', 'left']}>
          <SafeStatusBar style="light" />
          
          <TopBar
            title={
              selectedReport?.id === 'penjadwalan' && isKaprodi
                ? 'Review Jadwal'
                : selectedReport?.title || 'Detail Laporan'
            }
            onMenuPress={handleOpenSidebar}
            notifications={[]}
            showBackButton={true}
            onBackPress={() => setIsDetailModalVisible(false)}
          />
          
          {renderReportDetail()}
        </SafeAreaView>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        visible={rejectModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancelReject}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="close-circle" size={32} color="#EF4444" />
              <Text style={styles.modalTitle}>Tolak Jadwal</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Berikan alasan dan catatan detail mengapa jadwal ini ditolak:
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Alasan Penolakan *</Text>
              <TextInput
                style={styles.input}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Masukkan alasan penolakan"
                autoFocus={true}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Catatan Detail (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={rejectionNotes}
                onChangeText={setRejectionNotes}
                placeholder="Tambahkan catatan detail untuk membantu perbaikan jadwal"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelReject}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.rejectConfirmButton,
                  (!rejectionReason || isSubmittingRejection) && styles.rejectConfirmButtonDisabled
                ]}
                onPress={handleConfirmReject}
                disabled={!rejectionReason || isSubmittingRejection}
              >
                {isSubmittingRejection ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[
                    styles.rejectConfirmButtonText,
                    (!rejectionReason) && styles.rejectConfirmButtonTextDisabled
                  ]}>Tolak Jadwal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color="#EF4444" />
              <Text style={styles.modalTitle}>🚨 Konfirmasi Terakhir</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Ini adalah peringatan terakhir!
              {"\n\n"}
              Semua data {deleteReportType} akan dihapus permanen dan tidak dapat dikembalikan.
              {"\n\n"}
              Ketik "HAPUS" untuk melanjutkan:
            </Text>
            
            <TextInput
              style={styles.input}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Ketik HAPUS untuk konfirmasi"
              autoCapitalize="characters"
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setDeleteConfirmModalVisible(false);
                  setDeleteConfirmText('');
                }}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  deleteConfirmText !== 'HAPUS' && styles.deleteButtonDisabled
                ]}
                onPress={handleConfirmDelete}
                disabled={deleteConfirmText !== 'HAPUS'}
              >
                <Text style={[
                  styles.deleteButtonText,
                  deleteConfirmText !== 'HAPUS' && styles.deleteButtonTextDisabled
                ]}>Hapus Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
  },
  reportsGrid: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  detailHeader: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  detailSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    minWidth: width / 2 - 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 3,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#6b7280',
  },
  dataListContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dataListTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#1f2937',
    marginBottom: 12,
  },
  dataItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dataItemText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#1f2937',
  },
  dataItemSubtext: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  moreDataText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#9ca3af',
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  sendButtonText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#fff',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#1f2937',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  picker: {
    height: 50,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 10,
    fontFamily: 'Nunito_500Medium',
    color: '#fff',
  },
  sendKaprodiButton: {
    backgroundColor: '#3B82F6',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  publishButton: {
    backgroundColor: '#8B5CF6',
  },
  publishedIndicator: {
    backgroundColor: '#10B981',
  },
  createReportButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  createReportButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#fff',
  },
  deleteAllButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  deleteAllButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1f2937',
    marginTop: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    height: 48,
    borderColor: '#d1d5db',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#fca5a5',
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#fff',
  },
  deleteButtonTextDisabled: {
    color: '#fecaca',
  },
  exportSection: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  exportSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exportSectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#2563EB',
    marginLeft: 8,
  },
  exportButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  exportButton: {
    backgroundColor: '#34D399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    flexBasis: '48%',
  },
  exportReportButton: {
    backgroundColor: '#0891b2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flex: 1,
  },
  exportScheduleButton: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flex: 1,
  },
  exportButtonText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: '#fff',
  },
  exportButtonGuru: {
    backgroundColor: '#3B82F6',
  },
  exportButtonMurid: {
    backgroundColor: '#10B981',
  },
  exportButtonAdmin: {
    backgroundColor: '#8B5CF6',
  },
  exportButtonMaster: {
    backgroundColor: '#F59E0B',
  },
  dataMasterSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    marginLeft: 8,
  },
  // Rejection Modal Styles
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  rejectionInput: {
    height: 48,
    borderColor: '#d1d5db',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    textAlign: 'left',
  },
  rejectConfirmButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  rejectConfirmButtonDisabled: {
    backgroundColor: '#fca5a5',
    opacity: 0.6,
  },
  rejectConfirmButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#fff',
  },
  rejectConfirmButtonTextDisabled: {
    color: '#fecaca',
  },
});
