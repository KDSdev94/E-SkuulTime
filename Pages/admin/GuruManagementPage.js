import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { Picker as RNPicker } from '@react-native-picker/picker';
import GuruService from '../../services/GuruService';
import { Timestamp } from 'firebase/firestore';

export default function GuruManagementPage() {
  const [teachers, setTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    namaLengkap: '',
    nip: '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: '',
    tanggalLahir: '',
    alamat: '',
    nomorHP: '',
    email: '',
    pendidikanTerakhir: 'S1',
    jurusan: ['TKJ'],
    mataPelajaran: [],
    kelasAmpu: [],
    tingkatanMengajar: {},
    jabatan: 'Guru',
    waliKelas: '',
    statusKepegawaian: 'Honorer',
    fotoUrl: '',
    username: '',
    password: '',
  });

  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoading(true);
        const teachersData = await GuruService.getAllGuru();
        const processedTeachers = teachersData.map(teacher => ({
          ...teacher,
          tanggalLahir: teacher.tanggalLahir instanceof Timestamp 
            ? teacher.tanggalLahir.toDate().toISOString().split('T')[0]
            : teacher.tanggalLahir || '',
          createdAt: teacher.createdAt instanceof Timestamp 
            ? teacher.createdAt.toDate().toISOString()
            : teacher.createdAt || '',
          updatedAt: teacher.updatedAt instanceof Timestamp 
            ? teacher.updatedAt.toDate().toISOString()
            : teacher.updatedAt || '',
          // Ensure arrays are properly handled
          mataPelajaran: Array.isArray(teacher.mataPelajaran) ? teacher.mataPelajaran : [],
          kelasAmpu: Array.isArray(teacher.kelasAmpu) ? teacher.kelasAmpu : [],
          jurusan: Array.isArray(teacher.jurusan) ? teacher.jurusan : ['TKJ']
        }));
        setTeachers(processedTeachers);
      } catch (error) {
        Alert.alert('Error', 'Gagal memuat data guru');
      } finally {
        setLoading(false);
      }
    };
    loadTeachers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTeachers(teachers);
    } else {
      const filtered = teachers.filter(
        (teacher) => {
          const query = searchQuery.toLowerCase();
          return (
            teacher.namaLengkap.toLowerCase().includes(query) ||
            teacher.nip.toLowerCase().includes(query) ||
            (teacher.mataPelajaran && teacher.mataPelajaran.some(mapel => mapel.toLowerCase().includes(query))) ||
            (teacher.kelasAmpu && teacher.kelasAmpu.some(kelas => kelas.toLowerCase().includes(query))) ||
            (teacher.jabatan && teacher.jabatan.toLowerCase().includes(query))
          );
        }
      );
      setFilteredTeachers(filtered);
    }
  }, [searchQuery, teachers]);

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}> 
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setFormData({
      namaLengkap: '',
      nip: '',
      jenisKelamin: 'Laki-laki',
      tempatLahir: '',
      tanggalLahir: '',
      alamat: '',
      nomorHP: '',
      email: '',
      pendidikanTerakhir: 'S1',
      jurusan: ['TKJ'],
      mataPelajaran: [],
      kelasAmpu: [],
      tingkatanMengajar: {},
      jabatan: 'Guru',
      waliKelas: '',
      statusKepegawaian: 'Honorer',
      fotoUrl: '',
      username: '',
      password: '',
    });
    setIsModalVisible(true);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      namaLengkap: teacher.namaLengkap || '',
      nip: teacher.nip || '',
      jenisKelamin: teacher.jenisKelamin || 'Laki-laki',
      tempatLahir: teacher.tempatLahir || '',
      tanggalLahir: teacher.tanggalLahir || '',
      alamat: teacher.alamat || '',
      nomorHP: teacher.nomorHP || '',
      email: teacher.email || '',
      pendidikanTerakhir: teacher.pendidikanTerakhir || 'S1',
      jurusan: teacher.jurusan || ['TKJ'],
      mataPelajaran: teacher.mataPelajaran || [],
      kelasAmpu: teacher.kelasAmpu || [],
      tingkatanMengajar: teacher.tingkatanMengajar || {},
      jabatan: teacher.jabatan || 'Guru',
      waliKelas: teacher.waliKelas || '',
      statusKepegawaian: teacher.statusKepegawaian || 'Honorer',
      fotoUrl: teacher.fotoUrl || '',
      username: teacher.username || '',
      password: teacher.password || '',
    });
    setIsModalVisible(true);
  };

  const handleDeleteTeacher = (teacherId) => {
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
              setTeachers(teachers.filter((t) => t.id !== teacherId));
              Alert.alert('Berhasil', 'Data guru berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus data guru');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllTeachers = () => {
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
              Alert.alert('Berhasil', `${deletedCount} data guru berhasil dihapus`);
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus semua data guru');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleGenerateTeachers = () => {
    Alert.alert(
      'Generate Data Guru',
      'Apakah Anda ingin menggenerate data guru sample secara otomatis?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setGenerating(true);
              const result = await GuruService.generateGuruSample();
              
              // Reload teachers data
              const teachersData = await GuruService.getAllGuru();
              const processedTeachers = teachersData.map(teacher => ({
                ...teacher,
                tanggalLahir: teacher.tanggalLahir instanceof Timestamp 
                  ? teacher.tanggalLahir.toDate().toISOString().split('T')[0]
                  : teacher.tanggalLahir || '',
                createdAt: teacher.createdAt instanceof Timestamp 
                  ? teacher.createdAt.toDate().toISOString()
                  : teacher.createdAt || '',
                updatedAt: teacher.updatedAt instanceof Timestamp 
                  ? teacher.updatedAt.toDate().toISOString()
                  : teacher.updatedAt || '',
                // Ensure arrays are properly handled
                mataPelajaran: Array.isArray(teacher.mataPelajaran) ? teacher.mataPelajaran : [],
                kelasAmpu: Array.isArray(teacher.kelasAmpu) ? teacher.kelasAmpu : [],
                jurusan: Array.isArray(teacher.jurusan) ? teacher.jurusan : ['TKJ']
              }));
              setTeachers(processedTeachers);
              
              Alert.alert('Berhasil', `${result.totalGenerated} data guru berhasil digenerate!`);
            } catch (error) {
              Alert.alert('Error', 'Gagal menggenerate data guru: ' + error.message);
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveTeacher = async () => {
    if (!formData.namaLengkap || !formData.nip) {
      Alert.alert('Error', 'Nama dan NIP wajib diisi');
      return;
    }

    try {
      setSaving(true);

      const teacherData = {
        ...formData,
        password: formData.password || (formData.username + '123')
      };

      if (editingTeacher) {
        await GuruService.updateGuru(editingTeacher.id, teacherData);
        setTeachers(
          teachers.map((t) => (t.id === editingTeacher.id ? { ...teacherData, id: editingTeacher.id } : t))
        );
        Alert.alert('Berhasil', 'Data guru berhasil diperbarui');
      } else {
        const newTeacherId = await GuruService.addGuru(teacherData);
        const newTeacher = {
          ...teacherData,
          id: newTeacherId,
        };
        setTeachers([...teachers, newTeacher]);
        Alert.alert('Berhasil', 'Data guru berhasil ditambahkan');
      }

      setIsModalVisible(false);
      setFormData({
        namaLengkap: '',
        nip: '',
        jenisKelamin: 'Laki-laki',
        tempatLahir: '',
        tanggalLahir: '',
        alamat: '',
        nomorHP: '',
        email: '',
        pendidikanTerakhir: 'S1',
        jurusan: ['TKJ'],
        mataPelajaran: [],
        kelasAmpu: [],
        tingkatanMengajar: {},
        jabatan: 'Guru',
        waliKelas: '',
        statusKepegawaian: 'Honorer',
        fotoUrl: '',
        username: '',
        password: '',
      });
      setEditingTeacher(null);
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data guru: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderTeacherItem = ({ item }) => (
    <View style={styles.teacherCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={40} color="#4A90E2" />
        </View>
        <View style={styles.teacherMainInfo}>
          <Text style={styles.teacherName}>{item.namaLengkap}</Text>
          <View style={styles.teacherMetaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="card" size={12} color="#666" />
              <Text style={styles.metaText}>NIP: {item.nip}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="briefcase" size={12} color="#666" />
              <Text style={styles.metaText}>{item.jabatan || 'Guru'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="school" size={12} color="#666" />
              <Text style={styles.metaText}>{item.statusKepegawaian || 'Honorer'}</Text>
            </View>
            {item.mataPelajaran && item.mataPelajaran.length > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="book" size={12} color="#666" />
                <Text style={styles.metaText}>{item.mataPelajaran.slice(0, 2).join(', ')}{item.mataPelajaran.length > 2 ? '...' : ''}</Text>
              </View>
            )}
            {item.kelasAmpu && item.kelasAmpu.length > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="people" size={12} color="#666" />
                <Text style={styles.metaText}>{item.kelasAmpu.slice(0, 2).join(', ')}{item.kelasAmpu.length > 2 ? '...' : ''}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.statusKepegawaian || 'Honorer'}</Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditTeacher(item)}>
          <Ionicons name="create" size={14} color="white" />
          <Text style={styles.actionButtonText}>Detail & Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteTeacher(item.id)}>
          <Ionicons name="trash" size={14} color="white" />
          <Text style={styles.actionButtonText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari guru berdasarkan nama, NIP, mata pelajaran, atau kelas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredTeachers}
        renderItem={renderTeacherItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredTeachers.length === 0 ? styles.emptyListContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Tidak ada guru yang ditemukan' : 'Belum ada data guru'}
            </Text>
          </View>
        }
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, styles.fabDanger]} 
          onPress={handleDeleteAllTeachers}>
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.fab, generating && styles.fabDisabled]} 
          onPress={handleGenerateTeachers}
          disabled={generating}>
          {generating ? (
            <ActivityIndicator size={24} color="white" />
          ) : (
            <Ionicons name="copy" size={24} color="white" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, styles.fabPrimary]} onPress={handleAddTeacher}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingTeacher ? 'Edit Guru' : 'Tambah Guru'}
            </Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Lengkap *</Text>
              <TextInput
                style={styles.input}
                value={formData.namaLengkap}
                onChangeText={(text) => setFormData({ ...formData, namaLengkap: text })}
                placeholder="Masukkan nama lengkap"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>NIP *</Text>
              <TextInput
                style={styles.input}
                value={formData.nip}
                onChangeText={(text) => setFormData({ ...formData, nip: text })}
                placeholder="Masukkan NIP"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Jenis Kelamin *</Text>
              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.jenisKelamin}
                  onValueChange={(value) => setFormData({ ...formData, jenisKelamin: value })}
                  style={styles.picker}
                >
                  <RNPicker.Item label="Laki-laki" value="Laki-laki" />
                  <RNPicker.Item label="Perempuan" value="Perempuan" />
                </RNPicker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tempat Lahir</Text>
              <TextInput
                style={styles.input}
                value={formData.tempatLahir}
                onChangeText={(text) => setFormData({ ...formData, tempatLahir: text })}
                placeholder="Masukkan tempat lahir"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tanggal Lahir</Text>
              <TextInput
                style={styles.input}
                value={formData.tanggalLahir}
                onChangeText={(text) => setFormData({ ...formData, tanggalLahir: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Alamat</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.alamat}
                onChangeText={(text) => setFormData({ ...formData, alamat: text })}
                placeholder="Masukkan alamat lengkap"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Telepon Guru</Text>
              <TextInput
                style={styles.input}
                value={formData.nomorHP}
                onChangeText={(text) => setFormData({ ...formData, nomorHP: text })}
                placeholder="Masukkan nomor telepon guru"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="Masukkan username"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Masukkan email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pendidikan Terakhir</Text>
              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.pendidikanTerakhir}
                  onValueChange={(value) => setFormData({ ...formData, pendidikanTerakhir: value })}
                  style={styles.picker}
                >
                  <RNPicker.Item label="S1" value="S1" />
                  <RNPicker.Item label="S2" value="S2" />
                  <RNPicker.Item label="S3" value="S3" />
                  <RNPicker.Item label="D3" value="D3" />
                  <RNPicker.Item label="D4" value="D4" />
                </RNPicker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Jurusan</Text>
              <TextInput
                style={styles.input}
                value={formData.jurusan.join(', ')}
                onChangeText={(text) => setFormData({ ...formData, jurusan: text.split(', ').map(j => j.trim()).filter(j => j) })}
                placeholder="Contoh: TKJ, TKR"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mata Pelajaran</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.mataPelajaran.join(', ')}
                onChangeText={(text) => setFormData({ ...formData, mataPelajaran: text.split(', ').map(m => m.trim()).filter(m => m) })}
                placeholder="Contoh: Matematika, Bahasa Inggris, Fisika\n(Pisahkan dengan koma)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Kelas yang Diampu</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.kelasAmpu.join(', ')}
                onChangeText={(text) => setFormData({ ...formData, kelasAmpu: text.split(', ').map(k => k.trim()).filter(k => k) })}
                placeholder="Contoh: X TKJ 1, XI TKJ 1, XII TKJ 1\n(Pisahkan dengan koma)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Jabatan</Text>
              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.jabatan}
                  onValueChange={(value) => setFormData({ ...formData, jabatan: value })}
                  style={styles.picker}
                >
                  <RNPicker.Item label="Guru" value="Guru" />
                  <RNPicker.Item label="Kepala Sekolah" value="Kepala Sekolah" />
                  <RNPicker.Item label="Wakil Kepala Sekolah" value="Wakil Kepala Sekolah" />
                  <RNPicker.Item label="Wali Kelas" value="Wali Kelas" />
                  <RNPicker.Item label="Koordinator Mata Pelajaran" value="Koordinator Mata Pelajaran" />
                  <RNPicker.Item label="Bimbingan Konseling" value="Bimbingan Konseling" />
                </RNPicker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Wali Kelas</Text>
              <TextInput
                style={styles.input}
                value={formData.waliKelas}
                onChangeText={(text) => setFormData({ ...formData, waliKelas: text })}
                placeholder="Contoh: X TKJ 1 (opsional)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status Kepegawaian</Text>
              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.statusKepegawaian}
                  onValueChange={(value) => setFormData({ ...formData, statusKepegawaian: value })}
                  style={styles.picker}
                >
                  <RNPicker.Item label="Honorer" value="Honorer" />
                  <RNPicker.Item label="PNS" value="PNS" />
                  <RNPicker.Item label="PPPK" value="PPPK" />
                </RNPicker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>URL Foto</Text>
              <TextInput
                style={styles.input}
                value={formData.fotoUrl}
                onChangeText={(text) => setFormData({ ...formData, fotoUrl: text })}
                placeholder="Masukkan URL foto (opsional)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Masukkan password"
                secureTextEntry
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveTeacher}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator size={16} color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#2c3e50',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  teacherCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  teacherMainInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  teacherMetaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginLeft: 4,
  },
  statusBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#27ae60',
  },
  teacherNIP: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  editButton: {
    backgroundColor: '#4A90E2',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#999',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#4A90E2',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#2c3e50',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabPrimary: {
    backgroundColor: '#4A90E2',
  },
  fabDanger: {
    backgroundColor: '#e74c3c',
  },
  fabDisabled: {
    backgroundColor: '#95a5a6',
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    height: 50,
    fontFamily: 'Nunito_400Regular',
  },
});

