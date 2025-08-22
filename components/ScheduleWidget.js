import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, CardContent } from '../components/ui/Card';
import { formatTime } from '../utils/timeUtils';
import JadwalService from '../services/JadwalService';

const ScheduleWidget = ({ userType, userId, userClass, onSchedulePress, theme, headerBackgroundColor }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    loadSchedules();
  }, [userType, userId, userClass]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      let result = [];
      
      if (userType === 'murid' && userClass) {
        result = await JadwalService.getSchedulesByClass(userClass);
      }
      const sortedSchedules = result.sort((a, b) => {
        const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        // Pastikan a.hari dan b.hari adalah string sebelum menggunakan indexOf
        const dayA = typeof a.hari === 'string' ? dayOrder.indexOf(a.hari) : -1;
        const dayB = typeof b.hari === 'string' ? dayOrder.indexOf(b.hari) : -1;
        
        if (dayA !== dayB) {
          return dayA - dayB;
        }
        
        return a.jamMulai.localeCompare(b.jamMulai);
      });
      
      setSchedules(sortedSchedules);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  };

  const getTodaySchedules = () => {
    const today = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = dayNames[today.getDay()];
    
    return schedules.filter(schedule => schedule.hari === todayName);
  };

  const getUpcomingSchedules = () => {
    const today = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = dayNames[today.getDay()];
    const currentTime = today.getHours() * 60 + today.getMinutes();
    
    const todayRemaining = schedules.filter(schedule => {
      if (schedule.hari !== todayName) return false;
      
      const [hours, minutes] = schedule.jamMulai.split(':').map(Number);
      const scheduleTime = hours * 60 + minutes;
      
      return scheduleTime > currentTime;
    });
    
    const tomorrowIndex = (today.getDay() + 1) % 7;
    const tomorrowName = dayNames[tomorrowIndex];
    const tomorrowSchedules = schedules.filter(schedule => schedule.hari === tomorrowName);
    
    return [...todayRemaining, ...tomorrowSchedules].slice(0, 3);
  };

  const renderScheduleItem = (schedule, index) => {
    const parsedId = schedule.mapelGuruId ? 
      JadwalService.parseMapelGuruId(schedule.mapelGuruId) : null;
    
    const subjectName = schedule.namaMataPelajaran || schedule.mataPelajaran || 'Mata Pelajaran';
    const subjectAbbrev = getSubjectAbbreviation(subjectName);
    
    return (
      <TouchableOpacity
        key={index}
        style={styles.scheduleItem}
        onPress={() => onSchedulePress && onSchedulePress(schedule)}
      >
        <View style={styles.scheduleHeader}>
          <View style={styles.subjectContainer}>
            <View style={styles.subjectMainRow}>
              <View style={styles.subjectNameContainer}>
                <Text style={styles.subjectText} numberOfLines={2}>{subjectName}</Text>
                <Text style={styles.jamKeText}>Jam ke-{schedule.jamKe}</Text>
              </View>
              <View style={styles.idContainer}>
                {schedule.mapelGuruId && (
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>{schedule.mapelGuruId}</Text>
                  </View>
                )}
              </View>
            </View>
            {parsedId && (
              <Text style={styles.categoryText}>
                {parsedId.category.kategori}
                {parsedId.category.jurusan && ` - ${parsedId.category.jurusan}`}
              </Text>
            )}
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {formatTime(schedule.jamMulai)} - {formatTime(schedule.jamSelesai)}
            </Text>
            <Text style={styles.dayText}>{schedule.hari}</Text>
          </View>
        </View>
        <View style={styles.scheduleDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guru:</Text>
            <Text style={styles.detailValue}>
              {schedule.namaGuru || 'Tidak ada guru'}
              {userType !== 'murid' && schedule.guruId && schedule.guruId !== '-' && (
                <Text style={styles.guruIdText}> (ID: {schedule.guruId})</Text>
              )}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ruang:</Text>
            <Text style={styles.detailValue}>{schedule.ruangKelas || schedule.ruang || 'Tidak ada ruang'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderWeeklySchedule = () => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const schedulesByDay = {};
    
    days.forEach(day => {
      schedulesByDay[day] = schedules.filter(schedule => schedule.hari === day)
        .sort((a, b) => {
          const timeA = a.jamMulai.split(':').map(Number);
          const timeB = b.jamMulai.split(':').map(Number);
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });
    });
    
    return (
      <View style={styles.weeklySchedule}>
        {days.map(day => (
          <View key={day} style={styles.daySchedule}>
            <Text style={styles.dayTitle}>{day}</Text>
            {schedulesByDay[day].length > 0 ? (
              schedulesByDay[day].map((schedule, index) => (
                <View key={index} style={styles.weeklyScheduleItem}>
                  <View style={styles.weeklyTimeContainer}>
                    <Text style={styles.weeklyTimeText}>
                      {formatTime(schedule.jamMulai)}
                    </Text>
                    <Text style={styles.weeklyJamText}>J-{schedule.jamKe}</Text>
                  </View>
                  <View style={styles.weeklyInfoContainer}>
                    <View style={styles.weeklySubjectMainRow}>
                      <View style={styles.weeklySubjectNameContainer}>
                        <Text style={styles.weeklySubjectText} numberOfLines={1}>
                          {schedule.namaMataPelajaran || schedule.mataPelajaran || 'Mata Pelajaran'}
                        </Text>
                      </View>
                      <View style={styles.weeklyIdContainer}>
                        {schedule.mapelGuruId && (
                          <View style={styles.weeklyIdBadge}>
                            <Text style={styles.weeklyIdBadgeText}>{schedule.mapelGuruId}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.weeklyDetailText}>
                      {schedule.namaGuru || 'Tidak ada guru'}
                      {userType !== 'murid' && schedule.guruId && schedule.guruId !== '-' && (
                        <Text style={styles.weeklyGuruIdText}> (ID: {schedule.guruId})</Text>
                      )}
                      {' • '}
                      {schedule.ruangKelas || schedule.ruang || 'Tidak ada ruang'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDayScheduleText}>Tidak ada jadwal</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        {'Tidak ada jadwal untuk kelas Anda'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, headerBackgroundColor && { backgroundColor: headerBackgroundColor }]}>
        <Text style={[{ color: headerBackgroundColor ? '#FFFFFF' : '#333' }]}>Memuat jadwal...</Text>
      </View>
    );
  }

  const todaySchedules = getTodaySchedules();
  const upcomingSchedules = getUpcomingSchedules();

  return (
    <ScrollView
      style={[styles.container, headerBackgroundColor && { backgroundColor: headerBackgroundColor }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Today's Schedule */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>
          {todaySchedules.length > 0 ? (
            todaySchedules.map((schedule, index) => renderScheduleItem(schedule, index))
          ) : (
            <Text style={styles.noScheduleText}>Tidak ada jadwal hari ini</Text>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Schedule */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Jadwal Mendatang</Text>
          {upcomingSchedules.length > 0 ? (
            upcomingSchedules.map((schedule, index) => renderScheduleItem(schedule, index))
          ) : (
            <Text style={styles.noScheduleText}>Tidak ada jadwal mendatang</Text>
          )}
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Jadwal Mingguan</Text>
          {renderWeeklySchedule()}
        </CardContent>
      </Card>

      {/* All Schedules Summary */}
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Ringkasan Jadwal</Text>
          <Text style={styles.summaryText}>
            Total jadwal: {schedules.length} 
            {' mata pelajaran'}
          </Text>
          {schedules.length === 0 && renderEmptyState()}
        </CardContent>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  scheduleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subjectContainer: {
    flex: 1,
    marginRight: 8,
  },
  subjectMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  subjectNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  idContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 60,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    lineHeight: 20,
  },
  jamKeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  dayText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  scheduleDetails: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    width: 50,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  weeklySchedule: {
    marginTop: 8,
  },
  daySchedule: {
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  weeklyScheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 4,
  },
  weeklyTimeContainer: {
    width: 60,
    alignItems: 'center',
    marginRight: 12,
  },
  weeklyTimeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  weeklyJamText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  weeklyInfoContainer: {
    flex: 1,
  },
  weeklySubjectMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  weeklySubjectNameContainer: {
    flex: 1,
    marginRight: 6,
  },
  weeklyIdContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 50,
  },
  weeklySubjectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
  },
  weeklyDetailText: {
    fontSize: 12,
    color: '#666',
  },
  noDayScheduleText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  noScheduleText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subjectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  idBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  idBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  categoryText: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  guruIdText: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  weeklySubjectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  weeklyIdBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-end',
  },
  weeklyIdBadgeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  weeklyGuruIdText: {
    fontSize: 10,
    color: '#777',
    fontStyle: 'italic',
  },
  weeklyMapelIdText: {
    fontSize: 10,
    color: '#777',
    fontStyle: 'italic',
  },
});

export default ScheduleWidget;
