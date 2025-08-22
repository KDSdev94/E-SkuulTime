import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import MataPelajaranService from '../../services/MataPelajaranService';
import GuruService from '../../services/GuruService';
import ExportService from '../../services/ExportService';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');

// Helper function untuk check apakah user adalah prodi/kapordi
const isKapordiUser = (user) => {
  if (!user) return false;
  
  // Check userType
  if (user.userType === 'prodi') return true;
  
  // Check role
  if (user.role && (user.role.includes('kaprodi') || user.role === 'kaprodi_tkj' || user.role === 'kaprodi_tkr')) {
    return true;
  }
  
  return false;
};

export default function MapelPage({ navigation }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [firestoreData, setFirestoreData] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMapel, setNewMapel] = useState({
    nama: '',
    kelompok: 'A',
    kategori: 'Wajib Nasional',
    deskripsi: '',
    jurusan: ['Semua'],
    aktif: true
  });
  const [showFAB, setShowFAB] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const mataPelajaranData = {
    kelompokA: [
      'Pendidikan Agama dan Budi Pekerti',
      'PPKn (Pendidikan Pancasila dan Kewarganegaraan)',
      'Bahasa Indonesia',
      'Matematika',
      'Sejarah Indonesia',
      'Bahasa Inggris'
    ],
    kelompokB: [
      'Seni Budaya',
      'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)',
      'Bahasa Daerah',
      'Prakarya dan Kewirausahaan'
    ],
    kelompokC_TKJ: [
      'Komputer dan Jaringan Dasar',
      'Pemrograman Dasar',
      'Desain Grafis',
      'Sistem Komputer',
      'Simulasi dan Komunikasi Digital',
      'Administrasi Infrastruktur Jaringan (AIJ)',
      'Teknologi Jaringan Berbasis Luas (WAN)',
      'Administrasi Sistem Jaringan (ASJ)',
      'Teknologi Layanan Jaringan (TLJ)',
      'Produk Kreatif dan Kewirausahaan'
    ],
    kelompokC_TKR: [
      'Gambar Teknik Otomotif',
      'Teknologi Dasar Otomotif',
      'Pekerjaan Dasar Teknik Otomotif',
      'Pemeliharaan Mesin Kendaraan Ringan',
      'Pemeliharaan Sasis dan Pemindah Tenaga',
      'Pemeliharaan Kelistrikan Kendaraan Ringan',
      'Produk Kreatif dan Kewirausahaan'
    ]
  };


  const loadDataFromFirestore = async () => {
    try {
      const data = await MataPelajaranService.getMataPelajaranFromFirestore();
      setFirestoreData(data);
      setIsInitialized(data.length > 0);
    } catch (error) {
      
    }
  };

  const loadTeachers = async () => {
    try {
      const teachersData = await GuruService.getAllGuru();
      setTeachers(teachersData);
      
    } catch (error) {
      
    }
  };

  const getTeachersBySubject = (subjectName) => {
    return teachers.filter(teacher => {
      if (Array.isArray(teacher.mataPelajaran)) {
        return teacher.mataPelajaran.includes(subjectName);
      } else if (typeof teacher.mataPelajaran === 'string') {
        return teacher.mataPelajaran === subjectName;
      }
      return false;
    });
  };

  const getClassesBySubject = (subjectName) => {
    const teachingTeachers = getTeachersBySubject(subjectName);
    const allClasses = new Set();
    
    teachingTeachers.forEach(teacher => {
      if (Array.isArray(teacher.kelasAmpu)) {
        teacher.kelasAmpu.forEach(kelas => {
          if (kelas && kelas.trim()) {
            allClasses.add(kelas.trim());
          }
        });
      }
    });
    
    return Array.from(allClasses).sort();
  };

  useEffect(() => {
    loadDataFromFirestore();
    loadTeachers();
  }, []);

  useEffect(() => {
    setShowFAB(isInitialized);
  }, [isInitialized]);

  const addNewMataPelajaran = async () => {
    if (!newMapel.nama.trim()) {
      Alert.alert('Error', 'Nama mata pelajaran tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      await MataPelajaranService.addMataPelajaran(newMapel);
      
      Alert.alert(
        'Sukses!',
        `Mata pelajaran "${newMapel.nama}" berhasil ditambahkan`,
        [{ text: 'OK', onPress: () => {
          setShowAddModal(false);
          setNewMapel({
            nama: '',
            kelompok: 'A',
            kategori: 'Wajib Nasional',
            deskripsi: '',
            jurusan: ['Semua'],
            aktif: true
          });
          loadDataFromFirestore();
          loadTeachers(); // Reload teacher data
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat menambah mata pelajaran: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllMataPelajaran = async () => {
    Alert.alert(
      'Konfirmasi Hapus SEMUA Data',
      'Apakah Anda yakin ingin menghapus SEMUA data?\n\n⚠️ Ini akan menghapus:\n• Semua mata pelajaran\n• Semua data guru\n• Semua data kelas\n\nTindakan ini tidak dapat dibatalkan!',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus SEMUA', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const mapelResult = await MataPelajaranService.deleteAllMataPelajaran();
              
              const guruResult = await GuruService.deleteAllGuru();
              
              setFirestoreData([]);
              setTeachers([]);
              setIsInitialized(false);
              
              Alert.alert(
                'Sukses!',
                `Berhasil menghapus:\n• ${mapelResult.count} mata pelajaran\n• ${guruResult} guru\n• Data kelas terkait`,
                [{ text: 'OK', onPress: () => {
                  loadDataFromFirestore();
                  loadTeachers();
                }}]
              );
            } catch (error) {
              Alert.alert('Error', 'Terjadi kesalahan saat menghapus data: ' + error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const updateKategoriByKelompok = (kelompok) => {
    let kategori = '';
    let jurusan = ['Semua'];
    
    switch (kelompok) {
      case 'A':
        kategori = 'Wajib Nasional';
        break;
      case 'B':
        kategori = 'Wajib Kewilayahan';
        break;
      case 'C':
        kategori = 'Muatan Peminatan Kejuruan';
        jurusan = ['TKJ']; // Default ke TKJ
        break;
    }
    
    setNewMapel(prev => ({
      ...prev,
      kelompok,
      kategori,
      jurusan
    }));
  };

  const handleExportSubjects = async () => {
    setIsExporting(true);
    try {
      let dataToExport = [];
      
      if (isInitialized) {
        // Export Firestore data
        dataToExport = firestoreData.map(mapel => ({
          'Nama Mata Pelajaran': mapel.nama,
          'Kelompok': mapel.kelompok,
          'Kategori': mapel.kategori,
          'Jurusan': Array.isArray(mapel.jurusan) ? mapel.jurusan.join(', ') : mapel.jurusan || '',
          'Deskripsi': mapel.deskripsi || '',
          'Status': mapel.aktif ? 'Aktif' : 'Tidak Aktif',
          'Jumlah Guru Pengampu': getTeachersBySubject(mapel.nama).length,
          'Jumlah Kelas': getClassesBySubject(mapel.nama).length
        }));
      } else {
        // Export static local data
        const allSubjects = [
          ...mataPelajaranData.kelompokA.map(nama => ({ nama, kelompok: 'A', kategori: 'Wajib Nasional', jurusan: 'Semua' })),
          ...mataPelajaranData.kelompokB.map(nama => ({ nama, kelompok: 'B', kategori: 'Wajib Kewilayahan', jurusan: 'Semua' })),
          ...mataPelajaranData.kelompokC_TKJ.map(nama => ({ nama, kelompok: 'C', kategori: 'Muatan Peminatan Kejuruan', jurusan: 'TKJ' })),
          ...mataPelajaranData.kelompokC_TKR.map(nama => ({ nama, kelompok: 'C', kategori: 'Muatan Peminatan Kejuruan', jurusan: 'TKR' }))
        ];
        
        dataToExport = allSubjects.map(mapel => ({
          'Nama Mata Pelajaran': mapel.nama,
          'Kelompok': mapel.kelompok,
          'Kategori': mapel.kategori,
          'Jurusan': mapel.jurusan,
          'Deskripsi': '',
          'Status': 'Aktif',
          'Jumlah Guru Pengampu': getTeachersBySubject(mapel.nama).length,
          'Jumlah Kelas': getClassesBySubject(mapel.nama).length
        }));
      }
      
      await ExportService.exportToPDF(dataToExport, 'Data Mata Pelajaran');
      Alert.alert('Sukses', 'Data mata pelajaran berhasil diekspor ke PDF!');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengekspor data: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

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

  const renderMapelCard = (mapel, index, category = 'default') => {
    const teachingTeachers = getTeachersBySubject(mapel);
    const teacherCount = teachingTeachers.length;
    const mapelAbbrev = getSubjectAbbreviation(mapel);
    
    return (
      <TouchableOpacity 
        key={`${category}-${index}-${mapel}`} 
        style={styles.card}
        onPress={() => {
          navigation.navigate('MapelDetail', {
            mataPelajaran: mapel,
            teachers: teachingTeachers
          });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Ionicons name="book-outline" size={20} color="#4A90E2" />
            <Text style={styles.mapelName}>{mapel}</Text>
          </View>
          <View style={styles.cardAction}>
            <Ionicons name="chevron-forward" size={16} color="#4A90E2" />
          </View>
        </View>
        <View style={styles.cardContent}>
          {/* Teacher Info */}
          {teachingTeachers.length > 0 && (
            <View style={styles.teacherInfoSection}>
              <Text style={styles.teacherSectionTitle}>Guru Pengampu:</Text>
              <View style={styles.teacherList}>
                {teachingTeachers.slice(0, 3).map((teacher, idx) => (
                  <View key={idx} style={styles.teacherItem}>
                    <View style={styles.teacherNameRow}>
                      <Text style={styles.teacherItemName}>
                        {teacher.namaLengkap}
                      </Text>
                      <View style={styles.teacherIdBadge}>
                        <Text style={styles.teacherIdText}>
                          {mapelAbbrev}-{String.fromCharCode(65 + idx)}{(idx + 1).toString().padStart(2, '0')}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                {teachingTeachers.length > 3 && (
                  <Text style={styles.moreTeachers}>
                    +{teachingTeachers.length - 3} guru lainnya
                  </Text>
                )}
              </View>
            </View>
          )}
          
          {/* Classes that use this subject */}
          <View style={styles.classInfoSection}>
            <Text style={styles.classSectionTitle}>Kelas yang menggunakan:</Text>
            <View style={styles.sampleClassList}>
              {(() => {
                const classes = getClassesBySubject(mapel);
                if (classes.length === 0) {
                  return (
                    <Text style={styles.noClassText}>Belum ada kelas yang menggunakan mata pelajaran ini</Text>
                  );
                }
                
                // Group classes by chunks of 4 for better display
                const chunks = [];
                for (let i = 0; i < classes.length; i += 4) {
                  chunks.push(classes.slice(i, i + 4));
                }
                
                return chunks.map((chunk, index) => (
                  <Text key={index} style={styles.sampleClass}>
                    {chunk.join(', ')}
                  </Text>
                ));
              })()}
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{teacherCount}</Text>
              <Text style={styles.statLabel}>Guru Pengampu</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getClassesBySubject(mapel).length}</Text>
              <Text style={styles.statLabel}>Kelas</Text>
            </View>
          </View>
          <Text style={styles.tapHint}>Ketuk untuk melihat detail</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFirestoreCard = (mapel, index, category = 'firestore') => {
    const teachingTeachers = getTeachersBySubject(mapel.nama);
    const teacherCount = teachingTeachers.length;
    const mapelAbbrev = getSubjectAbbreviation(mapel.nama);
    
    return (
      <TouchableOpacity 
        key={`${category}-${mapel.id || index}-${mapel.nama}`} 
        style={styles.card}
        onPress={() => {
          navigation.navigate('MapelDetail', {
            mataPelajaran: mapel.nama,
            teachers: teachingTeachers
          });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Ionicons name="book-outline" size={20} color="#4A90E2" />
            <Text style={styles.mapelName}>{mapel.nama}</Text>
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>{mapel.kelompok}</Text>
          </View>
          <View style={styles.cardAction}>
            <Ionicons name="chevron-forward" size={16} color="#4A90E2" />
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.kategoriText}>{mapel.kategori}</Text>
          <Text style={styles.deskripsiText}>{mapel.deskripsi}</Text>
          <View style={styles.jurusanContainer}>
            {mapel.jurusan?.map((jurusan, idx) => (
              <Text key={idx} style={styles.jurusanTag}>{jurusan}</Text>
            ))}
          </View>
          
          {/* Teacher Info */}
          {teachingTeachers.length > 0 && (
            <View style={styles.teacherInfoSection}>
              <Text style={styles.teacherSectionTitle}>Guru Pengampu:</Text>
              <View style={styles.teacherList}>
                {teachingTeachers.slice(0, 3).map((teacher, idx) => (
                  <View key={idx} style={styles.teacherItem}>
                    <View style={styles.teacherNameRow}>
                      <Text style={styles.teacherItemName}>
                        {teacher.namaLengkap}
                      </Text>
                      <View style={styles.teacherIdBadge}>
                        <Text style={styles.teacherIdText}>
                          {mapelAbbrev}-{String.fromCharCode(65 + idx)}{(idx + 1).toString().padStart(2, '0')}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                {teachingTeachers.length > 3 && (
                  <Text style={styles.moreTeachers}>
                    +{teachingTeachers.length - 3} guru lainnya
                  </Text>
                )}
              </View>
            </View>
          )}
          
          {/* Classes that use this subject */}
          <View style={styles.classInfoSection}>
            <Text style={styles.classSectionTitle}>Kelas yang menggunakan:</Text>
            <View style={styles.sampleClassList}>
              {(() => {
                const classes = getClassesBySubject(mapel.nama);
                if (classes.length === 0) {
                  return (
                    <Text style={styles.noClassText}>Belum ada kelas yang menggunakan mata pelajaran ini</Text>
                  );
                }
                
                // Group classes by chunks of 4 for better display
                const chunks = [];
                for (let i = 0; i < classes.length; i += 4) {
                  chunks.push(classes.slice(i, i + 4));
                }
                
                return chunks.map((chunk, index) => (
                  <Text key={index} style={styles.sampleClass}>
                    {chunk.join(', ')}
                  </Text>
                ));
              })()}
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{teacherCount}</Text>
              <Text style={styles.statLabel}>Guru Pengampu</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getClassesBySubject(mapel.nama).length}</Text>
              <Text style={styles.statLabel}>Kelas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: mapel.aktif ? '#10B981' : '#EF4444' }]}>
                {mapel.aktif ? '✓' : '✗'}
              </Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>
          <Text style={styles.tapHint}>Ketuk untuk melihat detail</Text>
        </View>
      </TouchableOpacity>
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
        <Text style={styles.loadingText}>Memuat data mata pelajaran...</Text>
      </View>
    );
  }

  const totalMapel = mataPelajaranData.kelompokA.length + 
                    mataPelajaranData.kelompokB.length + 
                    mataPelajaranData.kelompokC_TKJ.length + 
                    mataPelajaranData.kelompokC_TKR.length;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Daftar Mata Pelajaran SMK</Text>
          <Text style={styles.subtitle}>
            {isInitialized 
              ? `Data Firestore: ${firestoreData.length} mata pelajaran` 
              : `Data Lokal: ${totalMapel} mata pelajaran`
            }
          </Text>
          
          
          {/* Tombol refresh data */}
          {isInitialized && (
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={loadDataFromFirestore}
            >
              <Ionicons name="refresh-outline" size={20} color="#4A90E2" />
              <Text style={styles.refreshButtonText}>Refresh Data</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tampilkan data dari Firestore jika sudah diinisialisasi */}
        {isInitialized ? (
          <>
            {/* Data dari Firestore */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📊 Data Mata Pelajaran dari Firestore</Text>
              </View>
              <Text style={styles.sectionDescription}>Data yang tersimpan di database</Text>
              
              {/* Kelompok A */}
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>✅ Kelompok A (Wajib Nasional)</Text>
                {firestoreData
                  .filter(mapel => mapel.kelompok === 'A')
                  .map((mapel, index) => renderFirestoreCard(mapel, index, 'firestoreA'))
                }
              </View>
              
              {/* Kelompok B */}
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>✅ Kelompok B (Wajib Kewilayahan)</Text>
                {firestoreData
                  .filter(mapel => mapel.kelompok === 'B')
                  .map((mapel, index) => renderFirestoreCard(mapel, index, 'firestoreB'))
                }
              </View>
              
              {/* Kelompok C - TKJ */}
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>🔧 Kelompok C - TKJ</Text>
                {firestoreData
                  .filter(mapel => mapel.kelompok === 'C' && mapel.jurusan?.includes('TKJ'))
                  .map((mapel, index) => renderFirestoreCard(mapel, index, 'firestoreTKJ'))
                }
              </View>
              
              {/* Kelompok C - TKR */}
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>🚗 Kelompok C - TKR</Text>
                {firestoreData
                  .filter(mapel => mapel.kelompok === 'C' && mapel.jurusan?.includes('TKR'))
                  .map((mapel, index) => renderFirestoreCard(mapel, index, 'firestoreTKR'))
                }
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Data statis lokal */}
            {/* Kelompok A (Wajib Nasional) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✅ Kelompok A (Wajib Nasional)</Text>
              </View>
              <Text style={styles.sectionDescription}>(Berlaku untuk semua jurusan SMK)</Text>
              {mataPelajaranData.kelompokA.map((mapel, index) => renderMapelCard(mapel, index, 'kelompokA'))}
            </View>

            {/* Kelompok B (Wajib Kewilayahan) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✅ Kelompok B (Wajib Kewilayahan)</Text>
              </View>
              {mataPelajaranData.kelompokB.map((mapel, index) => renderMapelCard(mapel, index, 'kelompokB'))}
            </View>

            {/* Kelompok C (Muatan Peminatan Kejuruan) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✅ Kelompok C (Muatan Peminatan Kejuruan)</Text>
              </View>
              
              {/* TKJ Section */}
              <View style={styles.subsection}>
                <View style={styles.subsectionHeader}>
                  <Text style={styles.subsectionTitle}>🔧 TKJ – Teknik Komputer dan Jaringan</Text>
                </View>
                {mataPelajaranData.kelompokC_TKJ.map((mapel, index) => renderMapelCard(mapel, index, 'kelompokC_TKJ'))}
              </View>
              
              {/* TKR Section */}
              <View style={styles.subsection}>
                <View style={styles.subsectionHeader}>
                  <Text style={styles.subsectionTitle}>🚗 TKR/TKRO – Teknik Kendaraan Ringan Otomotif</Text>
                </View>
                {mataPelajaranData.kelompokC_TKR.map((mapel, index) => renderMapelCard(mapel, index, 'kelompokC_TKR'))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Action Buttons - Hidden for kaprodi users */}
      {showFAB && !isKapordiUser(user) && (
        <>
          {/* FAB Tambah Mata Pelajaran */}
          <TouchableOpacity 
            style={[styles.fab, styles.fabAdd]} 
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>

          {/* FAB Export Data */}
          <TouchableOpacity 
            style={[styles.fab, styles.fabExport]} 
            onPress={handleExportSubjects}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download" size={24} color="#fff" />
            )}
          </TouchableOpacity>

          {/* FAB Hapus Semua Data */}
          <TouchableOpacity 
            style={[styles.fab, styles.fabDelete]} 
            onPress={deleteAllMataPelajaran}
          >
            <Ionicons name="trash" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Modal Tambah Mata Pelajaran */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Mata Pelajaran</Text>
              <TouchableOpacity 
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Nama Mata Pelajaran */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Mata Pelajaran *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMapel.nama}
                  onChangeText={(text) => setNewMapel(prev => ({...prev, nama: text}))}
                  placeholder="Masukkan nama mata pelajaran"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Kelompok */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kelompok *</Text>
                <View style={styles.radioGroup}>
                  {['A', 'B', 'C'].map(kelompok => (
                    <TouchableOpacity 
                      key={kelompok}
                      style={styles.radioOption}
                      onPress={() => updateKategoriByKelompok(kelompok)}
                    >
                      <View style={[
                        styles.radioCircle,
                        newMapel.kelompok === kelompok && styles.radioSelected
                      ]} />
                      <Text style={styles.radioText}>Kelompok {kelompok}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Kategori (Auto-filled) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kategori</Text>
                <TextInput
                  style={[styles.textInput, styles.disabledInput]}
                  value={newMapel.kategori}
                  editable={false}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Jurusan (jika Kelompok C) */}
              {newMapel.kelompok === 'C' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Jurusan *</Text>
                  <View style={styles.radioGroup}>
                    {['TKJ', 'TKR'].map(jurusan => (
                      <TouchableOpacity 
                        key={jurusan}
                        style={styles.radioOption}
                        onPress={() => setNewMapel(prev => ({...prev, jurusan: [jurusan]}))}
                      >
                        <View style={[
                          styles.radioCircle,
                          newMapel.jurusan.includes(jurusan) && styles.radioSelected
                        ]} />
                        <Text style={styles.radioText}>{jurusan}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Deskripsi */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Deskripsi</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newMapel.deskripsi}
                  onChangeText={(text) => setNewMapel(prev => ({...prev, deskripsi: text}))}
                  placeholder="Masukkan deskripsi mata pelajaran (opsional)"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Status Aktif */}
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.inputLabel}>Status Aktif</Text>
                  <TouchableOpacity 
                    style={styles.switchButton}
                    onPress={() => setNewMapel(prev => ({...prev, aktif: !prev.aktif}))}
                  >
                    <View style={[
                      styles.switch,
                      newMapel.aktif && styles.switchActive
                    ]}>
                      <View style={[
                        styles.switchThumb,
                        newMapel.aktif && styles.switchThumbActive
                      ]} />
                    </View>
                    <Text style={styles.switchText}>
                      {newMapel.aktif ? 'Aktif' : 'Tidak Aktif'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={addNewMataPelajaran}
                disabled={loading || !newMapel.nama.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#1a202c',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#718096',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
    color: '#2d3748',
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#718096',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  subsection: {
    marginTop: 16,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#2d3748',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardAction: {
    marginLeft: 8,
    opacity: 0.7,
  },
  mapelName: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#2d3748',
    marginLeft: 8,
    flex: 1,
  },
  cardContent: {
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#718096',
    marginTop: 4,
  },
  tapHint: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  initButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  initButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    marginLeft: 8,
  },
  refreshButton: {
    backgroundColor: '#f0f8ff',
    borderColor: '#4A90E2',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    marginLeft: 8,
  },
  badgeContainer: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badge: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
  },
  kategoriText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  deskripsiText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#718096',
    marginBottom: 8,
  },
  jurusanContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  jurusanTag: {
    backgroundColor: '#e6f3ff',
    color: '#4A90E2',
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  teacherInfoSection: {
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  teacherSectionTitle: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: '#374151',
    marginBottom: 6,
  },
  teacherList: {
    paddingLeft: 4,
  },
  teacherItem: {
    marginBottom: 6,
  },
  teacherNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  teacherItemName: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#374151',
    flex: 1,
  },
  teacherIdBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  teacherIdText: {
    fontSize: 9,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  teacherItemId: {
    fontSize: 10,
    fontFamily: 'Nunito_400Regular',
    color: '#9ca3af',
  },
  moreTeachers: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  classInfoSection: {
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  classSectionTitle: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: '#374151',
    marginBottom: 6,
  },
  sampleClassList: {
    paddingLeft: 4,
  },
  sampleClass: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: '#10B981',
    marginBottom: 2,
  },
  noClassText: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabAdd: {
    backgroundColor: '#10B981',
    bottom: 170,
    right: 20,
  },
  fabExport: {
    backgroundColor: '#17a2b8',
    bottom: 100,
    right: 20,
  },
  fabDelete: {
    backgroundColor: '#EF4444',
    bottom: 30,
    right: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
    width: width - 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  radioSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#4A90E2',
  },
  radioText: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#374151',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#10B981',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#374151',
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#fff',
  },
});
