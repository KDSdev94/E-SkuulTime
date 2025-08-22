import JadwalService from '../services/JadwalService.js';
import MuridService from '../services/MuridService.js';
import GuruService from '../services/GuruService.js';

/**
 * Menampilkan jadwal pelajaran untuk semua murid
 */
async function tampilkanJadwalUntukSemuaMurid() {
  try {
    console.log('\n📚 JADWAL PELAJARAN SEMUA MURID');
    console.log('=====================================\n');
    
    const semuaMurid = await MuridService.getAllMurid();
    console.log(`📊 Total murid: ${semuaMurid.length}\n`);
    
    for (const murid of semuaMurid) {
      try {
        // Get all schedules for this class (including draft/unpublished)
        const allJadwal = await JadwalService.getAllJadwal();
        const jadwalMurid = allJadwal.filter(jadwal => 
          jadwal.kelasId === murid.kelas || jadwal.namaKelas === murid.kelas
        );
        console.log(`👤 Murid: ${murid.namaLengkap}`);
        console.log(`🏫 Kelas: ${murid.kelas}`);
        console.log(`📋 Jumlah jadwal: ${jadwalMurid.length}`);
        
        if (jadwalMurid.length > 0) {
          console.log('📅 Jadwal Pelajaran:');
          jadwalMurid.forEach((jadwal, idx) => {
            console.log(`   ${idx + 1}. ${jadwal.hari} - Jam ke-${jadwal.jamKe} (${jadwal.jamMulai}-${jadwal.jamSelesai})`);
            console.log(`      📖 Mata Pelajaran: ${jadwal.namaMataPelajaran}`);
            console.log(`      👨‍🏫 Guru: ${jadwal.namaGuru || 'Belum ditentukan'}`);
            console.log(`      🏢 Ruang: ${jadwal.ruangKelas || 'Belum ditentukan'}`);
            console.log('');
          });
        } else {
          console.log('   ⚠️ Belum ada jadwal tersedia');
        }
        
        console.log('─────────────────────────────────────\n');
      } catch (error) {
        console.error(`❌ Gagal mendapatkan jadwal untuk murid ${murid.namaLengkap}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Gagal mendapatkan data murid:', error.message);
  }
}

/**
 * Menampilkan jadwal mengajar untuk semua guru
 */
async function tampilkanJadwalUntukSemuaGuru() {
  try {
    console.log('\n👨‍🏫 JADWAL MENGAJAR SEMUA GURU');
    console.log('===================================\n');
    
    const semuaGuru = await GuruService.getAllGuru();
    console.log(`📊 Total guru: ${semuaGuru.length}\n`);
    
    for (const guru of semuaGuru) {
      try {
        // Get all schedules for this teacher (including draft/unpublished)
        const allJadwal = await JadwalService.getAllJadwal();
        const jadwalGuru = allJadwal.filter(jadwal => {
          const matchByGuruId = jadwal.guruId !== '-' && jadwal.guruId === guru.id;
          const matchByNamaGuru = jadwal.namaGuru !== '-' && jadwal.namaGuru === guru.id;
          const matchByNipGuru = jadwal.nipGuru !== undefined && jadwal.nipGuru === guru.id;
          return matchByGuruId || matchByNamaGuru || matchByNipGuru;
        });
        console.log(`👤 Guru: ${guru.namaLengkap}`);
        console.log(`🆔 NIP: ${guru.nip || 'Belum ada NIP'}`);
        console.log(`📋 Jumlah jadwal mengajar: ${jadwalGuru.length}`);
        
        if (jadwalGuru.length > 0) {
          console.log('📅 Jadwal Mengajar:');
          jadwalGuru.forEach((jadwal, idx) => {
            console.log(`   ${idx + 1}. ${jadwal.hari} - Jam ke-${jadwal.jamKe} (${jadwal.jamMulai}-${jadwal.jamSelesai})`);
            console.log(`      📖 Mata Pelajaran: ${jadwal.namaMataPelajaran}`);
            console.log(`      🏫 Kelas: ${jadwal.namaKelas}`);
            console.log(`      🏢 Ruang: ${jadwal.ruangKelas || 'Belum ditentukan'}`);
            console.log('');
          });
        } else {
          console.log('   ⚠️ Belum ada jadwal mengajar');
        }
        
        console.log('─────────────────────────────────────\n');
      } catch (error) {
        console.error(`❌ Gagal mendapatkan jadwal untuk guru ${guru.namaLengkap}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Gagal mendapatkan data guru:', error.message);
  }
}

/**
 * Menampilkan ringkasan statistik jadwal
 */
async function tampilkanRingkasanJadwal() {
  try {
    console.log('\n📊 RINGKASAN STATISTIK JADWAL');
    console.log('===============================\n');
    
    const semuaJadwal = await JadwalService.getAllJadwal();
    const semuaMurid = await MuridService.getAllMurid();
    const semuaGuru = await GuruService.getAllGuru();
    
    console.log(`📚 Total jadwal: ${semuaJadwal.length}`);
    console.log(`👥 Total murid: ${semuaMurid.length}`);
    console.log(`👨‍🏫 Total guru: ${semuaGuru.length}`);
    
    // Hitung berdasarkan hari
    const jadwalPerHari = {};
    semuaJadwal.forEach(jadwal => {
      jadwalPerHari[jadwal.hari] = (jadwalPerHari[jadwal.hari] || 0) + 1;
    });
    
    console.log('\n📅 Jadwal per hari:');
    Object.entries(jadwalPerHari).forEach(([hari, jumlah]) => {
      console.log(`   ${hari}: ${jumlah} jadwal`);
    });
    
    // Hitung berdasarkan kelas
    const jadwalPerKelas = {};
    semuaJadwal.forEach(jadwal => {
      jadwalPerKelas[jadwal.namaKelas] = (jadwalPerKelas[jadwal.namaKelas] || 0) + 1;
    });
    
    console.log('\n🏫 Jadwal per kelas:');
    Object.entries(jadwalPerKelas).forEach(([kelas, jumlah]) => {
      console.log(`   ${kelas}: ${jumlah} jadwal`);
    });
    
    console.log('\n');
  } catch (error) {
    console.error('❌ Gagal mendapatkan ringkasan jadwal:', error.message);
  }
}

/**
 * Fungsi utama untuk menjalankan semua penampilan jadwal
 */
async function main() {
  console.log('🚀 Memulai penampilan jadwal pelajaran...');
  console.log('==========================================');
  
  try {
    // Tampilkan ringkasan terlebih dahulu
    await tampilkanRingkasanJadwal();
    
    // Tampilkan jadwal semua murid
    await tampilkanJadwalUntukSemuaMurid();
    
    // Tampilkan jadwal semua guru
    await tampilkanJadwalUntukSemuaGuru();
    
    console.log('✅ Selesai menampilkan semua jadwal!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat menjalankan script:', error.message);
  }
}

// Menjalankan fungsi utama
main();

