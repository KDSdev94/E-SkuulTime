import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { 
  useFonts, 
  Nunito_400Regular, 
  Nunito_500Medium, 
  Nunito_600SemiBold, 
  Nunito_700Bold 
} from '@expo-google-fonts/nunito';
import AdminService from '../../services/AdminService';
import KaprodiService from '../../services/KaprodiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function KaprodiManagementPage({ onGoBack }) {
  const [kaprodis, setKaprodis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedKaprodi, setSelectedKaprodi] = useState(null);
  const [formData, setFormData] = useState({
    adminId: '',
    namaLengkap: '',
    username: '',
    email: '',
    password: '',
    role: 'kaprodi_tkj',
    nip: '',
    noTelepon: '',
    alamat: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    pendidikanTerakhir: '',
    bidangKeahlian: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const availableRoles = [
    { label: 'Kaprodi TKJ', value: 'kaprodi_tkj' },
    { label: 'Kaprodi TKR', value: 'kaprodi_tkr' },
  ];

  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    loadKaprodis();
  }, []);

  const loadKaprodis = async () => {
    try {
      setLoading(true);
      const adminData = await AdminService.getAllAdmin();
      // Filter hanya untuk kaprodi
      const kaprodiData = adminData.filter(admin => 
        admin.role === 'kaprodi_tkj' || admin.role === 'kaprodi_tkr'
      );
      setKaprodis(kaprodiData);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data kaprodi');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadKaprodis();
    setRefreshing(false);
  };

  const handleAddKaprodi = async () => {
    const { namaLengkap, username, email, password } = formData;
    
    if (!namaLengkap || !username || !email || !password) {
      Alert.alert('Error', 'Semua field wajib diisi');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    try {
      setLoading(true);
      
      // Generate ID berdasarkan role
      const prefix = formData.role === 'kaprodi_tkj' ? 'KTJ' : 'KTR';
      const timestamp = Date.now().toString().slice(-6); // 6 digit terakhir timestamp
      const generatedId = `${prefix}${timestamp}`;
      
      const kaprodiData = {
        ...formData,
        adminId: generatedId
      };
      
      await AdminService.addAdmin(kaprodiData, 'Kaprodi Management');
      setAddModalVisible(false);
      setFormData({
        adminId: '',
        namaLengkap: '',
        username: '',
        email: '',
        password: '',
        role: 'kaprodi_tkj',
        nip: '',
        noTelepon: '',
        alamat: '',
        tanggalLahir: '',
        jenisKelamin: 'L',
        pendidikanTerakhir: '',
        bidangKeahlian: '',
      });
      await loadKaprodis();
      Alert.alert('Berhasil', 'Kaprodi berhasil ditambahkan');
    } catch (error) {
      Alert.alert('Error', error.message || 'Gagal menambahkan kaprodi');
    } finally {
      setLoading(false);
    }
  };

  const handleEditKaprodi = (kaprodi) => {
    setSelectedKaprodi(kaprodi);
    setFormData({
      adminId: kaprodi.id,
      namaLengkap: kaprodi.namaLengkap,
      username: kaprodi.username,
      email: kaprodi.email,
      password: kaprodi.password || '',
      role: kaprodi.role || 'kaprodi_tkj',
      nip: kaprodi.nip || '',
      noTelepon: kaprodi.noTelepon || '',
      alamat: kaprodi.alamat || '',
      tanggalLahir: kaprodi.tanggalLahir || '',
      jenisKelamin: kaprodi.jenisKelamin || 'L',
      pendidikanTerakhir: kaprodi.pendidikanTerakhir || '',
      bidangKeahlian: kaprodi.bidangKeahlian || '',
    });
    setEditModalVisible(true);
  };

  const handleUpdateKaprodi = async () => {
    const { namaLengkap, username, email, password, role } = formData;
    
    if (!namaLengkap || !username || !email) {
      Alert.alert('Error', 'Nama lengkap, username, dan email wajib diisi');
      return;
    }

    if (password && password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        namaLengkap,
        username,
        email,
        role,
      };
      
      if (password) {
        updateData.password = password;
      }

      await AdminService.updateAdmin(selectedKaprodi.id, updateData, 'Kaprodi Management');
      setEditModalVisible(false);
      setSelectedKaprodi(null);
      setFormData({
        adminId: '',
        namaLengkap: '',
        username: '',
        email: '',
        password: '',
        role: 'kaprodi_tkj',
      });
      await loadKaprodis();
      Alert.alert('Berhasil', 'Kaprodi berhasil diperbarui');
    } catch (error) {
      Alert.alert('Error', error.message || 'Gagal memperbarui kaprodi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKaprodi = (kaprodi) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus kaprodi ${kaprodi.namaLengkap}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await AdminService.deleteAdmin(kaprodi.id, 'Kaprodi Management');
              await loadKaprodis();
              Alert.alert('Berhasil', 'Kaprodi berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus kaprodi');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAllKaprodi = () => {
    Alert.alert(
      'Konfirmasi Hapus Semua',
      'Apakah Anda yakin ingin menghapus semua data Kaprodi? Tindakan ini tidak dapat dibatalkan!',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Delete only kaprodi accounts
              let deletedCount = 0;
              for (const kaprodi of kaprodis) {
                try {
                  await AdminService.deleteAdmin(kaprodi.id, 'Kaprodi Management - Delete All');
                  deletedCount++;
                } catch (error) {
                  console.error(`Failed to delete kaprodi ${kaprodi.id}:`, error);
                }
              }
              
              await loadKaprodis();
              Alert.alert('Berhasil', `Berhasil menghapus ${deletedCount} Kaprodi.`);
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus semua data Kaprodi');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportKaprodi = async () => {
    try {
      setExportLoading(true);
      // Export semua kaprodi tanpa filter department
      await KaprodiService.exportKaprodiToPDF(false, null);
      Alert.alert('Berhasil', 'Data Kaprodi berhasil diexport');
    } catch (error) {
      Alert.alert('Error', error.message || 'Gagal mengekspor data kaprodi');
    } finally {
      setExportLoading(false);
    }
  };

  const renderKaprodiCard = (kaprodi) => (
    <View key={kaprodi.id} style={styles.kaprodiCard}>
      <View style={styles.kaprodiCardHeader}>
        <View style={styles.kaprodiAvatar}>
          <Ionicons name="briefcase" size={24} color="#1E3A8A" />
        </View>
        <View style={styles.kaprodiInfo}>
          <Text style={styles.kaprodiId}>ID: {kaprodi.id}</Text>
          <Text style={styles.kaprodiName}>{kaprodi.namaLengkap}</Text>
          <Text style={styles.kaprodiEmail}>{kaprodi.email}</Text>
          <Text style={styles.kaprodiRole}>
            {availableRoles.find(role => role.value === kaprodi.role)?.label || 'Kaprodi'}
          </Text>
          <View style={styles.kaprodiStatus}>
            <View style={[styles.statusDot, { backgroundColor: kaprodi.status === 'aktif' ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>{kaprodi.status}</Text>
          </View>
        </View>
        <View style={styles.kaprodiActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditKaprodi(kaprodi)}
          >
            <Ionicons name="pencil" size={18} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteKaprodi(kaprodi)}
          >
            <Ionicons name="trash" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
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
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                value={formData.namaLengkap}
                onChangeText={(text) => setFormData({ ...formData, namaLengkap: text })}
                placeholder="Masukkan nama lengkap"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="Masukkan username"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Masukkan email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Role Kaprodi</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.role}
                  onValueChange={(itemValue) => setFormData({ ...formData, role: itemValue })}
                  style={styles.picker}
                >
                  {availableRoles.map((role) => (
                    <Picker.Item 
                      key={role.value} 
                      label={role.label} 
                      value={role.value} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder={editModalVisible ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Profil Lengkap */}
            <Text style={styles.sectionTitle}>Data Profil</Text>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>NIP</Text>
              <TextInput
                style={styles.input}
                value={formData.nip}
                onChangeText={(text) => setFormData({ ...formData, nip: text })}
                placeholder="Masukkan NIP"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>No. Telepon</Text>
              <TextInput
                style={styles.input}
                value={formData.noTelepon}
                onChangeText={(text) => setFormData({ ...formData, noTelepon: text })}
                placeholder="Masukkan nomor telepon"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Tanggal Lahir</Text>
              <TextInput
                style={styles.input}
                value={formData.tanggalLahir}
                onChangeText={(text) => setFormData({ ...formData, tanggalLahir: text })}
                placeholder="DD/MM/YYYY"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Jenis Kelamin</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.jenisKelamin}
                  onValueChange={(itemValue) => setFormData({ ...formData, jenisKelamin: itemValue })}
                  style={styles.picker}
                >
                  <Picker.Item label="Laki-laki" value="L" />
                  <Picker.Item label="Perempuan" value="P" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Alamat</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.alamat}
                onChangeText={(text) => setFormData({ ...formData, alamat: text })}
                placeholder="Masukkan alamat lengkap"
                multiline={true}
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Pendidikan Terakhir</Text>
              <TextInput
                style={styles.input}
                value={formData.pendidikanTerakhir}
                onChangeText={(text) => setFormData({ ...formData, pendidikanTerakhir: text })}
                placeholder="Contoh: S1 Teknik Informatika"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Bidang Keahlian</Text>
              <TextInput
                style={styles.input}
                value={formData.bidangKeahlian}
                onChangeText={(text) => setFormData({ ...formData, bidangKeahlian: text })}
                placeholder="Contoh: Teknik Komputer dan Jaringan"
              />
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

  return (
    <View style={styles.container}>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Memuat data kaprodi...</Text>
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
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{kaprodis.length}</Text>
              <Text style={styles.statLabel}>Total Kaprodi</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {kaprodis.filter(kaprodi => kaprodi.status === 'aktif').length}
              </Text>
              <Text style={styles.statLabel}>Kaprodi Aktif</Text>
            </View>
          </View>

          <View style={styles.kaprodiList}>
            {kaprodis.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>Belum ada kaprodi terdaftar</Text>
              </View>
            ) : (
              kaprodis.map(renderKaprodiCard)
            )}
          </View>
        </ScrollView>
      )}

{/* Export Button */}
      {kaprodis.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, {backgroundColor: '#4CAF50', right: 180}]}
          onPress={handleExportKaprodi}
          activeOpacity={0.8}
          disabled={exportLoading}
        >
          {exportLoading ? (
            <ActivityIndicator size={24} color="#fff" />
          ) : (
            <Ionicons name="download" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      )}

      {/* Delete All Button */}
      {kaprodis.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, {backgroundColor: '#DC2626', right: 100}]}
          onPress={handleDeleteAllKaprodi}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {renderModal(
        addModalVisible,
        () => setAddModalVisible(false),
        'Tambah Kaprodi Baru',
        handleAddKaprodi
      )}

      {renderModal(
        editModalVisible,
        () => setEditModalVisible(false),
        'Edit Kaprodi',
        handleUpdateKaprodi
      )}
    </View>
  );
}

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
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#1E3A8A',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginTop: 4,
  },
  kaprodiList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kaprodiCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  kaprodiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kaprodiAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kaprodiInfo: {
    flex: 1,
  },
  kaprodiId: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    marginBottom: 2,
  },
  kaprodiName: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#333',
    marginBottom: 2,
  },
  kaprodiEmail: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    marginBottom: 4,
  },
  kaprodiRole: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#1E3A8A',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  kaprodiStatus: {
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
    textTransform: 'capitalize',
  },
  kaprodiActions: {
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
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
  },
  passwordToggle: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
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
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#1E3A8A',
    marginTop: 20,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e3f2fd',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
