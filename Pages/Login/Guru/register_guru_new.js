import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  FlatList
} from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Nunito_500Medium,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import GuruService from '../../../services/GuruService';

export default function RegisterGuruNew() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [loadingGuru, setLoadingGuru] = useState(true);
  const [guruList, setGuruList] = useState([]);
  const [showGuruPicker, setShowGuruPicker] = useState(false);
  const [selectedGuruData, setSelectedGuruData] = useState(null);
  const [obscurePassword, setObscurePassword] = useState(true);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nomorHP: ''
  });
  
  const handleNavigation = (route) => {
    try {
      if (navigation && navigation.navigate) {
        navigation.navigate(route);
      } else {
        setTimeout(() => handleNavigation(route), 100);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  let [fontsLoaded] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
  });

  useEffect(() => {
    loadGuruWithoutLogin();
  }, []);

  const loadGuruWithoutLogin = async () => {
    try {
      setLoadingGuru(true);
      console.log('🔄 Loading guru without login credentials...');
      
      const allGuru = await GuruService.getAllGuru();
      console.log(`📋 Found ${allGuru.length} total guru`);
      
      // Filter guru yang belum punya username atau email (belum bisa login)
      const guruWithoutLogin = allGuru.filter(guru => 
        !guru.username && !guru.email && guru.nip && guru.namaLengkap
      );
      
      console.log(`👤 Found ${guruWithoutLogin.length} guru without login credentials`);
      
      // Sort by nama
      const sortedGuru = guruWithoutLogin.sort((a, b) => 
        (a.namaLengkap || '').localeCompare(b.namaLengkap || '')
      );
      
      setGuruList(sortedGuru);
      
    } catch (error) {
      console.error('❌ Error loading guru:', error);
      Alert.alert('Error', 'Gagal memuat data guru. Silakan coba lagi.');
    } finally {
      setLoadingGuru(false);
    }
  };

  const handleSelectGuru = (guru) => {
    setSelectedGuruData(guru);
    setShowGuruPicker(false);
    
    // Auto-generate username dari nama depan + NIP
    const namaDepan = guru.namaLengkap.split(' ')[0].toLowerCase();
    const nipSuffix = guru.nip.slice(-3); // 3 digit terakhir NIP
    const autoUsername = `${namaDepan}${nipSuffix}`;
    
    setFormData(prev => ({
      ...prev,
      username: autoUsername
    }));
    
    console.log('👤 Selected guru:', {
      nip: guru.nip,
      nama: guru.namaLengkap,
      autoUsername: autoUsername,
      mataPelajaran: guru.mataPelajaran,
      kelasAmpu: guru.kelasAmpu
    });
  };

  const handleRegister = async () => {
    try {
      const { username, password } = formData;
      
      if (!selectedGuruData) {
        Alert.alert('Error', 'Silakan pilih data guru terlebih dahulu.');
        return;
      }
      
      if (!username.trim()) {
        Alert.alert('Error', 'Username harus diisi');
        return;
      }
      
      if (!password.trim()) {
        Alert.alert('Error', 'Password harus diisi');
        return;
      }
      
      if (password.length < 6) {
        Alert.alert('Error', 'Password minimal 6 karakter');
        return;
      }

      setLoading(true);
      console.log('🔄 Starting guru registration process...');
      
      // Auto-generate email
      const mataPelajaranFirst = Array.isArray(selectedGuruData.mataPelajaran) && selectedGuruData.mataPelajaran.length > 0 
        ? selectedGuruData.mataPelajaran[0] 
        : 'guru';
      const emailDomain = mataPelajaranFirst.toLowerCase().replace(/\s+/g, '');
      const autoEmail = `${username}@guru.${emailDomain}.sch.id`;
      
      // Create ULTRA-SAFE guru data (prevent any indexOf errors)
      const updatedGuruData = {};
      
      // Helper function to safely convert to string
      const safeString = (value, defaultValue = '') => {
        if (value === null || value === undefined) return String(defaultValue);
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return String(value);
        if (Array.isArray(value)) return value.join(', ');
        return String(defaultValue);
      };
      
      // Essential fields (required)
      updatedGuruData.nip = safeString(selectedGuruData.nip);
      updatedGuruData.namaLengkap = safeString(selectedGuruData.namaLengkap);
      updatedGuruData.mataPelajaran = Array.isArray(selectedGuruData.mataPelajaran) 
        ? selectedGuruData.mataPelajaran.map(mp => String(mp))
        : [safeString(selectedGuruData.mataPelajaran, 'Umum')];
      updatedGuruData.kelasAmpu = Array.isArray(selectedGuruData.kelasAmpu)
        ? selectedGuruData.kelasAmpu.map(kelas => String(kelas))
        : [safeString(selectedGuruData.kelasAmpu, 'Semua Kelas')];
        
      // Login credentials (required)
      updatedGuruData.username = safeString(username);
      updatedGuruData.password = safeString(password);
      updatedGuruData.email = safeString(autoEmail);
        
      // Optional contact info
      updatedGuruData.nomorHP = safeString(formData.nomorHP || selectedGuruData.nomorHP);
        
      // Other existing data (optional but safe)
      updatedGuruData.jenisKelamin = safeString(selectedGuruData.jenisKelamin, 'Laki-laki');
      updatedGuruData.statusGuru = safeString(selectedGuruData.statusGuru, 'Aktif');
      updatedGuruData.statusAktif = safeString(selectedGuruData.statusAktif, 'Aktif');
      updatedGuruData.tempatLahir = safeString(selectedGuruData.tempatLahir);
      updatedGuruData.alamat = safeString(selectedGuruData.alamat);
      updatedGuruData.pendidikanTerakhir = safeString(selectedGuruData.pendidikanTerakhir);
      updatedGuruData.bidangKeahlian = safeString(selectedGuruData.bidangKeahlian);
      updatedGuruData.jabatan = safeString(selectedGuruData.jabatan);
      updatedGuruData.golongan = safeString(selectedGuruData.golongan);
      updatedGuruData.pangkat = safeString(selectedGuruData.pangkat);
        
      // Handle date fields properly (keep as-is if they exist)
      if (selectedGuruData.tanggalLahir) {
        updatedGuruData.tanggalLahir = selectedGuruData.tanggalLahir;
      }
      if (selectedGuruData.createdAt) {
        updatedGuruData.createdAt = selectedGuruData.createdAt;
      }
      
      console.log('📋 REGISTER GURU: Data prepared safely with keys:', Object.keys(updatedGuruData));
      
      // Debug logging
      console.log('🚀 REGISTER GURU: Starting registration process for:', {
        nip: selectedGuruData.nip,
        name: updatedGuruData.namaLengkap,
        username: updatedGuruData.username,
        email: updatedGuruData.email,
        mataPelajaran: updatedGuruData.mataPelajaran,
        kelasAmpu: updatedGuruData.kelasAmpu
      });

      // Use the new safer method that handles everything internally
      console.log('🔄 REGISTER GURU: Using updateGuruByNip method for safer update');
      
      const updateResult = await GuruService.updateGuruByNip(
        selectedGuruData.nip, 
        updatedGuruData, 
        'Self Registration'
      );
      
      console.log('✅ REGISTER GURU: Update completed successfully:', updateResult);
      
      Alert.alert(
        'Pendaftaran Berhasil! 🎉', 
        `Akun Anda telah berhasil dibuat dan dapat digunakan untuk login.

📧 Email: ${updatedGuruData.email}
👤 Username: ${updatedGuruData.username}
📚 Mata Pelajaran: ${updatedGuruData.mataPelajaran.join(', ')}

Admin telah diberitahu tentang pendaftaran Anda.`,
        [
          {
            text: 'OK',
            onPress: () => handleNavigation('GuruLogin')
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ REGISTER GURU: Registration failed:', error);
      console.error('❌ REGISTER GURU: Error details:', {
        message: error.message,
        selectedGuruNip: selectedGuruData?.nip,
        selectedGuruName: selectedGuruData?.namaLengkap,
        username: formData.username,
        errorType: error.constructor.name
      });
      
      let userMessage = 'Pendaftaran gagal. Silakan coba lagi.';
      
      // Provide specific error messages for common issues
      if (error.message?.includes('not found in database')) {
        userMessage = 'Data guru tidak ditemukan di database. Pastikan NIP yang dipilih benar.';
      } else if (error.message?.includes('Username') && error.message?.includes('sudah digunakan')) {
        userMessage = 'Username sudah digunakan. Silakan pilih username lain.';
      } else if (error.message?.includes('indexOf')) {
        userMessage = 'Terjadi masalah teknis. Silakan coba refresh halaman dan ulangi proses pendaftaran.';
      } else if (error.message?.includes('Document') && error.message?.includes('does not exist')) {
        userMessage = 'Data guru tidak valid. Silakan hubungi administrator.';
      }
      
      Alert.alert(
        'Pendaftaran Gagal', 
        userMessage + '\\n\\nJika masalah berlanjut, silakan hubungi administrator.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderGuruItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.guruItem} 
      onPress={() => handleSelectGuru(item)}
    >
      <View style={styles.guruItemContent}>
        <Text style={styles.guruName}>{item.namaLengkap}</Text>
        <Text style={styles.guruDetails}>NIP: {item.nip}</Text>
        {item.mataPelajaran && (
          <Text style={styles.guruDetails}>
            Mata Pelajaran: {Array.isArray(item.mataPelajaran) ? item.mataPelajaran.join(', ') : item.mataPelajaran}
          </Text>
        )}
        {item.kelasAmpu && (
          <Text style={styles.guruDetails}>
            Kelas Ampu: {Array.isArray(item.kelasAmpu) ? item.kelasAmpu.join(', ') : item.kelasAmpu}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="rgb(124, 58, 237)" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgb(124, 58, 237)', 'rgb(147, 51, 234)']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => handleNavigation('PilihanLogin')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrasi Guru</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/logo/admin.png')} 
            style={styles.logo}
          />
          <Text style={styles.title}>Daftar Akun Guru</Text>
          <Text style={styles.subtitle}>
            Pilih data guru berdasarkan NIP untuk membuat akun login
          </Text>
        </View>

        {/* Guru Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Data Guru</Text>
          
          {loadingGuru ? (
            <View style={styles.loadingGuruContainer}>
              <ActivityIndicator size="small" color="rgb(124, 58, 237)" />
              <Text style={styles.loadingText}>Memuat data guru...</Text>
            </View>
          ) : guruList.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#999" />
              <Text style={styles.noDataTitle}>Tidak Ada Data Guru</Text>
              <Text style={styles.noDataText}>
                Semua guru sudah memiliki akun login atau belum ada data guru yang tersedia.
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadGuruWithoutLogin}
              >
                <Ionicons name="refresh" size={20} color="rgb(124, 58, 237)" />
                <Text style={styles.refreshButtonText}>Refresh Data</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.dropdownButton, selectedGuruData && styles.dropdownButtonSelected]} 
                onPress={() => setShowGuruPicker(true)}
              >
                <View style={styles.dropdownButtonContent}>
                  <Ionicons name="person" size={20} color="rgb(124, 58, 237)" />
                  <Text style={[styles.dropdownButtonText, selectedGuruData && styles.dropdownButtonTextSelected]}>
                    {selectedGuruData 
                      ? `${selectedGuruData.namaLengkap} (${selectedGuruData.nip})`
                      : 'Pilih Data Guru...'
                    }
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="rgb(124, 58, 237)" />
              </TouchableOpacity>

              {selectedGuruData && (
                <View style={styles.selectedGuruInfo}>
                  <Text style={styles.selectedGuruTitle}>Data Guru Terpilih:</Text>
                  <Text style={styles.selectedGuruDetail}>📋 Nama: {selectedGuruData.namaLengkap}</Text>
                  <Text style={styles.selectedGuruDetail}>🆔 NIP: {selectedGuruData.nip}</Text>
                  {selectedGuruData.mataPelajaran && (
                    <Text style={styles.selectedGuruDetail}>
                      📚 Mata Pelajaran: {Array.isArray(selectedGuruData.mataPelajaran) 
                        ? selectedGuruData.mataPelajaran.join(', ') 
                        : selectedGuruData.mataPelajaran}
                    </Text>
                  )}
                  {selectedGuruData.kelasAmpu && (
                    <Text style={styles.selectedGuruDetail}>
                      🏫 Kelas Ampu: {Array.isArray(selectedGuruData.kelasAmpu) 
                        ? selectedGuruData.kelasAmpu.join(', ') 
                        : selectedGuruData.kelasAmpu}
                    </Text>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        {/* Login Credentials Form */}
        {selectedGuruData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buat Akun Login</Text>
            
            {/* Username */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
              <TextInput
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="Username"
                style={styles.input}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
              <TextInput
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Password (min. 6 karakter)"
                style={styles.input}
                placeholderTextColor="#999"
                secureTextEntry={obscurePassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setObscurePassword(!obscurePassword)}
                style={styles.passwordToggle}
              >
                <Ionicons 
                  name={obscurePassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            {/* Nomor HP (Optional) */}
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
              <TextInput
                value={formData.nomorHP}
                onChangeText={(text) => setFormData({ ...formData, nomorHP: text })}
                placeholder="Nomor HP (Opsional)"
                style={styles.input}
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* Email Preview */}
            {formData.username && (
              <View style={styles.emailPreview}>
                <Ionicons name="mail" size={16} color="#666" />
                <Text style={styles.emailPreviewText}>
                  Email akan dibuat otomatis: {formData.username}@guru.{
                    selectedGuruData.mataPelajaran && Array.isArray(selectedGuruData.mataPelajaran) && selectedGuruData.mataPelajaran.length > 0
                      ? selectedGuruData.mataPelajaran[0].toLowerCase().replace(/\\s+/g, '')
                      : 'guru'
                  }.sch.id
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Register Button */}
        {selectedGuruData && (
          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.registerButtonText}>Daftar Sekarang</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Sudah punya akun? </Text>
          <TouchableOpacity onPress={() => handleNavigation('GuruLogin')}>
            <Text style={styles.loginLink}>Masuk di sini</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Guru Picker Modal */}
      {showGuruPicker && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Data Guru</Text>
              <TouchableOpacity onPress={() => setShowGuruPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={guruList}
              renderItem={renderGuruItem}
              keyExtractor={(item) => item.id || item.nip}
              style={styles.guruList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    borderRadius: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  loadingGuruContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginTop: 10,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noDataTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1a1a1a',
    marginTop: 15,
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(124, 58, 237)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: 'white',
    marginLeft: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  dropdownButtonSelected: {
    borderColor: 'rgb(124, 58, 237)',
    backgroundColor: '#f3f1ff',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  dropdownButtonTextSelected: {
    color: 'rgb(124, 58, 237)',
    fontFamily: 'Nunito_700Bold',
  },
  selectedGuruInfo: {
    backgroundColor: '#f3f1ff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgb(124, 58, 237)',
  },
  selectedGuruTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: 'rgb(124, 58, 237)',
    marginBottom: 8,
  },
  selectedGuruDetail: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#333',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#1a1a1a',
  },
  passwordToggle: {
    padding: 5,
  },
  emailPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  emailPreviewText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#0369a1',
    marginLeft: 8,
    flex: 1,
  },
  registerButton: {
    backgroundColor: 'rgb(124, 58, 237)',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: 'rgb(124, 58, 237)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: 'white',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: 'rgb(124, 58, 237)',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '70%',
    width: '100%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1a1a1a',
  },
  guruList: {
    flex: 1,
  },
  guruItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  guruItemContent: {
    flex: 1,
  },
  guruName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  guruDetails: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});