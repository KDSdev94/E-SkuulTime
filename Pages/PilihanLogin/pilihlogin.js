import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  

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

  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Nunito_500Medium,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

    const modernLoginCard = ({ icon, label, color, textColor, shadowColor, onPress, iconName }) => {
    const finalTextColor = textColor || color;
    const finalShadowColor = shadowColor || color;
    return (
      <TouchableOpacity
        style={[
          styles.loginCard,
          {
            shadowColor: finalShadowColor,
            shadowOpacity: 0.15,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 6,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: color.replace('1)', '0.1)') }]}>
          {icon ? (
            <Image source={icon} style={styles.icon} resizeMode="contain" />
          ) : (
            <Ionicons name={iconName || "school"} size={40} color={color} />
          )}
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
            <Text style={styles.appTitle}>E-SkuulTime</Text>
            <Text style={styles.appSubtitle}>
              Sistem Informasi Penjadwalan{"\n"}SMK Ma'arif NU 1 Wanasari
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
              onPress: () => handleNavigation('MuridLogin'),
            })}

            {modernLoginCard({
              icon: require('../../assets/icon/teachericon.jpg'),
              label: 'Guru',
              color: 'rgba(124, 58, 237, 1)',
              textColor: 'rgb(124, 58, 237)',
              shadowColor: 'rgb(124, 58, 237)',
              onPress: () => handleNavigation('GuruLogin'),
            })}

            {modernLoginCard({
              icon: require('../../assets/logo/admin.png'),
              label: 'Admin',
              color: 'rgba(90, 90, 255, 1)',
              textColor: 'rgb(43, 123, 186)',
              shadowColor: 'rgb(43, 123, 186)',
              onPress: () => handleNavigation('AdminLogin'),
            })}

            {modernLoginCard({
              icon: require('../../assets/logo/admin.png'),
              label: 'Kaprodi',
              color: 'rgba(90, 90, 255, 1)',
              textColor: 'rgb(43, 123, 186)',
              shadowColor: 'rgb(43, 123, 186)',
              onPress: () => handleNavigation('KaprodiLogin'),
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
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  appTitle: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: 'rgb(43, 123, 186)',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#37474f',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  loginOptions: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    paddingVertical: 10,
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    width: 36,
    height: 36,
  },
  cardLabel: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
  },
  footer: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#999',
    marginBottom: 20,
  },
});
