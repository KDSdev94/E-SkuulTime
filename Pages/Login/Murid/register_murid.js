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
import MuridService from '../../../services/MuridService';
import { createNotification } from '../../../services/notificationService';
import RegistrationService from '../../../services/RegistrationService';

export default function RegisterMurid() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [loadingNIS, setLoadingNIS] = useState(true);
  const [availableNIS, setAvailableNIS] = useState([]);
  const [selectedStudentData, setSelectedStudentData] = useState(null);
  
  const handleNavigation = (route) => {
    try {
      if (navigation && navigation.navigate) {
        navigation.navigate(route);
      } else {
        
        setTimeout(() => handleNavigation(route), 100);
      }
    } catch (error) {
      
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
    nis: '',
    jenisKelamin: 'Laki-laki',
    kelas: '',
    jurusan: 'TKJ',
    tahunMasuk: new Date().getFullYear().toString(),
    statusSiswa: 'Aktif',
    nomorHP: '',
    email: '',
  });

  // Load available NIS data on component mount
  useEffect(() => {
    loadAvailableNIS();
  }, []);

  const loadAvailableNIS = async () => {
    try {
      setLoadingNIS(true);
      console.log('Loading NIS data...');
      
      // Get all students data
      const allStudents = await MuridService.getAllMurid();
      console.log('All students loaded:', allStudents.length);
      
      // Filter students that don't have username (haven't registered yet)
      const unregisteredStudents = allStudents.filter(student => {
        const hasUsername = student.username && student.username !== '' && student.username !== null;
        const hasValidData = student.nis && student.namaLengkap;
        return !hasUsername && hasValidData;
      });
      
      console.log('Unregistered students:', unregisteredStudents.length);
      console.log('Sample data with IDs:', unregisteredStudents.slice(0, 2).map(s => ({
        documentId: s.id,
        nis: s.nis,
        name: s.namaLengkap
      })));
      
      setAvailableNIS(unregisteredStudents);
      
      if (unregisteredStudents.length === 0) {
        Alert.alert('Info', 'Tidak ada data murid yang tersedia untuk pendaftaran. Semua murid sudah terdaftar atau belum ada data murid di sistem.');
      }
    } catch (error) {
      console.error('Error loading NIS data:', error);
      Alert.alert('Error', `Gagal memuat data NIS: ${error.message}`);
    } finally {
      setLoadingNIS(false);
    }
  };

  const handleNISChange = (selectedNIS) => {
    if (!selectedNIS) {
      setFormData({
        ...formData,
        nis: '',
        namaLengkap: '',
        kelas: '',
        jenisKelamin: 'Laki-laki',
        jurusan: 'TKJ'
      });
      setSelectedStudentData(null);
      return;
    }

    // Find selected student data
    const studentData = availableNIS.find(student => student.nis === selectedNIS);
    if (studentData) {
      setSelectedStudentData(studentData);
      setFormData({
        ...formData,
        nis: selectedNIS,
        namaLengkap: (studentData.namaLengkap || '').toString(),
        kelas: (studentData.kelas || '').toString(),
        jenisKelamin: (studentData.jenisKelamin || 'Laki-laki').toString(),
        jurusan: (studentData.jurusan || 'TKJ').toString()
      });
    }
  };

  const handleRegister = async () => {
    const { namaLengkap, nis, username, password } = formData;
    if (!namaLengkap || !nis || !username || !password) {
      Alert.alert('Error', 'Semua field yang bertanda * wajib diisi');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    if (!selectedStudentData) {
      Alert.alert('Error', 'Data murid tidak ditemukan. Silakan pilih NIS yang valid.');
      return;
    }

    try {
      setLoading(true);
      
      // Check if username already exists
      const allStudents = await MuridService.getAllMurid();
      const existingUsername = allStudents.find(student => {
        const studentUsername = student.username ? student.username.toString() : '';
        const studentNis = student.nis ? student.nis.toString() : '';
        return studentUsername === username && studentNis !== nis;
      });
      
      if (existingUsername) {
        Alert.alert('Error', 'Username sudah digunakan. Silakan pilih username lain.');
        return;
      }
      
      const extractedJurusan = (selectedStudentData.jurusan || 'TKJ').toString();
      const autoEmail = `${username}@murid.${extractedJurusan.toLowerCase()}.sch.id`;
      
      // Create ULTRA-SAFE student data (prevent any indexOf errors)
      const updatedStudentData = {};
      
      // Helper function to safely convert to string
      const safeString = (value, defaultValue = '') => {
        if (value === null || value === undefined) return String(defaultValue);
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return String(value);
        return String(defaultValue);
      };
      
      // Essential fields (required)
      updatedStudentData.nis = safeString(selectedStudentData.nis);
      updatedStudentData.namaLengkap = safeString(selectedStudentData.namaLengkap);
      updatedStudentData.kelas = safeString(selectedStudentData.kelas);
      updatedStudentData.jurusan = safeString(extractedJurusan, 'TKJ');
      updatedStudentData.jenisKelamin = safeString(selectedStudentData.jenisKelamin, 'Laki-laki');
        
      // Login credentials (required)
      updatedStudentData.username = safeString(username);
      updatedStudentData.password = safeString(password);
      updatedStudentData.email = safeString(autoEmail);
        
      // Optional contact info
      updatedStudentData.nomorHP = safeString(formData.nomorHP || selectedStudentData.nomorHP);
        
      // Other existing data (optional but safe)
      updatedStudentData.tempatLahir = safeString(selectedStudentData.tempatLahir);
      updatedStudentData.alamat = safeString(selectedStudentData.alamat);
      updatedStudentData.namaOrtu = safeString(selectedStudentData.namaOrtu);
      updatedStudentData.nomorHPOrtu = safeString(selectedStudentData.nomorHPOrtu);
      updatedStudentData.nomorHPWali = safeString(selectedStudentData.nomorHPWali);
      updatedStudentData.fotoUrl = safeString(selectedStudentData.fotoUrl);
      updatedStudentData.tahunMasuk = safeString(selectedStudentData.tahunMasuk, new Date().getFullYear());
      updatedStudentData.statusSiswa = safeString(selectedStudentData.statusSiswa, 'Aktif');
      updatedStudentData.rombel = safeString(selectedStudentData.rombel || selectedStudentData.kelas);
        
      // Handle date fields properly (keep as-is if they exist)
      if (selectedStudentData.tanggalLahir) {
        updatedStudentData.tanggalLahir = selectedStudentData.tanggalLahir;
      }
      if (selectedStudentData.createdAt) {
        updatedStudentData.createdAt = selectedStudentData.createdAt;
      }
      
      console.log('📋 REGISTER: Data prepared safely with keys:', Object.keys(updatedStudentData));
      
      // Debug logging
      console.log('🚀 REGISTER: Starting registration process for:', {
        nis: selectedStudentData.nis,
        name: updatedStudentData.namaLengkap,
        username: updatedStudentData.username,
        email: updatedStudentData.email
      });

      // Use the new safer method that handles everything internally
      console.log('🔄 REGISTER: Using updateMuridByNis method for safer update');
      
      const updateResult = await MuridService.updateMuridByNis(
        selectedStudentData.nis, 
        updatedStudentData, 
        'Self Registration'
      );
      
      console.log('✅ REGISTER: Update completed successfully:', updateResult);
      
      Alert.alert(
        'Pendaftaran Berhasil! 🎉', 
        `Akun Anda telah berhasil dibuat dan dapat digunakan untuk login.\n\n📧 Email: ${updatedStudentData.email}\n👤 Username: ${updatedStudentData.username}\n\nAdmin telah diberitahu tentang pendaftaran Anda.`,
        [
          {
            text: 'OK',
            onPress: () => handleNavigation('MuridLogin')
          }
        ]
      );
    } catch (error) {
      console.error('❌ REGISTER: Registration failed:', error);
      console.error('❌ REGISTER: Error details:', {
        message: error.message,
        selectedStudentNis: selectedStudentData?.nis,
        selectedStudentName: selectedStudentData?.namaLengkap,
        username: username,
        errorType: error.constructor.name
      });
      
      let userMessage = 'Pendaftaran gagal. Silakan coba lagi.';
      
      // Provide specific error messages for common issues
      if (error.message?.includes('not found in database')) {
        userMessage = 'Data murid tidak ditemukan di database. Pastikan NIS yang dipilih benar.';
      } else if (error.message?.includes('Username') && error.message?.includes('sudah digunakan')) {
        userMessage = 'Username sudah digunakan. Silakan pilih username lain.';
      } else if (error.message?.includes('indexOf')) {
        userMessage = 'Terjadi masalah teknis. Silakan coba refresh halaman dan ulangi proses pendaftaran.';
      } else if (error.message?.includes('Document') && error.message?.includes('does not exist')) {
        userMessage = 'Data murid tidak valid. Silakan hubungi administrator.';
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
            colors={['rgb(148, 232, 167)', 'rgb(108, 212, 127)']}
            style={styles.gradientBackground}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBackground}>
                <Image
                  source={require('../../../assets/logo/student.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.headerTitle}>Register Akun Murid</Text>
            <Text style={styles.headerSubtitle}>Silahkan lengkapi data untuk mendaftar</Text>
          </LinearGradient>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Pendaftaran Murid</Text>
          <Text style={styles.formSubtitle}>Pilih NIS Anda untuk melanjutkan pendaftaran akun</Text>
          
          {!selectedStudentData && (
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={16} color="rgb(108, 212, 127)" />
              <Text style={styles.infoText}>
                Pilih NIS Anda dari dropdown. Data pribadi akan terisi otomatis.
              </Text>
            </View>
          )}
          
          {selectedStudentData && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.successText}>
                Data ditemukan! Silakan buat username dan password untuk akun Anda.
              </Text>
            </View>
          )}
          
          {/* NIS Picker - First field */}
          <View style={styles.inputWrapper}>
            <Ionicons name="id-card" size={20} color="rgb(108, 212, 127)" style={styles.inputIcon} />
            {loadingNIS ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="rgb(108, 212, 127)" />
                <Text style={styles.loadingText}>Memuat data NIS...</Text>
              </View>
            ) : (
              <RNPicker
                selectedValue={formData.nis}
                onValueChange={handleNISChange}
                style={styles.pickerInWrapper}
                prompt="Pilih NIS"
              >
                <RNPicker.Item label="Pilih NIS *" value="" color="#999" />
                {availableNIS.map((student) => (
                  <RNPicker.Item 
                    key={student.nis} 
                    label={`${student.nis} - ${student.namaLengkap}`} 
                    value={student.nis} 
                  />
                ))}
              </RNPicker>
            )}
          </View>

          {/* Show username and password fields only after NIS is selected */}
          {selectedStudentData && (
            <>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-circle" size={20} color="rgb(108, 212, 127)" style={styles.inputIcon} />
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
                <Ionicons name="lock-closed" size={20} color="rgb(108, 212, 127)" style={styles.inputIcon} />
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
                    color="rgb(108, 212, 127)" 
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
          
          <View style={styles.inputWrapper}>
            <Ionicons name="person" size={20} color="rgb(108, 212, 127)" style={styles.inputIcon} />
            <TextInput
              value={formData.namaLengkap}
              placeholder={selectedStudentData ? 'Nama Lengkap (otomatis terisi)' : 'Nama Lengkap *'}
              style={[styles.input, selectedStudentData && styles.readOnlyInput]}
              placeholderTextColor='#999'
              autoCapitalize="words"
              editable={false}
            />
          </View>
          
          
          <View style={styles.inputWrapper}>
            <Ionicons name="school" size={20} color="rgb(108, 212, 127)" style={styles.inputIcon} />
            <TextInput
              value={formData.kelas}
              placeholder={selectedStudentData ? 'Kelas (otomatis terisi)' : 'Kelas'}
              style={[styles.input, selectedStudentData && styles.readOnlyInput]}
              placeholderTextColor='#999'
              editable={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="rgb(108, 212, 127)" style={styles.inputIcon} />
            <TextInput
              value={formData.jenisKelamin}
              placeholder={selectedStudentData ? 'Jenis Kelamin (otomatis terisi)' : 'Jenis Kelamin'}
              style={[styles.input, selectedStudentData && styles.readOnlyInput]}
              placeholderTextColor='#999'
              editable={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="call" size={20} color="rgb(108, 212, 127)" style={styles.inputIcon} />
            <TextInput
              value={formData.nomorHP}
              onChangeText={(text) => setFormData({ ...formData, nomorHP: text })}
              placeholder='Nomor HP (Opsional)'
              style={styles.input}
              placeholderTextColor='#999'
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail" size={20} color="rgb(108, 212, 127)" style={styles.inputIcon} />
            <TextInput
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder='Email (Opsional)'
              style={styles.input}
              placeholderTextColor='#999'
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size={20} color="white" />
            ) : (
              <Text style={styles.buttonText}>REGISTER</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Kembali ke Login</Text>
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
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    marginTop: 16,
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    marginTop: 4,
  },
  formContainer: {
    marginHorizontal: 24,
    marginTop: -30,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    minHeight: 56,
    borderWidth: 0,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    minHeight: 56,
    color: '#333',
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: 'rgb(108, 212, 127)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    elevation: 5,
    shadowColor: 'rgb(108, 212, 127)',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#a0a0a0',
    shadowColor: '#a0a0a0',
  },
  backButton: {
    marginTop: 15,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'rgb(108, 212, 127)',
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 1.2,
  },
  pickerInWrapper: {
    flex: 1,
    height: 56,
    color: '#333',
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    marginLeft: -16,
    marginRight: -16,
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
    color: '#2e7d32',
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    marginLeft: 8,
    flex: 1,
    color: '#2e7d32',
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
  },
});
