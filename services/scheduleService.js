import api from './api';

const scheduleService = {
  async getSchedules() {
    try {
      const response = await api.get('/jadwal');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getSchedulesByClass(className) {
    try {
      const response = await api.get(`/jadwal/kelas/${className}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getSchedulesByTeacher(teacherId) {
    try {
      const response = await api.get(`/jadwal/guru/${teacherId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getSchedulesByDay(day) {
    try {
      const response = await api.get(`/jadwal/hari/${day}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getSchedulesByWeek(weekStart, weekEnd) {
    try {
      const response = await api.get(`/jadwal/minggu`, {
        params: { start: weekStart, end: weekEnd }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getTodayScheduleForClass(className) {
    try {
      const today = new Date();
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const todayName = dayNames[today.getDay()];
      
      const response = await api.get(`/jadwal/kelas/${className}/hari/${todayName}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getTodayScheduleForTeacher(teacherId) {
    try {
      const today = new Date();
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const todayName = dayNames[today.getDay()];
      
      const response = await api.get(`/jadwal/guru/${teacherId}/hari/${todayName}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async createSchedule(scheduleData) {
    try {
      const response = await api.post('/jadwal', scheduleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateSchedule(scheduleId, scheduleData) {
    try {
      const response = await api.put(`/jadwal/${scheduleId}`, scheduleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteSchedule(scheduleId) {
    try {
      const response = await api.delete(`/jadwal/${scheduleId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getAvailableRooms() {
    try {
      const response = await api.get('/jadwal/ruang');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async checkScheduleConflicts(scheduleData) {
    try {
      const response = await api.post('/jadwal/check-conflict', scheduleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

};

export default scheduleService;

