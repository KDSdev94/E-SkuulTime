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
  Image
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

export default function RegisterGuru() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [loadingNIP, setLoadingNIP] = useState(true);
  const [availableGuru, setAvailableGuru] = useState([]);
  const [selectedGuruData, setSelectedGuruData] = useState(null);
  
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
  
  const [obscurePassword, setObscurePassword] = useState(true);
  
  let [fontsLoaded] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
  });
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    namaLengkap: '',
    nip: '',
    jenisKelamin: 'Laki-laki',
    mataPelajaran: [],
    kelasAmpu: [],
    statusAktif: 'Aktif',
    nomorHP: '',
    email: '',
  });

  // Load available NIP data on component mount
  useEffect(() => {
    loadAvailableNIP();
  }, []);

  const loadAvailableNIP = async () => {
    try {
      setLoadingNIP(true);
      console.log('Loading NIP data...');
      
      // Get all guru data
      const allGuru = await GuruService.getAllGuru();
      console.log('All guru loaded:', allGuru.length);
      
      // Filter guru that don't have username (haven't registered yet)
      const unregisteredGuru = allGuru.filter(guru => {
        const hasUsername = guru.username && guru.username !== '' && guru.username !== null;
        const hasValidData = guru.nip && guru.namaLengkap;
        return !hasUsername && hasValidData;
      });
      
      console.log('Unregistered guru:', unregisteredGuru.length);
      console.log('Sample data with IDs:', unregisteredGuru.slice(0, 2).map(g => ({
        documentId: g.id,
        nip: g.nip,
        name: g.namaLengkap
      })));
      
      setAvailableGuru(unregisteredGuru);
      
      if (unregisteredGuru.length === 0) {
        Alert.alert('Info', 'Tidak ada data guru yang tersedia untuk pendaftaran. Semua guru sudah terdaftar atau belum ada data guru di sistem.');
      }
    } catch (error) {
      console.error('Error loading NIP data:', error);
      Alert.alert('Error', `Gagal memuat data NIP: ${error.message}`);
    } finally {
      setLoadingNIP(false);
    }
  };

  const handleNIPChange = (selectedNIP) => {
    if (!selectedNIP) {
      setFormData({
        ...formData,
        nip: '',
        namaLengkap: '',
        jenisKelamin: 'Laki-laki',
        mataPelajaran: [],
        kelasAmpu: []
      });
      setSelectedGuruData(null);
      return;
    }

    // Find selected guru data
    const guruData = availableGuru.find(guru => guru.nip === selectedNIP);
    if (guruData) {
      setSelectedGuruData(guruData);
      setFormData({
        ...formData,
        nip: selectedNIP,
        namaLengkap: (guruData.namaLengkap || '').toString(),
        jenisKelamin: (guruData.jenisKelamin || 'Laki-laki').toString(),
        mataPelajaran: Array.isArray(guruData.mataPelajaran) ? guruData.mataPelajaran : [],
        kelasAmpu: Array.isArray(guruData.kelasAmpu) ? guruData.kelasAmpu : [],
        tempatLahir: (guruData.tempatLahir || '').toString(),
        tanggalLahir: guruData.tanggalLahir || '',
        alamat: (guruData.alamat || '').toString(),
        nomorHP: (guruData.nomorHP || '').toString(),
        pendidikanTerakhir: (guruData.pendidikanTerakhir || '').toString()
      });
    }
  };

  const handleRegister = async () => {
    const { namaLengkap, nip, username, password } = formData;
    if (!namaLengkap || !nip || !username || !password) {
      Alert.alert('Error', 'Semua field yang bertanda * wajib diisi');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    if (!selectedGuruData) {
      Alert.alert('Error', 'Data guru tidak ditemukan. Silakan pilih NIP yang valid.');
      return;
    }

    try {
      setLoading(true);
      
      // Check if username already exists
      const allGuru = await GuruService.getAllGuru();
      const existingUsername = allGuru.find(guru => {
        const guruUsername = guru.username ? guru.username.toString() : '';
        const guruNip = guru.nip ? guru.nip.toString() : '';
        return guruUsername === username && guruNip !== nip;
      });
      
      if (existingUsername) {
        Alert.alert('Error', 'Username sudah digunakan. Silakan pilih username lain.');
        return;
      }
      
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
      
      console.log('🚀 REGISTER GURU: Starting registration process for:', {
        nip: selectedGuruData.nip,
        name: updatedGuruData.namaLengkap,
        username: updatedGuruData.username,
        email: updatedGuruData.email,
        mataPelajaran: updatedGuruData.mataPelajaran,
        kelasAmpu: updatedGuruData.kelasAmpu
      });

      // Use the updateGuruByNip method for safer update
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
        userMessage + '\n\nJika masalah berlanjut, silakan hubungi administrator.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  if (!fontsLoaded) {
    return null;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['rgb(124, 58, 237)', 'rgb(168, 85, 247)']}
            style={styles.gradientBackground}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBackground}>
                <Image
                  source={require('../../../assets/icon/teachericon.jpg')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.headerTitle}>Register Akun Guru</Text>
            <Text style={styles.headerSubtitle}>Silahkan lengkapi data untuk mendaftar</Text>
          </LinearGradient>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Pendaftaran Guru</Text>
          <Text style={styles.formSubtitle}>Pilih NIP Anda untuk melanjutkan pendaftaran akun</Text>
          
          {!selectedGuruData && (
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={16} color="rgb(124, 58, 237)" />
              <Text style={styles.infoText}>
                Pilih NIP Anda dari dropdown. Data pribadi akan terisi otomatis.
              </Text>
            </View>
          )}
          
          {selectedGuruData && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.successText}>
                Data ditemukan! Silakan buat username dan password untuk akun Anda.
              </Text>
            </View>
          )}
          
          {/* NIP Picker - First field */}
          <View style={styles.inputWrapper}>
            <Ionicons name="id-card" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
            {loadingNIP ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="rgb(124, 58, 237)" />
                <Text style={styles.loadingText}>Memuat data NIP...</Text>
              </View>
            ) : (
              <RNPicker
                selectedValue={formData.nip}
                onValueChange={handleNIPChange}
                style={styles.pickerInWrapper}
                prompt="Pilih NIP"
              >
                <RNPicker.Item label="Pilih NIP *" value="" color="#999" />
                {availableGuru.map((guru) => (
                  <RNPicker.Item 
                    key={guru.nip} 
                    label={`${guru.nip} - ${guru.namaLengkap}`} 
                    value={guru.nip} 
                  />
                ))}
              </RNPicker>
            )}
          </View>

          {/* Show username and password fields only after NIP is selected */}
          {selectedGuruData && (
            <>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-circle" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
                <TextInput
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                  placeholder='Username *'
                  style={styles.input}
                  placeholderTextColor='#999'
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
                <TextInput
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder='Password (min. 6 karakter) *'
                  secureTextEntry={obscurePassword}
                  style={[styles.input, { flex: 1 }]}
                  placeholderTextColor='#999'
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setObscurePassword(!obscurePassword)}>
                  <Ionicons 
                    name={obscurePassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="rgb(124, 58, 237)" 
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
          
          <View style={styles.inputWrapper}>
            <Ionicons name="person" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
            <TextInput
              value={formData.namaLengkap}
              placeholder={selectedGuruData ? 'Nama Lengkap (otomatis terisi)' : 'Nama Lengkap *'}
              style={[styles.input, selectedGuruData && styles.readOnlyInput]}
              placeholderTextColor='#999'
              autoCapitalize="words"
              editable={false}
            />
          </View>
          
          <View style={styles.inputWrapper}>
            <Ionicons name="people" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
            <TextInput
              value={formData.jenisKelamin}
              placeholder={selectedGuruData ? 'Jenis Kelamin (otomatis terisi)' : 'Jenis Kelamin'}
              style={[styles.input, selectedGuruData && styles.readOnlyInput]}
              placeholderTextColor='#999'
              editable={false}
            />
          </View>

          {selectedGuruData && (
            <>
              <View style={styles.inputWrapper}>
                <Ionicons name="book" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
                <TextInput
                  value={Array.isArray(formData.mataPelajaran) ? formData.mataPelajaran.join(', ') : ''}
                  placeholder="Mata Pelajaran (otomatis terisi)"
                  style={[styles.input, styles.readOnlyInput]}
                  placeholderTextColor='#999'
                  editable={false}
                  multiline={true}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="school" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
                <TextInput
                  value={Array.isArray(formData.kelasAmpu) ? formData.kelasAmpu.join(', ') : ''}
                  placeholder="Kelas Ampu (otomatis terisi)"
                  style={[styles.input, styles.readOnlyInput]}
                  placeholderTextColor='#999'
                  editable={false}
                  multiline={true}
                />
              </View>
            </>
          )}

          <View style={styles.inputWrapper}>
            <Ionicons name="call" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
            <TextInput
              value={formData.nomorHP}
              onChangeText={(text) => setFormData({ ...formData, nomorHP: text })}
              placeholder='Nomor HP (Opsional)'
              style={styles.input}
              placeholderTextColor='#999'
              keyboardType="phone-pad"
            />
          </View>

          {selectedGuruData && formData.username && (
            <View style={styles.emailPreview}>
              <Ionicons name="mail" size={16} color="#666" />
              <Text style={styles.emailPreviewText}>
                Email akan dibuat otomatis: {formData.username}@guru.{
                  selectedGuruData.mataPelajaran && Array.isArray(selectedGuruData.mataPelajaran) && selectedGuruData.mataPelajaran.length > 0
                    ? selectedGuruData.mataPelajaran[0].toLowerCase().replace(/\s+/g, '')
                    : 'guru'
                }.sch.id
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.registerButton, (!selectedGuruData || loading) && styles.disabledButton]}
            onPress={handleRegister}
            disabled={!selectedGuruData || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>DAFTAR</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => handleNavigation('GuruLogin')}
          >
            <Text style={styles.backButtonText}>Sudah punya akun? Masuk di sini</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    width: '100%',
  },
  gradientBackground: {
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: '#fff',
    borderRadius: 60,
    padding: 10,
    elevation: 15,
  },
  avatarBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: 'rgb(124, 58, 237)',
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: 'rgb(124, 58, 237)',
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#4CAF50',
    marginLeft: 8,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 3,
    marginBottom: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#333',
    paddingVertical: 15,
  },
  readOnlyInput: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
  },
  pickerInWrapper: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginLeft: 10,
  },
  emailPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
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
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  backButtonText: {
    color: 'rgb(124, 58, 237)',
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
  },
});