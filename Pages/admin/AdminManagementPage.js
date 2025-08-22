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

export default function AdminManagementPage({ onGoBack }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState({
    adminId: '',
    namaLengkap: '',
    username: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [showPassword, setShowPassword] = useState(false);

  const availableRoles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Super Admin', value: 'superadmin' },
    { label: 'Waka Kurikulum', value: 'waka_kurikulum' },
  ];

  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const adminData = await AdminService.getAllAdmin();
      // Filter hanya untuk admin biasa (bukan kaprodi)
      const filteredAdminData = adminData.filter(admin => 
        admin.role !== 'kaprodi_tkj' && admin.role !== 'kaprodi_tkr'
      );
      setAdmins(filteredAdminData);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdmins();
    setRefreshing(false);
  };

  const handleAddAdmin = async () => {
    const { adminId, namaLengkap, username, email, password } = formData;
    
    if (!adminId || !namaLengkap || !username || !email || !password) {
      Alert.alert('Error', 'Semua field wajib diisi');
      return;
    }

    if (!/^\d+$/.test(adminId)) {
      Alert.alert('Error', 'ID Admin harus berupa angka');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    try {
      setLoading(true);
      await AdminService.addAdmin(formData, 'Admin Management');
      setAddModalVisible(false);
      setFormData({
        adminId: '',
        namaLengkap: '',
        username: '',
        email: '',
        password: '',
        role: 'admin',
      });
      await loadAdmins();
      Alert.alert('Berhasil', 'Admin berhasil ditambahkan');
    } catch (error) {
      Alert.alert('Error', error.message || 'Gagal menambahkan admin');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      adminId: admin.id,
      namaLengkap: admin.namaLengkap,
      username: admin.username,
      email: admin.email,
      password: admin.password || '',
      role: admin.role || 'admin',
    });
    setEditModalVisible(true);
  };

  const handleUpdateAdmin = async () => {
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

      await AdminService.updateAdmin(selectedAdmin.id, updateData, 'Admin Management');
      setEditModalVisible(false);
      setSelectedAdmin(null);
      setFormData({
        adminId: '',
        namaLengkap: '',
        username: '',
        email: '',
        password: '',
        role: 'admin',
      });
      await loadAdmins();
      Alert.alert('Berhasil', 'Admin berhasil diperbarui');
    } catch (error) {
      Alert.alert('Error', error.message || 'Gagal memperbarui admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = (admin) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus admin ${admin.namaLengkap}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await AdminService.deleteAdmin(admin.id, 'Admin Management');
              await loadAdmins();
              Alert.alert('Berhasil', 'Admin berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus admin');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderAdminCard = (admin) => (
    <View key={admin.id} style={styles.adminCard}>
      <View style={styles.adminCardHeader}>
        <View style={styles.adminAvatar}>
          <Ionicons name="person" size={24} color="#1E3A8A" />
        </View>
        <View style={styles.adminInfo}>
          <Text style={styles.adminId}>ID: {admin.id}</Text>
          <Text style={styles.adminName}>{admin.namaLengkap}</Text>
          <Text style={styles.adminEmail}>{admin.email}</Text>
          <Text style={styles.adminRole}>{availableRoles.find(role => role.value === admin.role)?.label || 'Admin'}</Text>
          <View style={styles.adminStatus}>
            <View style={[styles.statusDot, { backgroundColor: admin.status === 'aktif' ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>{admin.status}</Text>
          </View>
        </View>
        <View style={styles.adminActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditAdmin(admin)}
          >
            <Ionicons name="pencil" size={18} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteAdmin(admin)}
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
          
          <ScrollView style={styles.modalContent}>
            {!editModalVisible && (
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>ID Admin</Text>
                <TextInput
                  style={styles.input}
                  value={formData.adminId}
                  onChangeText={(text) => setFormData({ ...formData, adminId: text })}
                  placeholder="Masukkan ID Admin (numerik)"
                  keyboardType="numeric"
                />
              </View>
            )}
            
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
              <Text style={styles.inputLabel}>Role</Text>
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
          <Text style={styles.loadingText}>Memuat data admin...</Text>
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
              <Text style={styles.statNumber}>{admins.length}</Text>
              <Text style={styles.statLabel}>Total Admin</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {admins.filter(admin => admin.status === 'aktif').length}
              </Text>
              <Text style={styles.statLabel}>Admin Aktif</Text>
            </View>
          </View>

          <View style={styles.adminList}>
            {admins.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>Belum ada admin terdaftar</Text>
              </View>
            ) : (
              admins.map(renderAdminCard)
            )}
          </View>
        </ScrollView>
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
        'Tambah Admin Baru',
        handleAddAdmin
      )}

      {renderModal(
        editModalVisible,
        () => setEditModalVisible(false),
        'Edit Admin',
        handleUpdateAdmin
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
    paddingTop: 40,
  },
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#1E3A8A',
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
  adminList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  adminCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  adminCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminInfo: {
    flex: 1,
  },
  adminId: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    marginBottom: 2,
  },
  adminName: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#333',
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    marginBottom: 4,
  },
  adminRole: {
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
  adminStatus: {
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
  adminActions: {
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
    maxHeight: '80%',
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
  passwordDisplayWrapper: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  passwordDisplay: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#6b7280',
  },
});
