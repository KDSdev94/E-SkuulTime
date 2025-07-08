import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

// OnboardingData class equivalent
const onboardingData = [
  {
    title: 'Selamat Datang di SIMARA',
    description:
      'Sistem Administrasi SMK Ma\'arif NU 1 Wanasari untuk memudahkan administrasi sekolah.',
    color: '#4CAF50',
    backgroundColor: 'rgba(121, 204, 186, 1)',
    image: require('../../assets/image/onboard1.png'),
  },
  {
    title: 'Pengelolaan Data',
    description:
      'Kelola data murid dan guru dengan mudah. Sistem yang terintegrasi untuk manajemen informasi sekolah.',
    color: '#2196F3',
    backgroundColor: '#D4F6FF',
    image: require('../../assets/image/onboard2.png'),
  },
  {
    title: 'Jadwal Pembelajaran',
    description:
      'Atur jadwal pelajaran dan jadwal mengajar dengan efisien. Kelola waktu pembelajaran dengan optimal.',
    color: '#F44336',
    backgroundColor: '#FED4D5',
    image: require('../../assets/image/onboard3.png'),
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  
  // Load Google Fonts - MUST be called first
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
  });
  
  const [currentPage, setCurrentPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (fontsLoaded) {
      // Initial animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded]);

  // Animate when page changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentPage]);

  const nextPage = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextIndex = currentPage + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentPage(nextIndex);
    } else {
      navigateToLogin();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      const prevIndex = currentPage - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentPage(prevIndex);
    }
  };

  const navigateToLogin = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      navigation.navigate('PilihLogin');
    } catch (error) {
      console.error('Error saving onboarding completion status:', error);
      navigation.navigate('PilihLogin');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentPage(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Show loading indicator while fonts load
  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Loading fonts...</Text>
      </View>
    );
  }

  const renderOnboardingItem = ({ item, index }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <Animated.View
          style={[
            styles.slideContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <Image source={item.image} style={styles.onboardImage} resizeMode="contain" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: item.color }]}>
            {item.title}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const renderPageIndicator = () => {
    return (
      <View style={styles.pageIndicatorContainer}>
        {onboardingData.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotColor = index === currentPage ? onboardingData[currentPage].color : '#ccc';

          return (
            <Animated.View
              key={index}
              style={[
                styles.pageIndicator,
                {
                  width: dotWidth,
                  backgroundColor: dotColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[
        onboardingData[currentPage].backgroundColor,
        onboardingData[currentPage].color + '0D', // 5% opacity
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: onboardingData[currentPage].color }]}>
            SIMARA
          </Text>
          <TouchableOpacity onPress={navigateToLogin} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: onboardingData[currentPage].color }]}>
              Lewati
            </Text>
          </TouchableOpacity>
        </View>

        {/* Page Indicator */}
        {renderPageIndicator()}

        {/* Content */}
        <Animated.FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderOnboardingItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(_, index) => index.toString()}
          style={styles.flatList}
        />

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          {/* Previous Button */}
          {currentPage > 0 ? (
            <TouchableOpacity onPress={prevPage} style={styles.prevButton}>
              <Ionicons
                name="chevron-back"
                size={24}
                color={onboardingData[currentPage].color}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.prevButton} />
          )}

          {/* Next/Start Button */}
          <TouchableOpacity
            onPress={nextPage}
            style={[
              styles.nextButton,
              { backgroundColor: onboardingData[currentPage].color },
            ]}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === onboardingData.length - 1 ? 'Mulai' : 'Lanjut'}
            </Text>
            <Ionicons
              name={currentPage === onboardingData.length - 1 ? 'checkmark' : 'chevron-forward'}
              size={20}
              color="white"
              style={styles.nextButtonIcon}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20, // Add margin to avoid system UI overlap
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
    marginVertical: 15,
    marginTop: 20,
  },
  pageIndicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  imageContainer: {
    width: 250,
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
  },
  onboardImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  prevButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 0,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  nextButtonIcon: {
    marginLeft: 8,
  },
});
