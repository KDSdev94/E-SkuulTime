#!/usr/bin/env node

/**
 * Script untuk menjalankan notifikasi publikasi jadwal ke semua murid
 * Menggunakan admin dengan document ID 001
 */

import { notifyAllStudentsSchedulePublished, notifyStudentsByClass } from './sendSchedulePublishNotification.js';
import { db } from '../config/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

// Fungsi utama untuk menjalankan script
async function main() {
  try {
    console.log('🚀 MEMULAI SCRIPT NOTIFIKASI PUBLIKASI JADWAL');
    console.log('==============================================');
    
    // Ambil argumen dari command line
    const args = process.argv.slice(2);
    const adminId = args[0] || '001';  // Admin ID sebagai parameter pertama
    const targetClass = args[1]; // Opsional: jika ingin kirim ke kelas tertentu
    
    console.log(`🔍 Mengambil data admin dari database (ID: ${adminId})...`);
    
    // Ambil data admin dari Firestore
    const adminDocRef = doc(db, 'admin', adminId);
    const adminDoc = await getDoc(adminDocRef);
    
    if (!adminDoc.exists()) {
      console.error(`❌ Admin dengan ID ${adminId} tidak ditemukan di database!`);
      console.log('💡 Pastikan admin dengan ID tersebut sudah ada di collection "admin"');
      process.exit(1);
    }
    
    const adminData = adminDoc.data();
    const adminName = adminData.namaLengkap || 'Admin';
    
    console.log(`👤 Admin: ${adminName} (ID: ${adminId})`);
    console.log(`📧 Email: ${adminData.email || 'N/A'}`);
    if (adminData.jabatan) {
      console.log(`👔 Jabatan: ${adminData.jabatan}`);
    }
    
    let result;
    
    if (targetClass) {
      console.log(`🎯 Target: Kelas ${targetClass}`);
      console.log('📧 Mengirim notifikasi ke murid kelas tertentu...\n');
      
      result = await notifyStudentsByClass(targetClass, adminName, adminId);
    } else {
      console.log('🎯 Target: Semua murid dengan jadwal published');
      console.log('📧 Mengirim notifikasi ke semua murid...\n');
      
      result = await notifyAllStudentsSchedulePublished(adminName, adminId);
    }
    
    if (result && result.success) {
      console.log('\n🎉 SCRIPT BERHASIL DIJALANKAN!');
      console.log('================================');
      console.log(`✅ Notifikasi berhasil dikirim: ${result.totalNotificationsSent}`);
      console.log(`❌ Error: ${result.totalErrors}`);
      console.log(`📚 Kelas diproses: ${result.classesProcessed}`);
      console.log(`📅 Total jadwal: ${result.schedulesPublished}`);
      
      if (result.classResults && result.classResults.length > 0) {
        console.log('\n📋 DETAIL PER KELAS:');
        result.classResults.forEach(classResult => {
          console.log(`• ${classResult.className}: ${classResult.successCount}/${classResult.studentCount} murid berhasil`);
        });
      }
    } else {
      console.log('\n⚠️ SCRIPT TIDAK BERHASIL');
      console.log(result?.message || 'Tidak ada jadwal yang ditemukan untuk dinotifikasi');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR MENJALANKAN SCRIPT:');
    console.error(error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Fungsi untuk menampilkan petunjuk penggunaan
function showUsage() {
  console.log('📖 CARA PENGGUNAAN:');
  console.log('===================');
  console.log('');
  console.log('1. Kirim ke semua murid (menggunakan admin default ID: 001):');
  console.log('   node runScheduleNotification.js');
  console.log('');
  console.log('2. Kirim ke semua murid dengan admin ID tertentu:');
  console.log('   node runScheduleNotification.js [adminId]');
  console.log('   Contoh: node runScheduleNotification.js "002"');
  console.log('');
  console.log('3. Kirim ke kelas tertentu:');
  console.log('   node runScheduleNotification.js [adminId] [namaKelas]');
  console.log('   Contoh: node runScheduleNotification.js "001" "XII TKJ 1"');
  console.log('');
  console.log('📝 PARAMETER:');
  console.log('- adminId: ID admin di database (default: "001")');
  console.log('- namaKelas: Nama kelas spesifik (opsional)');
  console.log('');
  console.log('💡 CATATAN:');
  console.log('- Nama admin akan diambil otomatis dari database berdasarkan adminId');
  console.log('- Script akan menggunakan field "namaLengkap" dari document admin');
  console.log('');
}

// Cek apakah user meminta help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Jalankan script utama
console.log('⏰ ' + new Date().toLocaleString('id-ID'));
main().then(() => {
  console.log('\n✅ Script selesai dijalankan');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Script gagal:', error.message);
  process.exit(1);
});
