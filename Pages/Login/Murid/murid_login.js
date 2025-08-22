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
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../../../services/AuthService';
import { useUser } from '../../../context/UserContext';
import {
  useFonts,
  Nunito_500Medium,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function MuridLogin() {
  const navigation = useNavigation();
  const { refreshUser } = useUser();
  
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);

  let [fontsLoaded] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Harap isi semua field');
      return;
    }

    try {
      const result = await AuthService.loginMurid(username, password);
      
      if (result.success) {
        // Refresh user context after successful login
        await refreshUser();
        
        // Wait a bit to ensure data is saved and context is updated
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Navigate to dashboard and reset stack
        navigation.reset({
          index: 0,
          routes: [{ name: 'MuridDashboard' }],
        });
        
        Alert.alert('Sukses', 'Login berhasil! Selamat datang kembali.');
      } else {
        Alert.alert('Error', result.message || 'Username/password salah');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat login');
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
            <Text style={styles.headerTitle}>Login Murid</Text>
            <Text style={styles.headerSubtitle}>Silahkan login untuk melanjutkan</Text>
          </LinearGradient>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Login</Text>
          <Text style={styles.formSubtitle}>Masukkan username dan password Anda</Text>
          
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color="rgb(108, 212, 127)" style={styles.inputIcon} />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder='Masukkan username'
                style={styles.input}
                placeholderTextColor='#999'
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color="rgb(108, 212, 127)" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder='Masukkan password'
                secureTextEntry={obscurePassword}
                style={[styles.input, { flex: 1 }]}
                placeholderTextColor='#999'
              />
              <TouchableOpacity onPress={() => setObscurePassword(!obscurePassword)}>
                <Ionicons 
                  name={obscurePassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="rgb(108, 212, 127)" 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.forgotPasswordLink} 
              onPress={() => navigation.navigate('ForgotPassword', { userType: 'murid' })}
            >
              <Text style={styles.forgotPasswordLinkText}>Lupa Kata Sandi?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>LOGIN</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.registerButton} onPress={() => handleNavigation('RegisterMurid')}>
            <Text style={styles.buttonText}>REGISTER</Text>
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
    height: height * 0.35,
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
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
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    marginTop: 4,
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
  },
  formSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    marginBottom: 16,
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
  loginButton: {
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
  },
  registerButton: {
    backgroundColor: '#36a5f2',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    marginTop: 10,
    elevation: 5,
    shadowColor: '#36a5f2',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 1.2,
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: 'rgb(108, 212, 127)',
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    textDecorationLine: 'underline',
  },
  forgotPasswordLink: {
    alignItems: 'flex-end',
    marginTop: -12,
    marginBottom: 8,
  },
  forgotPasswordLinkText: {
    color: 'rgb(108, 212, 127)',
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    textDecorationLine: 'underline',
  },
});
