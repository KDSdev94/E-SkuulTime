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
  ActivityIndicator,
  Switch
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
    subtitle: 'Pilih metode reset password Anda',
    gradientColors: ['rgb(80, 160, 220)', 'rgb(43, 123, 186)'],
    primaryColor: 'rgb(43, 123, 186)',
    logoPath: require('../../../assets/logo/admin.png'),
    backgroundAlpha: 'rgba(33, 150, 243, 0.1)'
  },
  guru: {
    title: 'Reset Password Guru',
    subtitle: 'Pilih metode reset password Anda',
    gradientColors: ['rgb(124, 58, 237)', 'rgb(168, 85, 247)'],
    primaryColor: 'rgb(124, 58, 237)',
    logoPath: require('../../../assets/icon/teachericon.jpg'),
    backgroundAlpha: 'rgba(124, 58, 237, 0.1)'
  },
  murid: {
    title: 'Reset Password Murid',
    subtitle: 'Pilih metode reset password Anda',
    gradientColors: ['rgb(148, 232, 167)', 'rgb(108, 212, 127)'],
    primaryColor: 'rgb(108, 212, 127)',
    logoPath: require('../../../assets/logo/student.png'),
    backgroundAlpha: 'rgba(33, 150, 243, 0.1)'
  }
};

export default function ForgotPasswordEnhanced() {
  const navigation = useNavigation();
  const route = useRoute();
  const userType = route.params?.userType || 'admin';
  const config = USER_CONFIGS[userType];

  // State for reset method selection
  const [useTokenMethod, setUseTokenMethod] = useState(false);
  
  // Common states
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Token method states
  const [resetToken, setResetToken] = useState('');
  const [displayedToken, setDisplayedToken] = useState('');
  
  // Code method states  
  const [resetCode, setResetCode] = useState('');
  const [displayedCode, setDisplayedCode] = useState('');
  
  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);

  let [fontsLoaded] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // TOKEN METHOD HANDLERS
  const handleRequestResetToken = async () => {
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
      const result = await AuthService.requestPasswordReset(email.toLowerCase().trim(), userType);
      
      if (result.success) {
        Alert.alert('Berhasil', result.message);
        if (result.token) {
          setDisplayedToken(result.token);
          setStep(2);
        }
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memproses permintaan');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!resetToken) {
      Alert.alert('Error', 'Harap masukkan token reset');
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.verifyResetToken(resetToken, userType);
      
      if (result.success) {
        Alert.alert('Berhasil', 'Token valid');
        setStep(3);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memverifikasi token');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordWithToken = async () => {
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
      const result = await AuthService.resetPasswordWithToken(resetToken, newPassword, userType);
      
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

  // CODE METHOD HANDLERS (existing implementation)
  const handleRequestResetCode = async () => {
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

  const handleResetPasswordWithCode = async () => {
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

  const renderMethodSelection = () => (
    <>
      <Text style={[styles.formTitle, { color: '#333' }]}>Pilih Metode Reset</Text>
      <Text style={styles.formSubtitle}>
        Pilih cara yang Anda inginkan untuk mereset password
      </Text>
      
      {/* Method Toggle */}
      <View style={styles.methodContainer}>
        <View style={styles.methodOption}>
          <View style={styles.methodInfo}>
            <Ionicons name="mail" size={24} color={config.primaryColor} />
            <View style={styles.methodTexts}>
              <Text style={styles.methodTitle}>Kode Email (6 Digit)</Text>
              <Text style={styles.methodDescription}>
                Dapatkan kode 6 digit via email
              </Text>
            </View>
          </View>
          <Switch
            value={!useTokenMethod}
            onValueChange={(value) => setUseTokenMethod(!value)}
            trackColor={{ false: '#ccc', true: config.primaryColor }}
            thumbColor={!useTokenMethod ? '#fff' : '#fff'}
          />
        </View>

        <View style={styles.methodOption}>
          <View style={styles.methodInfo}>
            <Ionicons name="key" size={24} color={config.primaryColor} />
            <View style={styles.methodTexts}>
              <Text style={styles.methodTitle}>Token Reset</Text>
              <Text style={styles.methodDescription}>
                Dapatkan token panjang untuk reset
              </Text>
            </View>
          </View>
          <Switch
            value={useTokenMethod}
            onValueChange={setUseTokenMethod}
            trackColor={{ false: '#ccc', true: config.primaryColor }}
            thumbColor={useTokenMethod ? '#fff' : '#fff'}
          />
        </View>
      </View>

      {/* Email Input */}
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
        onPress={useTokenMethod ? handleRequestResetToken : handleRequestResetCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {useTokenMethod ? 'KIRIM TOKEN RESET' : 'KIRIM KODE RESET'}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderTokenVerification = () => (
    <>
      <Text style={[styles.formTitle, { color: '#333' }]}>Verifikasi Token</Text>
      <Text style={styles.formSubtitle}>
        Masukkan token yang telah dikirim ke email Anda
      </Text>
      
      {displayedToken && (
        <View style={styles.codeDisplayContainer}>
          <Text style={styles.codeDisplayLabel}>Token Reset Anda:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={[styles.tokenDisplayText, { color: config.primaryColor }]}>
              {displayedToken}
            </Text>
          </ScrollView>
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => {
              setResetToken(displayedToken);
              Alert.alert('Info', 'Token telah disalin ke input field');
            }}
          >
            <Text style={[styles.copyButtonText, { color: config.primaryColor }]}>
              Salin Token
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="key" size={20} color={config.primaryColor} style={styles.inputIcon} />
          <TextInput
            value={resetToken}
            onChangeText={setResetToken}
            placeholder='Masukkan token reset'
            style={styles.input}
            placeholderTextColor='#999'
            multiline={false}
            numberOfLines={1}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: config.primaryColor }]} 
        onPress={handleVerifyToken}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>VERIFIKASI TOKEN</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => setStep(1)}
      >
        <Text style={[styles.secondaryButtonText, { color: config.primaryColor }]}>
          Kirim Ulang Token
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderCodeVerification = () => (
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

  const renderPasswordReset = () => (
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
        onPress={useTokenMethod ? handleResetPasswordWithToken : handleResetPasswordWithCode}
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

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderMethodSelection();
      case 2:
        return useTokenMethod ? renderTokenVerification() : renderCodeVerification();
      case 3:
        return renderPasswordReset();
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
  methodContainer: {
    marginBottom: 25,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodTexts: {
    marginLeft: 12,
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
  },
  methodDescription: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginTop: 2,
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
  tokenDisplayText: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  copyButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
  },
});
