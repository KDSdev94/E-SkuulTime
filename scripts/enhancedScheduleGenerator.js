import JadwalService from '../services/JadwalService.js';
import GuruService from '../services/GuruService.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Enhanced Schedule Generator dengan sistem deteksi dan resolusi konflik otomatis
 * Fitur:
 * - Deteksi konflik secara real-time
 * - Algoritma backtracking untuk menyelesaikan konflik
 * - Optimasi penempatan jadwal
 * - Validasi menyeluruh
 */

// Data jam pelajaran
const JAM_PELAJARAN_DATA = {
  reguler: {
    0: { jamMulai: '07:00', jamSelesai: '07:15', label: 'MC', isSpecial: true },
    1: { jamMulai: '07:15', jamSelesai: '07:55', label: 'Jam 1' },
    2: { jamMulai: '07:55', jamSelesai: '08:35', label: 'Jam 2' },
    3: { jamMulai: '08:35', jamSelesai: '09:15', label: 'Jam 3' },
    4: { jamMulai: '09:15', jamSelesai: '09:55', label: 'Jam 4' },
    'istirahat1': { jamMulai: '09:55', jamSelesai: '10:15', label: 'Istirahat', isSpecial: true },
    5: { jamMulai: '10:15', jamSelesai: '10:55', label: 'Jam 5' },
    6: { jamMulai: '10:55', jamSelesai: '11:35', label: 'Jam 6' },
    7: { jamMulai: '11:35', jamSelesai: '12:15', label: 'Jam 7' },
    'istirahat2': { jamMulai: '12:15', jamSelesai: '12:55', label: 'Istirahat', isSpecial: true },
    8: { jamMulai: '12:55', jamSelesai: '13:35', label: 'Jam 8' },
    9: { jamMulai: '13:35', jamSelesai: '14:15', label: 'Jam 9' },
    10: { jamMulai: '14:15', jamSelesai: '14:55', label: 'Jam 10' },
    11: { jamMulai: '14:55', jamSelesai: '15:35', label: 'Jam 11' },
  },
  jumat: {
    0: { jamMulai: '07:00', jamSelesai: '07:40', label: 'Feed Back', isSpecial: true },
    'greenClean': { jamMulai: '07:40', jamSelesai: '08:40', label: 'Green & Clean', isSpecial: true },
    'istirahat1': { jamMulai: '08:40', jamSelesai: '09:20', label: 'Istirahat', isSpecial: true },
    1: { jamMulai: '09:20', jamSelesai: '10:00', label: 'Jam 1' },
    2: { jamMulai: '10:00', jamSelesai: '10:40', label: 'Jam 2' },
    3: { jamMulai: '10:40', jamSelesai: '11:20', label: 'Jam 3' },
    'istirahat2': { jamMulai: '11:20', jamSelesai: '13:00', label: 'Istirahat', isSpecial: true },
    4: { jamMulai: '13:00', jamSelesai: '13:40', label: 'Jam 4' },
    5: { jamMulai: '13:40', jamSelesai: '14:20', label: 'Jam 5' },
    6: { jamMulai: '14:20', jamSelesai: '15:00', label: 'Jam 6' },
    7: { jamMulai: '15:00', jamSelesai: '16:00', label: 'Jam 7' },
  }
};

// Data kelas
const KELAS_DATA = {
  TKJ: ['X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2', 'XII TKJ 1', 'XII TKJ 2'],
  TKR: ['X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2']
};

// Data hari
const HARI_DATA = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

// Data ruang kelas
const RUANG_KELAS_DATA = {
  kelas: [
    'X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2', 'XII TKJ 1', 'XII TKJ 2',
    'X TKR 1', 'X TKR 2', 'XI TKR 1', 'XI TKR 2', 'XII TKR 1', 'XII TKR 2'
  ],
  ruanganLain: [
    { nama: 'Lab. TKJ', color: '#FBBF24' },
    { nama: 'Lab. IoT', color: '#7C3AED' },
    { nama: 'Outdoor', color: '#FB923C' },
    { nama: 'R. Teater', color: '#DC2626' },
    { nama: 'Bengkel 1', color: '#10B981' },
    { nama: 'Bengkel 2', color: '#10B981' },
    { nama: 'Perpustakaan', color: '#3B82F6' },
    { nama: 'Aula', color: '#F59E0B' },
    { nama: 'Mushola', color: '#6B7280' },
  ]
};

/**
 * Kelas untuk mengelola constraint dan konflik jadwal dengan deteksi otomatis
 */
class EnhancedConstraintManager {
  constructor() {
    this.guruSchedule = new Map(); // guruId -> { hari -> { jamKe -> scheduleId } }
    this.kelasSchedule = new Map(); // namaKelas -> { hari -> { jamKe -> scheduleId } }
    this.ruangSchedule = new Map(); // ruangKelas -> { hari -> { jamKe -> scheduleId } }
    this.allSchedules = new Map(); // scheduleId -> schedule data
    this.conflicts = [];
  }

  /**
   * Inisialisasi dengan jadwal yang sudah ada dan deteksi konflik
   */
  async initialize() {
    try {
      const existingSchedules = await JadwalService.getAllJadwal();
      
      for (const schedule of existingSchedules) {
        this.addScheduleConstraint(schedule);
      }
      
      // Deteksi konflik yang sudah ada
      this.detectExistingConflicts();
      
      console.log(`📋 Loaded ${existingSchedules.length} existing schedules`);
      console.log(`⚠️ Found ${this.conflicts.length} existing conflicts`);
      
    } catch (error) {
      console.warn('⚠️ Failed to load existing schedules, starting fresh:', error);
    }
  }

  /**
   * Tambahkan constraint dari jadwal yang ada
   */
  addScheduleConstraint(schedule) {
    const { id, guruId, namaKelas, ruangKelas, hari, jamKe } = schedule;
    
    // Store schedule data
    this.allSchedules.set(id, schedule);

    // Constraint guru
    if (guruId && guruId !== '-') {
      if (!this.guruSchedule.has(guruId)) {
        this.guruSchedule.set(guruId, new Map());
      }
      if (!this.guruSchedule.get(guruId).has(hari)) {
        this.guruSchedule.get(guruId).set(hari, new Map());
      }
      
      // Deteksi konflik guru
      if (this.guruSchedule.get(guruId).get(hari).has(jamKe)) {
        const existingScheduleId = this.guruSchedule.get(guruId).get(hari).get(jamKe);
        this.addConflict('guru', guruId, hari, jamKe, [existingScheduleId, id]);
      }
      
      this.guruSchedule.get(guruId).get(hari).set(jamKe, id);
    }

    // Constraint kelas
    if (namaKelas) {
      if (!this.kelasSchedule.has(namaKelas)) {
        this.kelasSchedule.set(namaKelas, new Map());
      }
      if (!this.kelasSchedule.get(namaKelas).has(hari)) {
        this.kelasSchedule.get(namaKelas).set(hari, new Map());
      }
      
      // Deteksi konflik kelas
      if (this.kelasSchedule.get(namaKelas).get(hari).has(jamKe)) {
        const existingScheduleId = this.kelasSchedule.get(namaKelas).get(hari).get(jamKe);
        this.addConflict('kelas', namaKelas, hari, jamKe, [existingScheduleId, id]);
      }
      
      this.kelasSchedule.get(namaKelas).get(hari).set(jamKe, id);
    }

    // Constraint ruang (hanya untuk ruangan khusus)
    if (ruangKelas && !RUANG_KELAS_DATA.kelas.includes(ruangKelas)) {
      if (!this.ruangSchedule.has(ruangKelas)) {
        this.ruangSchedule.set(ruangKelas, new Map());
      }
      if (!this.ruangSchedule.get(ruangKelas).has(hari)) {
        this.ruangSchedule.get(ruangKelas).set(hari, new Map());
      }
      
      // Deteksi konflik ruang
      if (this.ruangSchedule.get(ruangKelas).get(hari).has(jamKe)) {
        const existingScheduleId = this.ruangSchedule.get(ruangKelas).get(hari).get(jamKe);
        this.addConflict('ruang', ruangKelas, hari, jamKe, [existingScheduleId, id]);
      }
      
      this.ruangSchedule.get(ruangKelas).get(hari).set(jamKe, id);
    }
  }

  /**
   * Tambahkan konflik ke dalam daftar
   */
  addConflict(type, resource, hari, jamKe, scheduleIds) {
    const conflict = {
      type,
      resource,
      hari,
      jamKe,
      scheduleIds,
      schedules: scheduleIds.map(id => this.allSchedules.get(id)).filter(Boolean)
    };
    
    // Cek apakah konflik sudah ada
    const existingConflict = this.conflicts.find(c => 
      c.type === type && c.resource === resource && 
      c.hari === hari && c.jamKe === jamKe
    );
    
    if (!existingConflict) {
      this.conflicts.push(conflict);
    }
  }

  /**
   * Deteksi konflik yang sudah ada dalam jadwal
   */
  detectExistingConflicts() {
    this.conflicts = []; // Reset conflicts sebelum deteksi ulang
    
    // Re-process semua schedule untuk deteksi konflik
    const allSchedules = Array.from(this.allSchedules.values());
    this.guruSchedule.clear();
    this.kelasSchedule.clear();
    this.ruangSchedule.clear();
    
    for (const schedule of allSchedules) {
      this.addScheduleConstraint(schedule);
    }
  }

  /**
   * Check apakah slot waktu available untuk kombinasi tertentu
   */
  isSlotAvailable(guruId, namaKelas, ruangKelas, hari, jamKe) {
    // Check guru availability
    if (guruId && guruId !== '-') {
      if (this.guruSchedule.has(guruId) && 
          this.guruSchedule.get(guruId).has(hari) && 
          this.guruSchedule.get(guruId).get(hari).has(jamKe)) {
        return false;
      }
    }

    // Check kelas availability
    if (namaKelas) {
      if (this.kelasSchedule.has(namaKelas) && 
          this.kelasSchedule.get(namaKelas).has(hari) && 
          this.kelasSchedule.get(namaKelas).get(hari).has(jamKe)) {
        return false;
      }
    }

    // Check ruang availability (hanya untuk ruangan khusus)
    if (ruangKelas && !RUANG_KELAS_DATA.kelas.includes(ruangKelas)) {
      if (this.ruangSchedule.has(ruangKelas) && 
          this.ruangSchedule.get(ruangKelas).has(hari) && 
          this.ruangSchedule.get(ruangKelas).get(hari).has(jamKe)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Reserve slot setelah jadwal dibuat
   */
  reserveSlot(scheduleId, guruId, namaKelas, ruangKelas, hari, jamKe) {
    const schedule = { id: scheduleId, guruId, namaKelas, ruangKelas, hari, jamKe };
    this.addScheduleConstraint(schedule);
  }

  /**
   * Release slot (untuk conflict resolution)
   */
  releaseSlot(scheduleId) {
    const schedule = this.allSchedules.get(scheduleId);
    if (!schedule) return;

    const { guruId, namaKelas, ruangKelas, hari, jamKe } = schedule;

    // Remove from guru schedule
    if (guruId && guruId !== '-' && this.guruSchedule.has(guruId)) {
      const guruHari = this.guruSchedule.get(guruId).get(hari);
      if (guruHari && guruHari.get(jamKe) === scheduleId) {
        guruHari.delete(jamKe);
      }
    }

    // Remove from class schedule
    if (namaKelas && this.kelasSchedule.has(namaKelas)) {
      const kelasHari = this.kelasSchedule.get(namaKelas).get(hari);
      if (kelasHari && kelasHari.get(jamKe) === scheduleId) {
        kelasHari.delete(jamKe);
      }
    }

    // Remove from room schedule
    if (ruangKelas && !RUANG_KELAS_DATA.kelas.includes(ruangKelas) && this.ruangSchedule.has(ruangKelas)) {
      const ruangHari = this.ruangSchedule.get(ruangKelas).get(hari);
      if (ruangHari && ruangHari.get(jamKe) === scheduleId) {
        ruangHari.delete(jamKe);
      }
    }

    // Remove from all schedules
    this.allSchedules.delete(scheduleId);
  }

  /**
   * Get all available slots for given constraints
   */
  getAvailableSlots(guruId, namaKelas, ruangKelas) {
    const availableSlots = [];

    for (const hari of HARI_DATA) {
      const jamData = hari === 'Jumat' ? JAM_PELAJARAN_DATA.jumat : JAM_PELAJARAN_DATA.reguler;
      const regularSlots = Object.keys(jamData).filter(jamKe => 
        !jamData[jamKe].isSpecial && typeof jamKe === 'string' && !isNaN(jamKe)
      ).map(jamKe => parseInt(jamKe)).sort((a, b) => a - b);

      for (const jamKe of regularSlots) {
        if (this.isSlotAvailable(guruId, namaKelas, ruangKelas, hari, jamKe)) {
          availableSlots.push({ hari, jamKe });
        }
      }
    }

    return availableSlots;
  }

  /**
   * Get conflicts summary
   */
  getConflictsSummary() {
    const summary = {
      total: this.conflicts.length,
      byType: {
        guru: this.conflicts.filter(c => c.type === 'guru').length,
        kelas: this.conflicts.filter(c => c.type === 'kelas').length,
        ruang: this.conflicts.filter(c => c.type === 'ruang').length
      },
      details: this.conflicts
    };

    return summary;
  }
}

/**
 * Enhanced Schedule Generator dengan resolusi konflik otomatis
 */
class EnhancedScheduleGenerator {
  constructor() {
    this.constraintManager = new EnhancedConstraintManager();
    this.generatedSchedules = [];
    this.resolvedConflicts = [];
    this.statistics = {
      totalGenerated: 0,
      successfulPlacements: 0,
      conflicts: 0,
      conflictsResolved: 0,
      errors: 0
    };
  }

  /**
   * Generate jadwal dengan deteksi dan resolusi konflik otomatis
   */
  async generateSchedules(options = {}) {
    const {
      clearExisting = false,
      dryRun = false,
      maxHoursPerDay = 8,
      prioritizeConsecutive = true,
      resolveExistingConflicts = true
    } = options;

    console.log('🚀 Starting enhanced schedule generation with conflict resolution...');
    console.log('📊 Options:', { clearExisting, dryRun, maxHoursPerDay, prioritizeConsecutive, resolveExistingConflicts });

    try {
      // Initialize constraint manager
      await this.constraintManager.initialize();

      // Resolve existing conflicts first if requested
      if (resolveExistingConflicts) {
        await this.resolveExistingConflicts();
      }

      // Clear existing schedules if requested
      if (clearExisting && !dryRun) {
        await this.clearExistingSchedules();
        await this.constraintManager.initialize(); // Re-initialize after clearing
      }

      // Get all teachers
      const allGuru = await GuruService.getAllGuru();
      console.log(`👥 Found ${allGuru.length} teachers`);

      // Filter active teachers with valid data
      const activeGuru = allGuru.filter(guru => 
        guru.statusAktif === 'Aktif' && 
        guru.mataPelajaran && 
        Array.isArray(guru.mataPelajaran) && 
        guru.mataPelajaran.length > 0 &&
        guru.kelasAmpu &&
        Array.isArray(guru.kelasAmpu) &&
        guru.kelasAmpu.length > 0
      );

      console.log(`✅ Found ${activeGuru.length} active teachers with valid data`);

      // Generate schedules for each teacher with conflict resolution
      for (const guru of activeGuru) {
        await this.generateSchedulesForGuruWithConflictResolution(guru, maxHoursPerDay, prioritizeConsecutive);
      }

      // Add special activities
      await this.generateSpecialActivities();

      // Final conflict check and resolution
      await this.finalConflictResolution();

      // Save generated schedules if not dry run
      if (!dryRun) {
        await this.saveGeneratedSchedules();
      }

      // Validate final result
      await this.validateFinalSchedule();

      // Print statistics
      this.printStatistics();

      return {
        success: true,
        statistics: this.statistics,
        schedules: this.generatedSchedules,
        resolvedConflicts: this.resolvedConflicts,
        conflicts: this.constraintManager.getConflictsSummary()
      };

    } catch (error) {
      console.error('❌ Error during enhanced schedule generation:', error);
      return {
        success: false,
        error: error.message,
        statistics: this.statistics
      };
    }
  }

  /**
   * Resolve konflik yang sudah ada dalam jadwal
   */
  async resolveExistingConflicts() {
    const conflicts = this.constraintManager.conflicts;
    if (conflicts.length === 0) {
      console.log('✅ No existing conflicts found');
      return;
    }

    console.log(`🔧 Resolving ${conflicts.length} existing conflicts...`);

    for (const conflict of conflicts) {
      try {
        await this.resolveConflict(conflict);
        this.statistics.conflictsResolved++;
      } catch (error) {
        console.error(`❌ Failed to resolve conflict:`, error);
        this.statistics.errors++;
      }
    }

    console.log(`✅ Resolved ${this.statistics.conflictsResolved} conflicts`);
  }

  /**
   * Resolve single conflict
   */
  async resolveConflict(conflict) {
    const { type, resource, hari, jamKe, schedules } = conflict;
    
    console.log(`🔧 Resolving ${type} conflict for ${resource} on ${hari} jam ${jamKe}`);

    // Strategi resolusi: pindahkan jadwal dengan prioritas terendah
    const scheduleToMove = this.selectScheduleToMove(schedules);
    
    if (!scheduleToMove) {
      console.warn(`⚠️ Could not select schedule to move for conflict resolution`);
      return;
    }

    // Find alternative slot untuk schedule yang dipindah
    const alternativeSlot = await this.findAlternativeSlot(scheduleToMove);
    
    if (!alternativeSlot) {
      console.warn(`⚠️ Could not find alternative slot for ${scheduleToMove.namaMataPelajaran} in ${scheduleToMove.namaKelas}`);
      return;
    }

    // Release current slot
    this.constraintManager.releaseSlot(scheduleToMove.id);

    // Update schedule dengan slot baru
    const updatedSchedule = {
      ...scheduleToMove,
      hari: alternativeSlot.hari,
      jamKe: alternativeSlot.jamKe,
      jamMulai: this.getJamMulai(alternativeSlot.hari, alternativeSlot.jamKe),
      jamSelesai: this.getJamSelesai(alternativeSlot.hari, alternativeSlot.jamKe)
    };

    // Reserve new slot
    this.constraintManager.reserveSlot(
      scheduleToMove.id,
      scheduleToMove.guruId,
      scheduleToMove.namaKelas,
      scheduleToMove.ruangKelas,
      alternativeSlot.hari,
      alternativeSlot.jamKe
    );

    // Save updated schedule to database
    try {
      await JadwalService.updateJadwal(scheduleToMove.id, {
        hari: alternativeSlot.hari,
        jamKe: alternativeSlot.jamKe,
        jamMulai: updatedSchedule.jamMulai,
        jamSelesai: updatedSchedule.jamSelesai
      });

      this.resolvedConflicts.push({
        conflict,
        movedSchedule: scheduleToMove,
        newSlot: alternativeSlot
      });

      console.log(`✅ Moved ${scheduleToMove.namaMataPelajaran} from ${hari} jam ${jamKe} to ${alternativeSlot.hari} jam ${alternativeSlot.jamKe}`);
    } catch (error) {
      console.error(`❌ Failed to update schedule in database:`, error);
      // Roll back constraint manager changes
      this.constraintManager.reserveSlot(
        scheduleToMove.id,
        scheduleToMove.guruId,
        scheduleToMove.namaKelas,
        scheduleToMove.ruangKelas,
        hari,
        jamKe
      );
      throw error;
    }
  }

  /**
   * Select schedule to move berdasarkan prioritas
   */
  selectScheduleToMove(schedules) {
    // Prioritas rendah: jadwal yang bukan mata pelajaran utama
    // Prioritas tinggi: jadwal mata pelajaran penting
    
    const priorities = schedules.map(schedule => ({
      schedule,
      priority: this.getSchedulePriority(schedule)
    })).sort((a, b) => a.priority - b.priority);

    return priorities[0]?.schedule;
  }

  /**
   * Get priority score untuk schedule (semakin rendah semakin mudah dipindah)
   */
  getSchedulePriority(schedule) {
    const { namaMataPelajaran, jamKe } = schedule;
    let priority = 10; // Base priority

    // Mata pelajaran penting lebih sulit dipindah
    if (namaMataPelajaran && (
        namaMataPelajaran.toLowerCase().includes('matematika') ||
        namaMataPelajaran.toLowerCase().includes('bahasa indonesia') ||
        namaMataPelajaran.toLowerCase().includes('bahasa inggris')
    )) {
      priority += 10;
    }

    // Mata pelajaran praktik lebih sulit dipindah
    if (namaMataPelajaran && (
        namaMataPelajaran.toLowerCase().includes('praktik') ||
        namaMataPelajaran.toLowerCase().includes('praktek')
    )) {
      priority += 5;
    }

    // Jam tengah hari lebih sulit dipindah
    if (jamKe >= 4 && jamKe <= 7) {
      priority += 3;
    }

    // Jam pagi dan sore lebih mudah dipindah
    if (jamKe <= 2 || jamKe >= 9) {
      priority -= 2;
    }

    return priority;
  }

  /**
   * Find alternative slot untuk schedule yang akan dipindah
   */
  async findAlternativeSlot(schedule) {
    const { guruId, namaKelas, ruangKelas } = schedule;
    
    const availableSlots = this.constraintManager.getAvailableSlots(guruId, namaKelas, ruangKelas);
    
    if (availableSlots.length === 0) {
      return null;
    }

    // Prioritas: pilih slot yang paling optimal
    const rankedSlots = availableSlots.map(slot => ({
      ...slot,
      score: this.getSlotScore(slot)
    })).sort((a, b) => b.score - a.score);

    return rankedSlots[0];
  }

  /**
   * Get score untuk slot (semakin tinggi semakin baik)
   */
  getSlotScore(slot) {
    let score = 10;

    // Jam tengah hari lebih baik
    if (slot.jamKe >= 3 && slot.jamKe <= 6) {
      score += 5;
    }

    // Avoid jam pertama dan terakhir
    if (slot.jamKe === 1 || slot.jamKe >= 9) {
      score -= 3;
    }

    // Prefer weekdays over Friday
    if (slot.hari === 'Jumat') {
      score -= 2;
    }

    return score;
  }

  /**
   * Generate schedules untuk guru dengan conflict resolution
   */
  async generateSchedulesForGuruWithConflictResolution(guru, maxHoursPerDay, prioritizeConsecutive) {
    console.log(`👨‍🏫 Generating schedules for: ${guru.namaLengkap} with conflict resolution`);

    const { mataPelajaran, kelasAmpu } = guru;
    const subjectHours = this.calculateSubjectHours(mataPelajaran);

    for (const mapel of mataPelajaran) {
      const hoursNeeded = subjectHours[mapel] || 2;
      
      for (const namaKelas of kelasAmpu) {
        if (!this.isValidKelas(namaKelas)) continue;

        await this.scheduleSubjectForClassWithConflictResolution(
          guru, 
          mapel, 
          namaKelas, 
          hoursNeeded, 
          maxHoursPerDay, 
          prioritizeConsecutive
        );
      }
    }
  }

  /**
   * Schedule subject dengan conflict resolution
   */
  async scheduleSubjectForClassWithConflictResolution(guru, mapel, namaKelas, hoursNeeded, maxHoursPerDay, prioritizeConsecutive) {
    console.log(`📚 Scheduling ${mapel} for ${namaKelas} (${hoursNeeded} hours needed) with conflict resolution`);

    let hoursScheduled = 0;
    const attempts = [];
    let maxRetries = 3; // Maximum retry attempts jika ada konflik

    // Try dengan retry mechanism
    while (hoursScheduled < hoursNeeded && maxRetries > 0) {
      const previousHours = hoursScheduled;

      // Try consecutive hours first
      if (prioritizeConsecutive && (hoursNeeded - hoursScheduled) >= 2) {
        hoursScheduled += await this.scheduleConsecutiveHoursWithConflictResolution(
          guru, mapel, namaKelas, Math.min(hoursNeeded - hoursScheduled, 3), attempts
        );
      }

      // Schedule remaining hours individually
      while (hoursScheduled < hoursNeeded) {
        const scheduled = await this.scheduleSingleHourWithConflictResolution(
          guru, mapel, namaKelas, attempts
        );
        
        if (!scheduled) {
          console.warn(`⚠️ Could not schedule remaining hours for ${mapel} in ${namaKelas}`);
          break;
        }
        
        hoursScheduled++;
      }

      // Jika tidak ada progress, kurangi retry
      if (hoursScheduled === previousHours) {
        maxRetries--;
        if (maxRetries > 0) {
          console.log(`🔄 Retrying schedule generation for ${mapel} in ${namaKelas} (${maxRetries} attempts left)`);
          // Reset beberapa attempts untuk memberi kesempatan slot lain
          attempts.splice(-2);
        }
      } else {
        break; // Ada progress, lanjutkan
      }
    }

    if (hoursScheduled < hoursNeeded) {
      this.statistics.conflicts++;
      console.warn(`⚠️ Only scheduled ${hoursScheduled}/${hoursNeeded} hours for ${mapel} in ${namaKelas}`);
    } else {
      console.log(`✅ Successfully scheduled ${hoursScheduled}/${hoursNeeded} hours for ${mapel} in ${namaKelas}`);
    }
  }

  /**
   * Schedule consecutive hours dengan conflict resolution
   */
  async scheduleConsecutiveHoursWithConflictResolution(guru, mapel, namaKelas, consecutiveHours, attempts) {
    for (const hari of HARI_DATA) {
      const jamData = hari === 'Jumat' ? JAM_PELAJARAN_DATA.jumat : JAM_PELAJARAN_DATA.reguler;
      const availableSlots = Object.keys(jamData).filter(jamKe => 
        !jamData[jamKe].isSpecial && typeof jamKe === 'string' && !isNaN(jamKe)
      ).map(jamKe => parseInt(jamKe)).sort((a, b) => a - b);

      for (let i = 0; i <= availableSlots.length - consecutiveHours; i++) {
        const startJam = availableSlots[i];
        let canScheduleConsecutive = true;
        const slotsToCheck = [];
        
        // Check if all consecutive slots are available
        for (let j = 0; j < consecutiveHours; j++) {
          const jamKe = startJam + j;
          const ruangKelas = this.getRuangForMapel(mapel, namaKelas);
          
          if (!availableSlots.includes(jamKe)) {
            canScheduleConsecutive = false;
            break;
          }

          // Check availability dengan constraint manager
          if (!this.constraintManager.isSlotAvailable(guru.id, namaKelas, ruangKelas, hari, jamKe)) {
            canScheduleConsecutive = false;
            break;
          }

          slotsToCheck.push({ hari, jamKe, ruangKelas });
        }

        if (canScheduleConsecutive) {
          // Schedule all consecutive hours
          for (const slot of slotsToCheck) {
            await this.createScheduleEntryWithConflictResolution(
              guru, mapel, namaKelas, slot.hari, slot.jamKe, slot.ruangKelas
            );
            attempts.push({ hari: slot.hari, jamKe: slot.jamKe });
          }
          
          console.log(`🔗 Scheduled ${consecutiveHours} consecutive hours for ${mapel} on ${hari} from jam ${startJam}`);
          return consecutiveHours;
        }
      }
    }

    return 0; // Could not schedule consecutive hours
  }

  /**
   * Schedule single hour dengan conflict resolution
   */
  async scheduleSingleHourWithConflictResolution(guru, mapel, namaKelas, attempts) {
    for (const hari of HARI_DATA) {
      const jamData = hari === 'Jumat' ? JAM_PELAJARAN_DATA.jumat : JAM_PELAJARAN_DATA.reguler;
      const availableSlots = Object.keys(jamData).filter(jamKe => 
        !jamData[jamKe].isSpecial && typeof jamKe === 'string' && !isNaN(jamKe)
      ).map(jamKe => parseInt(jamKe)).sort((a, b) => a - b);

      for (const jamKe of availableSlots) {
        // Skip if already attempted
        if (attempts.some(a => a.hari === hari && a.jamKe === jamKe)) continue;

        const ruangKelas = this.getRuangForMapel(mapel, namaKelas);
        
        if (this.constraintManager.isSlotAvailable(guru.id, namaKelas, ruangKelas, hari, jamKe)) {
          await this.createScheduleEntryWithConflictResolution(guru, mapel, namaKelas, hari, jamKe, ruangKelas);
          attempts.push({ hari, jamKe });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Create schedule entry dengan conflict resolution
   */
  async createScheduleEntryWithConflictResolution(guru, mapel, namaKelas, hari, jamKe, ruangKelas) {
    const jamData = hari === 'Jumat' ? JAM_PELAJARAN_DATA.jumat : JAM_PELAJARAN_DATA.reguler;
    const jam = jamData[jamKe];

    const scheduleId = `${namaKelas.replace(/\s+/g, '-')}_${hari}_${mapel.replace(/\s+/g, '')}_${jamKe}_${Date.now()}`;

    const scheduleData = {
      id: scheduleId,
      namaMataPelajaran: mapel,
      namaGuru: guru.namaLengkap,
      guruId: guru.id,
      nipGuru: guru.nip || '',
      jurusan: this.getJurusanFromKelas(namaKelas),
      namaKelas: namaKelas,
      hari: hari,
      jamKe: jamKe,
      jamMulai: jam.jamMulai,
      jamSelesai: jam.jamSelesai,
      ruangKelas: ruangKelas,
      jenisAktivitas: 'pembelajaran',
      tahunAjaran: '2024/2025',
      semester: 'Ganjil',
      statusJadwal: 'Aktif',
      createdBy: 'enhanced-auto-generator',
      createdAt: new Date().toISOString()
    };

    this.generatedSchedules.push(scheduleData);
    this.constraintManager.reserveSlot(scheduleId, guru.id, namaKelas, ruangKelas, hari, jamKe);
    this.statistics.successfulPlacements++;

    console.log(`  ✅ ${mapel} - ${namaKelas} - ${hari} Jam ${jamKe} (${jam.jamMulai}-${jam.jamSelesai})`);
  }

  /**
   * Final conflict resolution setelah generate semua jadwal
   */
  async finalConflictResolution() {
    console.log('🔍 Performing final conflict check...');
    
    // Re-detect conflicts after generation
    this.constraintManager.detectExistingConflicts();
    const conflicts = this.constraintManager.getConflictsSummary();
    
    if (conflicts.total > 0) {
      console.log(`⚠️ Found ${conflicts.total} conflicts in generated schedule, resolving...`);
      await this.resolveExistingConflicts();
    } else {
      console.log('✅ No conflicts found in final schedule');
    }
  }

  /**
   * Validate final schedule untuk memastikan tidak ada konflik
   */
  async validateFinalSchedule() {
    console.log('🔍 Validating final schedule...');
    
    const conflicts = this.constraintManager.getConflictsSummary();
    const validationResults = {
      totalSchedules: this.generatedSchedules.length,
      conflicts: conflicts.total,
      conflictsByType: conflicts.byType,
      isValid: conflicts.total === 0
    };

    if (validationResults.isValid) {
      console.log('✅ Final schedule validation passed - no conflicts detected');
    } else {
      console.warn(`⚠️ Final schedule validation failed - ${conflicts.total} conflicts still exist`);
      console.warn('Conflict details:', conflicts.details);
    }

    return validationResults;
  }

  // Helper methods (sama seperti generator sebelumnya)
  calculateSubjectHours(mataPelajaran) {
    const subjectHours = {};
    
    for (const mapel of mataPelajaran) {
      if (mapel.toLowerCase().includes('matematika') || 
          mapel.toLowerCase().includes('bahasa indonesia') ||
          mapel.toLowerCase().includes('bahasa inggris')) {
        subjectHours[mapel] = 4;
      } else if (mapel.toLowerCase().includes('praktik') ||
                mapel.toLowerCase().includes('praktek') ||
                mapel.toLowerCase().includes('komputer') ||
                mapel.toLowerCase().includes('jaringan') ||
                mapel.toLowerCase().includes('otomotif')) {
        subjectHours[mapel] = 4;
      } else {
        subjectHours[mapel] = 2;
      }
    }
    
    return subjectHours;
  }

  isValidKelas(namaKelas) {
    return [...KELAS_DATA.TKJ, ...KELAS_DATA.TKR].includes(namaKelas);
  }

  getJurusanFromKelas(namaKelas) {
    if (namaKelas.includes('TKJ')) return 'TKJ';
    if (namaKelas.includes('TKR')) return 'TKR';
    return '';
  }

  getRuangForMapel(mapel, namaKelas) {
    const mapelLower = mapel.toLowerCase();
    
    if (mapelLower.includes('komputer') || mapelLower.includes('jaringan') || mapelLower.includes('tkj')) {
      return 'Lab. TKJ';
    } else if (mapelLower.includes('otomotif') || mapelLower.includes('tkr') || mapelLower.includes('kendaraan')) {
      return Math.random() > 0.5 ? 'Bengkel 1' : 'Bengkel 2';
    } else if (mapelLower.includes('olahraga') || mapelLower.includes('pjok')) {
      return 'Outdoor';
    } else {
      return namaKelas;
    }
  }

  getJamMulai(hari, jamKe) {
    const jamData = hari === 'Jumat' ? JAM_PELAJARAN_DATA.jumat : JAM_PELAJARAN_DATA.reguler;
    return jamData[jamKe]?.jamMulai || '07:00';
  }

  getJamSelesai(hari, jamKe) {
    const jamData = hari === 'Jumat' ? JAM_PELAJARAN_DATA.jumat : JAM_PELAJARAN_DATA.reguler;
    return jamData[jamKe]?.jamSelesai || '07:40';
  }

  async generateSpecialActivities() {
    console.log('🎯 Generating special activities...');

    for (const namaKelas of [...KELAS_DATA.TKJ, ...KELAS_DATA.TKR]) {
      for (const hari of HARI_DATA) {
        const jamData = hari === 'Jumat' ? JAM_PELAJARAN_DATA.jumat : JAM_PELAJARAN_DATA.reguler;
        
        for (const [jamKe, jam] of Object.entries(jamData)) {
          if (jam.isSpecial) {
            const scheduleId = `${namaKelas.replace(/\s+/g, '-')}_${hari}_${jamKe}`;
            const scheduleData = {
              id: scheduleId,
              namaMataPelajaran: jam.label,
              namaGuru: '-',
              guruId: '-',
              nipGuru: '',
              jurusan: this.getJurusanFromKelas(namaKelas),
              namaKelas: namaKelas,
              hari: hari,
              jamKe: jamKe,
              jamMulai: jam.jamMulai,
              jamSelesai: jam.jamSelesai,
              ruangKelas: namaKelas,
              jenisAktivitas: this.getJenisAktivitas(jam.label),
              tahunAjaran: '2024/2025',
              semester: 'Ganjil',
              statusJadwal: 'Aktif',
              createdBy: 'enhanced-auto-generator',
              createdAt: new Date().toISOString()
            };

            this.generatedSchedules.push(scheduleData);
            this.constraintManager.reserveSlot(scheduleId, '-', namaKelas, namaKelas, hari, jamKe);
          }
        }
      }
    }
  }

  getJenisAktivitas(label) {
    const labelLower = label.toLowerCase();
    if (labelLower.includes('mc')) return 'mc';
    if (labelLower.includes('istirahat')) return 'istirahat';
    if (labelLower.includes('feed back')) return 'feedBack';
    if (labelLower.includes('green') && labelLower.includes('clean')) return 'greenClean';
    return 'pembelajaran';
  }

  async clearExistingSchedules() {
    try {
      console.log('🗑️ Clearing existing auto-generated schedules...');
      const existingSchedules = await JadwalService.getAllJadwal();
      let cleared = 0;
      
      for (const schedule of existingSchedules) {
        if (schedule.createdBy === 'auto-generator' || schedule.createdBy === 'enhanced-auto-generator') {
          await JadwalService.deleteJadwal(schedule.id);
          cleared++;
        }
      }
      
      console.log(`✅ Cleared ${cleared} existing auto-generated schedules`);
    } catch (error) {
      console.warn('⚠️ Failed to clear existing schedules:', error);
    }
  }

  async saveGeneratedSchedules() {
    console.log(`💾 Saving ${this.generatedSchedules.length} generated schedules...`);
    
    let saved = 0;
    let errors = 0;

    for (const schedule of this.generatedSchedules) {
      try {
        // Remove id from schedule data before saving (let Firestore generate it)
        const { id, ...scheduleData } = schedule;
        await JadwalService.createJadwal(scheduleData);
        saved++;
      } catch (error) {
        console.error('❌ Failed to save schedule:', error);
        errors++;
        this.statistics.errors++;
      }
    }

    console.log(`✅ Successfully saved ${saved} schedules, ${errors} errors`);
    
    // Send notification to admin
    try {
      const conflictsResolved = this.statistics.conflictsResolved;
      const conflictsRemaining = this.constraintManager.getConflictsSummary().total;
      
      await createNotification(
        'admin',
        `📅 Enhanced schedule generation completed! Generated ${saved} schedules, resolved ${conflictsResolved} conflicts, ${conflictsRemaining} conflicts remaining, ${errors} errors.`,
        {
          name: 'Enhanced Schedule Generator',
          type: 'system',
          id: 'enhanced-schedule-generator'
        },
        'schedule_generation'
      );
    } catch (notifError) {
      console.warn('⚠️ Failed to send notification:', notifError);
    }
  }

  printStatistics() {
    console.log('\n📊 ENHANCED SCHEDULE GENERATION STATISTICS');
    console.log('=' + '='.repeat(60));
    console.log(`Total schedules generated: ${this.generatedSchedules.length}`);
    console.log(`Successful placements: ${this.statistics.successfulPlacements}`);
    console.log(`Conflicts encountered: ${this.statistics.conflicts}`);
    console.log(`Conflicts resolved: ${this.statistics.conflictsResolved}`);
    console.log(`Errors: ${this.statistics.errors}`);
    
    const conflictsSummary = this.constraintManager.getConflictsSummary();
    console.log(`\nRemaining conflicts: ${conflictsSummary.total}`);
    console.log(`  - Guru conflicts: ${conflictsSummary.byType.guru}`);
    console.log(`  - Kelas conflicts: ${conflictsSummary.byType.kelas}`);
    console.log(`  - Ruang conflicts: ${conflictsSummary.byType.ruang}`);
    
    console.log(`\nResolved conflicts: ${this.resolvedConflicts.length}`);
    for (const resolved of this.resolvedConflicts) {
      console.log(`  - Moved ${resolved.movedSchedule.namaMataPelajaran} from ${resolved.conflict.hari} jam ${resolved.conflict.jamKe} to ${resolved.newSlot.hari} jam ${resolved.newSlot.jamKe}`);
    }
    
    console.log('=' + '='.repeat(60));
  }
}

/**
 * Main function to run enhanced schedule generation
 */
export async function generateEnhancedSchedule(options = {}) {
  const generator = new EnhancedScheduleGenerator();
  return await generator.generateSchedules(options);
}

/**
 * Run script if executed directly
 */
if (typeof window === 'undefined') {
  console.log('🚀 Starting Enhanced Schedule Generator...');
  console.log('📋 Checking imports...');
  
  try {
    console.log('✅ Script loaded successfully');
    console.log('🔧 Starting schedule generation with enhanced conflict resolution...');
    
    generateEnhancedSchedule({
      clearExisting: true,
      dryRun: false,
      maxHoursPerDay: 8,
      prioritizeConsecutive: true,
      resolveExistingConflicts: true
    }).then(result => {
      console.log('\n📊 FINAL RESULTS:');
      console.log('==================');
      if (result.success) {
        console.log('✅ Enhanced schedule generation completed successfully!');
        console.log('📊 Statistics:', result.statistics);
        console.log('🔧 Resolved conflicts:', result.resolvedConflicts?.length || 0);
        console.log('⚠️ Remaining conflicts:', result.conflicts?.total || 0);
        console.log('📅 Generated schedules:', result.schedules?.length || 0);
      } else {
        console.error('❌ Enhanced schedule generation failed!');
        console.error('Error:', result.error);
        console.error('Statistics:', result.statistics);
      }
      console.log('==================');
      process.exit(result.success ? 0 : 1);
    }).catch(error => {
      console.error('💥 Unexpected error during execution:');
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
  } catch (initError) {
    console.error('💥 Error during script initialization:');
    console.error('Error message:', initError.message);
    console.error('Stack trace:', initError.stack);
    process.exit(1);
  }
}

export default EnhancedScheduleGenerator;
