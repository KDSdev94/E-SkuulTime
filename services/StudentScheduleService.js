import JadwalService from './JadwalService';
import MuridService from './MuridService';

/**
 * Service untuk mengelola jadwal murid yang sudah dipublikasikan
 */
class StudentScheduleService {
  
  /**
   * Mengambil jadwal yang sudah dipublikasikan berdasarkan kelas
   * @param {string} className - Nama kelas (contoh: "X TKJ 1")
   * @returns {Promise<Array>} - Array jadwal yang sudah dipublikasikan
   */
  async getPublishedSchedulesByClass(className) {
    try {
      console.log(`📚 Mengambil jadwal terpublikasi untuk kelas: ${className}`);
      
      const jadwalService = new JadwalService();
      const allSchedules = await jadwalService.getAllJadwal();
      
      // Filter jadwal yang sudah dipublikasikan dan sesuai kelas
      const publishedSchedules = allSchedules.filter(schedule => {
        const isPublished = schedule.isPublished === true;
        const isApproved = schedule.approvalStatus === 'approved';
        const matchClass = schedule.namaKelas === className;
        
        return isPublished && isApproved && matchClass;
      });
      
      console.log(`✅ Ditemukan ${publishedSchedules.length} jadwal terpublikasi untuk kelas ${className}`);
      
      // Sort jadwal berdasarkan hari dan jam
      const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      publishedSchedules.sort((a, b) => {
        const dayA = dayOrder.indexOf(a.hari);
        const dayB = dayOrder.indexOf(b.hari);
        
        if (dayA !== dayB) {
          return dayA - dayB;
        }
        
        return (a.jamKe || 0) - (b.jamKe || 0);
      });
      
      return publishedSchedules;
    } catch (error) {
      console.error('❌ Error mengambil jadwal terpublikasi:', error);
      throw error;
    }
  }

  /**
   * Mengambil jadwal murid berdasarkan ID murid
   * @param {string} muridId - ID murid
   * @returns {Promise<Array>} - Array jadwal murid
   */
  async getSchedulesByStudentId(muridId) {
    try {
      console.log(`👨‍🎓 Mengambil jadwal untuk murid ID: ${muridId}`);
      
      // Ambil data murid untuk mendapatkan kelas
      const muridData = await MuridService.getMuridById(muridId);
      if (!muridData) {
        console.warn(`⚠️ Data murid dengan ID ${muridId} tidak ditemukan`);
        return [];
      }
      
      const className = muridData.kelas || muridData.namaKelas;
      if (!className) {
        console.warn(`⚠️ Kelas murid ${muridData.namaLengkap} tidak ditemukan`);
        return [];
      }
      
      console.log(`🎯 Murid ${muridData.namaLengkap} berada di kelas: ${className}`);
      
      // Ambil jadwal berdasarkan kelas
      const schedules = await this.getPublishedSchedulesByClass(className);
      
      return schedules;
    } catch (error) {
      console.error('❌ Error mengambil jadwal murid:', error);
      throw error;
    }
  }

  /**
   * Mengambil jadwal hari ini untuk kelas tertentu
   * @param {string} className - Nama kelas
   * @returns {Promise<Array>} - Array jadwal hari ini
   */
  async getTodayScheduleForClass(className) {
    try {
      const today = new Date();
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const todayName = dayNames[today.getDay()];
      
      console.log(`📅 Mengambil jadwal hari ini (${todayName}) untuk kelas: ${className}`);
      
      const allSchedules = await this.getPublishedSchedulesByClass(className);
      const todaySchedules = allSchedules.filter(schedule => schedule.hari === todayName);
      
      console.log(`✅ Ditemukan ${todaySchedules.length} jadwal untuk hari ini`);
      
      return todaySchedules;
    } catch (error) {
      console.error('❌ Error mengambil jadwal hari ini:', error);
      throw error;
    }
  }

  /**
   * Mengambil jadwal minggu ini untuk kelas tertentu
   * @param {string} className - Nama kelas
   * @returns {Promise<Object>} - Object jadwal per hari dalam minggu
   */
  async getWeekScheduleForClass(className) {
    try {
      console.log(`📅 Mengambil jadwal minggu ini untuk kelas: ${className}`);
      
      const allSchedules = await this.getPublishedSchedulesByClass(className);
      
      // Kelompokkan jadwal berdasarkan hari
      const weekSchedule = {
        'Senin': [],
        'Selasa': [],
        'Rabu': [],
        'Kamis': [],
        'Jumat': []
      };
      
      allSchedules.forEach(schedule => {
        if (weekSchedule[schedule.hari]) {
          weekSchedule[schedule.hari].push(schedule);
        }
      });
      
      // Sort setiap hari berdasarkan jam
      Object.keys(weekSchedule).forEach(day => {
        weekSchedule[day].sort((a, b) => (a.jamKe || 0) - (b.jamKe || 0));
      });
      
      console.log('✅ Jadwal minggu berhasil dikelompokkan');
      
      return weekSchedule;
    } catch (error) {
      console.error('❌ Error mengambil jadwal minggu:', error);
      throw error;
    }
  }

  /**
   * Mengambil statistik jadwal untuk kelas
   * @param {string} className - Nama kelas
   * @returns {Promise<Object>} - Statistik jadwal
   */
  async getScheduleStats(className) {
    try {
      const schedules = await this.getPublishedSchedulesByClass(className);
      
      // Hitung mata pelajaran unik
      const uniqueSubjects = [...new Set(schedules.map(s => s.namaMataPelajaran))];
      
      // Hitung guru unik
      const uniqueTeachers = [...new Set(schedules.map(s => s.namaGuru).filter(g => g && g !== '-'))];
      
      // Hitung total jam per hari
      const hoursPerDay = {};
      schedules.forEach(schedule => {
        if (!hoursPerDay[schedule.hari]) {
          hoursPerDay[schedule.hari] = 0;
        }
        hoursPerDay[schedule.hari]++;
      });
      
      const stats = {
        totalSchedules: schedules.length,
        totalSubjects: uniqueSubjects.length,
        totalTeachers: uniqueTeachers.length,
        subjects: uniqueSubjects,
        teachers: uniqueTeachers,
        hoursPerDay,
        averageHoursPerDay: schedules.length / 5 // 5 hari kerja
      };
      
      console.log(`📊 Statistik jadwal kelas ${className}:`, stats);
      
      return stats;
    } catch (error) {
      console.error('❌ Error mengambil statistik jadwal:', error);
      throw error;
    }
  }

  /**
   * Cari jadwal berdasarkan mata pelajaran untuk kelas tertentu
   * @param {string} className - Nama kelas
   * @param {string} subject - Nama mata pelajaran
   * @returns {Promise<Array>} - Array jadwal mata pelajaran
   */
  async getSchedulesBySubject(className, subject) {
    try {
      console.log(`🔍 Mencari jadwal mata pelajaran "${subject}" untuk kelas ${className}`);
      
      const allSchedules = await this.getPublishedSchedulesByClass(className);
      const subjectSchedules = allSchedules.filter(schedule => 
        schedule.namaMataPelajaran === subject
      );
      
      console.log(`✅ Ditemukan ${subjectSchedules.length} jadwal untuk mata pelajaran ${subject}`);
      
      return subjectSchedules;
    } catch (error) {
      console.error('❌ Error mencari jadwal mata pelajaran:', error);
      throw error;
    }
  }
}

export default StudentScheduleService;
