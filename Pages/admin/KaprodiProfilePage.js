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
  Image,
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
import { LinearGradient } from 'expo-linear-gradient';
import AuthService from '../../services/AuthService';
import AdminService from '../../services/AdminService';
import { getUserDisplayName } from '../../utils/roleUtils';

export default function KaprodiProfilePage({ onGoBack }) {
  const [kaprodiData, setKaprodiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    namaLengkap: '',
    username: '',
    email: '',
    nip: '',
    noTelepon: '',
    alamat: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    pendidikanTerakhir: '',
    bidangKeahlian: '',
    jabatan: '',
  });

  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    loadKaprodiProfile();
  }, []);

  const loadKaprodiProfile = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      
      if (currentUser.isLoggedIn && currentUser.userData) {
        const userId = currentUser.userData.id;
        const profileData = await AdminService.getAdminById(userId);
        
        if (profileData) {
          setKaprodiData(profileData);
          setFormData({
            namaLengkap: profileData.namaLengkap || '',
            username: profileData.username || '',
            email: profileData.email || '',
            nip: profileData.nip || '',
            noTelepon: profileData.noTelepon || '',
            alamat: profileData.alamat || '',
            tanggalLahir: profileData.tanggalLahir || '',
            jenisKelamin: profileData.jenisKelamin || 'L',
            pendidikanTerakhir: profileData.pendidikanTerakhir || '',
            bidangKeahlian: profileData.bidangKeahlian || '',
            jabatan: profileData.jabatan || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading kaprodi profile:', error);
      Alert.alert('Error', 'Gagal memuat data profil');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadKaprodiProfile();
    setRefreshing(false);
  };

  const handleUpdateProfile = async () => {
    const { namaLengkap, username, email } = formData;
    
    if (!namaLengkap || !username || !email) {
      Alert.alert('Error', 'Nama lengkap, username, dan email wajib diisi');
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        namaLengkap: formData.namaLengkap,
        username: formData.username,
        email: formData.email,
        nip: formData.nip,
        noTelepon: formData.noTelepon,
        alamat: formData.alamat,
        tanggalLahir: formData.tanggalLahir,
        jenisKelamin: formData.jenisKelamin,
        pendidikanTerakhir: formData.pendidikanTerakhir,
        bidangKeahlian: formData.bidangKeahlian,
        jabatan: formData.jabatan,
      };

      await AdminService.updateAdmin(kaprodiData.id, updateData, 'Profile Update');
      
      // Update current user data in AuthService
      const updatedUserData = { ...kaprodiData, ...updateData };
      await AuthService.saveLoginData(updatedUserData, kaprodiData.userType);
      
      setEditModalVisible(false);
      await loadKaprodiProfile();
      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'kaprodi_tkj':
        return 'Kepala Program Studi TKJ';
      case 'kaprodi_tkr':
        return 'Kepala Program Studi TKR';
      default:
        return 'Kaprodi';
    }
  };

  const getDepartmentColor = (department) => {
    switch (department) {
      case 'TKJ':
        return '#3B82F6';
      case 'TKR':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  if (!kaprodiData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Data profil tidak ditemukan</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadKaprodiProfile}>
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[getDepartmentColor(kaprodiData.department), getDepartmentColor(kaprodiData.department) + '80']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/logo/admin.png')}
              style={styles.avatar}
            />
            <View style={[styles.statusBadge, { backgroundColor: kaprodiData.status === 'aktif' ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.statusText}>{kaprodiData.status || 'aktif'}</Text>
            </View>
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{kaprodiData.namaLengkap}</Text>
            <Text style={styles.headerRole}>{getRoleDisplayName(kaprodiData.role)}</Text>
            <View style={styles.departmentBadge}>
              <Text style={styles.departmentText}>{kaprodiData.department}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Personal</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>NIP</Text>
              <Text style={styles.infoValue}>{kaprodiData.nip || 'Belum diisi'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tanggal Lahir</Text>
              <Text style={styles.infoValue}>{kaprodiData.tanggalLahir || 'Belum diisi'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Jenis Kelamin</Text>
              <Text style={styles.infoValue}>
                {kaprodiData.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>No. Telepon</Text>
              <Text style={styles.infoValue}>{kaprodiData.noTelepon || 'Belum diisi'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Alamat</Text>
              <Text style={styles.infoValue}>{kaprodiData.alamat || 'Belum diisi'}</Text>
            </View>
          </View>
        </View>

        {/* Professional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Profesional</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Pendidikan Terakhir</Text>
              <Text style={styles.infoValue}>{kaprodiData.pendidikanTerakhir || 'Belum diisi'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="bulb-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Bidang Keahlian</Text>
              <Text style={styles.infoValue}>{kaprodiData.bidangKeahlian || 'Belum diisi'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Jabatan</Text>
              <Text style={styles.infoValue}>{kaprodiData.jabatan || 'Belum diisi'}</Text>
            </View>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>{kaprodiData.username}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{kaprodiData.email}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancelButton}>Batal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profil</Text>
            <TouchableOpacity onPress={handleUpdateProfile} disabled={saving}>
              <Text style={[styles.modalSaveButton, saving && styles.disabledButton]}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nama Lengkap *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.namaLengkap}
                onChangeText={(text) => setFormData({...formData, namaLengkap: text})}
                placeholder="Masukkan nama lengkap"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Username *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.username}
                onChangeText={(text) => setFormData({...formData, username: text})}
                placeholder="Masukkan username"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                placeholder="Masukkan email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>NIP</Text>
              <TextInput
                style={styles.formInput}
                value={formData.nip}
                onChangeText={(text) => setFormData({...formData, nip: text})}
                placeholder="Masukkan NIP"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>No. Telepon</Text>
              <TextInput
                style={styles.formInput}
                value={formData.noTelepon}
                onChangeText={(text) => setFormData({...formData, noTelepon: text})}
                placeholder="Masukkan nomor telepon"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Alamat</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.alamat}
                onChangeText={(text) => setFormData({...formData, alamat: text})}
                placeholder="Masukkan alamat"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tanggal Lahir</Text>
              <TextInput
                style={styles.formInput}
                value={formData.tanggalLahir}
                onChangeText={(text) => setFormData({...formData, tanggalLahir: text})}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Jenis Kelamin</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.jenisKelamin}
                  onValueChange={(value) => setFormData({...formData, jenisKelamin: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="Laki-laki" value="L" />
                  <Picker.Item label="Perempuan" value="P" />
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pendidikan Terakhir</Text>
              <TextInput
                style={styles.formInput}
                value={formData.pendidikanTerakhir}
                onChangeText={(text) => setFormData({...formData, pendidikanTerakhir: text})}
                placeholder="Contoh: S2 Teknik Informatika"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Bidang Keahlian</Text>
              <TextInput
                style={styles.formInput}
                value={formData.bidangKeahlian}
                onChangeText={(text) => setFormData({...formData, bidangKeahlian: text})}
                placeholder="Masukkan bidang keahlian"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Jabatan</Text>
              <TextInput
                style={styles.formInput}
                value={formData.jabatan}
                onChangeText={(text) => setFormData({...formData, jabatan: text})}
                placeholder="Contoh: Kepala Program Studi TKJ"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    textTransform: 'uppercase',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerName: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerRole: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  departmentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  departmentText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#1F2937',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1F2937',
  },
  modalCancelButton: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#6B7280',
  },
  modalSaveButton: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#3B82F6',
  },
  disabledButton: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#1F2937',
    backgroundColor: '#FFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  picker: {
    height: 50,
  },
});
