import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import StudentScheduleService from '../services/StudentScheduleService';

const StudentSchedule = ({ studentClass }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const studentScheduleService = new StudentScheduleService();
        const fetchedSchedules = await studentScheduleService.getPublishedSchedulesByClass(studentClass);
        setSchedules(fetchedSchedules);
      } catch (error) {
        console.error('Error loading student schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [studentClass]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView style={styles.container}>
      {schedules.length === 0 ? (
        <Text>No schedules available.</Text>
      ) : (
        schedules.map((schedule, index) => (
          <View key={index} style={styles.scheduleItem}>
            <Text>{schedule.namaMataPelajaran} - {schedule.hari} Jam {schedule.jamKe}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  scheduleItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
  }
});

export default StudentSchedule;

