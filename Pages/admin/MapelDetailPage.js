import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Dimensions,
  Image,
  TouchableOpacity,
  Text
} from 'react-native';
import { 
  Card, 
  Button, 
  Title, 
  Paragraph, 
  Avatar, 
  Chip, 
  Badge,
  IconButton,
  Surface,
  Divider
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { SafeStatusBar } from '../../utils/statusBarUtils';
import TopBar from './dashboard_components/TopBar';
import GuruService from '../../services/GuruService';

const { width } = Dimensions.get('window');

export default function MapelDetailPage({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [subjectName, setSubjectName] = useState('');

  const { mataPelajaran, teachers: routeTeachers } = route.params;

  const getSubjectAbbreviation = (subjectName) => {
    const abbreviations = {
      'Pendidikan Agama dan Budi Pekerti': 'PAI',
      'PPKn (Pendidikan Pancasila dan Kewarganegaraan)': 'PPKn',
      'Bahasa Indonesia': 'B.Indo',
      'Matematika': 'MTK',
      'Sejarah Indonesia': 'Sejarah',
      'Bahasa Inggris': 'B.Ing',
      'Seni Budaya': 'SenBud',
      'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)': 'PJOK',
      'Bahasa Daerah': 'B.Daerah',
      'Prakarya dan Kewirausahaan': 'Prakarya',
      'Komputer dan Jaringan Dasar': 'KJD',
      'Pemrograman Dasar': 'ProgDas',
      'Desain Grafis': 'DKV',
      'Sistem Komputer': 'SisKom',
      'Simulasi dan Komunikasi Digital': 'Simdig',
      'Administrasi Infrastruktur Jaringan (AIJ)': 'AIJ',
      'Teknologi Jaringan Berbasis Luas (WAN)': 'WAN',
      'Administrasi Sistem Jaringan (ASJ)': 'ASJ',
      'Teknologi Layanan Jaringan (TLJ)': 'TLJ',
      'Produk Kreatif dan Kewirausahaan': 'PKK',
      'Gambar Teknik Otomotif': 'GTO',
      'Teknologi Dasar Otomotif': 'TDO',
      'Pekerjaan Dasar Teknik Otomotif': 'PDTO',
      'Pemeliharaan Mesin Kendaraan Ringan': 'PMKR',
      'Pemeliharaan Sasis dan Pemindah Tenaga': 'PSPT',
      'Pemeliharaan Kelistrikan Kendaraan Ringan': 'PKKR'
    };
    return abbreviations[subjectName] || subjectName.substring(0, 8);
  };

  useEffect(() => {
    setSubjectName(mataPelajaran);
    loadTeacherDetails();
  }, [mataPelajaran]);

  const loadTeacherDetails = async () => {
    try {
      setLoading(true);
      
      if (routeTeachers && routeTeachers.length > 0) {
        const enhancedTeachers = routeTeachers.map((teacher, index) => ({
          id: `${teacher.id}_${index}`, // Create unique ID for each teacher
          guruId: teacher.id,
          teacherDetail: teacher,
          allSubjects: Array.isArray(teacher.mataPelajaran) ? teacher.mataPelajaran : [teacher.mataPelajaran || ''],
          totalSubjects: Array.isArray(teacher.mataPelajaran) ? teacher.mataPelajaran.length : (teacher.mataPelajaran ? 1 : 0)
        }));
        
        setTeachers(enhancedTeachers);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      
      Alert.alert('Error', 'Gagal memuat data guru pengampu');
    } finally {
      setLoading(false);
    }
  };

  const getClassesForTeacher = (teacherId) => {
    const sampleClasses = [
      'X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2', 'XII TKJ 1',
      'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1',
      'X AKL 1', 'X AKL 2', 'XI AKL 1', 'XI AKL 2', 'XII AKL 1'
    ];
    
    const numClasses = Math.floor(Math.random() * 3) + 2; // 2-4 classes
    return sampleClasses.slice(0, numClasses);
  };

  const renderTeacherCard = (teacher, index) => {
    const classes = getClassesForTeacher(teacher.guruId);
    const teacherName = teacher.teacherDetail?.namaLengkap || 'Nama tidak tersedia';
    const teacherNip = teacher.teacherDetail?.nip || 'NIP tidak tersedia';
    const teacherPhoto = teacher.teacherDetail?.fotoUrl;
    const mapelAbbrev = getSubjectAbbreviation(mataPelajaran);
    const statusKepegawaian = teacher.teacherDetail?.statusKepegawaian || 'Tidak diketahui';
    const email = teacher.teacherDetail?.email || 'Email tidak tersedia';
    
    const getKelompokColor = () => {
      // Default color for teacher cards
      return '#6366F1'; // Indigo
    };
    
    return (
      <Card 
        key={`${teacher.id}-${index}`} 
        style={styles.modernCard}
        elevation={3}
        mode="elevated"
        onPress={() => {
          Alert.alert(
            'Detail Guru',
            `Nama: ${teacherName}\nNIP: ${teacherNip}\nStatus: ${statusKepegawaian}\nEmail: ${email}\nTotal Mata Pelajaran: ${teacher.totalSubjects}`
          );
        }}
      >
        <Card.Title
          title={teacherName}
          subtitle={`NIP: ${teacherNip} • ${statusKepegawaian}`}
          titleStyle={styles.cardTitleText}
          subtitleStyle={styles.cardSubtitleText}
          left={(props) => (
            <View style={styles.avatarContainer}>
              {teacherPhoto ? (
                <Image
                  source={{ uri: teacherPhoto }}
                  style={styles.teacherAvatar}
                  defaultSource={require('../../assets/icon/teachericon.jpg')}
                />
              ) : (
                <Image
                  source={require('../../assets/icon/teachericon.jpg')}
                  style={styles.teacherAvatar}
                  resizeMode="cover"
                />
              )}
            </View>
          )}
          right={(props) => (
            <View style={styles.cardRightSection}>
              <Chip 
                style={[styles.kelompokChip, { backgroundColor: getKelompokColor() + '20' }]}
                textStyle={[styles.kelompokChipText, { color: getKelompokColor() }]}
                compact
              >
                {mapelAbbrev}-{String.fromCharCode(65 + index)}{(index + 1).toString().padStart(2, '0')}
              </Chip>
              <Badge 
                style={[styles.statusBadge, { 
                  backgroundColor: statusKepegawaian === 'PNS' ? '#10B981' : '#F59E0B' 
                }]}
                size={8}
              />
            </View>
          )}
        />
        
        <Card.Content style={styles.modernCardContent}>
          {email && email !== 'Email tidak tersedia' && (
            <Paragraph style={styles.modernDescription}>
              📧 {email}
            </Paragraph>
          )}
          
          {/* Subject Tags */}
          <View style={styles.modernJurusanContainer}>
            <Text style={styles.modernSectionTitle}>📚 Mata Pelajaran yang Diampu:</Text>
            {teacher.allSubjects.map((subject, idx) => (
              <Chip 
                key={idx}
                style={[
                  styles.modernJurusanChip,
                  subject === mataPelajaran && { backgroundColor: '#dcfce7', borderColor: '#10B981' }
                ]}
                textStyle={[
                  styles.modernJurusanChipText,
                  subject === mataPelajaran && { color: '#059669', fontFamily: 'Nunito_600SemiBold' }
                ]}
                compact
                icon={subject === mataPelajaran ? "star" : "book"}
              >
                {subject === mataPelajaran ? `${subject} ⭐` : subject}
              </Chip>
            ))}
          </View>
          
          {/* Class Tags */}
          <View style={styles.modernJurusanContainer}>
            <Text style={styles.modernSectionTitle}>🏫 Kelas yang Diampu:</Text>
            {classes.map((className, idx) => (
              <Chip 
                key={idx}
                style={styles.modernClassChip}
                textStyle={styles.modernClassChipText}
                compact
                icon="school"
              >
                {className}
              </Chip>
            ))}
          </View>
          
          {/* Stats Cards */}
          <View style={styles.modernStatsContainer}>
            <Surface style={styles.modernStatCard} elevation={1}>
              <Ionicons name="book-outline" size={20} color="#6366F1" />
              <Text style={styles.modernStatNumber}>{teacher.totalSubjects}</Text>
              <Text style={styles.modernStatLabel}>Mata Pelajaran</Text>
            </Surface>
            
            <Surface style={styles.modernStatCard} elevation={1}>
              <Ionicons name="school-outline" size={20} color="#10B981" />
              <Text style={styles.modernStatNumber}>{classes.length}</Text>
              <Text style={styles.modernStatLabel}>Kelas</Text>
            </Surface>
            
            <Surface style={styles.modernStatCard} elevation={1}>
              <Ionicons 
                name={statusKepegawaian === 'PNS' ? "checkmark-circle" : "time-outline"} 
                size={20} 
                color={statusKepegawaian === 'PNS' ? '#10B981' : '#F59E0B'} 
              />
              <Text style={[styles.modernStatNumber, { 
                color: statusKepegawaian === 'PNS' ? '#10B981' : '#F59E0B',
                fontSize: 12
              }]}>
                {statusKepegawaian}
              </Text>
              <Text style={styles.modernStatLabel}>Status</Text>
            </Surface>
          </View>
        </Card.Content>
        
        <Card.Actions style={styles.modernCardActions}>
          <Button 
            mode="text" 
            onPress={() => {
              Alert.alert(
                'Detail Lengkap Guru',
                `Nama: ${teacherName}\nNIP: ${teacherNip}\nStatus: ${statusKepegawaian}\nEmail: ${email}\nTotal Mata Pelajaran: ${teacher.totalSubjects}\nTotal Kelas: ${classes.length}`
              );
            }}
            icon="account-details"
            textColor={getKelompokColor()}
          >
            Lihat Detail Lengkap
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  let [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Memuat data guru...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <SafeStatusBar style="light" hidden={true} />
      
      <TopBar
        title="Detail Mata Pelajaran"
        onMenuPress={() => console.log('Sidebar not implemented')}
        notifications={[]}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Subject Info Header */}
        <Card style={styles.subjectInfoCard} elevation={2} mode="elevated">
          <Card.Content>
            <View style={styles.subjectHeader}>
              <View style={styles.subjectIconContainer}>
                <Ionicons name="book-open" size={24} color="#4A90E2" />
              </View>
              <View style={styles.subjectInfo}>
                <Title style={styles.subjectTitle}>{mataPelajaran}</Title>
                <Paragraph style={styles.subjectSubtitle}>
                  {teachers.length} guru pengampu • Kode: {getSubjectAbbreviation(mataPelajaran)}
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Memuat data guru pengampu...</Text>
          </View>
        ) : teachers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Belum ada guru yang mengampu mata pelajaran ini</Text>
            <Text style={styles.emptySubtext}>
              Silakan assign guru melalui halaman manajemen guru
            </Text>
          </View>
        ) : (
          <View style={styles.teachersList}>
            <Text style={styles.teachersListTitle}>👨‍🏫 Guru Pengampu ({teachers.length})</Text>
            {teachers.map((teacher, index) => renderTeacherCard(teacher, index))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  teachersList: {
    paddingVertical: 16,
  },
  
  // Modern Card Styles (consistent with MapelPage)
  modernCard: {
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  
  cardTitleText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#1f2937',
    lineHeight: 22,
  },
  
  cardSubtitleText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  
  cardRightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  
  kelompokChip: {
    marginBottom: 4,
    borderRadius: 6,
    height: 24,
  },
  
  kelompokChipText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 14,
  },
  
  statusBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  
  modernCardContent: {
    paddingTop: 8,
  },
  
  modernDescription: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  
  modernJurusanContainer: {
    marginBottom: 16,
  },
  
  modernJurusanChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    height: 28,
  },
  
  modernJurusanChipText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#2563eb',
  },
  
  modernClassChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    height: 28,
  },
  
  modernClassChipText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#059669',
  },
  
  modernStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  modernStatCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  
  modernStatNumber: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  
  modernStatLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  
  modernSectionTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  
  modernCardActions: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'flex-end',
  },
  
  // Subject Info Card Styles
  subjectInfoCard: {
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  subjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  subjectInfo: {
    flex: 1,
  },
  
  subjectTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  
  subjectSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
  },
  
  teachersListTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#374151',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  
  // Avatar Styles
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  teacherAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  
  // Legacy styles (kept for compatibility)
  teacherCard: {
    marginBottom: 16,
  },
  avatar: {
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  photoContainer: {
    marginRight: 12,
  },
  teacherPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#1a202c',
    marginBottom: 2,
  },
  teacherNip: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#718096',
    marginBottom: 1,
  },
  teacherIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  teacherIdLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#718096',
  },
  teacherIdChip: {
    backgroundColor: '#4A90E2',
    height: 20,
  },
  teacherIdText: {
    fontSize: 9,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  assignmentId: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#4A90E2',
  },
  badgeContainer: {
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  divider: {
    marginVertical: 12,
  },
  badge: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#4A90E2',
  },
  badgeLabel: {
    fontSize: 10,
    fontFamily: 'Nunito_400Regular',
    color: '#4A90E2',
  },
  cardContent: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  subjectList: {
    marginBottom: 16,
  },
  subjectItem: {
    marginBottom: 6,
    paddingVertical: 4,
  },
  subjectNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
    flex: 1,
  },
  currentSubject: {
    color: '#4A90E2',
    fontFamily: 'Nunito_600SemiBold',
  },
  subjectIdChip: {
    backgroundColor: '#10B981',
    height: 20,
    marginLeft: 8,
  },
  subjectId: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: '#9ca3af',
  },
  classList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  classChip: {
    marginRight: 6,
    marginBottom: 6,
  },
  classText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: '#4A90E2',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
    marginLeft: 4,
  },
});
