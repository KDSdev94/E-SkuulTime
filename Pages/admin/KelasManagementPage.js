import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Nunito_500Medium,
} from '@expo-google-fonts/nunito';

export default function KelasManagementPage() {
  // Load Google Fonts
  let [fontsLoaded] = useFonts({
    Nunito_500Medium,
  });

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Ionicons name="construct" size={80} color="#ccc" />
      <Text style={styles.text}>
        Halaman Data Kelas{"\n"}akan segera dibuat
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  text: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Nunito_500Medium',
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});
