import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

const primaryColor = 'rgb(43, 123, 186)';

const actionItems = [
  { id: 1, title: 'Kelola Murid', icon: 'people-outline', color: '#4F46E5' }, // Indigo
  { id: 2, title: 'Kelola Guru', icon: 'school-outline', color: '#059669' }, // Emerald
  { id: 3, title: 'Jadwal', icon: 'calendar-outline', color: '#DC2626' }, // Red
  { id: 7, title: 'Laporan', icon: 'document-text-outline', color: '#7C3AED' }, // Violet
];

const ActionCard = ({ item, onQuickAction }) => (
  <TouchableOpacity 
    style={[styles.actionCard, { borderLeftColor: item.color }]}
    onPress={() => onQuickAction(item.id)}
    activeOpacity={0.7}
  >
    <View style={styles.cardContent}>
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
        <Ionicons name={item.icon} size={18} color={item.color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.actionText}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </View>
    <View style={[styles.cardAccent, { backgroundColor: item.color }]} />
  </TouchableOpacity>
);

export default function QuickActions({ onQuickAction }) {
  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aksi Cepat</Text>
      <View style={styles.grid}>
        {actionItems.map(item => (
          <ActionCard key={item.id} item={item} onQuickAction={onQuickAction} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderLeftWidth: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#2d3748',
    flex: 1,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 3,
    height: '100%',
    zIndex: 1,
  },
});
