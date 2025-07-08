import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Nunito_500Medium,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

const { width, height } = Dimensions.get('window');

export default function PilihLogin() {
  const navigation = useNavigation();

  // Load Google Fonts
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Nunito_500Medium,
    Nunito_700Bold,
  });

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

    const modernLoginCard = ({ icon, label, color, textColor, shadowColor, onPress }) => {
    const finalTextColor = textColor || color;
    const finalShadowColor = shadowColor || color;
    return (
      <TouchableOpacity
        style={[
          styles.loginCard,
          {
                        shadowColor: finalShadowColor,
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 15,
            elevation: 8,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: color.replace('1)', '0.1)') }]}>
          <Image source={icon} style={styles.icon} resizeMode="contain" />
        </View>
        <Text style={[styles.cardLabel, { color: finalTextColor }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={finalTextColor} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Background Circle */}
        <View
          style={[
            styles.backgroundCircle,
            {
              top: -height * 0.1,
              left: -width * 0.2,
              width: width * 0.7,
              height: width * 0.7,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(36, 200, 150, 0.1)', 'rgba(68, 114, 255, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCircle}
          />
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo/logo_nobg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appTitle}>SIMARA</Text>
            <Text style={styles.appSubtitle}>
              Sistem Informasi Administrasi{"\n"}SMK Ma'arif NU 1 Wanasari
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.pageTitle}>Pilih Opsi Login</Text>

          {/* Login Options */}
          <View style={styles.loginOptions}>
            {modernLoginCard({
              icon: require('../../assets/logo/student.png'),
              label: 'Murid',
              color: 'rgba(36, 200, 150, 1)',
                            textColor: 'rgb(108, 212, 127)',
              shadowColor: 'rgb(108, 212, 127)',
              onPress: () => navigation.navigate('MuridLogin'),
            })}

            {modernLoginCard({
              icon: require('../../assets/icon/teachericon.jpg'),
              label: 'Guru',
              color: 'rgba(55, 232, 173, 1)',
                            textColor: 'rgb(34, 34, 32)',
              shadowColor: 'rgb(34, 34, 32)',
              onPress: () => navigation.navigate('GuruLogin'),
            })}

            {modernLoginCard({
              icon: require('../../assets/logo/admin.png'),
              label: 'Admin',
              color: 'rgba(90, 90, 255, 1)',
                            textColor: 'rgb(43, 123, 186)',
              shadowColor: 'rgb(43, 123, 186)',
              onPress: () => navigation.navigate('AdminLogin'),
            })}
          </View>

          {/* Footer */}
          <Text style={styles.footer}>© 2025 SMK Ma'arif NU 1 Wanasari</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(248, 249, 250, 1)',
  },
  safeArea: {
    flex: 1,
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  gradientCircle: {
    flex: 1,
    borderRadius: 1000,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: 'rgb(43, 123, 186)',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  appSubtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    color: '#37474f',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  loginOptions: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  icon: {
    width: 40,
    height: 40,
  },
  cardLabel: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
  },
  footer: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#999',
    marginBottom: 20,
  },
});
