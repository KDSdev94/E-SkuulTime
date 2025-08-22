import { createNotification } from '../../services/notificationService';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Picker,
  Platform,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { Picker as RNPicker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import MuridService from '../../services/MuridService';
import { Timestamp } from 'firebase/firestore';
import { commonStyles } from '../../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSafeFont } from '../../utils/fontUtils';
import PermissionService from '../../services/PermissionService';
import ProtectedComponent from '../../components/ProtectedComponent';
import ExportService from '../../services/ExportService';

export default function MuridManagementPage({ onGoBack }) {
  const navigation = useNavigation();
  
  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isKaprodi, setIsKaprodi] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [kaprodiDepartment, setKaprodiDepartment] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nis: '',
    nisn: '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: '',
    tanggalLahir: '',
    tingkat: 'X',
    kelasNumber: '1',
    kelas: 'X TKJ 1',
    rombel: 'X TKJ 1',
    jurusan: 'TKJ',
    tahunMasuk: new Date().getFullYear().toString(),
    statusSiswa: 'Aktif',
    nomorHP: '',
    alamat: '',
    namaOrtu: '',
    nomorHPOrtu: '',
    nomorHPWali: '',
    fotoUrl: '',
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await MuridService.getAllMurid();
      
      const processedStudents = studentsData.map(student => ({
        ...student,
        tanggalLahir: student.tanggalLahir instanceof Timestamp 
          ? student.tanggalLahir.toDate().toISOString().split('T')[0]
          : student.tanggalLahir || '',
        createdAt: student.createdAt instanceof Timestamp 
          ? student.createdAt.toDate().toISOString()
          : student.createdAt || '',
        updatedAt: student.updatedAt instanceof Timestamp 
          ? student.updatedAt.toDate().toISOString()
          : student.updatedAt || ''
      }));
      
      setStudents(processedStudents);
      
    } catch (error) {
      
      Alert.alert('Error', 'Gagal memuat data murid');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStudents();
      checkUserRole();
    }, [])
  );

  const checkUserRole = async () => {
    try {
      const currentUserRole = await PermissionService.getCurrentUserRole();
      setUserRole(currentUserRole);
      setIsKaprodi(currentUserRole === 'kaprodi_tkj' || currentUserRole === 'kaprodi_tkr');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  }, []);


  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(
        (student) => {
          const namaLengkap = student.namaLengkap || '';
          const nis = student.nis || '';
          const kelas = student.kelas || '';
          return (
            namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
            nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
            kelas.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const formatDateToIndonesian = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      
      return '';
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, tanggalLahir: formattedDate });
    }
  };

  const getDateFromFormData = () => {
    if (formData.tanggalLahir) {
      return new Date(formData.tanggalLahir);
    }
    return new Date();
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setFormData({
      namaLengkap: '',
      nis: '',
      nisn: '',
      jenisKelamin: 'Laki-laki',
      tempatLahir: '',
      tanggalLahir: '',
      tingkat: 'X',
      kelasNumber: '1',
      kelas: 'X TKJ 1',
      rombel: 'X TKJ 1',
      jurusan: 'TKJ',
      tahunMasuk: new Date().getFullYear().toString(),
      statusSiswa: 'Aktif',
      nomorHP: '',
      alamat: '',
      namaOrtu: '',
      nomorHPOrtu: '',
      nomorHPWali: '',
      fotoUrl: '',
    });
    setIsModalVisible(true);
  };

  // Generate dummy data function
  const generateDummyStudents = async () => {
    try {
      setGenerating(true);
      
      // Confirm with user first
      Alert.alert(
        'Generate Data Murid',
        'Apakah Anda yakin ingin menambahkan 20 data murid dummy untuk testing? Data ini tidak akan memiliki username dan password sehingga cocok untuk testing pendaftaran murid.',
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Ya, Generate', 
            onPress: async () => {
              await executeGenerateDummyStudents();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in generateDummyStudents:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat generate data murid');
    } finally {
      setGenerating(false);
    }
  };

  const executeGenerateDummyStudents = async () => {
    try {
      const adminName = await AsyncStorage.getItem('adminName') || 'Admin';
      
      // Get existing students to avoid duplicate names and NIS
      const existingStudents = await MuridService.getAllMurid();
      const existingNames = new Set(existingStudents.map(s => s.namaLengkap?.toLowerCase()));
      const existingNIS = new Set(existingStudents.map(s => s.nis));
      
      // Sample names (enough unique names for 20 students)
      const maleFirstNames = [
        'Ahmad', 'Budi', 'Dimas', 'Eko', 'Fajar', 'Gilang', 'Hendra', 'Ivan', 'Joko', 'Kevin',
        'Lukman', 'Muhammad', 'Nur', 'Omar', 'Pandi', 'Qomar', 'Rizky', 'Surya', 'Taufik', 'Usman'
      ];
      
      const maleLastNames = [
        'Santoso', 'Pratama', 'Saputra', 'Nugroho', 'Permana', 'Wijaya', 'Setiawan', 'Ananda',
        'Firmansyah', 'Kurniawan', 'Ramadhan', 'Hakim', 'Mahendra', 'Perdana', 'Utomo'
      ];
      
      const femaleFirstNames = [
        'Aisyah', 'Bella', 'Citra', 'Diana', 'Eka', 'Fitri', 'Gita', 'Hani', 'Intan', 'Julia',
        'Kartika', 'Laila', 'Mega', 'Nanda', 'Olivia', 'Putri', 'Qonita', 'Rina', 'Sari', 'Tiwi'
      ];
      
      const femaleLastNames = [
        'Putri', 'Sari', 'Dewi', 'Fitri', 'Rahayu', 'Handayani', 'Purnama', 'Lestari', 'Permata', 'Safitri',
        'Maharani', 'Wulandari', 'Pratiwi', 'Anggraini', 'Kusuma', 'Melati', 'Indah', 'Cantika'
      ];
      
      // Sample addresses
      const addresses = [
        'Jl. Merdeka No. 123, Jakarta',
        'Jl. Sudirman Blok A No. 45, Bandung', 
        'Jl. Diponegoro No. 67, Yogyakarta',
        'Jl. Ahmad Yani No. 89, Surabaya',
        'Jl. Gatot Subroto No. 12, Semarang',
        'Jl. Panglima Sudirman No. 34, Malang',
        'Jl. Veteran No. 56, Solo',
        'Jl. Pahlawan No. 78, Medan',
        'Jl. Kemerdekaan No. 90, Palembang',
        'Jl. Proklamasi No. 11, Makassar'
      ];

      // Sample parent names and jobs
      const parentNames = [
        'Bapak Sutrisno', 'Ibu Siti Nurhaliza', 'Bapak Agus Salim', 'Ibu Ratna Sari',
        'Bapak Bambang Purnomo', 'Ibu Dewi Lestari', 'Bapak Cahyo Utomo', 'Ibu Endang Suryani',
        'Bapak Dedi Kurniawan', 'Ibu Fatimah Zahra', 'Bapak Gunawan', 'Ibu Hesti Wulandari'
      ];

      const jobs = [
        'Wiraswasta', 'PNS', 'Guru', 'Petani', 'Pedagang', 'Pegawai Swasta', 
        'Dokter', 'Perawat', 'Supir', 'Buruh', 'TNI/POLRI', 'Pensiunan'
      ];

      // Sample cities for birth places
      const cities = [
        'Jakarta', 'Bandung', 'Yogyakarta', 'Surabaya', 'Semarang', 
        'Malang', 'Solo', 'Medan', 'Palembang', 'Makassar'
      ];

      // Classes available
      const classes = [
        'X TKJ 1', 'X TKJ 2', 'X TKR 1', 'X TKR 2',
        'XI TKJ 1', 'XI TKJ 2', 'XI TKR 1', 'XI TKR 2',
        'XII TKJ 1', 'XII TKJ 2', 'XII TKR 1', 'XII TKR 2'
      ];

      const currentYear = new Date().getFullYear();
      const generatedStudents = [];
      const usedNames = new Set();
      const usedNIS = new Set();

      // Create shuffled arrays to ensure unique combinations
      const shuffledMaleFirstNames = [...maleFirstNames].sort(() => Math.random() - 0.5);
      const shuffledMaleLastNames = [...maleLastNames].sort(() => Math.random() - 0.5);
      const shuffledFemaleFirstNames = [...femaleFirstNames].sort(() => Math.random() - 0.5);
      const shuffledFemaleLastNames = [...femaleLastNames].sort(() => Math.random() - 0.5);

      let maleCount = 0;
      let femaleCount = 0;
      let nisCounter = 1;

      for (let i = 0; i < 20; i++) {
        const gender = i % 2 === 0 ? 'Laki-laki' : 'Perempuan';
        
        // Generate unique name
        let name;
        let attempts = 0;
        do {
          if (gender === 'Laki-laki') {
            const firstIndex = (maleCount + attempts) % shuffledMaleFirstNames.length;
            const lastIndex = Math.floor((maleCount + attempts) / shuffledMaleFirstNames.length) % shuffledMaleLastNames.length;
            const firstName = shuffledMaleFirstNames[firstIndex];
            const lastName = shuffledMaleLastNames[lastIndex];
            name = `${firstName} ${lastName}`;
          } else {
            const firstIndex = (femaleCount + attempts) % shuffledFemaleFirstNames.length;
            const lastIndex = Math.floor((femaleCount + attempts) / shuffledFemaleFirstNames.length) % shuffledFemaleLastNames.length;
            const firstName = shuffledFemaleFirstNames[firstIndex];
            const lastName = shuffledFemaleLastNames[lastIndex];
            name = `${firstName} ${lastName}`;
          }
          attempts++;
        } while ((usedNames.has(name.toLowerCase()) || existingNames.has(name.toLowerCase())) && attempts < 100);

        if (attempts >= 100) {
          // If we can't find unique name, add number suffix
          name = `${name} ${i + 1}`;
        }

        usedNames.add(name.toLowerCase());
        
        if (gender === 'Laki-laki') {
          maleCount++;
        } else {
          femaleCount++;
        }
        
        const selectedClass = classes[i % classes.length];
        const jurusan = selectedClass.includes('TKJ') ? 'TKJ' : 'TKR';
        
        // Generate unique NIS: format YYYYNNNNN (Year + 5 digit number)
        let nisNumber;
        do {
          nisNumber = String(20240000 + nisCounter).padStart(9, '0');
          nisCounter++;
        } while (existingNIS.has(nisNumber) || usedNIS.has(nisNumber));
        
        usedNIS.add(nisNumber);

        // Generate birth date (15-18 years old)
        const birthYear = currentYear - (15 + (i % 4)); // Age 15-18
        const birthMonth = Math.floor(Math.random() * 12);
        const birthDay = Math.floor(Math.random() * 28) + 1;
        const birthDate = new Date(birthYear, birthMonth, birthDay);

        const studentData = {
          nis: nisNumber.toString(),
          namaLengkap: name.toString(),
          kelas: selectedClass.toString(),
          jenisKelamin: gender.toString(),
          jurusan: jurusan.toString(),
          tempatLahir: cities[i % cities.length].toString(),
          tanggalLahir: Timestamp.fromDate(birthDate),
          alamat: addresses[i % addresses.length].toString(),
          namaOrtu: parentNames[i % parentNames.length].toString(),
          pekerjaanOrtu: jobs[i % jobs.length].toString(),
          nomorHPOrtu: `08${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
          nomorHPWali: `08${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
          fotoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${['4285F4', '34A853', 'FBBC05', 'EA4335', '9C27B0', 'FF9800'][i % 6]}&color=fff&size=200`,
          tahunMasuk: currentYear.toString(),
          statusSiswa: 'Aktif',
          rombel: selectedClass.toString(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          // Intentionally NOT including: username, email, password
        };

        generatedStudents.push(studentData);
      }

      // Save all students to database
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const studentData of generatedStudents) {
        try {
          console.log(`Saving student ${successCount + 1}/20: ${studentData.namaLengkap} (${studentData.nis})`);
          const docId = await MuridService.addMurid(studentData, adminName);
          console.log(`✅ Saved: ${studentData.namaLengkap} with doc ID: ${docId}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Error saving student ${studentData.namaLengkap}:`, error);
          errors.push({
            name: studentData.namaLengkap,
            nis: studentData.nis,
            error: error.message
          });
          errorCount++;
        }
      }

      console.log('Generate dummy students completed:', {
        successCount,
        errorCount,
        errors: errors.slice(0, 3) // Show first 3 errors
      });

      // Refresh the student list
      await loadStudents();

      // Show result
      if (errorCount === 0) {
        Alert.alert(
          'Berhasil!', 
          `${successCount} data murid berhasil di-generate. Data ini siap digunakan untuk testing pendaftaran murid.\n\nSekarang murid dapat mendaftar menggunakan NIS yang tersedia di dropdown.`
        );
      } else {
        const errorDetails = errors.length > 0 ? 
          `\n\nContoh error:\n• ${errors[0].name}: ${errors[0].error}` : '';
        Alert.alert(
          'Sebagian Berhasil', 
          `${successCount} data berhasil disimpan, ${errorCount} data gagal.${errorDetails}\n\nSilakan cek console log untuk detail lengkap.`
        );
      }

    } catch (error) {
      console.error('Error executing generate dummy students:', error);
      Alert.alert('Error', `Gagal generate data murid: ${error.message}`);
    }
  };

  const handleDetailStudent = useCallback((student) => {
    setSelectedStudent(student);
    setIsDetailModalVisible(true);
  }, []);

  const handleEditStudent = useCallback((student) => {
    setEditingStudent(student);
    const kelasParts = student.kelas ? student.kelas.split(' ') : ['X', 'TKJ', '1'];
    const tingkat = kelasParts[0] || 'X';
    const jurusan = kelasParts[1] || 'TKJ';
    const kelasNumber = kelasParts[2] || '1';
    
    setFormData({ 
      ...student,
      tingkat,
      kelasNumber,
      jurusan
    });
    setIsModalVisible(true);
  }, []);

  const handleDeleteStudent = useCallback((studentId) => {
    Alert.alert(
      'Hapus Murid',
      'Apakah Anda yakin ingin menghapus data murid ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const adminName = await AsyncStorage.getItem('adminName') || 'Admin';
              const adminId = await AsyncStorage.getItem('adminId') || 'admin';
              await MuridService.deleteMurid(studentId, adminName);
              createNotification('admin', `Data Murid dengan ID ${studentId} telah dihapus.`, {
                name: adminName,
                type: 'admin',
                id: adminId
              });
              setStudents(students.filter((s) => s.id !== studentId));
              Alert.alert('Berhasil', 'Data murid berhasil dihapus');
            } catch (error) {
              
              Alert.alert('Error', 'Gagal menghapus data murid');
            }
          },
        },
      ]
    );
  }, [students]);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedStudents(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredStudents.map(student => student.id));
      setSelectedStudents(allIds);
      setSelectAll(true);
    }
  }, [selectAll, filteredStudents]);

  const handleSelectStudent = useCallback((studentId) => {
    setSelectedStudents(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(studentId)) {
        newSelected.delete(studentId);
      } else {
        newSelected.add(studentId);
      }
      setSelectAll(newSelected.size === filteredStudents.length);
      return newSelected;
    });
  }, [filteredStudents.length]);

  const handleDeleteSelected = () => {
    const selectedCount = selectedStudents.size;
    if (selectedCount === 0) {
      Alert.alert('Peringatan', 'Pilih minimal satu murid untuk dihapus');
      return;
    }

    Alert.alert(
      'Hapus Murid Terpilih',
      `Apakah Anda yakin ingin menghapus ${selectedCount} murid yang dipilih?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const adminName = await AsyncStorage.getItem('adminName') || 'Admin';
              const selectedIds = Array.from(selectedStudents);
              await Promise.all(selectedIds.map(id => MuridService.deleteMurid(id, adminName)));
              const adminId = await AsyncStorage.getItem('adminId') || 'admin';
              createNotification('admin', `${selectedCount} Murid berhasil dihapus.`, {
                name: adminName,
                type: 'admin',
                id: adminId
              });
              setStudents(students.filter(s => !selectedStudents.has(s.id)));
              setSelectedStudents(new Set());
              setSelectAll(false);
              Alert.alert('Berhasil', `${selectedCount} murid berhasil dihapus`);
            } catch (error) {
              
              Alert.alert('Error', 'Gagal menghapus murid terpilih');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllStudents = () => {
    Alert.alert(
      'Hapus Semua Data Murid',
      'Apakah Anda yakin ingin menghapus SEMUA data murid? Tindakan ini tidak dapat dibatalkan!',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const deletedCount = await MuridService.deleteAllMurid();
              setStudents([]);
              setSelectedStudents(new Set());
              setSelectAll(false);
              Alert.alert('Berhasil', `${deletedCount} data murid berhasil dihapus`);
            } catch (error) {
              
              Alert.alert('Error', 'Gagal menghapus semua data murid');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };


  // Handler untuk export students
  const handleExportStudents = async () => {
    try {
      setIsExporting(true);
      const dataToExport = selectedStudents.size > 0 
        ? students.filter(student => selectedStudents.has(student.id))
        : filteredStudents;
      
      if (dataToExport.length === 0) {
        Alert.alert('Peringatan', 'Tidak ada data murid untuk diexport');
        return;
      }

      const title = selectedStudents.size > 0 
        ? `Data Murid Terpilih (${selectedStudents.size} murid)`
        : `Data Murid (${filteredStudents.length} murid)`;
      
      // Define columns for export (removed login-related fields)
      const columns = [
        { key: 'nis', header: 'NIS' },
        { key: 'namaLengkap', header: 'Nama Lengkap' },
        { key: 'kelas', header: 'Kelas' },
        { key: 'jurusan', header: 'Jurusan' },
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
        },
        { key: 'tempatLahir', header: 'Tempat Lahir' },
        { key: 'nomorHP', header: 'No. HP' },
        { key: 'alamat', header: 'Alamat' },
        { key: 'namaOrtu', header: 'Nama Orang Tua' },
        { key: 'nomorHPOrtu', header: 'HP Orang Tua' }
      ];

      const subtitle = `Laporan Data Murid - Total: ${dataToExport.length} murid`;
      
      // Use the regular export function with custom columns
      const success = await ExportService.exportCustomData(dataToExport, columns, title, 'data-murid', subtitle);
      
      if (success) {
        Alert.alert(
          'Export Berhasil', 
          `Data ${dataToExport.length} murid berhasil diexport ke PDF.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error exporting students:', error);
      Alert.alert('Error', 'Gagal mengexport data murid');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveStudent = async () => {
    if (!formData.namaLengkap || !formData.nis || !formData.nisn) {
      Alert.alert('Error', 'Nama, NIS, dan NISN wajib diisi');
      return;
    }

    const isDuplicate = students.some(student => 
        student.namaLengkap.toLowerCase() === formData.namaLengkap.toLowerCase() &&
        student.kelas === formData.kelas &&
        (!editingStudent || student.id !== editingStudent.id) // Abaikan murid yang sedang diedit
    );

    if (isDuplicate) {
        Alert.alert('Error', `Murid dengan nama "${formData.namaLengkap}" sudah ada di kelas ${formData.kelas}.`);
        return;
    }

    try {
      setSaving(true);
      
      const studentData = {
        ...formData
      };
      
      const adminName = await AsyncStorage.getItem('adminName') || 'Admin';
      
      if (editingStudent) {
        await MuridService.updateMurid(editingStudent.id, studentData, adminName);
        setStudents(
          students.map((s) => (s.id === editingStudent.id ? { ...studentData, id: editingStudent.id } : s))
        );
        Alert.alert('Berhasil', 'Data murid berhasil diperbarui');
        
        const adminId = await AsyncStorage.getItem('adminId') || 'admin';
        createNotification('admin', `Data Murid ${studentData.namaLengkap} berhasil diperbarui.`, {
          name: adminName,
          type: 'admin',
          id: adminId
        });
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        });
        const studentMessage = `📝 Data profil Anda telah diperbarui oleh ${adminName} pada ${dateStr} pukul ${timeStr}. Silakan periksa informasi terbaru di menu profil Anda.`;
        createNotification(editingStudent.id, studentMessage, {
          name: adminName,
          type: 'admin',
          id: adminId
        });
      } else {
        const newStudentId = await MuridService.addMurid(studentData, adminName);
        const newStudent = {
          ...studentData,
          id: studentData.nis, // Menggunakan NIS sebagai ID
        };
        setStudents([...students, newStudent]);
        Alert.alert('Berhasil', 'Data murid berhasil ditambahkan');
        const adminId = await AsyncStorage.getItem('adminId') || 'admin';
        createNotification('admin', `Murid baru ${studentData.namaLengkap} berhasil ditambahkan.`, {
          name: adminName,
          type: 'admin',
          id: adminId
        });
      }

      setIsModalVisible(false);
      setFormData({
        namaLengkap: '',
        nis: '',
        nisn: '',
        jenisKelamin: 'Laki-laki',
        tempatLahir: '',
        tanggalLahir: '',
        tingkat: 'X',
        kelasNumber: '1',
        kelas: 'X TKJ 1',
        rombel: 'X TKJ 1',
        jurusan: 'TKJ',
        tahunMasuk: new Date().getFullYear().toString(),
        statusSiswa: 'Aktif',
        nomorHP: '',
        alamat: '',
        namaOrtu: '',
        nomorHPOrtu: '',
        nomorHPWali: '',
        fotoUrl: '',
      });
      setEditingStudent(null);
    } catch (error) {
      
      Alert.alert('Error', 'Gagal menyimpan data murid: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Aktif':
        return {
          backgroundColor: '#dcfce7',
          borderColor: '#bbf7d0',
          textColor: '#16a34a',
        };
      case 'Tidak Aktif':
        return {
          backgroundColor: '#fee2e2',
          borderColor: '#fecaca',
          textColor: '#dc2626',
        };
      case 'Lulus':
        return {
          backgroundColor: '#dbeafe',
          borderColor: '#bfdbfe',
          textColor: '#2563eb',
        };
      case 'Pindah':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#fde68a',
          textColor: '#d97706',
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          borderColor: '#e5e7eb',
          textColor: '#6b7280',
        };
    }
  };

  const renderTableHeader = () => {
    return (
      <View style={styles.tableHeader}>
        <View style={[styles.tableCell, styles.checkboxCell]}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={handleSelectAll}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, selectAll && styles.checkboxChecked]}>
              {selectAll && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
          </TouchableOpacity>
        </View>
        <View style={[styles.tableCell, styles.studentInfoCell]}>
          <Text style={styles.tableHeaderText}>Murid</Text>
        </View>
        <View style={[styles.tableCell, styles.classCell]}>
          <Text style={styles.tableHeaderText}>Kelas</Text>
        </View>
        <View style={[styles.tableCell, styles.birthPlaceCell]}>
          <Text style={styles.tableHeaderText}>Tempat Lahir</Text>
        </View>
        <View style={[styles.tableCell, styles.birthDateCell]}>
          <Text style={styles.tableHeaderText}>Tanggal Lahir</Text>
        </View>
        <View style={[styles.tableCell, styles.phoneCell]}>
          <Text style={styles.tableHeaderText}>No. HP</Text>
        </View>
        <View style={[styles.tableCell, styles.actionCell]}>
          <Text style={styles.tableHeaderText}>Aksi</Text>
        </View>
      </View>
    );
  };

  const StudentRow = React.memo(({ item, isSelected, onSelectStudent, onEditStudent, onDeleteStudent }) => {
    const handleSelectPress = () => {
      onSelectStudent(item.id);
    };

    const handleEditPress = () => {
      onEditStudent(item);
    };

    const handleDeletePress = () => {
      onDeleteStudent(item.id);
    };

    const avatarInitials = item.namaLengkap 
      ? item.namaLengkap.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase() 
      : 'MR';

    const formattedBirthDate = formatDateToIndonesian(item.tanggalLahir) || '-';
    
    return (
      <View style={[styles.tableRow, isSelected && styles.selectedRow]}>
        {/* Checkbox Column */}
        <View style={[styles.tableCell, styles.checkboxCell]}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={handleSelectPress}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Student Info Column */}
        <View style={[styles.tableCell, styles.studentInfoCell]}>
          <View style={styles.studentInfo}>
            <View style={styles.avatarContainer}>
              {(item.profileImage || item.fotoUrl) ? (
                <Image
                  source={{ uri: item.profileImage || item.fotoUrl }}
                  style={styles.avatar}
                  onError={() => {
                    console.log('Student profile image failed to load');
                  }}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {avatarInitials}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentNis} numberOfLines={1}>
                NIS: {item.nis || '-'}
              </Text>
              <Text style={styles.studentName} numberOfLines={1}>
                {item.namaLengkap || '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Class Column */}
        <View style={[styles.tableCell, styles.classCell]}>
          <Text style={styles.tableCellText}>{item.kelas || '-'}</Text>
        </View>

        {/* Birth Place Column */}
        <View style={[styles.tableCell, styles.birthPlaceCell]}>
          <Text style={styles.tableCellText} numberOfLines={1}>
            {item.tempatLahir || '-'}
          </Text>
        </View>

        {/* Birth Date Column */}
        <View style={[styles.tableCell, styles.birthDateCell]}>
          <Text style={styles.tableCellText}>
            {formattedBirthDate}
          </Text>
        </View>

        {/* Phone Column */}
        <View style={[styles.tableCell, styles.phoneCell]}>
          <Text style={styles.tableCellText}>
            {item.nomorHP || '-'}
          </Text>
        </View>

        {/* Action Column */}
        <View style={[styles.tableCell, styles.actionCell]}>
          <View style={styles.actionButtons}>
            <ProtectedComponent permission={PermissionService.PERMISSIONS.EDIT_DATA} showFallback={false}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={handleEditPress}
              >
                <Ionicons name="create" size={16} color="white" />
              </TouchableOpacity>
            </ProtectedComponent>
            <ProtectedComponent permission={PermissionService.PERMISSIONS.DELETE_DATA} showFallback={false}>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeletePress}
              >
                <Ionicons name="trash" size={16} color="white" />
              </TouchableOpacity>
            </ProtectedComponent>
          </View>
        </View>
      </View>
    );
  }, (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.namaLengkap === nextProps.item.namaLengkap &&
      prevProps.item.nis === nextProps.item.nis &&
      prevProps.item.kelas === nextProps.item.kelas &&
      prevProps.item.tempatLahir === nextProps.item.tempatLahir &&
      prevProps.item.tanggalLahir === nextProps.item.tanggalLahir &&
      prevProps.item.nomorHP === nextProps.item.nomorHP &&
      prevProps.item.fotoUrl === nextProps.item.fotoUrl &&
      prevProps.item.profileImage === nextProps.item.profileImage &&
      prevProps.isSelected === nextProps.isSelected
    );
  });

  const renderStudentRow = useCallback(({ item }) => {
    const isSelected = selectedStudents.has(item.id);
    
    return (
      <StudentRow
        item={item}
        isSelected={isSelected}
        onSelectStudent={handleSelectStudent}
        onEditStudent={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
      />
    );
  }, [selectedStudents, handleSelectStudent, handleEditStudent, handleDeleteStudent]);


  const getItemLayout = useCallback((data, index) => ({
    length: 80, // Fixed row height
    offset: 80 * index,
    index,
  }), []);

  const keyExtractor = useCallback((item) => item.id, []);

  if (loading) {
    return (
      <View style={[commonStyles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={commonStyles.loadingText}>Memuat Murid...</Text>
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, { flex: 1 }]}>
      {/* Search Bar */}
      <View style={[commonStyles.searchContainer, { marginHorizontal: 0, marginTop: 0 }]}>
        <Ionicons name="search" size={20} color="#999" style={commonStyles.searchIcon} />
        <TextInput
          style={[commonStyles.searchInput, { color: '#2c3e50' }]}
          placeholder="Cari murid berdasarkan nama, NIS, atau kelas..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Students Table */}
      <View style={[styles.tableContainer, { marginHorizontal: 0, marginTop: 0, flex: 1 }]}>
        <ScrollView 
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.tableContent}>
            {renderTableHeader()}
            <FlatList
              data={filteredStudents}
              renderItem={renderStudentRow}
              keyExtractor={keyExtractor}
              getItemLayout={getItemLayout}
              extraData={selectedStudents}
              contentContainerStyle={filteredStudents.length === 0 ? styles.emptyListContainer : styles.listContainer}
              showsVerticalScrollIndicator={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4A90E2']}
                  progressBackgroundColor="#ffffff"
                />
              }
              initialNumToRender={15}
              windowSize={10}
              maxToRenderPerBatch={15}
              updateCellsBatchingPeriod={100}
              removeClippedSubviews={false}
              nestedScrollEnabled={true}
            />
          </View>
        </ScrollView>
      </View>



      {/* Add/Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={commonStyles.modalContainer}>
          <View style={commonStyles.modalHeader}>
            <Text style={commonStyles.modalTitle}>
              {editingStudent ? 'Edit Murid' : 'Tambah Murid'}
            </Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={commonStyles.modalContent}>
            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>NIS *</Text>
              <TextInput
                style={[commonStyles.input, { color: '#2c3e50' }]}
                value={formData.nis}
                onChangeText={(text) => setFormData({ ...formData, nis: text })}
                placeholder="Masukkan NIS"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Nama Lengkap *</Text>
              <TextInput
                style={[commonStyles.input, { color: '#2c3e50' }]}
                value={formData.namaLengkap}
                onChangeText={(text) => setFormData({ ...formData, namaLengkap: text })}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>NISN *</Text>
              <TextInput
                style={[commonStyles.input, { color: '#2c3e50' }]}
                value={formData.nisn}
                onChangeText={(text) => setFormData({ ...formData, nisn: text })}
                placeholder="Masukkan NISN"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Jenis Kelamin *</Text>
              <View style={commonStyles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.jenisKelamin}
                  onValueChange={(value) => setFormData({ ...formData, jenisKelamin: value })}
                  style={commonStyles.picker}
                  itemStyle={commonStyles.pickerItem}
                >
                  <RNPicker.Item label="Laki-laki" value="Laki-laki" />
                  <RNPicker.Item label="Perempuan" value="Perempuan" />
                </RNPicker>
              </View>
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Tempat Lahir</Text>
              <TextInput
                style={[commonStyles.input, { color: '#2c3e50' }]}
                value={formData.tempatLahir}
                onChangeText={(text) => setFormData({ ...formData, tempatLahir: text })}
                placeholder="Masukkan tempat lahir"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Tanggal Lahir</Text>
              <TouchableOpacity
                style={commonStyles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={commonStyles.datePickerText}>
                  {formData.tanggalLahir ? formatDateToIndonesian(formData.tanggalLahir) : 'Pilih tanggal lahir'}
                </Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={getDateFromFormData()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Tingkat *</Text>
              <View style={commonStyles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.tingkat || 'X'}
                  placeholder="-"
                  onValueChange={(value) => {
                    const newKelas = `${value} ${formData.jurusan} ${formData.kelasNumber || '1'}`;
                    setFormData({ 
                      ...formData, 
                      tingkat: value,
                      kelas: newKelas,
                      rombel: newKelas
                    });
                  }}
                  style={commonStyles.picker}
                  itemStyle={commonStyles.pickerItem}
                >
                  <RNPicker.Item label="X (Kelas 10)" value="X" />
                  <RNPicker.Item label="XI (Kelas 11)" value="XI" />
                  <RNPicker.Item label="XII (Kelas 12)" value="XII" />
                </RNPicker>
              </View>
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Nomor Kelas *</Text>
              <View style={commonStyles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.kelasNumber || '1'}
                  placeholder="-"
                  onValueChange={(value) => {
                    const newKelas = `${formData.tingkat || 'X'} ${formData.jurusan} ${value}`;
                    setFormData({ 
                      ...formData, 
                      kelasNumber: value,
                      kelas: newKelas,
                      rombel: newKelas
                    });
                  }}
                  style={commonStyles.picker}
                  itemStyle={commonStyles.pickerItem}
                >
                  <RNPicker.Item label="1" value="1" />
                  <RNPicker.Item label="2" value="2" />
                </RNPicker>
              </View>
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Jurusan</Text>
              <View style={commonStyles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.jurusan}
                  onValueChange={(value) => {
                    const newKelas = `${formData.tingkat || 'X'} ${value} ${formData.kelasNumber || '1'}`;
                    const newEmail = formData.username ? `${formData.username}@murid.${value.toLowerCase()}.sch.id` : '';
                    setFormData({ 
                      ...formData, 
                      jurusan: value,
                      kelas: newKelas,
                      rombel: newKelas,
                      email: newEmail
                    });
                  }}
                  style={commonStyles.picker}
                  itemStyle={commonStyles.pickerItem}
                >
                  <RNPicker.Item label="TKJ - Teknik Komputer Jaringan" value="TKJ" />
                  <RNPicker.Item label="TKR - Teknik Kendaraan Ringan" value="TKR" />
                </RNPicker>
              </View>
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Tahun Masuk</Text>
              <TextInput
                style={[commonStyles.input, { color: '#2c3e50' }]}
                value={formData.tahunMasuk}
                onChangeText={(text) => setFormData({ ...formData, tahunMasuk: text })}
                placeholder="Masukkan tahun masuk"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Status Murid</Text>
              <View style={commonStyles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.statusSiswa}
                  onValueChange={(value) => setFormData({ ...formData, statusSiswa: value })}
                  style={commonStyles.picker}
                  itemStyle={commonStyles.pickerItem}
                >
                  <RNPicker.Item label="Aktif" value="Aktif" />
                  <RNPicker.Item label="Tidak Aktif" value="Tidak Aktif" />
                  <RNPicker.Item label="Lulus" value="Lulus" />
                  <RNPicker.Item label="Pindah" value="Pindah" />
                </RNPicker>
              </View>
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Telepon Murid</Text>
              <TextInput
                style={[commonStyles.input, { color: '#2c3e50' }]}
                value={formData.nomorHP}
                onChangeText={(text) => setFormData({ ...formData, nomorHP: text })}
                placeholder="Masukkan nomor telepon murid"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>



            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Alamat</Text>
              <TextInput
                style={[commonStyles.input, commonStyles.textArea, { color: '#2c3e50' }]}
                value={formData.alamat}
                onChangeText={(text) => setFormData({ ...formData, alamat: text })}
                placeholder="Masukkan alamat lengkap"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                autoCapitalize="sentences"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Nama Orang Tua</Text>
              <TextInput
                style={[commonStyles.input, { color: '#2c3e50' }]}
                value={formData.namaOrtu}
                onChangeText={(text) => setFormData({ ...formData, namaOrtu: text })}
                placeholder="Masukkan nama orang tua"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Telepon Orang Tua</Text>
              <TextInput
                style={[commonStyles.input, { color: '#2c3e50' }]}
                value={formData.nomorHPOrtu}
                onChangeText={(text) => setFormData({ ...formData, nomorHPOrtu: text })}
                placeholder="Masukkan nomor telepon orang tua"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Nomor HP Wali</Text>
              <TextInput
                style={[commonStyles.input, { color: '#2c3e50' }]}
                value={formData.nomorHPWali}
                onChangeText={(text) => setFormData({ ...formData, nomorHPWali: text })}
                placeholder="Masukkan nomor HP wali"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>URL Foto</Text>
              <TextInput
                style={[commonStyles.input, { color: '#2c3e50' }]}
                value={formData.fotoUrl}
                onChangeText={(text) => setFormData({ ...formData, fotoUrl: text })}
                placeholder="Masukkan URL foto (opsional)"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>
          </ScrollView>

          <View style={commonStyles.modalFooter}>
            <TouchableOpacity
              style={[commonStyles.modalButton, commonStyles.cancelButton]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={commonStyles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.modalButton, commonStyles.saveButton, saving && commonStyles.saveButtonDisabled]}
              onPress={handleSaveStudent}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size={16} color="white" />
              ) : (
                <Text style={commonStyles.saveButtonText}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Detail Modal */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={commonStyles.detailModalOverlay}>
          <View style={commonStyles.detailModalContainer}>
            <View style={commonStyles.detailModalHeader}>
              <Text style={commonStyles.detailModalTitle}>Detail Murid</Text>
              <TouchableOpacity onPress={() => setIsDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedStudent && (
              <>
                <View style={commonStyles.profileHeader}>
                  <View style={commonStyles.profileAvatarContainer}>
                    {selectedStudent.fotoUrl ? (
                      <Image 
                        source={{ uri: selectedStudent.fotoUrl }} 
                        style={commonStyles.profileAvatar} 
                        defaultSource={require('../../assets/logo/student.png')}
                      />
                    ) : (
                      <Ionicons name="person" size={36} color="#ffffff" />
                    )}
                  </View>
                  <View style={commonStyles.profileInfo}>
                    <Text style={commonStyles.profileSubtitle}>NIS: {selectedStudent.nis || '-'}</Text>
                    <Text style={commonStyles.profileName}>{selectedStudent.namaLengkap || '-'}</Text>
                    <View style={commonStyles.profileBadge}>
                      <Text style={commonStyles.profileBadgeText}>{selectedStudent.statusSiswa || 'Aktif'}</Text>
                    </View>
                  </View>
                </View>
                
                <ScrollView style={commonStyles.detailModalContent}>
                  <View style={commonStyles.detailCard}>
                    <View style={commonStyles.cardHeaderRow}>
                      <Ionicons name="person" size={20} color="#4A90E2" />
                      <Text style={commonStyles.cardTitle}>Informasi Personal</Text>
                    </View>
                    <View style={commonStyles.detailRows}>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>NIS</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.nis || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Nama Lengkap</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.namaLengkap || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>NISN</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.nisn || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Jenis Kelamin</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.jenisKelamin || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Tempat Lahir</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.tempatLahir || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Tanggal Lahir</Text>
                        <Text style={commonStyles.detailValue}>
                          {formatDateToIndonesian(selectedStudent.tanggalLahir)}
                        </Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Alamat</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.alamat || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>No. HP</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.nomorHP || '-'}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={commonStyles.detailCard}>
                    <View style={commonStyles.cardHeaderRow}>
                      <Ionicons name="school" size={20} color="#4A90E2" />
                      <Text style={commonStyles.cardTitle}>Informasi Akademik</Text>
                    </View>
                    <View style={commonStyles.detailRows}>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Kelas</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.kelas || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Jurusan</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.jurusan || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Tahun Masuk</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.tahunMasuk || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Status Siswa</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.statusSiswa || 'Aktif'}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={commonStyles.detailCard}>
                    <View style={commonStyles.cardHeaderRow}>
                      <Ionicons name="people" size={20} color="#4A90E2" />
                      <Text style={commonStyles.cardTitle}>Informasi Orang Tua</Text>
                    </View>
                    <View style={commonStyles.detailRows}>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Nama Orang Tua</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.namaOrtu || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>No. HP Orang Tua</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.nomorHPOrtu || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>No. HP Wali</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.nomorHPWali || '-'}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={commonStyles.detailCard}>
                    <View style={commonStyles.cardHeaderRow}>
                      <Ionicons name="key" size={20} color="#4A90E2" />
                      <Text style={commonStyles.cardTitle}>Informasi Akun</Text>
                    </View>
                    <View style={commonStyles.detailRows}>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Username</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.username || '-'}</Text>
                      </View>
                      <View style={commonStyles.detailRow}>
                        <Text style={commonStyles.detailLabel}>Email</Text>
                        <Text style={commonStyles.detailValue}>{selectedStudent.email || '-'}</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* FAB Button to Delete All Students */}
      <ProtectedComponent permission={PermissionService.PERMISSIONS.DELETE_DATA} showFallback={false}>
        <TouchableOpacity
          style={styles.fabDeleteAllStudents}
          onPress={handleDeleteAllStudents}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      </ProtectedComponent>

      {/* FAB Button to Export Students - Show only to non-Kaprodi roles */}
      {!(userRole === 'kaprodi_tkj' || userRole === 'kaprodi_tkr') && (
        <TouchableOpacity
          style={[styles.fabExportStudents, isExporting && styles.fabDisabled]}
          onPress={handleExportStudents}
          disabled={isExporting}
          activeOpacity={0.8}
        >
          {isExporting ? (
            <ActivityIndicator size={24} color="white" />
          ) : (
            <Ionicons name="download" size={24} color="white" />
          )}
        </TouchableOpacity>
      )}

      {/* FAB Button to Generate Dummy Students */}
      <ProtectedComponent permission={PermissionService.PERMISSIONS.CREATE_DATA} showFallback={false}>
        <TouchableOpacity
          style={styles.fabGenerateStudents}
          onPress={generateDummyStudents}
          activeOpacity={0.8}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size={24} color="white" />
          ) : (
            <Ionicons name="people" size={24} color="white" />
          )}
        </TouchableOpacity>
      </ProtectedComponent>

      {/* FAB Button to Add Student */}
      <ProtectedComponent permission={PermissionService.PERMISSIONS.CREATE_DATA} showFallback={false}>
        <TouchableOpacity
          style={styles.fabAddStudent}
          onPress={handleAddStudent}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </ProtectedComponent>

    </View>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 0,
  },
  tableContent: {
    minWidth: 770, // Increased to accommodate checkbox column
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  tableHeaderText: {
    fontSize: 13,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#374151',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 80, // Fixed height for getItemLayout optimization
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  checkboxCell: {
    width: 50, // Width for checkbox column
    alignItems: 'center',
  },
  studentInfoCell: {
    width: 200, // Reduced width for student info
  },
  classCell: {
    width: 90, // Reduced width for class
  },
  birthPlaceCell: {
    width: 110, // Reduced width for birth place
  },
  birthDateCell: {
    width: 100, // Reduced width for birth date
  },
  phoneCell: {
    width: 120, // Reduced width for phone
  },
  actionCell: {
    width: 100, // Reduced width for actions
    alignItems: 'center',
    borderRightWidth: 0, // Remove right border for last column
  },
  selectedRow: {
    backgroundColor: '#f0f9ff',
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  fabWithBadge: {
    position: 'relative',
  },
  fabBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  fabBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: getSafeFont('Nunito_700Bold'),
    fontSize: 12,
    color: '#4b5563',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#1f2937',
    marginBottom: 2,
  },
  studentNis: {
    fontSize: 11,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#6b7280',
  },
  tableCellText: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#374151',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
  },
  fabGenerate: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabAddStudent: {
    position: 'absolute',
    bottom: 144,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabGenerateStudents: {
    position: 'absolute',
    bottom: 208,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabExportStudents: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabDeleteAllStudents: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabDisabled: {
    opacity: 0.6,
  },
});
