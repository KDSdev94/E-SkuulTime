import { db } from '../config/firebase.js';
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

/**
 * EMERGENCY SCRIPT: Publikasi semua jadwal draft yang ada
 * ⚠️  HANYA GUNAKAN JIKA ANDA YAKIN SEMUA JADWAL SUDAH BENAR!
 * 
 * Script ini akan:
 * 1. Mengubah semua jadwal draft menjadi published
 * 2. Set approvalStatus menjadi approved
 * 3. Set isPublished menjadi true
 */
async function publishAllDraftSchedules() {
  try {
    console.log('🚨 EMERGENCY SCRIPT: Publikasi semua jadwal draft...');
    console.log('⚠️  PERINGATAN: Ini akan mempublikasi SEMUA jadwal draft!');
    
    // Ambil semua jadwal dari database
    const jadwalCollection = collection(db, 'jadwal');
    const querySnapshot = await getDocs(jadwalCollection);
    
    let publishedCount = 0;
    let skippedCount = 0;
    
    console.log(`📊 Total jadwal ditemukan: ${querySnapshot.size}`);
    
    for (const docSnap of querySnapshot.docs) {
      const jadwalData = docSnap.data();
      const jadwalId = docSnap.id;
      
      // Cek jika masih draft
      if (jadwalData.status === 'draft' || 
          jadwalData.status === 'Draft' || 
          jadwalData.approvalStatus === 'pending' ||
          jadwalData.isPublished !== true) {
        
        console.log(`📋 Publishing: ${jadwalData.namaKelas} - ${jadwalData.namaMataPelajaran} (${jadwalData.hari} jam ${jadwalData.jamKe})`);
        const jadwalRef = doc(db, 'jadwal', jadwalId);
        await updateDoc(jadwalRef, {
          status: 'published',
          approvalStatus: 'approved',
          isPublished: true,
          approvedAt: Timestamp.now(),
          approvedBy: 'Emergency System Fix',
          publishedAt: Timestamp.now(),
          publishedBy: 'Emergency System Fix',
          updatedAt: Timestamp.now()
        });
        
        publishedCount++;
        
      } else {
        console.log(`✅ Skipping already published: ${jadwalData.namaKelas} - ${jadwalData.namaMataPelajaran}`);
        skippedCount++;
      }
    }
    
    console.log('\n📊 EMERGENCY FIX SUMMARY:');
    console.log(`=====================================`);
    console.log(`📢 Jadwal yang dipublikasi: ${publishedCount}`);
    console.log(`✅ Jadwal yang dilewati: ${skippedCount}`);
    console.log(`📊 Total jadwal: ${querySnapshot.size}`);
    console.log(`=====================================`);
    
    if (publishedCount > 0) {
      console.log(`\n🎉 BERHASIL! ${publishedCount} jadwal telah dipublikasi!`);
      console.log(`🔥 SEMUA jadwal sekarang sudah published dan dapat dilihat oleh guru dan murid.`);
      console.log(`⚠️  Pastikan untuk mengecek kembali semua jadwal di aplikasi.`);
    } else {
      console.log(`\n✅ Tidak ada jadwal yang perlu dipublikasi.`);
    }
    
  } catch (error) {
    console.error('❌ Error saat melakukan emergency fix:', error);
    throw error;
  }
}

// Fungsi untuk konfirmasi sebelum menjalankan
async function confirmAndRun() {
  console.log('\n🚨 PERINGATAN PENTING:');
  console.log('Script ini akan mempublikasi SEMUA jadwal draft yang ada.');
  console.log('Pastikan semua jadwal sudah benar sebelum menjalankan!');
  console.log('\nUntuk melanjutkan, jalankan: node scripts/publishAllDraftSchedules.js --confirm');
  
  // Cek apakah ada flag --confirm
  if (process.argv.includes('--confirm')) {
    console.log('\n✅ Konfirmasi diterima. Menjalankan emergency fix...');
    await publishAllDraftSchedules();
  } else {
    console.log('\n❌ Script dibatalkan. Tambahkan --confirm untuk melanjutkan.');
    process.exit(0);
  }
}

// Jalankan script jika dipanggil langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  confirmAndRun()
    .then(() => {
      console.log('\n✅ Emergency script selesai dijalankan!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Emergency script gagal:', error);
      process.exit(1);
    });
}

export default publishAllDraftSchedules;
