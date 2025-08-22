import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Dimensions, 
  ScrollView, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AuthService from '../../../services/AuthService';
import PasswordResetService from '../../../services/PasswordResetService';
import {
  useFonts,
  Nunito_500Medium,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// User type configurations
const USER_CONFIGS = {
  admin: {
    title: 'Reset Password Admin',
    subtitle: 'Silahkan masukkan email untuk reset password',
    gradientColors: ['rgb(80, 160, 220)', 'rgb(43, 123, 186)'],
    primaryColor: 'rgb(43, 123, 186)',
    logoPath: require('../../../assets/logo/admin.png'),
    backgroundAlpha: 'rgba(33, 150, 243, 0.1)'
  },
  guru: {
    title: 'Reset Password Guru',
    subtitle: 'Silahkan masukkan email untuk reset password',
    gradientColors: ['rgb(124, 58, 237)', 'rgb(168, 85, 247)'],
    primaryColor: 'rgb(124, 58, 237)',
    logoPath: require('../../../assets/icon/teachericon.jpg'),
    backgroundAlpha: 'rgba(124, 58, 237, 0.1)'
  },
  murid: {
    title: 'Reset Password Murid',
    subtitle: 'Silahkan masukkan email untuk reset password',
    gradientColors: ['rgb(148, 232, 167)', 'rgb(108, 212, 127)'],
    primaryColor: 'rgb(108, 212, 127)',
    logoPath: require('../../../assets/logo/student.png'),
    backgroundAlpha: 'rgba(33, 150, 243, 0.1)'
  },
  kaprodi: {
    title: 'Reset Password Kaprodi',
    subtitle: 'Silahkan masukkan email untuk reset password',
    gradientColors: ['#C70039', '#FF5733', '#FF8C69'],
    primaryColor: '#C70039',
    logoPath: require('../../../assets/logo/admin.png'),
    backgroundAlpha: 'rgba(199, 0, 57, 0.1)'
  }
};

export default function ForgotPassword() {
  const navigation = useNavigation();
  const route = useRoute();
  const userType = route.params?.userType || 'admin';
  const config = USER_CONFIGS[userType];

  const [step, setStep] = useState(1); // 1: Email input, 2: Code verification, 3: New password
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [displayedCode, setDisplayedCode] = useState(''); // For displaying code when email not available

  let [fontsLoaded] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Harap masukkan email Anda');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    try {
      setLoading(true);
      const result = await PasswordResetService.requestPasswordReset(email);
      
      if (result.success) {
        Alert.alert('Berhasil', result.message);
        if (result.resetCode) {
          setDisplayedCode(result.resetCode);
        }
        setStep(2);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memproses permintaan');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode) {
      Alert.alert('Error', 'Harap masukkan kode reset');
      return;
    }

    if (resetCode.length !== 6) {
      Alert.alert('Error', 'Kode reset harus 6 digit');
      return;
    }

    try {
      setLoading(true);
      const result = await PasswordResetService.verifyResetCode(email, resetCode);
      
      if (result.success) {
        Alert.alert('Berhasil', 'Kode verifikasi valid');
        setStep(3);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memverifikasi kode');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Harap isi semua field password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak sesuai');
      return;
    }

    try {
      setLoading(true);
      const result = await PasswordResetService.resetPasswordWithCode(email, resetCode, newPassword);
      
      if (result.success) {
        Alert.alert(
          'Berhasil', 
          'Password berhasil direset! Silakan login dengan password baru Anda.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat mereset password');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={[styles.formTitle, { color: '#333' }]}>Reset Password</Text>
            <Text style={styles.formSubtitle}>
              Masukkan email Anda untuk menerima kode reset password
            </Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail" size={20} color={config.primaryColor} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder='Masukkan email Anda'
                  style={styles.input}
                  placeholderTextColor='#999'
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: config.primaryColor }]} 
              onPress={handleRequestReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>KIRIM KODE RESET</Text>
              )}
            </TouchableOpacity>
          </>
        );

      case 2:
        return (
          <>
            <Text style={[styles.formTitle, { color: '#333' }]}>Verifikasi Kode</Text>
            <Text style={styles.formSubtitle}>
              Masukkan 6 digit kode yang telah dikirim ke email Anda
            </Text>
            
            {displayedCode && (
              <View style={styles.codeDisplayContainer}>
                <Text style={styles.codeDisplayLabel}>Kode Reset Anda:</Text>
                <Text style={[styles.codeDisplayText, { color: config.primaryColor }]}>
                  {displayedCode}
                </Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="key" size={20} color={config.primaryColor} style={styles.inputIcon} />
                <TextInput
                  value={resetCode}
                  onChangeText={setResetCode}
                  placeholder='Masukkan kode 6 digit'
                  style={styles.input}
                  placeholderTextColor='#999'
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: config.primaryColor }]} 
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>VERIFIKASI KODE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => setStep(1)}
            >
              <Text style={[styles.secondaryButtonText, { color: config.primaryColor }]}>
                Kirim Ulang Kode
              </Text>
            </TouchableOpacity>
          </>
        );

      case 3:
        return (
          <>
            <Text style={[styles.formTitle, { color: '#333' }]}>Password Baru</Text>
            <Text style={styles.formSubtitle}>
              Masukkan password baru Anda
            </Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={20} color={config.primaryColor} style={styles.inputIcon} />
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder='Masukkan password baru'
                  secureTextEntry={obscurePassword}
                  style={[styles.input, { flex: 1 }]}
                  placeholderTextColor='#999'
                />
                <TouchableOpacity onPress={() => setObscurePassword(!obscurePassword)}>
                  <Ionicons 
                    name={obscurePassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={config.primaryColor} 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={20} color={config.primaryColor} style={styles.inputIcon} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder='Konfirmasi password baru'
                  secureTextEntry={obscureConfirmPassword}
                  style={[styles.input, { flex: 1 }]}
                  placeholderTextColor='#999'
                />
                <TouchableOpacity onPress={() => setObscureConfirmPassword(!obscureConfirmPassword)}>
                  <Ionicons 
                    name={obscureConfirmPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={config.primaryColor} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: config.primaryColor }]} 
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>RESET PASSWORD</Text>
              )}
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  const keyboardVerticalOffset = Platform.OS === "ios" ? 60 : 0;
  
  return (
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={config.gradientColors}
            style={styles.gradientBackground}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarBackground, { backgroundColor: config.backgroundAlpha }]}>
                <Image
                  source={config.logoPath}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.headerTitle}>{config.title}</Text>
            <Text style={styles.headerSubtitle}>{config.subtitle}</Text>
          </LinearGradient>
        </View>

        <View style={styles.formContainer}>
          {renderStepContent()}
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
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: '#fff',
    borderRadius: 60,
    padding: 10,
    elevation: 15,
    marginBottom: 20,
  },
  avatarBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 90,
    height: 90,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    marginTop: 16,
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    marginTop: 8,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  formContainer: {
    marginHorizontal: 24,
    marginTop: 40,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
    borderWidth: 0,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#333',
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
  },
  actionButton: {
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    elevation: 5,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 1.2,
  },
  secondaryButton: {
    padding: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    textDecorationLine: 'underline',
  },
  codeDisplayContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  codeDisplayLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginBottom: 5,
  },
  codeDisplayText: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 3,
  },
});
