import { createNotification } from '../../services/notificationService';
import { Timestamp } from 'firebase/firestore';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
import DropDownPicker from 'react-native-dropdown-picker';
import GuruService from '../../services/GuruService';
import MataPelajaranService from '../../services/MataPelajaranService';
import KelasJurusanService from '../../services/KelasJurusanService';
import DataTable from '../../components/DataTable';
import SearchBar from '../../components/SearchBar';
import { commonStyles } from '../../styles/commonStyles';
import { getSafeFont } from '../../utils/fontUtils';
import ProtectedComponent from '../../components/ProtectedComponent';
import PermissionService from '../../services/PermissionService';
import ExportService from '../../services/ExportService';

const GuruManagementPage = memo(function GuruManagementPage({ onGoBack }) {
  const navigation = useNavigation();
  
  const [teachers, setTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [mataPelajaranOpen, setMataPelajaranOpen] = useState(false);
  const [mataPelajaranItems, setMataPelajaranItems] = useState([]);
  const [mataPelajaranLoading, setMataPelajaranLoading] = useState(true);
  const [kelasAmpuOpen, setKelasAmpuOpen] = useState(false);
  const [kelasAmpuItems, setKelasAmpuItems] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  // Memoized computed values
  const memoizedFilteredTeachers = useMemo(() => {
    if (!searchQuery) return teachers;
    return teachers.filter(teacher => 
      teacher.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.nip?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.mataPelajaran?.some(mp => mp.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [teachers, searchQuery]);

  // Memoized form validation
  const formValidation = useMemo(() => {
    const errors = {};
    // Early return if formData is not initialized
    if (!formData) return errors;
    
    if (!formData?.namaLengkap?.trim()) errors.namaLengkap = 'Nama lengkap wajib diisi';
    if (!formData?.nip?.trim()) errors.nip = 'NIP wajib diisi';
    if (formData?.nomorHP && !validatePhoneNumber(formData.nomorHP)) errors.nomorHP = 'Format nomor HP tidak valid';
    return errors;
  }, [formData]);


  const [formData, setFormData] = useState({
    namaLengkap: '',
    nip: '',
    fotoUrl: '',
    jenisKelamin: '',
    tempatLahir: '',
    tanggalLahir: '',
    alamat: '',
    nomorHP: '',
    pendidikanTerakhir: '',
    mataPelajaran: [],
    kelasAmpu: [],
    tingkatanMengajar: {},
    jabatan: '',
    waliKelas: '',
    statusKepegawaian: '',
  });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const re = /^[0-9]{10,13}$/;
    return re.test(phone);
  };

  const convertMataPelajaranToDropdownFormat = (mataPelajaranArray) => {
    if (!Array.isArray(mataPelajaranArray)) return [];
    return mataPelajaranArray.map(mapel => {
      const matchingItem = mataPelajaranItems.find(item => item.originalName === mapel);
      return matchingItem ? matchingItem.value : mapel;
    });
  };

  const convertDropdownFormatToMataPelajaran = (dropdownValues) => {
    if (!Array.isArray(dropdownValues)) return [];
    return dropdownValues.map(value => {
      const matchingItem = mataPelajaranItems.find(item => item.value === value);
      return matchingItem ? matchingItem.originalName : value;
    });
  };

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

const loadTeachers = async () => {
    try {
      // Coba ambil mata pelajaran dari Firestore dulu
      const firestoreMapel = await MataPelajaranService.getMataPelajaranFromFirestore();
      
      let allItems = [];
      
      if (firestoreMapel.length > 0) {
        // Jika ada data di Firestore, gunakan itu
        allItems = firestoreMapel.map((mapel, index) => ({
          label: mapel.nama,
          value: `firestore_${index}_${mapel.nama}`,
          category: mapel.kelompok,
          originalName: mapel.nama
        }));
      } else {
        // Jika tidak ada data di Firestore, gunakan data statis
        const categorizedMapel = MataPelajaranService.getAllMataPelajaranWithCategories();
        const formatItems = (list, prefix, categoryCode) =>
          list.map((item, index) => ({ 
            label: `${prefix} - ${item}`, 
            value: `${categoryCode}_${index}_${item}`,
            category: categoryCode,
            originalName: item
          }));
        
        allItems = [
          ...formatItems(categorizedMapel.umum, 'Umum', 'UMUM'),
          ...formatItems(categorizedMapel.tkj, 'TKJ', 'TKJ'),
          ...formatItems(categorizedMapel.tkr, 'TKR', 'TKR'),
        ];
      }
      
      setMataPelajaranItems(allItems);
      setMataPelajaranLoading(false);

      // Ambil data kelas dinamis dari service
      const kelasData = await KelasJurusanService.getKelasJurusanData();
      const kelasItems = [];
      if (kelasData && kelasData.kelas) {
        for (const jurusan in kelasData.kelas) {
          kelasData.kelas[jurusan].forEach(kelasName => {
            kelasItems.push({ label: kelasName, value: kelasName });
          });
        }
      }

      if (kelasItems.length === 0) {
        // fallback ke data statis jika kosong
        kelasItems.push(...[
          { label: 'X TKJ 1', value: 'X TKJ 1' },
          { label: 'X TKJ 2', value: 'X TKJ 2' },
          { label: 'X TKR 1', value: 'X TKR 1' },
          { label: 'X TKR 2', value: 'X TKR 2' },
          { label: 'XI TKJ 1', value: 'XI TKJ 1' },
          { label: 'XI TKJ 2', value: 'XI TKJ 2' },
          { label: 'XI TKR 1', value: 'XI TKR 1' },
          { label: 'XI TKR 2', value: 'XI TKR 2' },
          { label: 'XII TKJ 1', value: 'XII TKJ 1' },
          { label: 'XII TKJ 2', value: 'XII TKJ 2' },
          { label: 'XII TKR 1', value: 'XII TKR 1' },
          { label: 'XII TKR 2', value: 'XII TKR 2' },
        ]);
      }
      setKelasAmpuItems(kelasItems);

      try {
        setLoading(true);
        const teachersData = await GuruService.getAllGuru();
        const processedTeachers = teachersData.map(teacher => ({
          ...teacher,
          namaLengkap: teacher.namaLengkap || '',
          nip: teacher.nip || '',
          tanggalLahir: teacher.tanggalLahir instanceof Timestamp 
            ? teacher.tanggalLahir.toDate().toISOString().split('T')[0]
            : (typeof teacher.tanggalLahir === 'string' ? teacher.tanggalLahir : ''),
          createdAt: teacher.createdAt instanceof Timestamp 
            ? teacher.createdAt.toDate().toISOString()
            : (typeof teacher.createdAt === 'string' ? teacher.createdAt : ''),
          updatedAt: teacher.updatedAt instanceof Timestamp 
            ? teacher.updatedAt.toDate().toISOString()
            : (typeof teacher.updatedAt === 'string' ? teacher.updatedAt : ''),
          mataPelajaran: Array.isArray(teacher.mataPelajaran) ? teacher.mataPelajaran : [],
          kelasAmpu: Array.isArray(teacher.kelasAmpu) ? teacher.kelasAmpu : [],
          statusKepegawaian: teacher.statusKepegawaian || 'Honorer',
          jabatan: teacher.jabatan || 'Guru',
        }));
        setTeachers(processedTeachers);
      } catch (error) {
        Alert.alert('Error', 'Gagal memuat data guru: ' + error.message);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading mata pelajaran or kelas:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTeachers();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTeachers();
    setRefreshing(false);
  }, []);


  const filterTeachers = useCallback(() => {
    let filtered = [...teachers];
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((teacher) => {
        try {
          return (
            (teacher.namaLengkap || '').toLowerCase().includes(query) ||
            (teacher.nip || '').toLowerCase().includes(query) ||
            (Array.isArray(teacher.mataPelajaran) && teacher.mataPelajaran.some(mapel => (mapel || '').toLowerCase().includes(query))) ||
            (Array.isArray(teacher.kelasAmpu) && teacher.kelasAmpu.some(kelas => (kelas || '').toLowerCase().includes(query))) ||
            (teacher.jabatan || '').toLowerCase().includes(query)
          );
        } catch (error) {
          
          return false;
        }
      });
    }
    
    filtered.sort((a, b) => {
      const aValue = (a.namaLengkap || '').toLowerCase();
      const bValue = (b.namaLengkap || '').toLowerCase();
      return aValue.localeCompare(bValue);
    });
    
    setFilteredTeachers(filtered);
  }, [searchQuery, teachers]);

  useEffect(() => {
    filterTeachers();
  }, [filterTeachers]);

  const formatDateToIndonesian = useCallback((dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  }, []);

  const onDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, tanggalLahir: formattedDate }));
    }
  }, []);

  const getDateFromFormData = useCallback(() => {
    try {
      return formData.tanggalLahir ? new Date(formData.tanggalLahir) : new Date();
    } catch {
      return new Date();
    }
  }, [formData.tanggalLahir]);


  const handleAddTeacher = useCallback(() => {
    setEditingTeacher(null);
    setShowValidationErrors(false);
    setFormData({
      namaLengkap: '',
      nip: '',
      fotoUrl: '',
      jenisKelamin: '',
      tempatLahir: '',
      tanggalLahir: '',
      alamat: '',
      nomorHP: '',
      pendidikanTerakhir: '',
      mataPelajaran: [],
      kelasAmpu: [],
      tingkatanMengajar: {},
      jabatan: '',
      waliKelas: '',
      statusKepegawaian: '',
    });
    setIsModalVisible(true);
  }, []);

  const handleDetailTeacher = useCallback((teacher) => {
    setSelectedTeacher(teacher);
    setIsDetailModalVisible(true);
  }, []);

  const handleEditTeacher = useCallback((teacher) => {
    setEditingTeacher(teacher);
    setShowValidationErrors(false);
    setFormData({
      namaLengkap: teacher.namaLengkap || '',
      nip: teacher.nip || '',
      fotoUrl: teacher.fotoUrl || '',
      jenisKelamin: teacher.jenisKelamin || '',
      tempatLahir: teacher.tempatLahir || '',
      tanggalLahir: teacher.tanggalLahir || '',
      alamat: teacher.alamat || '',
      nomorHP: teacher.nomorHP || '',
      pendidikanTerakhir: teacher.pendidikanTerakhir || '',
      mataPelajaran: convertMataPelajaranToDropdownFormat(Array.isArray(teacher.mataPelajaran) ? teacher.mataPelajaran : []),
      kelasAmpu: Array.isArray(teacher.kelasAmpu) ? teacher.kelasAmpu : [],
      tingkatanMengajar: teacher.tingkatanMengajar || {},
      jabatan: teacher.jabatan || '',
      waliKelas: teacher.waliKelas || '',
      statusKepegawaian: teacher.statusKepegawaian || '',
    });
    setIsModalVisible(true);
  }, [convertMataPelajaranToDropdownFormat]);

  const handleDeleteTeacher = useCallback((teacherId) => {
    Alert.alert(
      'Hapus Guru',
      'Apakah Anda yakin ingin menghapus data guru ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await GuruService.deleteGuru(teacherId);
              const senderInfo = { name: 'Administrator', type: 'admin', id: 'admin' };
              createNotification('admin', `Data Guru dengan ID ${teacherId} telah dihapus.`, senderInfo);
              setTeachers(prev => prev.filter((t) => t.id !== teacherId));
              Alert.alert('Berhasil', 'Data guru berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus data guru: ' + error.message);
            }
          },
        },
      ]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedTeachers(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredTeachers.map(teacher => teacher.id));
      setSelectedTeachers(allIds);
      setSelectAll(true);
    }
  }, [selectAll, filteredTeachers]);

  const handleSelectTeacher = useCallback((teacherId) => {
    setSelectedTeachers(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(teacherId)) {
        newSelected.delete(teacherId);
      } else {
        newSelected.add(teacherId);
      }
      setSelectAll(newSelected.size === filteredTeachers.length);
      return newSelected;
    });
  }, [filteredTeachers.length]);

  const handleDeleteSelected = useCallback(() => {
    const selectedCount = selectedTeachers.size;
    if (selectedCount === 0) {
      Alert.alert('Peringatan', 'Pilih minimal satu guru untuk dihapus');
      return;
    }

    Alert.alert(
      'Hapus Guru Terpilih',
      `Apakah Anda yakin ingin menghapus ${selectedCount} guru yang dipilih?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const selectedIds = Array.from(selectedTeachers);
              await Promise.all(selectedIds.map(id => GuruService.deleteGuru(id)));
              const senderInfo = { name: 'Administrator', type: 'admin', id: 'admin' };
              createNotification('admin', `${selectedCount} Guru berhasil dihapus.`, senderInfo);
              setTeachers(teachers.filter(t => !selectedTeachers.has(t.id)));
              setSelectedTeachers(new Set());
              setSelectAll(false);
              Alert.alert('Berhasil', `${selectedCount} guru berhasil dihapus`);
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus guru terpilih: ' + error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [selectedTeachers, teachers]);

  const handleDeleteAllTeachers = useCallback(() => {
    Alert.alert(
      'Hapus Semua Data Guru',
      'Apakah Anda yakin ingin menghapus SEMUA data guru? Tindakan ini tidak dapat dibatalkan!',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const deletedCount = await GuruService.deleteAllGuru();
              setTeachers([]);
              setSelectedTeachers(new Set());
              setSelectAll(false);
              Alert.alert('Berhasil', `${deletedCount} data guru berhasil dihapus`);
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus semua data guru: ' + error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, []);

  const handleExportTeachers = useCallback(async () => {
    try {
      setIsExporting(true);
      
      // Tentukan data yang akan diekspor
      let dataToExport;
      if (selectedTeachers.size > 0) {
        // Jika ada guru yang dipilih, ekspor yang dipilih saja
        dataToExport = teachers.filter(teacher => selectedTeachers.has(teacher.id));
      } else {
        // Jika tidak ada yang dipilih, ekspor semua data yang sedang ditampilkan (sesuai filter pencarian)
        dataToExport = filteredTeachers;
      }

      if (dataToExport.length === 0) {
        Alert.alert('Peringatan', 'Tidak ada data guru untuk diekspor');
        return;
      }

      // Definisi kolom untuk ekspor
      const columns = [
        { key: 'nip', header: 'NIP' },
        { key: 'namaLengkap', header: 'Nama Lengkap' },
        { key: 'jenisKelamin', header: 'L/P' },
        { key: 'tempatLahir', header: 'Tempat Lahir' },
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
        { key: 'alamat', header: 'Alamat' },
        { key: 'nomorHP', header: 'No. HP' },
        { 
          key: 'mataPelajaran', 
          header: 'Mata Pelajaran',
          format: (value) => {
            if (Array.isArray(value) && value.length > 0) {
              return value.join(', ');
            }
            return '-';
          }
        },
        { 
          key: 'kelasAmpu', 
          header: 'Kelas Ampu',
          format: (value) => {
            if (Array.isArray(value) && value.length > 0) {
              return value.join(', ');
            }
            return '-';
          }
        },
        { key: 'jabatan', header: 'Jabatan' },
        { key: 'waliKelas', header: 'Wali Kelas' },
      ];

      // Ekspor menggunakan ExportService
      await ExportService.exportCustomData(
        dataToExport,
        columns,
        'Data Guru - SMK E-SkuulTime',
        selectedTeachers.size > 0 
          ? `Data ${selectedTeachers.size} Guru Terpilih` 
          : `Data ${dataToExport.length} Guru`
      );

      Alert.alert(
        'Berhasil', 
        `Data guru berhasil diekspor ke PDF${selectedTeachers.size > 0 ? ` (${selectedTeachers.size} guru terpilih)` : ` (${dataToExport.length} guru)`}`
      );
    } catch (error) {
      console.error('Error exporting teachers:', error);
      Alert.alert('Error', 'Gagal mengekspor data guru: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  }, [teachers, filteredTeachers, selectedTeachers]);


  const handleSaveTeacher = useCallback(async () => {
    setShowValidationErrors(true);
    
    if (!formData.namaLengkap.trim()) {
      Alert.alert('Error', 'Nama lengkap wajib diisi');
      return;
    }
    if (!formData.nip.trim()) {
      Alert.alert('Error', 'NIP wajib diisi');
      return;
    }
    if (formData.email && !validateEmail(formData.email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }
    if (formData.nomorHP && !validatePhoneNumber(formData.nomorHP)) {
      Alert.alert('Error', 'Format nomor telepon tidak valid (10-13 digit)');
      return;
    }

    try {
      setSaving(true);
      const teacherData = {
        nama: formData.namaLengkap.trim(), // Map namaLengkap to nama for service
        namaLengkap: formData.namaLengkap.trim(), // Include namaLengkap field
        nip: formData.nip.trim(),
        fotoUrl: formData.fotoUrl.trim() || '',
        nomorHP: formData.nomorHP ? formData.nomorHP.trim() : '',
        jenisKelamin: formData.jenisKelamin || '',
        tempatLahir: formData.tempatLahir || '',
        tanggalLahir: formData.tanggalLahir || '',
        alamat: formData.alamat || '',
        pendidikanTerakhir: formData.pendidikanTerakhir || '',
        mataPelajaran: convertDropdownFormatToMataPelajaran(formData.mataPelajaran),
        kelasAmpu: formData.kelasAmpu || [],
        tingkatanMengajar: formData.tingkatanMengajar || {},
        jabatan: formData.jabatan || '',
        waliKelas: formData.waliKelas || '',
        statusKepegawaian: formData.statusKepegawaian || '',
      };

      if (editingTeacher) {
        await GuruService.updateGuru(editingTeacher.id, teacherData);
        setTeachers(prev =>
          prev.map((t) => (t.id === editingTeacher.id ? { ...teacherData, id: editingTeacher.id } : t))
        );
        Alert.alert('Berhasil', 'Data guru berhasil diperbarui');
        
        const senderInfo = { name: 'Administrator', type: 'admin', id: 'admin' };
        createNotification('admin', `Data Guru ${teacherData.namaLengkap} berhasil diperbarui.`, senderInfo);
        
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
        const teacherMessage = `📝 Data profil Anda telah diperbarui oleh admin pada ${dateStr} pukul ${timeStr}. Silakan periksa informasi terbaru di menu profil Anda.`;
        createNotification(editingTeacher.id, teacherMessage, senderInfo, 'data', 'guru');
      } else {
        const newTeacherId = await GuruService.addGuru(teacherData);
        setTeachers(prev => [...prev, { ...teacherData, id: newTeacherId }]);
        Alert.alert('Berhasil', 'Data guru berhasil ditambahkan');
        const senderInfo = { name: 'Administrator', type: 'admin', id: 'admin' };
        createNotification('admin', `Guru Baru ${teacherData.namaLengkap} berhasil ditambahkan.`, senderInfo);
      }

      setIsModalVisible(false);
      setEditingTeacher(null);
      setShowValidationErrors(false);
      setFormData({
        namaLengkap: '',
        nip: '',
        fotoUrl: '',
        jenisKelamin: '',
        tempatLahir: '',
        tanggalLahir: '',
        alamat: '',
        nomorHP: '',
        pendidikanTerakhir: '',
        mataPelajaran: [],
        kelasAmpu: [],
        tingkatanMengajar: {},
        jabatan: '',
        waliKelas: '',
        statusKepegawaian: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data guru: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [formData, editingTeacher]);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setShowValidationErrors(false);
  }, []);


  const tableColumns = [
    {
      key: 'info',
      title: 'Guru',
      style: { width: 200 },
      render: (item) => (
        <View style={styles.teacherInfo}>
          <View style={styles.avatarContainer}>
            {(item.profileImage || item.fotoUrl) ? (
              <Image
                source={{ uri: item.profileImage || item.fotoUrl }}
                style={styles.avatar}
                onError={() => {
                  console.log('Teacher profile image failed to load');
                }}
              />
            ) : (
              <Image
                source={require('../../assets/icon/teachericon.jpg')}
                style={styles.avatar}
                resizeMode="cover"
              />
            )}
          </View>
          <View style={styles.teacherDetails}>
            <Text style={styles.teacherName} numberOfLines={1}>
              {item.namaLengkap || '-'}
            </Text>
            <Text style={styles.teacherNip} numberOfLines={1}>
              NIP: {item.nip || '-'}
            </Text>
          </View>
        </View>
      )
    },
    {
      key: 'statusKepegawaian',
      title: 'Status',
      style: { width: 90 },
      render: (item) => (
        <View style={[
          styles.statusBadge,
          item.statusKepegawaian === 'PNS' ? styles.statusPNS :
          item.statusKepegawaian === 'PPPK' ? styles.statusPPPK : styles.statusHonorer
        ]}>
          <Text style={styles.statusText}>{item.statusKepegawaian || 'Honorer'}</Text>
        </View>
      )
    },
    {
      key: 'mataPelajaran',
      title: 'Mata Pelajaran',
      style: { width: 150 },
      render: (item) => (
        <Text style={styles.tableCellText} numberOfLines={2}>
          {Array.isArray(item.mataPelajaran) && item.mataPelajaran.length > 0
            ? item.mataPelajaran.slice(0, 2).join(', ') + 
              (item.mataPelajaran.length > 2 ? ` (+${item.mataPelajaran.length - 2})` : '')
            : '-'}
        </Text>
      )
    },
    {
      key: 'kelasAmpu',
      title: 'Kelas Ampu',
      style: { width: 120 },
      render: (item) => (
        <Text style={styles.tableCellText} numberOfLines={2}>
          {Array.isArray(item.kelasAmpu) && item.kelasAmpu.length > 0
            ? item.kelasAmpu.slice(0, 2).join(', ') + 
              (item.kelasAmpu.length > 2 ? ` (+${item.kelasAmpu.length - 2})` : '')
            : '-'}
        </Text>
      )
    },
    {
      key: 'jabatan',
      title: 'Jabatan',
      style: { width: 100 },
      numberOfLines: 2
    },
    {
      key: 'nomorHP',
      title: 'No. HP',
      style: { width: 120 }
    }
  ];

  const renderDetailModal = useCallback(() => {
    if (!selectedTeacher) return null;
    
    return (
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailModalVisible(false)}>
        <View style={commonStyles.detailModalOverlay}>
          <View style={commonStyles.detailModalContainer}>
            <View style={commonStyles.detailModalHeader}>
              <Text style={commonStyles.detailModalTitle}>Detail Guru</Text>
              <TouchableOpacity onPress={() => setIsDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={commonStyles.profileHeader}>
              <View style={commonStyles.profileAvatarContainer}>
                {selectedTeacher.fotoUrl ? (
                  <Image 
                    source={{ uri: selectedTeacher.fotoUrl }} 
                    style={commonStyles.profileAvatar} 
                    defaultSource={require('../../assets/icon/teachericon.jpg')} // Fallback image
                  />
                ) : (
                  <Image
                    source={require('../../assets/icon/teachericon.jpg')}
                    style={commonStyles.profileAvatar}
                    resizeMode="cover"
                  />
                )}
              </View>
              <View style={commonStyles.profileInfo}>
                <Text style={commonStyles.profileName}>{selectedTeacher.namaLengkap || '-'}</Text>
                <Text style={commonStyles.profileSubtitle}>NIP: {selectedTeacher.nip || '-'}</Text>
                <View style={commonStyles.profileBadge}>
                  <Text style={commonStyles.profileBadgeText}>{selectedTeacher.statusKepegawaian || 'Honorer'}</Text>
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
                    <Text style={commonStyles.detailLabel}>Nama Lengkap</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.namaLengkap || '-'}</Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>NIP</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.nip || '-'}</Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>Jenis Kelamin</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.jenisKelamin || '-'}</Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>Tempat Lahir</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.tempatLahir || '-'}</Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>Tanggal Lahir</Text>
                    <Text style={commonStyles.detailValue}>
                      {formatDateToIndonesian(selectedTeacher.tanggalLahir)}
                    </Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>Alamat</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.alamat || '-'}</Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>No. HP</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.nomorHP || '-'}</Text>
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
                    <Text style={commonStyles.detailLabel}>Pendidikan Terakhir</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.pendidikanTerakhir || '-'}</Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>Mata Pelajaran</Text>
                    <Text style={commonStyles.detailValue}>
                      {Array.isArray(selectedTeacher.mataPelajaran) && selectedTeacher.mataPelajaran.length
                        ? selectedTeacher.mataPelajaran.join(', ')
                        : '-'}
                    </Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>Kelas Ampu</Text>
                    <Text style={commonStyles.detailValue}>
                      {Array.isArray(selectedTeacher.kelasAmpu) && selectedTeacher.kelasAmpu.length
                        ? selectedTeacher.kelasAmpu.join(', ')
                        : '-'}
                    </Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>Jabatan</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.jabatan || 'Guru'}</Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>Wali Kelas</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.waliKelas || '-'}</Text>
                  </View>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>Status Kepegawaian</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.statusKepegawaian || 'Honorer'}</Text>
                  </View>
                </View>
              </View>
              
              <View style={commonStyles.detailCard}>
                <View style={commonStyles.cardHeaderRow}>
                  <Ionicons name="mail" size={20} color="#4A90E2" />
                  <Text style={commonStyles.cardTitle}>Informasi Kontak</Text>
                </View>
                <View style={commonStyles.detailRows}>
                  <View style={commonStyles.detailRow}>
                    <Text style={commonStyles.detailLabel}>Email</Text>
                    <Text style={commonStyles.detailValue}>{selectedTeacher.email || '-'}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }, [selectedTeacher, isDetailModalVisible, formatDateToIndonesian]);


  if (loading) {
return (
      <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }

return (
    	<View style={[commonStyles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Cari guru berdasarkan nama, NIP, mata pelajaran..."
      />

      {/* Teachers Table */}
      <DataTable
        data={filteredTeachers}
        columns={tableColumns}
        onEdit={handleEditTeacher}
        onDelete={handleDeleteTeacher}
        onSelectAll={handleSelectAll}
        onSelectItem={handleSelectTeacher}
        selectedItems={selectedTeachers}
        selectAll={selectAll}
        emptyMessage="Belum ada data guru"
        searchQuery={searchQuery}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
            progressBackgroundColor="#ffffff"
          />
        }
      />

        {/* Floating Action Buttons */}
        <View style={commonStyles.fabContainer}>
          <ProtectedComponent permission={PermissionService.PERMISSIONS.CREATE_DATA} showFallback={false}>
            <TouchableOpacity style={[commonStyles.fab, commonStyles.fabPrimary]} onPress={handleAddTeacher}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </ProtectedComponent>
          <ProtectedComponent permission={PermissionService.PERMISSIONS.CREATE_DATA} showFallback={false}>
            <TouchableOpacity 
              style={[commonStyles.fab, commonStyles.fabSuccess, isExporting && commonStyles.fabDisabled]}
              onPress={handleExportTeachers}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size={20} color="white" />
              ) : (
                <Ionicons name="download" size={24} color="white" />
              )}
            </TouchableOpacity>
          </ProtectedComponent>
          <ProtectedComponent permission={PermissionService.PERMISSIONS.DELETE_DATA} showFallback={false}>
            <TouchableOpacity 
              style={[commonStyles.fab, commonStyles.fabDanger, selectedTeachers.size > 0 && styles.fabWithBadge]} 
              onPress={selectedTeachers.size > 0 ? handleDeleteSelected : handleDeleteAllTeachers}
            >
              <Ionicons name="trash" size={24} color="white" />
              {selectedTeachers.size > 0 && (
                <View style={styles.fabBadge}>
                  <Text style={styles.fabBadgeText}>{selectedTeachers.size}</Text>
                </View>
              )}
            </TouchableOpacity>
          </ProtectedComponent>
        </View>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseModal}
        >
        <View style={commonStyles.modalContainer}>
          <View style={commonStyles.modalHeader}>
            <Text style={commonStyles.modalTitle}>
              {editingTeacher ? 'Edit Guru' : 'Tambah Guru'}
            </Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={commonStyles.modalContent}>
            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Nama Lengkap *</Text>
              <TextInput
                style={[commonStyles.input, showValidationErrors && !formData.namaLengkap.trim() && commonStyles.inputError]}
                value={formData.namaLengkap}
                onChangeText={(text) => setFormData({ ...formData, namaLengkap: text })}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>NIP *</Text>
              <TextInput
                style={[commonStyles.input, showValidationErrors && !formData.nip.trim() && commonStyles.inputError]}
                value={formData.nip}
                onChangeText={(text) => setFormData({ ...formData, nip: text })}
                placeholder="Masukkan NIP"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Username</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="Masukkan username untuk login"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Password</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Masukkan password"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>URL Foto</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.fotoUrl}
                onChangeText={(text) => setFormData({ ...formData, fotoUrl: text })}
                placeholder="Masukkan URL foto profil (opsional)"
                placeholderTextColor="#999"
                autoCapitalize="none"
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
                  <RNPicker.Item label="Pilih jenis kelamin" value="" />
                  <RNPicker.Item label="Laki-laki" value="Laki-laki" />
                  <RNPicker.Item label="Perempuan" value="Perempuan" />
                </RNPicker>
              </View>
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Tempat Lahir</Text>
              <TextInput
                style={commonStyles.input}
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
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Alamat</Text>
              <TextInput
                style={[commonStyles.input, commonStyles.textArea]}
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
              <Text style={commonStyles.label}>Telepon Guru</Text>
              <TextInput
                style={[commonStyles.input, showValidationErrors && formData.nomorHP && !validatePhoneNumber(formData.nomorHP) && commonStyles.inputError]}
                value={formData.nomorHP}
                onChangeText={(text) => setFormData({ ...formData, nomorHP: text })}
                placeholder="Masukkan nomor telepon guru"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>




            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Pendidikan Terakhir</Text>
              <View style={commonStyles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.pendidikanTerakhir}
                  onValueChange={(value) => setFormData({ ...formData, pendidikanTerakhir: value })}
                  style={commonStyles.picker}
                  itemStyle={commonStyles.pickerItem}
                >
                  <RNPicker.Item label="Pilih pendidikan terakhir" value="" />
                  <RNPicker.Item label="S1" value="S1" />
                  <RNPicker.Item label="S2" value="S2" />
                  <RNPicker.Item label="S3" value="S3" />
                  <RNPicker.Item label="D3" value="D3" />
                  <RNPicker.Item label="D4" value="D4" />
                </RNPicker>
              </View>
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Mata Pelajaran</Text>
              <Text style={[commonStyles.label, {fontSize: 12, color: '#666', marginBottom: 8}]}>Pilih mata pelajaran yang diampu (bisa lebih dari satu)</Text>
              {mataPelajaranLoading ? (
                <View style={[commonStyles.input, {justifyContent: 'center', alignItems: 'center'}]}>
                  <ActivityIndicator size="small" color="#4A90E2" />
                  <Text style={{marginTop: 8, color: '#666'}}>Memuat mata pelajaran...</Text>
                </View>
              ) : (
                <DropDownPicker
                  open={mataPelajaranOpen}
                  value={formData.mataPelajaran}
                  items={mataPelajaranItems}
                  setOpen={setMataPelajaranOpen}
                  setValue={(callback) => {
                    const newValue = typeof callback === 'function' ? callback(formData.mataPelajaran) : callback;
                    
                    setFormData(prev => ({ ...prev, mataPelajaran: newValue }));
                  }}
                  setItems={setMataPelajaranItems}
                  placeholder="Pilih mata pelajaran"
                  multiple={true}
                  mode="BADGE"
                  style={{
                    backgroundColor: '#fff',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    borderRadius: 8,
                    minHeight: 50,
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    borderRadius: 8,
                    maxHeight: 200,
                  }}
                  searchable={true}
                  searchPlaceholder="Cari mata pelajaran..."
                  listMode="SCROLLVIEW"
                  scrollViewProps={{
                    nestedScrollEnabled: true,
                  }}
                  closeAfterSelecting={false}
                  showTickIcon={true}
                  zIndex={1000}
                  zIndexInverse={3000}
                />
              )}
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Kelas yang Diampu</Text>
              <Text style={[commonStyles.label, {fontSize: 12, color: '#666', marginBottom: 8}]}>Pilih kelas yang diampu (bisa lebih dari satu)</Text>
              <DropDownPicker
                open={kelasAmpuOpen}
                value={formData.kelasAmpu}
                items={kelasAmpuItems}
                setOpen={setKelasAmpuOpen}
                setValue={(callback) => {
                  const newValue = typeof callback === 'function' ? callback(formData.kelasAmpu) : callback;
                  setFormData(prev => ({ ...prev, kelasAmpu: newValue }));
                }}
                setItems={setKelasAmpuItems}
                placeholder="Pilih kelas yang diampu"
                multiple={true}
                mode="BADGE"
                style={{
                  backgroundColor: '#fff',
                  borderColor: '#ddd',
                  borderWidth: 1,
                  borderRadius: 8,
                  minHeight: 50,
                }}
                dropDownContainerStyle={{
                  backgroundColor: '#fff',
                  borderColor: '#ddd',
                  borderWidth: 1,
                  borderRadius: 8,
                  maxHeight: 200,
                }}
                searchable={true}
                searchPlaceholder="Cari kelas..."
                listMode="SCROLLVIEW"
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                closeAfterSelecting={false}
                showTickIcon={true}
                zIndex={999}
                zIndexInverse={3001}
              />
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Jabatan</Text>
              <View style={commonStyles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.jabatan}
                  onValueChange={(value) => setFormData({ ...formData, jabatan: value })}
                  style={commonStyles.picker}
                  itemStyle={commonStyles.pickerItem}
                >
                  <RNPicker.Item label="Pilih jabatan" value="" />
                  <RNPicker.Item label="Guru" value="Guru" />
                  <RNPicker.Item label="Kepala Sekolah" value="Kepala Sekolah" />
                  <RNPicker.Item label="Wakil Kepala Sekolah" value="Wakil Kepala Sekolah" />
                  <RNPicker.Item label="Wali Kelas" value="Wali Kelas" />
                  <RNPicker.Item label="Koordinator Mata Pelajaran" value="Koordinator Mata Pelajaran" />
                  <RNPicker.Item label="Bimbingan Konseling" value="Bimbingan Konseling" />
                </RNPicker>
              </View>
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Wali Kelas</Text>
              <View style={commonStyles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.waliKelas}
                  onValueChange={(value) => setFormData({ ...formData, waliKelas: value })}
                  style={commonStyles.picker}
                  itemStyle={commonStyles.pickerItem}
                >
                  <RNPicker.Item label="Tidak menjadi wali kelas" value="" />
                  <RNPicker.Item label="X TKJ 1" value="X TKJ 1" />
                  <RNPicker.Item label="X TKJ 2" value="X TKJ 2" />
                  <RNPicker.Item label="X TKR 1" value="X TKR 1" />
                  <RNPicker.Item label="X TKR 2" value="X TKR 2" />
                  <RNPicker.Item label="XI TKJ 1" value="XI TKJ 1" />
                  <RNPicker.Item label="XI TKJ 2" value="XI TKJ 2" />
                  <RNPicker.Item label="XI TKR 1" value="XI TKR 1" />
                  <RNPicker.Item label="XI TKR 2" value="XI TKR 2" />
                  <RNPicker.Item label="XII TKJ 1" value="XII TKJ 1" />
                  <RNPicker.Item label="XII TKJ 2" value="XII TKJ 2" />
                  <RNPicker.Item label="XII TKR 1" value="XII TKR 1" />
                  <RNPicker.Item label="XII TKR 2" value="XII TKR 2" />
                </RNPicker>
              </View>
            </View>

            <View style={commonStyles.formGroup}>
              <Text style={commonStyles.label}>Status Kepegawaian</Text>
              <View style={commonStyles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.statusKepegawaian}
                  onValueChange={(value) => setFormData({ ...formData, statusKepegawaian: value })}
                  style={commonStyles.picker}
                  itemStyle={commonStyles.pickerItem}
                >
                  <RNPicker.Item label="Pilih status kepegawaian" value="" />
                  <RNPicker.Item label="Honorer" value="Honorer" />
                  <RNPicker.Item label="PNS" value="PNS" />
                  <RNPicker.Item label="PPPK" value="PPPK" />
                </RNPicker>
              </View>
            </View>

          </ScrollView>

          <View style={commonStyles.modalFooter}>
            <TouchableOpacity
              style={[commonStyles.modalButton, commonStyles.cancelButton]}
              onPress={handleCloseModal}>
              <Text style={commonStyles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.modalButton, commonStyles.saveButton, saving && commonStyles.saveButtonDisabled]}
              onPress={handleSaveTeacher}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator size={16} color="white" />
              ) : (
                <Text style={commonStyles.saveButtonText}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
          </View>
        </Modal>
        
        {renderDetailModal()}
    </View>
  );
});

const styles = StyleSheet.create({
  teacherInfo: {
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
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: 'white',
    textAlign: 'center',
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 14,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#1f2937',
    marginBottom: 2,
  },
  teacherNip: {
    fontSize: 11,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  statusPNS: {
    backgroundColor: '#10b981',
  },
  statusPPPK: {
    backgroundColor: '#3b82f6',
  },
  statusHonorer: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    fontSize: 10,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: 'white',
  },
  tableCellText: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#374151',
    textAlign: 'center',
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
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_700Bold'),
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#4A90E2',
    textAlign: 'center',
  },
});

export default GuruManagementPage;
