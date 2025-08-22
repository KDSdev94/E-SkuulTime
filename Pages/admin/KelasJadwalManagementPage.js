import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '../../context/UserContext';

// Data statis untuk kelas dan jurusan
const JURUSAN_DATA = [
  { kode: 'TKJ', nama: 'Teknik Komputer dan Jaringan' },
  { kode: 'TKR', nama: 'Teknik Kendaraan Ringan' }
];

const TINGKAT_KELAS = ['X', 'XI', 'XII'];

// Data kelas yang sudah ada (sesuai dengan RUANG_KELAS_DATA)
const DEFAULT_KELAS_DATA = [
  { id: 1, namaKelas: 'X TKJ 1', jurusan: 'TKJ', tingkat: 'X', nomor: 1, kapasitas: 32, aktif: true },
  { id: 2, namaKelas: 'X TKJ 2', jurusan: 'TKJ', tingkat: 'X', nomor: 2, kapasitas: 32, aktif: true },
  { id: 3, namaKelas: 'XI TKJ 1', jurusan: 'TKJ', tingkat: 'XI', nomor: 1, kapasitas: 30, aktif: true },
  { id: 4, namaKelas: 'XI TKJ 2', jurusan: 'TKJ', tingkat: 'XI', nomor: 2, kapasitas: 30, aktif: true },
  { id: 5, namaKelas: 'XII TKJ 1', jurusan: 'TKJ', tingkat: 'XII', nomor: 1, kapasitas: 28, aktif: true },
  { id: 6, namaKelas: 'XII TKJ 2', jurusan: 'TKJ', tingkat: 'XII', nomor: 2, kapasitas: 28, aktif: true },
  { id: 7, namaKelas: 'X TKR 1', jurusan: 'TKR', tingkat: 'X', nomor: 1, kapasitas: 32, aktif: true },
  { id: 8, namaKelas: 'X TKR 2', jurusan: 'TKR', tingkat: 'X', nomor: 2, kapasitas: 32, aktif: true },
  { id: 9, namaKelas: 'XI TKR 1', jurusan: 'TKR', tingkat: 'XI', nomor: 1, kapasitas: 30, aktif: true },
  { id: 10, namaKelas: 'XI TKR 2', jurusan: 'TKR', tingkat: 'XI', nomor: 2, kapasitas: 30, aktif: true },
  { id: 11, namaKelas: 'XII TKR 1', jurusan: 'TKR', tingkat: 'XII', nomor: 1, kapasitas: 28, aktif: true },
  { id: 12, namaKelas: 'XII TKR 2', jurusan: 'TKR', tingkat: 'XII', nomor: 2, kapasitas: 28, aktif: true },
];

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

export default function KelasManagementPage({ onGoBack }) {
  const { user } = useUser();
  const [kelas, setKelas] = useState(DEFAULT_KELAS_DATA);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
const [filterJurusan, setFilterJurusan] = useState('semua');
const [kelasWithWali, setKelasWithWali] = useState([]);
const [availableGuru, setAvailableGuru] = useState([]);
const [loadingGuru, setLoadingGuru] = useState(false);

useEffect(() => {
  const fetchKelasWithWali = async () => {
    const updatedKelas = await Promise.all(kelas.map(async k => {
      const waliKelasName = await KelasJurusanService.getWaliKelasByClassName(k.namaKelas);
      return { ...k, waliKelasName };
    }));
    setKelasWithWali(updatedKelas);
  };

  const fetchAvailableGuru = async () => {
    try {
      setLoadingGuru(true);
      const GuruService = await import('../../services/GuruService');
      const allGuru = await GuruService.default.getAllGuru();
      setAvailableGuru(allGuru);
    } catch (error) {
      console.error('Error loading guru:', error);
    } finally {
      setLoadingGuru(false);
    }
  };

  fetchKelasWithWali();
  fetchAvailableGuru();
}, [kelas]);
  const [formData, setFormData] = useState({
    tingkat: 'X',
    jurusan: 'TKJ',
    nomor: '1',
    kapasitas: '32',
    waliKelasId: '',
  });

  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulasi loading
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const generateKelasName = (tingkat, jurusan, nomor) => {
    return `${tingkat} ${jurusan} ${nomor}`;
  };

  const handleAddKelas = async () => {
    const { tingkat, jurusan, nomor, kapasitas } = formData;
    
    if (!tingkat || !jurusan || !nomor || !kapasitas) {
      Alert.alert('Error', 'Semua field wajib diisi');
      return;
    }

    if (!/^\d+$/.test(nomor) || !/^\d+$/.test(kapasitas)) {
      Alert.alert('Error', 'Nomor kelas dan kapasitas harus berupa angka');
      return;
    }

    const namaKelas = generateKelasName(tingkat, jurusan, nomor);
    
    // Check if class already exists
    const existingKelas = kelas.find(k => k.namaKelas === namaKelas);
    if (existingKelas) {
      Alert.alert('Error', `Kelas ${namaKelas} sudah ada`);
      return;
    }

    try {
      setLoading(true);
      const newKelas = {
        id: Math.max(...kelas.map(k => k.id)) + 1,
        namaKelas,
        tingkat,
        jurusan,
        nomor: parseInt(nomor),
        kapasitas: parseInt(kapasitas),
        aktif: true,
      };

      setKelas([...kelas, newKelas]);
      setAddModalVisible(false);
      setFormData({
        tingkat: 'X',
        jurusan: 'TKJ',
        nomor: '1',
        kapasitas: '32',
        waliKelasId: '',
      });
      Alert.alert('Berhasil', 'Kelas berhasil ditambahkan');
    } catch (error) {
      Alert.alert('Error', 'Gagal menambahkan kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleEditKelas = async (kelasItem) => {
    setSelectedKelas(kelasItem);
    
    // Cari wali kelas berdasarkan nama kelas jika waliKelasId tidak ada
    let waliKelasId = kelasItem.waliKelasId || '';
    
    if (!waliKelasId && kelasItem.waliKelasName && kelasItem.waliKelasName !== 'Belum ditentukan') {
      // Cari ID guru berdasarkan nama wali kelas
      const waliKelas = availableGuru.find(guru => guru.namaLengkap === kelasItem.waliKelasName);
      if (waliKelas) {
        waliKelasId = waliKelas.id;
      }
    }
    
    setFormData({
      tingkat: kelasItem.tingkat,
      jurusan: kelasItem.jurusan,
      nomor: kelasItem.nomor.toString(),
      kapasitas: kelasItem.kapasitas.toString(),
      waliKelasId: waliKelasId,
    });
    setEditModalVisible(true);
  };

  const handleUpdateKelas = async () => {
    const { tingkat, jurusan, nomor, kapasitas } = formData;
    
    if (!tingkat || !jurusan || !nomor || !kapasitas) {
      Alert.alert('Error', 'Semua field wajib diisi');
      return;
    }

    if (!/^\d+$/.test(nomor) || !/^\d+$/.test(kapasitas)) {
      Alert.alert('Error', 'Nomor kelas dan kapasitas harus berupa angka');
      return;
    }

    const namaKelas = generateKelasName(tingkat, jurusan, nomor);
    
    // Check if new class name conflicts with existing (but not the current one)
    const existingKelas = kelas.find(k => k.namaKelas === namaKelas && k.id !== selectedKelas.id);
    if (existingKelas) {
      Alert.alert('Error', `Kelas ${namaKelas} sudah ada`);
      return;
    }

try {
      setLoading(true);
      // Update wali kelas jika berganti
      if (selectedKelas.waliKelasId !== formData.waliKelasId) {
        // Hapus status wali kelas dari guru sebelumnya jika ada
        if (selectedKelas.waliKelasId) {
          await GuruService.updateGuru(selectedKelas.waliKelasId, { waliKelas: null });
        }
        
        // Set status wali kelas untuk guru baru jika dipilih
        if (formData.waliKelasId) {
          await GuruService.updateGuru(formData.waliKelasId, { waliKelas: namaKelas });
        }
      }
      
      const updatedKelas = kelas.map(k => 
        k.id === selectedKelas.id 
          ? { 
              ...k, 
              namaKelas,
              tingkat,
              jurusan,
              nomor: parseInt(nomor),
              kapasitas: parseInt(kapasitas),
              waliKelasId: formData.waliKelasId
            }
          : k
      );

      setKelas(updatedKelas);
      setEditModalVisible(false);
      setSelectedKelas(null);
      setFormData({
        tingkat: 'X',
        jurusan: 'TKJ',
        nomor: '1',
        kapasitas: '32',
        waliKelasId: '',
      });
      Alert.alert('Berhasil', 'Kelas berhasil diperbarui');
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKelas = (kelasItem) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus kelas ${kelasItem.namaKelas}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const updatedKelas = kelas.filter(k => k.id !== kelasItem.id);
              setKelas(updatedKelas);
              Alert.alert('Berhasil', 'Kelas berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus kelas');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const toggleKelasStatus = (kelasItem) => {
    const updatedKelas = kelas.map(k => 
      k.id === kelasItem.id ? { ...k, aktif: !k.aktif } : k
    );
    setKelas(updatedKelas);
  };

  const getFilteredKelas = () => {
    const dataToFilter = kelasWithWali.length > 0 ? kelasWithWali : kelas;
    if (filterJurusan === 'semua') {
      return dataToFilter;
    }
    return dataToFilter.filter(k => k.jurusan === filterJurusan);
  };

  const getStatistik = () => {
    const filteredKelas = getFilteredKelas();
    return {
      total: filteredKelas.length,
      aktif: filteredKelas.filter(k => k.aktif).length,
      nonAktif: filteredKelas.filter(k => !k.aktif).length,
      tkj: kelas.filter(k => k.jurusan === 'TKJ').length,
      tkr: kelas.filter(k => k.jurusan === 'TKR').length,
    };
  };

  const renderKelasCard = (kelasItem) => (
    <View key={kelasItem.id} style={styles.kelasCard}>
      <View style={styles.kelasCardHeader}>
        <View style={[styles.kelasAvatar, { backgroundColor: kelasItem.jurusan === 'TKJ' ? '#e3f2fd' : '#f3e5f5' }]}>
          <Ionicons 
            name={kelasItem.jurusan === 'TKJ' ? 'desktop' : 'bicycle'} 
            size={24} 
            color={kelasItem.jurusan === 'TKJ' ? '#1976d2' : '#7b1fa2'} 
          />
        </View>
        <View style={styles.kelasInfo}>
          <Text style={styles.kelasName}>{kelasItem.namaKelas}</Text>
          <Text style={styles.kelasJurusan}>
            {JURUSAN_DATA.find(j => j.kode === kelasItem.jurusan)?.nama}
          </Text>
          <Text style={styles.kelasDetail}>
            Kapasitas: {kelasItem.kapasitas} siswa
          </Text>
          <Text style={styles.kelasDetail}>
            Wali Kelas: {kelasItem.waliKelasName || 'Belum ditentukan'}
          </Text>
        </View>
        {!isKapordiUser(user) && (
          <View style={styles.kelasActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditKelas(kelasItem)}
            >
              <Ionicons name="pencil" size={18} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteKelas(kelasItem)}
            >
              <Ionicons name="trash" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderModal = (visible, onClose, title, onSubmit) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Tingkat Kelas</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.tingkat}
                  onValueChange={(value) => setFormData({ ...formData, tingkat: value })}
                  style={styles.picker}
                >
                  {TINGKAT_KELAS.map(tingkat => (
                    <Picker.Item key={tingkat} label={`Kelas ${tingkat}`} value={tingkat} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Jurusan</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.jurusan}
                  onValueChange={(value) => setFormData({ ...formData, jurusan: value })}
                  style={styles.picker}
                >
                  {JURUSAN_DATA.map(jurusan => (
                    <Picker.Item key={jurusan.kode} label={jurusan.nama} value={jurusan.kode} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nomor Kelas</Text>
              <TextInput
                style={styles.input}
                value={formData.nomor}
                onChangeText={(text) => setFormData({ ...formData, nomor: text })}
                placeholder="Masukkan nomor kelas"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Kapasitas Siswa</Text>
              <TextInput
                style={styles.input}
                value={formData.kapasitas}
                onChangeText={(text) => setFormData({ ...formData, kapasitas: text })}
                placeholder="Masukkan kapasitas maksimal"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Wali Kelas</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.waliKelasId}
                  onValueChange={(value) => setFormData({ ...formData, waliKelasId: value })}
                  style={styles.picker}
                  enabled={!loadingGuru}
                >
                  <Picker.Item label="Pilih Wali Kelas" value="" />
                  {availableGuru.map(guru => (
                    <Picker.Item 
                      key={guru.id} 
                      label={`${guru.namaLengkap} (${guru.nip})`} 
                      value={guru.id} 
                    />
                  ))}
                </Picker>
              </View>
              {loadingGuru && (
                <Text style={styles.loadingText}>Memuat data guru...</Text>
              )}
            </View>

            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Preview Nama Kelas:</Text>
              <Text style={styles.previewText}>
                {generateKelasName(formData.tingkat, formData.jurusan, formData.nomor)}
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onClose}
            >
              <Text style={styles.modalCancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={onSubmit}
            >
              <Text style={styles.modalSubmitText}>
                {editModalVisible ? 'Perbarui' : 'Tambah'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  const statistik = getStatistik();
  const filteredKelas = getFilteredKelas();

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Memproses data kelas...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1E3A8A']}
            />
          }
        >

          {/* Filter Jurusan */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter Jurusan:</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, filterJurusan === 'semua' && styles.filterButtonActive]}
                onPress={() => setFilterJurusan('semua')}
              >
                <Text style={[styles.filterButtonText, filterJurusan === 'semua' && styles.filterButtonTextActive]}>
                  Semua
                </Text>
              </TouchableOpacity>
              {JURUSAN_DATA.map(jurusan => (
                <TouchableOpacity
                  key={jurusan.kode}
                  style={[styles.filterButton, filterJurusan === jurusan.kode && styles.filterButtonActive]}
                  onPress={() => setFilterJurusan(jurusan.kode)}
                >
                  <Text style={[styles.filterButtonText, filterJurusan === jurusan.kode && styles.filterButtonTextActive]}>
                    {jurusan.kode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Statistik */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{statistik.total}</Text>
              <Text style={styles.statLabel}>Total Kelas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{statistik.aktif}</Text>
              <Text style={styles.statLabel}>Kelas Aktif</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{statistik.tkj}</Text>
              <Text style={styles.statLabel}>Kelas TKJ</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{statistik.tkr}</Text>
              <Text style={styles.statLabel}>Kelas TKR</Text>
            </View>
          </View>

          {/* Informasi Jurusan */}
          <View style={styles.jurusanContainer}>
            <Text style={styles.sectionTitle}>Informasi Jurusan</Text>
            {JURUSAN_DATA.map(jurusan => (
              <View key={jurusan.kode} style={styles.jurusanCard}>
                <View style={styles.jurusanHeader}>
                  <View style={[styles.jurusanIcon, { backgroundColor: jurusan.kode === 'TKJ' ? '#e3f2fd' : '#f3e5f5' }]}>
                    <Ionicons 
                      name={jurusan.kode === 'TKJ' ? 'desktop' : 'bicycle'} 
                      size={20} 
                      color={jurusan.kode === 'TKJ' ? '#1976d2' : '#7b1fa2'} 
                    />
                  </View>
                  <View style={styles.jurusanInfo}>
                    <Text style={styles.jurusanKode}>{jurusan.kode}</Text>
                    <Text style={styles.jurusanNama}>{jurusan.nama}</Text>
                  </View>
                  <View style={styles.jurusanStats}>
                    <Text style={styles.jurusanStatNumber}>
                      {kelas.filter(k => k.jurusan === jurusan.kode).length}
                    </Text>
                    <Text style={styles.jurusanStatLabel}>Kelas</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Daftar Kelas */}
          <View style={styles.kelasList}>
            <Text style={styles.sectionTitle}>
              Daftar Kelas {filterJurusan !== 'semua' && `(${filterJurusan})`}
            </Text>
            {filteredKelas.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="school" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  {filterJurusan === 'semua' ? 'Belum ada kelas terdaftar' : `Belum ada kelas ${filterJurusan}`}
                </Text>
              </View>
            ) : (
              filteredKelas.map(renderKelasCard)
            )}
          </View>
        </ScrollView>
      )}

      {/* Floating Action Button - Hidden for kaprodi users */}
      {!isKapordiUser(user) && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {renderModal(
        addModalVisible,
        () => setAddModalVisible(false),
        'Tambah Kelas Baru',
        handleAddKelas
      )}

      {renderModal(
        editModalVisible,
        () => setEditModalVisible(false),
        'Edit Kelas',
        handleUpdateKelas
      )}
    </View>
  );
}

import KelasJurusanService from '../../services/KelasJurusanService';
import GuruService from '../../services/GuruService';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 16,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#1E3A8A',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#1E3A8A',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  jurusanContainer: {
    marginBottom: 20,
  },
  jurusanCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  jurusanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jurusanIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jurusanInfo: {
    flex: 1,
  },
  jurusanKode: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
  },
  jurusanNama: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    marginTop: 2,
  },
  jurusanStats: {
    alignItems: 'center',
  },
  jurusanStatNumber: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1E3A8A',
  },
  jurusanStatLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
  },
  kelasList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kelasCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  kelasCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kelasAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kelasInfo: {
    flex: 1,
  },
  kelasName: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#333',
    marginBottom: 2,
  },
  kelasJurusan: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    marginBottom: 2,
  },
  kelasDetail: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#888',
    marginBottom: 4,
  },
  kelasStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
  },
  kelasActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '85%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  modalContentContainer: {
    paddingBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  previewContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#1E3A8A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
  },
  modalSubmitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
  },
  modalSubmitText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#fff',
  },
});
