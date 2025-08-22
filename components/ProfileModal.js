import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeStatusBar } from '../utils/statusBarUtils';
import { useUser } from '../context/UserContext';
import AuthService from '../services/AuthService';
import { createNotification } from '../services/notificationService';

const formatFirebaseTimestamp = (timestamp) => {
  if (!timestamp) return 'Tidak tersedia';
  
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  return 'Tidak tersedia';
};

const safeStringify = (value) => {
  if (value === null || value === undefined) return 'Tidak tersedia';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Tidak tersedia';
    return value.join(', ');
  }
  if (typeof value === 'object') {
    if (value.seconds && value.nanoseconds) {
      return formatFirebaseTimestamp(value);
    }
    return JSON.stringify(value);
  }
  return String(value);
};

const ProfileModal = ({ visible, onClose, userData, userType }) => {
  
  // Null check for userType to prevent undefined errors
  const safeUserType = userType || 'default';
  
  // Theme colors based on userType - matching dashboard themes
  const getThemeColors = () => {
    switch(safeUserType) {
      case 'guru':
        return {
          primary: 'rgb(124, 58, 237)', // #7C3AED - Purple theme for guru
          light: 'rgb(168, 85, 247)',   // #A855F7
          background: '#f3e8ff',         // Light purple background
          text: '#1e293b',               // Dark text for better readability
          textLight: '#64748b',          // Dark light text for better readability
          card: '#f5f3ff',              // Very light purple for cards
          border: '#e5e7eb',
          headerBackground: 'rgb(168, 85, 247)' // #A855F7
        };
      case 'murid':
        return {
          primary: '#4ECDC4',            // Teal theme for murid
          light: '#5DADE2', 
          background: '#f8fafc',         // Light background matching dashboard
          text: '#1e293b',
          textLight: '#3d4758',
          card: '#ffffff',
          border: '#e2e8f0',
          headerBackground: '#4ECDC4'
        };
      case 'prodi':
        return {
          primary: '#9333EA',
          light: '#A855F7',
          background: '#FAF5FF',
          text: '#1e293b',
          textLight: '#3d4758',
          card: '#ffffff',
          border: '#e2e8f0',
          headerBackground: '#9333EA'
        };
      default:
        return {
          primary: '#2c3e50',
          light: '#34495e',
          background: '#ECF0F1',
          text: '#1e293b',
          textLight: '#3d4758',
          card: '#ffffff',
          border: '#e2e8f0',
          headerBackground: '#2c3e50'
        };
    }
  };
  
  const themeColors = getThemeColors();
  
  // Ensure all theme properties exist to prevent undefined errors
  const safeThemeColors = {
    primary: themeColors?.primary || '#2c3e50',
    light: themeColors?.light || '#34495e',
    background: themeColors?.background || '#ECF0F1',
    text: themeColors?.text || '#1e293b',
    textLight: themeColors?.textLight || '#3d4758',
    card: themeColors?.card || '#ffffff',
    border: themeColors?.border || '#e2e8f0',
    headerBackground: themeColors?.headerBackground || '#2c3e50'
  };
  

  
  const getProfileFields = () => {
    if (safeUserType === 'prodi' || safeUserType === 'kaprodi' || safeUserType?.includes('kaprodi')) {
      return [
        { label: 'Nama Lengkap', value: safeStringify(userData?.namaLengkap || userData?.nama), icon: 'person' },
        { label: 'NIP', value: safeStringify(userData?.nip), icon: 'card' },
        { label: 'NIS', value: safeStringify(userData?.nis), icon: 'card' },
        { label: 'Username', value: safeStringify(userData?.username), icon: 'at' },
        { label: 'Email', value: safeStringify(userData?.email), icon: 'mail' },
        { label: 'Mata Pelajaran', value: safeStringify(userData?.mataPelajaran), icon: 'book' },
        { label: 'Kelas Ampu', value: safeStringify(userData?.kelasAmpu), icon: 'school' },
        { label: 'Kelas', value: safeStringify(userData?.kelas), icon: 'school' },
        { label: 'Jabatan', value: safeStringify(userData?.jabatan || userData?.role), icon: 'briefcase' },
        { label: 'Department', value: safeStringify(userData?.department), icon: 'business' },
        { label: 'Pendidikan Terakhir', value: safeStringify(userData?.pendidikanTerakhir), icon: 'school' },
        { label: 'Bidang Keahlian', value: safeStringify(userData?.bidangKeahlian), icon: 'bulb' },
        { label: 'Alamat', value: safeStringify(userData?.alamat), icon: 'location' },
        { label: 'No. Telepon', value: safeStringify(userData?.noTelepon || userData?.nomorHP), icon: 'call' },
        { label: 'Tanggal Lahir', value: formatFirebaseTimestamp(userData?.tanggalLahir) || safeStringify(userData?.tanggalLahir), icon: 'calendar' },
        { label: 'Jenis Kelamin', value: safeStringify(userData?.jenisKelamin), icon: 'people' },
      ];
    }
    return [];
  };

  const { updateProfile, refreshUser } = useUser();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    namaLengkap: userData?.namaLengkap || userData?.nama || '',
    nis: userData?.nis || '',
    nip: userData?.nip || '',
    username: userData?.username || '',
    email: userData?.email || '',
    kelas: userData?.kelas || '',
    mataPelajaran: Array.isArray(userData?.mataPelajaran) ? userData?.mataPelajaran.join(', ') : (userData?.mataPelajaran || ''),
    kelasAmpu: Array.isArray(userData?.kelasAmpu) ? userData?.kelasAmpu.join(', ') : (userData?.kelasAmpu || ''),
    jabatan: userData?.jabatan || '',
    alamat: userData?.alamat || '',
    noTelepon: userData?.noTelepon || userData?.nomorHP || '',
    tanggalLahir: formatFirebaseTimestamp(userData?.tanggalLahir) || '',
    jenisKelamin: userData?.jenisKelamin || '',
    // Additional fields for kaprodi/prodi
    department: userData?.department || '',
    pendidikanTerakhir: userData?.pendidikanTerakhir || '',
    bidangKeahlian: userData?.bidangKeahlian || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profileImage, setProfileImage] = useState(userData?.profileImage || userData?.fotoUrl || null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isEditingProfileImage, setIsEditingProfileImage] = useState(false);
  const [fotoUrlInput, setFotoUrlInput] = useState('');
  const [coverImage, setCoverImage] = useState(userData?.coverImage || null);
  const [isEditingCoverImage, setIsEditingCoverImage] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    setFormData({
      namaLengkap: userData?.namaLengkap || userData?.nama || '',
      nis: userData?.nis || '',
      nip: userData?.nip || '',
      username: userData?.username || '',
      email: userData?.email || '',
      kelas: userData?.kelas || '',
      mataPelajaran: Array.isArray(userData?.mataPelajaran) ? userData?.mataPelajaran.join(', ') : (userData?.mataPelajaran || ''),
      kelasAmpu: Array.isArray(userData?.kelasAmpu) ? userData?.kelasAmpu.join(', ') : (userData?.kelasAmpu || ''),
      jabatan: userData?.jabatan || '',
      alamat: userData?.alamat || '',
      noTelepon: userData?.noTelepon || userData?.nomorHP || '',
      tanggalLahir: formatFirebaseTimestamp(userData?.tanggalLahir) || '',
      jenisKelamin: userData?.jenisKelamin || '',
      // Additional fields for kaprodi/prodi
      department: userData?.department || '',
      pendidikanTerakhir: userData?.pendidikanTerakhir || '',
      bidangKeahlian: userData?.bidangKeahlian || '',
    });
    setProfileImage(userData?.profileImage || userData?.fotoUrl || null);
    setCoverImage(userData?.coverImage || null);
  }, [userData]);



  const validateForm = () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const phoneRegex = /^[0-9+\-\s]{10,15}$/;
    
    if (!formData.namaLengkap || !formData.namaLengkap.trim()) {
      Alert.alert('Error', 'Nama lengkap tidak boleh kosong.');
      return false;
    }
    
    if (formData.email && !emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Format email tidak valid.');
      return false;
    }
    
    if (formData.noTelepon && !phoneRegex.test(formData.noTelepon)) {
      Alert.alert('Error', 'Format nomor telepon tidak valid.');
      return false;
    }
    
    return true;
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword.trim()) {
      Alert.alert('Error', 'Password saat ini tidak boleh kosong.');
      return false;
    }
    
    if (!passwordData.newPassword.trim()) {
      Alert.alert('Error', 'Password baru tidak boleh kosong.');
      return false;
    }
    
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password baru minimal 6 karakter.');
      return false;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak cocok.');
      return false;
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      Alert.alert('Error', 'Password baru harus berbeda dengan password saat ini.');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) return;
      
      setLoading(true);
      setUploadProgress(0);
      console.log('ProfileModal: Saving profile with image:', { profileImage });
      
      // Strict data validation before sending to avoid indexOf errors
      // 1. Start with the original data
      const updatedData = { ...userData };

      // 2. Apply changes from the form, ensuring no undefined values are introduced
      Object.keys(formData).forEach(key => {
        updatedData[key] = formData[key] !== undefined ? formData[key] : null;
      });

      // 3. Handle specific data transformations with safe string checks
      const mataPelajaranValue = formData.mataPelajaran || '';
      const kelasAmpuValue = formData.kelasAmpu || '';
      
      // Pastikan value adalah string sebelum menggunakan split
      updatedData.mataPelajaran = typeof mataPelajaranValue === 'string' ? 
        mataPelajaranValue.split(',').map(item => item.trim()).filter(Boolean) : [];
      updatedData.kelasAmpu = typeof kelasAmpuValue === 'string' ? 
        kelasAmpuValue.split(',').map(item => item.trim()).filter(Boolean) : [];
      updatedData.nomorHP = formData.noTelepon || '';

      
      console.log('ProfileModal: Data being sent (raw):', updatedData);
      console.log('ProfileModal: Cleaned data to save:', updatedData);
      
      
      console.log('ProfileModal: Using regular updateProfile');
      const result = await updateProfile(updatedData);
      
      console.log('ProfileModal: Update result:', result);
      
      if (result.success) {
        await refreshUser(); // Refresh user data in context
        console.log('ProfileModal: User refreshed');
        
        
        Alert.alert('Berhasil', 'Profil berhasil diperbarui!');
        const senderInfo = {
          name: userData.namaLengkap || 'User',
          type: userType,
          id: userData.id || userData.uid
        };
        createNotification('admin', `${userType} ${userData.namaLengkap} telah memperbarui profilnya.`, senderInfo);
        setEditing(false);
        setUploadProgress(0);
      } else {
        Alert.alert('Error', result.message || 'Gagal memperbarui profil.');
      }
    } catch (error) {
      console.error('ProfileModal: Error saving profile:', error);
      Alert.alert('Error', error.message || 'Gagal memperbarui profil. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handlePasswordChange = async () => {
    if (!validatePassword()) return;
    
    setPasswordLoading(true);
    try {
      await AuthService.updatePassword(
        userType,
        userData.id || userData.uid,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      Alert.alert('Success', 'Password berhasil diubah!');
      const senderInfo = {
        name: userData.namaLengkap || 'User',
        type: userType,
        id: userData.id || userData.uid
      };
      createNotification('admin', `${userType} ${userData.namaLengkap} telah mengubah kata sandinya.`, senderInfo);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsEditingPassword(false);
    } catch (error) {
      
      Alert.alert('Error', error.message || 'Gagal mengubah password. Silakan coba lagi.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordEdit = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditingPassword(false);
  };

  const validateImageUrl = (url) => {
    if (!url || !url.trim()) {
      return false;
    }
    
    // Basic URL validation
    const urlRegex = /^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlRegex.test(url)) {
      Alert.alert('Error', 'Format URL tidak valid. Pastikan URL dimulai dengan http:// atau https://');
      return false;
    }
    
    // Check if URL is likely an image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const hasImageExtension = imageExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );
    
    if (!hasImageExtension) {
      Alert.alert(
        'Peringatan', 
        'URL yang Anda masukkan mungkin bukan gambar. Apakah Anda yakin ingin melanjutkan?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Lanjutkan', onPress: () => true }
        ]
      );
      return true; // Allow user to proceed
    }
    
    return true;
  };

  const handleSaveProfileImage = async () => {
    try {
      if (!validateImageUrl(fotoUrlInput)) {
        return;
      }

      setLoading(true);
      
      // Update profile image in state first for immediate feedback
      setProfileImage(fotoUrlInput);
      
      // Prepare data for update
      const updatedData = {
        ...userData,
        fotoUrl: fotoUrlInput,
        profileImage: fotoUrlInput // Support both field names
      };

      console.log('ProfileModal: Updating profile image URL:', fotoUrlInput);
      const result = await updateProfile(updatedData);
      
      if (result.success) {
        await refreshUser();
        Alert.alert('Berhasil', 'Foto profil berhasil diperbarui!');
        const senderInfo = {
          name: userData.namaLengkap || 'User',
          type: userType,
          id: userData.id || userData.uid
        };
        createNotification('admin', `${userType} ${userData.namaLengkap} telah mengubah foto profilnya.`, senderInfo);
        setIsEditingProfileImage(false);
        setFotoUrlInput('');
      } else {
        // Revert profile image on failure
        setProfileImage(userData?.profileImage || userData?.fotoUrl || null);
        Alert.alert('Error', result.message || 'Gagal memperbarui foto profil.');
      }
    } catch (error) {
      console.error('ProfileModal: Error updating profile image:', error);
      // Revert profile image on error
      setProfileImage(userData?.profileImage || userData?.fotoUrl || null);
      Alert.alert('Error', error.message || 'Gagal memperbarui foto profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditProfileImage = () => {
    setFotoUrlInput('');
    setIsEditingProfileImage(false);
  };

  const handleRemoveProfileImage = async () => {
    Alert.alert(
      'Hapus Foto Profil',
      'Apakah Anda yakin ingin menghapus foto profil?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const updatedData = {
                ...userData,
                fotoUrl: null,
                profileImage: null
              };

              const result = await updateProfile(updatedData);
              
              if (result.success) {
                setProfileImage(null);
                await refreshUser();
                Alert.alert('Berhasil', 'Foto profil berhasil dihapus!');
                const senderInfo = {
                  name: userData.namaLengkap || 'User',
                  type: userType,
                  id: userData.id || userData.uid
                };
                createNotification('admin', `${userType} ${userData.namaLengkap} telah menghapus foto profilnya.`, senderInfo);
              } else {
                Alert.alert('Error', result.message || 'Gagal menghapus foto profil.');
              }
            } catch (error) {
              console.error('ProfileModal: Error removing profile image:', error);
              Alert.alert('Error', 'Gagal menghapus foto profil.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Request permission untuk mengakses galeri
  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Izin Diperlukan',
        'Aplikasi membutuhkan izin untuk mengakses galeri foto. Silakan aktifkan di pengaturan aplikasi.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Handle image picker dari galeri
  const handlePickImageFromGallery = async () => {
    try {
      const hasPermission = await requestImagePermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio untuk foto profil
        quality: 0.8,
        base64: false, // Kita akan menggunakan URI saja
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await handleSaveProfileImageFromPicker(imageUri);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Gagal memilih gambar dari galeri.');
    }
  };

  // Handle camera
  const handlePickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi membutuhkan izin untuk mengakses kamera. Silakan aktifkan di pengaturan aplikasi.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio untuk foto profil
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await handleSaveProfileImageFromPicker(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo with camera:', error);
      Alert.alert('Error', 'Gagal mengambil foto dengan kamera.');
    }
  };

  // Save profile image dari picker
  const handleSaveProfileImageFromPicker = async (imageUri) => {
    try {
      setLoading(true);
      
      // Update profile image in state first for immediate feedback
      setProfileImage(imageUri);
      
      // Prepare data for update
      const updatedData = {
        ...userData,
        fotoUrl: imageUri,
        profileImage: imageUri // Support both field names
      };

      console.log('ProfileModal: Updating profile image from picker:', imageUri);
      const result = await updateProfile(updatedData);
      
      if (result.success) {
        await refreshUser();
        Alert.alert('Berhasil', 'Foto profil berhasil diperbarui!');
        const senderInfo = {
          name: userData.namaLengkap || 'User',
          type: userType,
          id: userData.id || userData.uid
        };
        createNotification('admin', `${userType} ${userData.namaLengkap} telah mengubah foto profilnya.`, senderInfo);
        setIsEditingProfileImage(false);
      } else {
        // Revert profile image on failure
        setProfileImage(userData?.profileImage || userData?.fotoUrl || null);
        Alert.alert('Error', result.message || 'Gagal memperbarui foto profil.');
      }
    } catch (error) {
      console.error('ProfileModal: Error updating profile image from picker:', error);
      // Revert profile image on error
      setProfileImage(userData?.profileImage || userData?.fotoUrl || null);
      Alert.alert('Error', error.message || 'Gagal memperbarui foto profil.');
    } finally {
      setLoading(false);
    }
  };

  // Show option picker (Gallery, Camera, URL)
  const showImagePickerOptions = () => {
    Alert.alert(
      'Pilih Foto Profil',
      'Pilih sumber foto yang ingin Anda gunakan:',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Galeri', onPress: handlePickImageFromGallery },
        { text: 'Kamera', onPress: handlePickImageFromCamera },
        { text: 'URL Link', onPress: () => setIsEditingProfileImage(true) },
      ],
      { cancelable: true }
    );
  };

  // Show option picker for cover image (Gallery, Camera, URL)
  const showCoverImagePickerOptions = () => {
    Alert.alert(
      'Pilih Foto Sampul',
      'Pilih sumber foto sampul yang ingin Anda gunakan:',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Galeri', onPress: handlePickCoverImageFromGallery },
        { text: 'Kamera', onPress: handlePickCoverImageFromCamera }
      ],
      { cancelable: true }
    );
  };

  // Handle save cover image from picker
  const handleSaveCoverImageFromPicker = async (imageUri) => {
    try {
      setLoading(true);
      
      // Update cover image in state first for immediate feedback
      setCoverImage(imageUri);
      
      // Prepare data for update
      const updatedData = {
        ...userData,
        coverImage: imageUri
      };

      console.log('ProfileModal: Updating cover image from picker:', imageUri);
      const result = await updateProfile(updatedData);
      
      if (result.success) {
        await refreshUser();
        Alert.alert('Berhasil', 'Foto sampul berhasil diperbarui!');
        const senderInfo = {
          name: userData.namaLengkap || 'User',
          type: userType,
          id: userData.id || userData.uid
        };
        createNotification('admin', `${userType} ${userData.namaLengkap} telah mengubah foto sampulnya.`, senderInfo);
        setIsEditingCoverImage(false);
      } else {
        setCoverImage(userData?.coverImage || null);
        Alert.alert('Error', result.message || 'Gagal memperbarui foto sampul.');
      }
    } catch (error) {
      console.error('ProfileModal: Error updating cover image from picker:', error);
      setCoverImage(userData?.coverImage || null);
      Alert.alert('Error', error.message || 'Gagal memperbarui foto sampul.');
    } finally {
      setLoading(false);
    }
  };

  // Request permission and handle gallery and camera for cover image
  const handlePickCoverImageFromGallery = async () => {
    try {
      const hasPermission = await requestImagePermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Ratio for cover image
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await handleSaveCoverImageFromPicker(imageUri);
      }
    } catch (error) {
      console.error('Error picking cover image from gallery:', error);
      Alert.alert('Error', 'Gagal memilih gambar dari galeri.');
    }
  };

  const handlePickCoverImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi membutuhkan izin untuk mengakses kamera. Silakan aktifkan di pengaturan aplikasi.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Ratio for cover image
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await handleSaveCoverImageFromPicker(imageUri);
      }
    } catch (error) {
      console.error('Error taking cover photo with camera:', error);
      Alert.alert('Error', 'Gagal mengambil foto dengan kamera.');
    }
  };

  // Date picker functions
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setFormData({ ...formData, tanggalLahir: formattedDate });
    }
  };

  const showDatePickerModal = () => {
    if (editing) {
      setShowDatePicker(true);
    }
  };

  const hideDatePicker = () => {
    setShowDatePicker(false);
  };

  // Dynamic styles based on userType
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: safeThemeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: safeThemeColors.headerBackground,
      paddingHorizontal: 16,
      paddingVertical: 8,
      paddingTop: 12,
      height: 58,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    coverImageContainer: {
      height: 120,
      backgroundColor: safeThemeColors.headerBackground,
    },
    coverImagePlaceholder: {
      flex: 1,
      backgroundColor: safeThemeColors.headerBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileImageEditButton: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      backgroundColor: safeThemeColors.primary,
      borderRadius: 8,
      padding: 2,
    },
    changePasswordButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: safeUserType === 'guru' ? safeThemeColors.card : '#f0f9ff',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: safeThemeColors.primary,
    },
    changePasswordText: {
      fontSize: 12,
      color: safeThemeColors.primary,
      marginLeft: 4,
      fontWeight: '500',
    },
    savePasswordButton: {
      backgroundColor: safeThemeColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      minWidth: 60,
      alignItems: 'center',
    },
    schoolName: {
      fontSize: 14,
      fontWeight: '600',
      color: safeThemeColors.primary,
      marginBottom: 5,
    },
  });

  // Get profile title based on userType
  const getProfileTitle = () => {
    switch(safeUserType) {
      case 'prodi':
      case 'kaprodi':
        return 'Profil Kaprodi';
      default:
        return 'Profil Pengguna';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <SafeStatusBar style="light" />

        <View style={styles.coverImageContainer}>
          {coverImage ? (
            <Image
              source={{ uri: coverImage }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: safeThemeColors.headerBackground }]}>
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.coverImagePlaceholderContent}>
                <Ionicons name="image" size={40} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.coverImagePlaceholderText}>
                  Pilih Foto Sampul
                </Text>
              </View>
            </View>
          )}
          {coverImage && (
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.editCoverButton} onPress={showCoverImagePickerOptions}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
                {profileImage ? (
                    <Image
                        source={{ uri: profileImage }}
                        style={styles.profileImage}
                    />
                ) : (safeUserType === 'prodi' || safeUserType === 'kaprodi' || safeUserType?.includes('kaprodi') || safeUserType === 'admin') ? (
                    <Image
                        source={require('../assets/logo/admin.png')}
                        style={styles.profileImage}
                    />
                ) : (
                    <View style={[styles.profileImage, styles.defaultProfileContainer]}>
                        <Ionicons name="person" size={40} color="#666" />
                    </View>
                )}
                {editing && (
                    <TouchableOpacity 
                        style={styles.editProfileImageButton}
                        onPress={showImagePickerOptions}
                    >
                        <Ionicons name="camera" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.headerActions}>
                {editing ? (
                    <View style={styles.editButtonsContainer}>
                        <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => setEditing(false)}>
                            <Text style={styles.actionButtonText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave} disabled={loading}>
                            {loading ? (
                              <View style={styles.loadingContainer}>
                                <ActivityIndicator color="#fff" size="small" />
                                {uploadProgress > 0 && (
                                  <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
                                )}
                              </View>
                            ) : (
                              <Text style={styles.actionButtonText}>Simpan</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.editProfileButton} onPress={() => setEditing(true)}>
                        <Text style={styles.editProfileButtonText}>Edit Profil</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.userInfoSection}>
                    <Text style={styles.userName}>{formData.namaLengkap}</Text>
                    <Text style={styles.userHandle}>{formData.username}</Text>
                </View>

          {/* Form Fields */}
          <View style={[styles.formContainer, { backgroundColor: '#FFFFFF' }]}>
            {/* Nama Lengkap */}
            <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
              <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Nama Lengkap</Text>
              <TextInput
                style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                value={formData.namaLengkap || ''}
                onChangeText={(text) => setFormData({ ...formData, namaLengkap: text })}
                editable={editing}
                placeholder={formData.namaLengkap ? '' : 'Masukkan nama lengkap'}
                placeholderTextColor={safeThemeColors.textLight}
              />
            </View>
            {/* NIS - Only for role-based Kaprodi */}
            {((safeUserType === 'prodi' || safeUserType === 'kaprodi' || safeUserType?.includes('kaprodi')) && formData.nis) && (
              <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
                <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>NIS</Text>
                <TextInput
                  style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                  value={formData.nis || ''}
                  onChangeText={(text) => setFormData({ ...formData, nis: text })}
                  editable={editing}
                  placeholder="Masukkan NIS"
                  placeholderTextColor={safeThemeColors.textLight}
                />
              </View>
            )}

            {/* NIP - Only for role-based Kaprodi */}
            {((safeUserType === 'prodi' || safeUserType === 'kaprodi' || safeUserType?.includes('kaprodi')) && (formData.nip || !formData.nis)) && (
              <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
                <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>NIP</Text>
                <TextInput
                  style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                  value={formData.nip || ''}
                  onChangeText={(text) => setFormData({ ...formData, nip: text })}
                  editable={editing}
                  placeholder="Masukkan NIP"
                  placeholderTextColor={safeThemeColors.textLight}
                />
              </View>
            )}

            {/* Username */}
            <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
              <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Username</Text>
              <TextInput
                style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                value={formData.username || ''}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                editable={editing}
                placeholder={formData.username ? '' : 'Masukkan username'}
                placeholderTextColor={safeThemeColors.textLight}
              />
            </View>

            {/* Email */}
            <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
              <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Email</Text>
              <TextInput
                style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                value={formData.email || ''}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                editable={editing}
                placeholder={formData.email ? '' : 'Masukkan email'}
                placeholderTextColor={safeThemeColors.textLight}
                keyboardType="email-address"
              />
            </View>

            {/* Conditional Fields for Guru role in Kaprodi */}
            {((safeUserType === 'prodi' || safeUserType === 'kaprodi' || safeUserType?.includes('kaprodi')) && (formData.mataPelajaran || formData.kelasAmpu)) && (
              <>
                {/* Mata Pelajaran */}
                {formData.mataPelajaran && (
                  <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
                    <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Mata Pelajaran</Text>
                    <TextInput
                      style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                      value={formData.mataPelajaran || ''}
                      onChangeText={(text) => setFormData({ ...formData, mataPelajaran: text })}
                      editable={editing}
                      placeholder={formData.mataPelajaran ? '' : 'Contoh: Matematika, Fisika'}
                      placeholderTextColor={safeThemeColors.textLight}
                    />
                  </View>
                )}

                {/* Kelas Ampu */}
                {formData.kelasAmpu && (
                  <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
                    <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Kelas Ampu</Text>
                    <TextInput
                      style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                      value={formData.kelasAmpu || ''}
                      onChangeText={(text) => setFormData({ ...formData, kelasAmpu: text })}
                      editable={editing}
                      placeholder={formData.kelasAmpu ? '' : 'Contoh: X TKJ 1, XI TKJ 2'}
                      placeholderTextColor={safeThemeColors.textLight}
                    />
                  </View>
                )}
              </>
            )}

            {/* Conditional Fields for Murid role in Kaprodi */}
            {((safeUserType === 'prodi' || safeUserType === 'kaprodi' || safeUserType?.includes('kaprodi')) && formData.kelas) && (
              <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
                <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Kelas</Text>
                <TextInput
                  style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                  value={formData.kelas || ''}
                  onChangeText={(text) => setFormData({ ...formData, kelas: text })}
                  editable={editing}
                  placeholder={formData.kelas ? '' : 'Contoh: XII TKJ 1'}
                  placeholderTextColor={safeThemeColors.textLight}
                />
              </View>
            )}

            {/* Conditional Fields for Prodi/Kaprodi */}
            {(safeUserType === 'prodi' || safeUserType === 'kaprodi' || safeUserType?.includes('kaprodi')) && (
              <>
                {/* Jabatan */}
                <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
                  <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Jabatan</Text>
                  <TextInput
                    style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                    value={formData.jabatan || ''}
                    onChangeText={(text) => setFormData({ ...formData, jabatan: text })}
                    editable={editing}
                    placeholder={formData.jabatan ? '' : 'Contoh: Kepala Program Studi TKJ / Guru Mata Pelajaran'}
                    placeholderTextColor={safeThemeColors.textLight}
                  />
                </View>

                {/* Department */}
                <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
                  <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Department</Text>
                  <TextInput
                    style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                    value={formData.department || ''}
                    onChangeText={(text) => setFormData({ ...formData, department: text })}
                    editable={editing}
                    placeholder={formData.department ? '' : 'Contoh: TKJ, TKR'}
                    placeholderTextColor={safeThemeColors.textLight}
                  />
                </View>

                {/* Pendidikan Terakhir */}
                <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
                  <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Pendidikan Terakhir</Text>
                  <TextInput
                    style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                    value={formData.pendidikanTerakhir || ''}
                    onChangeText={(text) => setFormData({ ...formData, pendidikanTerakhir: text })}
                    editable={editing}
                    placeholder={formData.pendidikanTerakhir ? '' : 'Contoh: S2 Teknik Informatika'}
                    placeholderTextColor={safeThemeColors.textLight}
                  />
                </View>

                {/* Bidang Keahlian */}
                <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
                  <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Bidang Keahlian</Text>
                  <TextInput
                    style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                    value={formData.bidangKeahlian || ''}
                    onChangeText={(text) => setFormData({ ...formData, bidangKeahlian: text })}
                    editable={editing}
                    placeholder={formData.bidangKeahlian ? '' : 'Masukkan bidang keahlian'}
                    placeholderTextColor={safeThemeColors.textLight}
                  />
                </View>
              </>
            )}


            {/* Alamat */}
            <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
              <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Alamat</Text>
              <TextInput
                style={[styles.fieldInput, styles.bioInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                value={formData.alamat || ''}
                onChangeText={(text) => setFormData({ ...formData, alamat: text })}
                multiline
                numberOfLines={3}
                editable={editing}
                placeholder={formData.alamat ? '' : 'Masukkan alamat lengkap'}
                placeholderTextColor={safeThemeColors.textLight}
              />
            </View>

            {/* No. Telepon */}
            <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
              <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>No. Telepon</Text>
              <TextInput
                style={[styles.fieldInput, !editing && styles.fieldInputDisabled, { color: safeThemeColors.text }]}
                value={formData.noTelepon || ''}
                onChangeText={(text) => setFormData({ ...formData, noTelepon: text })}
                editable={editing}
                placeholder={formData.noTelepon ? '' : 'Contoh: 08123456789'}
                placeholderTextColor={safeThemeColors.textLight}
                keyboardType="phone-pad"
              />
            </View>

            {/* Tanggal Lahir */}
            <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
              <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Tanggal Lahir</Text>
              <TouchableOpacity 
                style={[styles.fieldInput, { paddingVertical: 12 }]}
                onPress={showDatePickerModal}
                disabled={!editing}
              >
                <Text style={[styles.datePickerText, { 
                  color: formData.tanggalLahir ? safeThemeColors.text : safeThemeColors.textLight 
                }]}>
                  {formData.tanggalLahir || 'Pilih tanggal lahir'}
                </Text>
                {editing && (
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={safeThemeColors.primary} 
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Jenis Kelamin */}
            <View style={[styles.fieldContainer, { borderBottomColor: safeThemeColors.border }]}>
              <Text style={[styles.fieldLabel, { color: safeThemeColors.textLight }]}>Jenis Kelamin</Text>
              {editing ? (
                <TouchableOpacity 
                  style={[styles.fieldInput, { paddingVertical: 12 }]}
                  onPress={() => {
                    Alert.alert(
                      'Pilih Jenis Kelamin',
                      'Pilih jenis kelamin Anda:',
                      [
                        { text: 'Batal', style: 'cancel' },
                        { 
                          text: 'Laki-laki', 
                          onPress: () => setFormData({ ...formData, jenisKelamin: 'Laki-laki' })
                        },
                        { 
                          text: 'Perempuan', 
                          onPress: () => setFormData({ ...formData, jenisKelamin: 'Perempuan' })
                        },
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={[styles.genderPickerText, { 
                    color: formData.jenisKelamin ? safeThemeColors.text : safeThemeColors.textLight 
                  }]}>
                    {formData.jenisKelamin || 'Pilih jenis kelamin'}
                  </Text>
                  <Ionicons 
                    name="chevron-down-outline" 
                    size={20} 
                    color={safeThemeColors.primary} 
                    style={{ marginLeft: 'auto' }}
                  />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.fieldInput, styles.fieldInputDisabled, { paddingVertical: 12, color: safeThemeColors.text }]}>
                  {formData.jenisKelamin || 'Tidak tersedia'}
                </Text>
              )}
            </View>

            {/* Password Section */}
            <View style={[styles.passwordSection, { borderTopColor: safeThemeColors.border }]}>
              <View style={styles.passwordHeader}>
                <Text style={[styles.passwordTitle, { color: safeUserType === 'guru' ? '#1e293b' : safeThemeColors.text }]}>Keamanan</Text>
                {!isEditingPassword ? (
                  <TouchableOpacity 
                    style={dynamicStyles.changePasswordButton} 
                    onPress={() => setIsEditingPassword(true)}
                  >
                    <Ionicons name="lock-closed" size={16} color={safeThemeColors.primary} />
                    <Text style={dynamicStyles.changePasswordText}>Ubah Password</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.passwordActions}>
                    <TouchableOpacity 
                      style={styles.cancelPasswordButton} 
                      onPress={handleCancelPasswordEdit}
                    >
                      <Text style={styles.cancelPasswordText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={dynamicStyles.savePasswordButton} 
                      onPress={handlePasswordChange}
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.savePasswordText}>Simpan</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {isEditingPassword && (
                <View style={styles.passwordFormContainer}>
                  {/* Current Password */}
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.fieldLabel, { color: '#64748b' }]}>Password Saat Ini</Text>
                    <TextInput
                      style={[styles.fieldInput, { color: '#1e293b' }]}
                      value={passwordData.currentPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                      placeholder="Masukkan password saat ini"
                      placeholderTextColor="#64748b"
                      secureTextEntry
                    />
                  </View>

                  {/* New Password */}
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.fieldLabel, { color: '#64748b' }]}>Password Baru</Text>
                    <TextInput
                      style={[styles.fieldInput, { color: '#1e293b' }]}
                      value={passwordData.newPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                      placeholder="Masukkan password baru (minimal 6 karakter)"
                      placeholderTextColor="#64748b"
                      secureTextEntry
                    />
                  </View>

                  {/* Confirm New Password */}
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.fieldLabel, { color: '#64748b' }]}>Konfirmasi Password Baru</Text>
                    <TextInput
                      style={[styles.fieldInput, { color: '#1e293b' }]}
                      value={passwordData.confirmPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                      placeholder="Ulangi password baru"
                      placeholderTextColor="#64748b"
                      secureTextEntry
                    />
                  </View>
                </View>
              )}
            </View>

            {/* School Information */}
            <View style={[styles.schoolSection, { borderTopColor: safeThemeColors.border }]}>
              <Text style={[styles.schoolTitle, { color: safeThemeColors.text }]}>Informasi Sekolah</Text>
              <View style={[styles.schoolInfoContainer, { backgroundColor: safeThemeColors.card, borderColor: safeThemeColors.border }]}>
                <Text style={dynamicStyles.schoolName}>SMK Ma'arif NU 01 Wanasari</Text>
                <Text style={[styles.schoolAddress, { color: safeThemeColors.textLight }]}>Jl. Pemuda Sawojajar KM 1 Pesantunan Wanasari Brebes, Pesantunan, Kec. Wanasari, Kab. Brebes Prov. Jawa Tengah</Text>
                <Text style={[styles.schoolContact, { color: safeThemeColors.textLight }]}>Telp: (0283) 4514778 | Email: smkmaarif01wanasari.brebes@gmail.com</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* Modal Edit Foto URL */}
      <Modal
        visible={isEditingProfileImage}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEditProfileImage}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={[styles.editImageModal, { backgroundColor: safeThemeColors.card, borderColor: safeThemeColors.border }]}>
              {/* Header */}
              <View style={[styles.editImageHeader, { borderBottomColor: safeThemeColors.border }]}>
                <Text style={[styles.editImageTitle, { color: safeThemeColors.text }]}>Edit Foto Profil</Text>
                <TouchableOpacity 
                  style={styles.closeEditImageButton}
                  onPress={handleCancelEditProfileImage}
                >
                  <Ionicons name="close" size={24} color={safeThemeColors.textLight} />
                </TouchableOpacity>
              </View>
              
              {/* Preview Current Image */}
              <View style={styles.imagePreviewSection}>
                <Text style={[styles.previewTitle, { color: safeThemeColors.textLight }]}>Foto Saat Ini</Text>
                <View style={[styles.currentImageContainer, { borderColor: safeThemeColors.border }]}>
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.previewImage, styles.noImageContainer]}>
                      <Ionicons name="person" size={40} color={safeThemeColors.textLight} />
                      <Text style={[styles.noImageText, { color: safeThemeColors.textLight }]}>Tidak ada foto</Text>
                    </View>
                  )}
                </View>
              </View>
              
              {/* URL Input */}
              <View style={styles.urlInputSection}>
                <Text style={[styles.inputLabel, { color: safeThemeColors.textLight }]}>URL Foto Baru</Text>
                <TextInput
                  style={[styles.urlInput, { 
                    borderColor: safeThemeColors.border, 
                    color: safeThemeColors.text,
                    backgroundColor: safeThemeColors.background
                  }]}
                  value={fotoUrlInput}
                  onChangeText={setFotoUrlInput}
                  placeholder="https://example.com/foto.jpg"
                  placeholderTextColor={safeThemeColors.textLight}
                  keyboardType="url"
                  autoCapitalize="none"
                  multiline
                  numberOfLines={3}
                />
                <Text style={[styles.inputHint, { color: safeThemeColors.textLight }]}>
                  Masukkan URL lengkap gambar (jpg, png, gif, dll.)
                </Text>
              </View>
              
              {/* Preview New Image */}
              {fotoUrlInput && (
                <View style={styles.newImagePreviewSection}>
                  <Text style={[styles.previewTitle, { color: safeThemeColors.textLight }]}>Preview Foto Baru</Text>
                  <View style={[styles.currentImageContainer, { borderColor: safeThemeColors.border }]}>
                    <Image
                      source={{ uri: fotoUrlInput }}
                      style={styles.previewImage}
                      resizeMode="cover"
                      onError={() => {
                        // Handle image load error silently for preview
                      }}
                    />
                  </View>
                </View>
              )}
              
              {/* Action Buttons */}
              <View style={styles.editImageActions}>
                {profileImage && (
                  <TouchableOpacity 
                    style={[styles.removeImageButton, { backgroundColor: '#ef4444' }]}
                    onPress={handleRemoveProfileImage}
                    disabled={loading}
                  >
                    <Ionicons name="trash" size={16} color="#FFFFFF" />
                    <Text style={styles.removeImageText}>Hapus Foto</Text>
                  </TouchableOpacity>
                )}
                
                <View style={styles.editImageButtonGroup}>
                  <TouchableOpacity 
                    style={[styles.editImageButton, styles.cancelEditImageButton]}
                    onPress={handleCancelEditProfileImage}
                    disabled={loading}
                  >
                    <Text style={styles.cancelEditImageText}>Batal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.editImageButton, styles.saveEditImageButton, { backgroundColor: safeThemeColors.primary }]}
                    onPress={handleSaveProfileImage}
                    disabled={loading || !fotoUrlInput.trim()}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        <Text style={styles.saveEditImageText}>Simpan</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  // General
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
  },

  // Cover & Back Button
  coverImageContainer: {
    height: 180,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 50, // Status bar safe area
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)', // Transparan
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  editCoverButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 50,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  // Profile Header (Avatar & Actions)
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -40, // Overlap cover image
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  profileImageContainer: {
    // This container helps with positioning the avatar
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#e0e0e0',
  },
  defaultProfileContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  editProfileImageButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  headerActions: {
    // container for buttons on the right
  },
  editProfileButton: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  editProfileButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },

  // Edit Mode Buttons (Cancel/Save)
  editButtonsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  saveButton: {
    backgroundColor: '#2980b9',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // User Info section (below header)
  userInfoSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 5,
  },
formContainer: {
    paddingTop: 30,
    paddingHorizontal: 16,
  },
fieldContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
fieldLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
fieldInput: {
    fontSize: 14,
    color: '#1e293b',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  fieldInputDisabled: {
    color: '#64748b',
  },
  bioInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  fieldSubtext: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  schoolSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  schoolTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 15,
  },
  schoolInfoContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 5,
  },
  schoolAddress: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 3,
  },
  schoolContact: {
    fontSize: 11,
    color: '#64748b',
  },
  passwordSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  passwordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  changePasswordText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelPasswordButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelPasswordText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  savePasswordButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  savePasswordText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  passwordFormContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  // Top Bar Upload Actions Styles
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  topBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
    justifyContent: 'center',
  },
  topBarButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  coverImagePlaceholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  coverImagePlaceholderText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  
  // Modal styles for editing images
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  editImageModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
  },
  editImageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  editImageTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeEditImageButton: {
    padding: 4,
  },
  imagePreviewSection: {
    padding: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  currentImageContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f5f5f5',
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 12,
  },
  urlInputSection: {
    padding: 16,
    paddingTop: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  newImagePreviewSection: {
    padding: 16,
    paddingTop: 0,
  },
  editImageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  removeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  editImageButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  editImageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelEditImageButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelEditImageText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  saveEditImageButton: {
    // backgroundColor will be set dynamically
  },
  saveEditImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  genderPickerText: {
    fontSize: 14,
    paddingVertical: 4,
  },
  datePickerText: {
    fontSize: 14,
    paddingVertical: 4,
  },
});

ProfileModal.defaultProps = {
  visible: false,
  onClose: () => {},
  userData: {},
  userType: 'default'
};

export default ProfileModal;
