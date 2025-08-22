#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File-file yang akan dibersihkan dari console.log
const FILES_TO_CLEAN = [
  // Script debug dan testing
  'debug_registration_display.js',
  'scripts/debugLogin.js',
  'scripts/testRegistrationReport.js',
  'scripts/testPublishNotification.js',
  'scripts/ensurePublishNotification.js',
  'scripts/testRegistrationPersistent.js',
  'scripts/simpleTest.js',
  'scripts/testJadwalVisibility.js',
  'scripts/testRegistrationFlow.js',
  'scripts/simpleFirebaseTest.js',
  'scripts/testNotificationSystem.js',
  'scripts/fixSchedulePublication.js',
  'test-service.js',
  
  // File aplikasi utama (hati-hati, hanya hapus console.log development)
  'context/UserContext.js',
  'services/AuthService.js',
  'Pages/admin/JadwalManagementPage.js',
  'Pages/admin/admin_dashboard.js',
  'Pages/admin/LaporanPageNew.js',
  'Pages/guru/GuruDashboard.js',
  'components/EnhancedHeader.js'
];

// Pattern console.log yang akan dihapus
const CONSOLE_PATTERNS = [
  /^\s*console\.log\([^;]*\);\s*$/gm,           // console.log(...);
  /^\s*console\.info\([^;]*\);\s*$/gm,          // console.info(...);
  /^\s*console\.debug\([^;]*\);\s*$/gm,         // console.debug(...);
  /^\s*console\.warn\([^;]*\);\s*$/gm,          // console.warn(...); (hati-hati)
];

function cleanFile(filePath) {
  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File tidak ditemukan: ${filePath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Hitung jumlah console.log sebelum
    const beforeCount = (content.match(/console\.(log|info|debug)/g) || []).length;
    
    // Hapus console.log patterns
    CONSOLE_PATTERNS.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // Hapus baris kosong berlebihan
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Hitung jumlah console.log setelah
    const afterCount = (content.match(/console\.(log|info|debug)/g) || []).length;
    const removedCount = beforeCount - afterCount;
    
    if (content !== originalContent) {
      // Backup file original
      const backupPath = fullPath + '.backup';
      fs.writeFileSync(backupPath, originalContent);
      
      // Tulis file yang sudah dibersihkan
      fs.writeFileSync(fullPath, content);
      
      console.log(`✅ ${filePath}: Menghapus ${removedCount} console.log (sisa: ${afterCount})`);
      return true;
    } else {
      console.log(`ℹ️  ${filePath}: Tidak ada perubahan`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🧹 Membersihkan console.log yang tidak diperlukan...\n');
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  FILES_TO_CLEAN.forEach(file => {
    processedCount++;
    if (cleanFile(file)) {
      modifiedCount++;
    }
  });
  
  console.log(`\n📊 Selesai!`);
  console.log(`   - File diproses: ${processedCount}`);
  console.log(`   - File dimodifikasi: ${modifiedCount}`);
  console.log(`   - File backup dibuat untuk file yang dimodifikasi`);
  
  if (modifiedCount > 0) {
    console.log(`\n💡 Tips:`);
    console.log(`   - File backup tersimpan dengan ekstensi .backup`);
    console.log(`   - Jika ada masalah, restore dengan: mv file.js.backup file.js`);
    console.log(`   - Hapus backup setelah yakin: rm *.backup`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanFile, FILES_TO_CLEAN };
