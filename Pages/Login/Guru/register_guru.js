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
import MataPelajaranService from '../../../services/MataPelajaranService';
import KelasJurusanService from '../../../services/KelasJurusanService';

export default function RegisterGuru() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [loadingNIP, setLoadingNIP] = useState(true);
  const [availableGuru, setAvailableGuru] = useState([]);
  const [selectedGuruData, setSelectedGuruData] = useState(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
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
  
  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setFormData({ ...formData, tanggalLahir: formattedDate });
    }
  };
  
  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };
  
  let [fontsLoaded] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
  });

  useEffect(() => {
    loadAvailableNIP();
    loadSubjects();
    loadClasses();
  }, []);

  // Load available NIP data on component mount
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

  const loadSubjects = async () => {
    try {
      console.log('Loading subjects...');
      
      // First try to get from Firestore (which returns objects with .nama property)
      const firestoreSubjects = await MataPelajaranService.getMataPelajaranFromFirestore();
      console.log('Firestore subjects:', firestoreSubjects);
      
      if (firestoreSubjects && firestoreSubjects.length > 0) {
        setSubjects(firestoreSubjects);
        console.log('Using firestore subjects:', firestoreSubjects.length);
      } else {
        // Fallback to string array, convert to objects with .nama property
        const stringSubjects = await MataPelajaranService.getAllMataPelajaran();
        console.log('String subjects:', stringSubjects);
        
        if (stringSubjects && stringSubjects.length > 0) {
          const convertedSubjects = stringSubjects.map((subject, index) => ({
            id: `fallback_${index}`,
            nama: subject
          }));
          setSubjects(convertedSubjects);
          console.log('Using converted string subjects:', convertedSubjects.length);
        } else {
          // Ultimate fallback - use predefined subjects
          const defaultSubjects = [
            { id: 'default_1', nama: 'Bahasa Indonesia' },
            { id: 'default_2', nama: 'Bahasa Inggris' },
            { id: 'default_3', nama: 'Matematika' },
            { id: 'default_4', nama: 'Pendidikan Agama' },
            { id: 'default_5', nama: 'PPKn' },
            { id: 'default_6', nama: 'Sejarah Indonesia' },
            { id: 'default_7', nama: 'Seni Budaya' },
            { id: 'default_8', nama: 'PJOK' },
            { id: 'default_9', nama: 'Prakarya dan Kewirausahaan' },
            { id: 'default_10', nama: 'Komputer dan Jaringan Dasar' },
            { id: 'default_11', nama: 'Pemrograman Dasar' },
            { id: 'default_12', nama: 'Sistem Komputer' }
          ];
          setSubjects(defaultSubjects);
          console.log('Using default subjects:', defaultSubjects.length);
        }
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      // Set default subjects as ultimate fallback
      const defaultSubjects = [
        { id: 'error_1', nama: 'Bahasa Indonesia' },
        { id: 'error_2', nama: 'Bahasa Inggris' },
        { id: 'error_3', nama: 'Matematika' }
      ];
      setSubjects(defaultSubjects);
    }
  };

  const loadClasses = async () => {
    try {
      const allClasses = await KelasJurusanService.getAllKelas();
      setClasses(allClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const toggleSubjectSelection = (subject) => {
    const currentSubjects = formData.mataPelajaran;
    const isSelected = currentSubjects.includes(subject);
    
    if (isSelected) {
      setFormData({
        ...formData,
        mataPelajaran: currentSubjects.filter(s => s !== subject)
      });
    } else {
      setFormData({
        ...formData,
        mataPelajaran: [...currentSubjects, subject]
      });
    }
  };

  const toggleClassSelection = (kelas) => {
    const currentClasses = formData.kelasAmpu;
    const isSelected = currentClasses.includes(kelas);
    
    if (isSelected) {
      setFormData({
        ...formData,
        kelasAmpu: currentClasses.filter(k => k !== kelas)
      });
    } else {
      setFormData({
        ...formData,
        kelasAmpu: [...currentClasses, kelas]
      });
    }
  };
  
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

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
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
      updatedGuruData.email = safeString(formData.email);
        
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

👤 Username: ${updatedGuruData.username}
📚 Mata Pelajaran: ${updatedGuruData.mataPelajaran.join(', ')}${updatedGuruData.email ? `\n📧 Email: ${updatedGuruData.email}` : ''}

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


          
          <View style={styles.inputWrapper}>
            <Ionicons name="book" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowSubjectPicker(!showSubjectPicker)}
            >
              <Text style={[styles.pickerButtonText, formData.mataPelajaran.length === 0 && styles.placeholderText]}>
                {formData.mataPelajaran.length > 0 
                  ? (formData.mataPelajaran.length <= 2 
                      ? formData.mataPelajaran.join(', ')
                      : `${formData.mataPelajaran.slice(0, 2).join(', ')}, +${formData.mataPelajaran.length - 2} lainnya`)
                  : 'Pilih Mata Pelajaran *'}
              </Text>
              <Ionicons name={showSubjectPicker ? "chevron-up" : "chevron-down"} size={20} color="rgb(124, 58, 237)" />
            </TouchableOpacity>
          </View>
          
          {showSubjectPicker && (
            <View style={styles.pickerContainer}>
              <ScrollView style={styles.pickerScrollView} nestedScrollEnabled={true}>
                {subjects.map((subject, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.pickerItem,
                      formData.mataPelajaran.includes(subject.nama) && styles.selectedPickerItem
                    ]}
                    onPress={() => toggleSubjectSelection(subject.nama)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      formData.mataPelajaran.includes(subject.nama) && styles.selectedPickerItemText
                    ]}>
                      {subject.nama}
                    </Text>
                    {formData.mataPelajaran.includes(subject.nama) && (
                      <Ionicons name="checkmark" size={20} color="rgb(124, 58, 237)" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          <View style={styles.inputWrapper}>
            <Ionicons name="school" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowClassPicker(!showClassPicker)}
            >
              <Text style={[styles.pickerButtonText, formData.kelasAmpu.length === 0 && styles.placeholderText]}>
                {formData.kelasAmpu.length > 0 
                  ? `${formData.kelasAmpu.length} kelas dipilih` 
                  : 'Pilih Kelas yang Diampu *'}
              </Text>
              <Ionicons name={showClassPicker ? "chevron-up" : "chevron-down"} size={20} color="rgb(124, 58, 237)" />
            </TouchableOpacity>
          </View>
          
          {showClassPicker && (
            <View style={styles.pickerContainer}>
              <ScrollView style={styles.pickerScrollView} nestedScrollEnabled={true}>
                {classes.map((kelas, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.pickerItem,
                      formData.kelasAmpu.includes(kelas.nama) && styles.selectedPickerItem
                    ]}
                    onPress={() => toggleClassSelection(kelas.nama)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      formData.kelasAmpu.includes(kelas.nama) && styles.selectedPickerItemText
                    ]}>
                      {kelas.nama}
                    </Text>
                    {formData.kelasAmpu.includes(kelas.nama) && (
                      <Ionicons name="checkmark" size={20} color="rgb(124, 58, 237)" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}





          


          <View style={styles.inputWrapper}>
            <Ionicons name="mail" size={20} color="rgb(124, 58, 237)" style={styles.inputIcon} />
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
  readOnlyInput: {
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    color: '#666',
  },
  registerButton: {
    backgroundColor: 'rgb(124, 58, 237)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    elevation: 5,
    shadowColor: 'rgb(124, 58, 237)',
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
    color: 'rgb(124, 58, 237)',
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
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
  },
  pickerButtonText: {
    flex: 1,
    color: '#333',
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
  },
  placeholderText: {
    color: '#999',
  },
  pickerContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 16,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerScrollView: {
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedPickerItem: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  pickerItemText: {
    flex: 1,
    color: '#333',
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
  },
  selectedPickerItemText: {
    color: 'rgb(124, 58, 237)',
    fontFamily: 'Nunito_700Bold',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: 'rgb(124, 58, 237)',
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
    color: 'rgb(124, 58, 237)',
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    marginLeft: 10,
    flex: 1,
    color: '#2e7d32',
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 10,
    color: 'rgb(124, 58, 237)',
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
  },
});
