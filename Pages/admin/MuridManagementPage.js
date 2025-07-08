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
  Picker,
  Platform,
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
import MuridService from '../../services/MuridService';
import { Timestamp } from 'firebase/firestore';

export default function MuridManagementPage() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
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
    username: '',
    email: '',
    password: '',
  });

  // Load Google Fonts
  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // Load students from Firebase when component mounts
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const studentsData = await MuridService.getAllMurid();
        
        // Convert Firebase Timestamps to strings for rendering
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
        console.error('Error loading students:', error);
        Alert.alert('Error', 'Gagal memuat data siswa');
      } finally {
        setLoading(false);
      }
    };
    
    loadStudents();
  }, []);

  // Filter students based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(
        (student) =>
          student.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.kelas.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  // Don't render until fonts are loaded
  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
      username: '',
      email: '',
      password: '',
    });
    setIsModalVisible(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    // Parse existing kelas format untuk form
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
  };


  const handleDeleteStudent = (studentId) => {
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
              await MuridService.deleteMurid(studentId);
              setStudents(students.filter((s) => s.id !== studentId));
              Alert.alert('Berhasil', 'Data murid berhasil dihapus');
            } catch (error) {
              console.error('Error deleting student:', error);
              Alert.alert('Error', 'Gagal menghapus data murid');
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
              Alert.alert('Berhasil', `${deletedCount} data murid berhasil dihapus`);
            } catch (error) {
              console.error('Error deleting all students:', error);
              Alert.alert('Error', 'Gagal menghapus semua data murid');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleGenerateStudents = () => {
    Alert.alert(
      'Generate Data Siswa',
      'Pilih jurusan untuk menggenerate data siswa secara otomatis:',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'TKJ (90 siswa)',
          onPress: () => generateStudentsByMajor('TKJ'),
        },
        {
          text: 'TKR (180 siswa)',
          onPress: () => generateStudentsByMajor('TKR'),
        },
      ]
    );
  };

  const generateStudentsByMajor = async (major) => {
    const studentCount = major === 'TKJ' ? 90 : 180;
    const classStructure = major === 'TKJ' ? '3 tingkat x 1 kelas x 30 siswa' : '3 tingkat x 2 kelas x 30 siswa';
    
    Alert.alert(
      `Generate Data Siswa ${major}`,
      `Apakah Anda ingin menggenerate ${studentCount} data siswa ${major} secara otomatis? (${classStructure})`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setGenerating(true);
              await MuridService.generateSiswaMassal(major, (progress) => {
                // You can add progress indicator here if needed
                console.log(`Progress: ${progress}%`);
              });
              
              // Reload students data
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
              
              Alert.alert('Berhasil', `${studentCount} data siswa ${major} berhasil digenerate!`);
            } catch (error) {
              console.error('Error generating students:', error);
              Alert.alert('Error', 'Gagal menggenerate data siswa: ' + error.message);
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveStudent = async () => {
    if (!formData.namaLengkap || !formData.nis || !formData.nisn) {
      Alert.alert('Error', 'Nama, NIS, dan NISN wajib diisi');
      return;
    }

    // Cek duplikasi nama di kelas yang sama
    const isDuplicate = students.some(student => 
        student.namaLengkap.toLowerCase() === formData.namaLengkap.toLowerCase() &&
        student.kelas === formData.kelas &&
        (!editingStudent || student.id !== editingStudent.id) // Abaikan murid yang sedang diedit
    );

    if (isDuplicate) {
        Alert.alert('Error', `Siswa dengan nama "${formData.namaLengkap}" sudah ada di kelas ${formData.kelas}.`);
        return;
    }

    try {
      setSaving(true);
      
      // Prepare student data with default password if empty
      const studentData = {
        ...formData,
        password: formData.password || (formData.username + '123')
      };
      
      if (editingStudent) {
        // Update existing student
        await MuridService.updateMurid(editingStudent.id, studentData);
        setStudents(
          students.map((s) => (s.id === editingStudent.id ? { ...studentData, id: editingStudent.id } : s))
        );
        Alert.alert('Berhasil', 'Data murid berhasil diperbarui');
      } else {
        // Add new student
        const newStudentId = await MuridService.addMurid(studentData);
        const newStudent = {
          ...studentData,
          id: newStudentId,
        };
        setStudents([...students, newStudent]);
        Alert.alert('Berhasil', 'Data murid berhasil ditambahkan');
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
        username: '',
        email: '',
        password: '',
      });
      setEditingStudent(null);
    } catch (error) {
      console.error('Error saving student:', error);
      Alert.alert('Error', 'Gagal menyimpan data murid: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStudentItem = ({ item }) => (
    <View style={styles.studentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={40} color="#4A90E2" />
        </View>
        <View style={styles.studentMainInfo}>
          <Text style={styles.studentName}>{item.namaLengkap}</Text>
          <View style={styles.studentMetaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="card" size={12} color="#666" />
              <Text style={styles.metaText}>NIS: {item.nis}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="library" size={12} color="#666" />
              <Text style={styles.metaText}>{item.kelas}</Text>
            </View>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.statusSiswa}</Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditStudent(item)}
        >
          <Ionicons name="create" size={14} color="white" />
          <Text style={styles.actionButtonText}>Detail & Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteStudent(item.id)}
        >
          <Ionicons name="trash" size={14} color="white" />
          <Text style={styles.actionButtonText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari murid berdasarkan nama, NIS, atau kelas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Students List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Tidak ada murid yang ditemukan' : 'Belum ada data murid'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, styles.fabDanger]} 
          onPress={handleDeleteAllStudents}
        >
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.fab, generating && styles.fabDisabled]} 
          onPress={handleGenerateStudents}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size={24} color="white" />
          ) : (
            <Ionicons name="copy" size={24} color="white" />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, styles.fabPrimary]} onPress={handleAddStudent}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>


      {/* Add/Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingStudent ? 'Edit Murid' : 'Tambah Murid'}
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
              <Text style={styles.label}>NIS *</Text>
              <TextInput
                style={styles.input}
                value={formData.nis}
                onChangeText={(text) => setFormData({ ...formData, nis: text })}
                placeholder="Masukkan NIS"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>NISN *</Text>
              <TextInput
                style={styles.input}
                value={formData.nisn}
                onChangeText={(text) => setFormData({ ...formData, nisn: text })}
                placeholder="Masukkan NISN"
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
              <Text style={styles.label}>Tingkat *</Text>
              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.tingkat || 'X'}
                  onValueChange={(value) => {
                    const newKelas = `${value} ${formData.jurusan} ${formData.kelasNumber || '1'}`;
                    setFormData({ 
                      ...formData, 
                      tingkat: value,
                      kelas: newKelas,
                      rombel: newKelas
                    });
                  }}
                  style={styles.picker}
                >
                  <RNPicker.Item label="X (Kelas 10)" value="X" />
                  <RNPicker.Item label="XI (Kelas 11)" value="XI" />
                  <RNPicker.Item label="XII (Kelas 12)" value="XII" />
                </RNPicker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nomor Kelas *</Text>
              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.kelasNumber || '1'}
                  onValueChange={(value) => {
                    const newKelas = `${formData.tingkat || 'X'} ${formData.jurusan} ${value}`;
                    setFormData({ 
                      ...formData, 
                      kelasNumber: value,
                      kelas: newKelas,
                      rombel: newKelas
                    });
                  }}
                  style={styles.picker}
                >
                  <RNPicker.Item label="1" value="1" />
                  <RNPicker.Item label="2" value="2" />
                </RNPicker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Jurusan</Text>
              <View style={styles.pickerContainer}>
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
                  style={styles.picker}
                >
                  <RNPicker.Item label="TKJ" value="TKJ" />
                  <RNPicker.Item label="TKR" value="TKR" />
                </RNPicker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tahun Masuk</Text>
              <TextInput
                style={styles.input}
                value={formData.tahunMasuk}
                onChangeText={(text) => setFormData({ ...formData, tahunMasuk: text })}
                placeholder="Masukkan tahun masuk"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status Siswa</Text>
              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.statusSiswa}
                  onValueChange={(value) => setFormData({ ...formData, statusSiswa: value })}
                  style={styles.picker}
                >
                  <RNPicker.Item label="Aktif" value="Aktif" />
                  <RNPicker.Item label="Tidak Aktif" value="Tidak Aktif" />
                  <RNPicker.Item label="Lulus" value="Lulus" />
                  <RNPicker.Item label="Pindah" value="Pindah" />
                </RNPicker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Telepon Siswa</Text>
              <TextInput
                style={styles.input}
                value={formData.nomorHP}
                onChangeText={(text) => setFormData({ ...formData, nomorHP: text })}
                placeholder="Masukkan nomor telepon siswa"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => {
                  const newEmail = text ? `${text}@murid.${formData.jurusan.toLowerCase()}.sch.id` : '';
                  setFormData({ 
                    ...formData, 
                    username: text,
                    email: newEmail
                  });
                }}
                placeholder="Masukkan username"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Email akan otomatis terisi berdasarkan username dan jurusan"
                keyboardType="email-address"
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
              <Text style={styles.label}>Nama Orang Tua</Text>
              <TextInput
                style={styles.input}
                value={formData.namaOrtu}
                onChangeText={(text) => setFormData({ ...formData, namaOrtu: text })}
                placeholder="Masukkan nama orang tua"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Telepon Orang Tua</Text>
              <TextInput
                style={styles.input}
                value={formData.nomorHPOrtu}
                onChangeText={(text) => setFormData({ ...formData, nomorHPOrtu: text })}
                placeholder="Masukkan nomor telepon orang tua"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nomor HP Wali</Text>
              <TextInput
                style={styles.input}
                value={formData.nomorHPWali}
                onChangeText={(text) => setFormData({ ...formData, nomorHPWali: text })}
                placeholder="Masukkan nomor HP wali"
                keyboardType="phone-pad"
              />
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
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveStudent}
              disabled={saving}
            >
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
  studentCard: {
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
  studentMainInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  studentMetaInfo: {
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
  detailButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  detailButtonText: {
    color: '#4A90E2',
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
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
    paddingTop: 80,
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
  // Detail Modal Styles
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    margin: 16,
    maxHeight: '90%',
    width: '95%',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailModalTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#1e293b',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    position: 'relative',
  },
  profileHeaderGradient: {
    backgroundColor: '#667eea',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  profileAvatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  profileSubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  profileBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileBadgeText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  detailModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#1e293b',
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  detailRows: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: '#64748b',
    flex: 1,
    marginRight: 16,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: '#1e293b',
    flex: 1.5,
    textAlign: 'right',
    lineHeight: 22,
  },
});
