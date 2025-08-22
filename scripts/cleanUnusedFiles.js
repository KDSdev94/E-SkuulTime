#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File-file yang jelas tidak diperlukan untuk aplikasi inti
const UNUSED_FILES = [
  // File backup yang dibuat oleh script cleanLogs
  '**/*.backup',
  
  // File debug dan testing
  'debug_registration_display.js',
  'test-service.js',
  'test-kaprodi-selection.md',
  
  // Scripts testing dan debug
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
  'scripts/generateMuridData.js',
  'scripts/generateProdiData.js',
  'scripts/addKaprodiAdmin.js',
  'scripts/deleteAllJadwal.js',
  'scripts/createWakasek.js',
  'scripts/addWakasekAdmin.mjs',
  'scripts/updateAdminPermissions.js',
  'scripts/testRegistrationIds.json',
  
  // File contoh dan eksperimen
  'examples/',
  
  // File dokumentasi yang mungkin tidak diperlukan di produksi
  'docs/',
  'PANDUAN_NOTIFIKASI_PUBLIKASI.md',
  
  // Context yang mungkin tidak digunakan
  'contexts/MapelContext.js', // Duplikat dengan context/
  
  // File yang kemungkinan tidak digunakan berdasarkan analisis import
  'components/TempDataGenerator.js',
  'components/PlaceholderPage.js',
  'components/SearchBar.js',
  'components/StudentCard.js',
  'utils/debugUtils.js',
  'utils/logger.js', // Sudah ada loggerConfig.js
  
  // Store yang mungkin tidak digunakan
  'stores/scheduleStore.js',
  
  // File yang tidak referenced di App.js
  'Pages/admin/LaporanPage.js', // Ada LaporanPageNew.js
  'Pages/admin/MapelPage.js', // Tidak ada di routing
  'Pages/admin/AdminManagementPage.js', // Tidak ada di routing
  'Pages/admin/KelasJadwalManagementPage.js', // Tidak ada di routing
];

// Direktori-direktori yang akan dicek untuk file yang tidak direferensi
const CORE_DIRS = [
  'components',
  'services',
  'Pages',
  'utils',
  'context',
  'hooks',
  'styles'
];

function getAllJSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules')) {
      files.push(...getAllJSFiles(fullPath));
    } else if (item.match(/\.(js|jsx|ts|tsx)$/)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function findImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Cari import statements
    const importRegex = /import\s+.*?from\s+['"](\.\.?\/[^'"]+)['"]/g;
    const requireRegex = /require\(['"](\.\.?\/[^'"]+)['"]\)/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (error) {
    return [];
  }
}

function resolveImportPath(basePath, importPath) {
  const baseDir = path.dirname(basePath);
  let resolvedPath = path.resolve(baseDir, importPath);
  
  // Coba dengan ekstensi .js jika tidak ada ekstensi
  if (!path.extname(resolvedPath)) {
    if (fs.existsSync(resolvedPath + '.js')) {
      resolvedPath += '.js';
    } else if (fs.existsSync(resolvedPath + '.jsx')) {
      resolvedPath += '.jsx';
    }
  }
  
  return resolvedPath;
}

function findUnusedFiles() {
  const allFiles = getAllJSFiles('.');
  const usedFiles = new Set();
  
  // Mulai dari App.js sebagai entry point
  const toCheck = ['./App.js'];
  const checked = new Set();
  
  while (toCheck.length > 0) {
    const currentFile = toCheck.pop();
    if (checked.has(currentFile)) continue;
    
    checked.add(currentFile);
    const fullPath = path.resolve(currentFile);
    
    if (fs.existsSync(fullPath)) {
      usedFiles.add(fullPath);
      const imports = findImportsInFile(fullPath);
      
      for (const importPath of imports) {
        const resolvedPath = resolveImportPath(fullPath, importPath);
        if (fs.existsSync(resolvedPath) && !checked.has(resolvedPath)) {
          toCheck.push(resolvedPath);
        }
      }
    }
  }
  
  // Filter file yang tidak digunakan
  const unusedFiles = allFiles.filter(file => {
    const absolutePath = path.resolve(file);
    return !usedFiles.has(absolutePath);
  });
  
  return unusedFiles;
}

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        // Hapus direktori beserta isinya
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`📁 Menghapus direktori: ${filePath}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`📄 Menghapus file: ${filePath}`);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error menghapus ${filePath}:`, error.message);
    return false;
  }
}

function matchesPattern(filePath, pattern) {
  if (pattern.includes('*')) {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  }
  return filePath.includes(pattern);
}

function main() {
  console.log('🧹 Mencari file-file yang tidak diperlukan...\n');
  
  let deletedCount = 0;
  
  // 1. Hapus file-file yang sudah diidentifikasi sebagai tidak diperlukan
  console.log('📋 Menghapus file-file yang sudah diidentifikasi tidak diperlukan:');
  
  for (const pattern of UNUSED_FILES) {
    if (pattern.endsWith('/')) {
      // Ini adalah direktori
      const dirPath = pattern.slice(0, -1);
      if (fs.existsSync(dirPath)) {
        if (deleteFile(dirPath)) {
          deletedCount++;
        }
      }
    } else if (pattern.includes('*')) {
      // Pattern dengan wildcard
      const allFiles = getAllJSFiles('.');
      const backupFiles = fs.readdirSync('.').filter(f => f.endsWith('.backup'));
      
      for (const file of [...allFiles, ...backupFiles]) {
        if (matchesPattern(file, pattern)) {
          if (deleteFile(file)) {
            deletedCount++;
          }
        }
      }
    } else {
      // File spesifik
      if (deleteFile(pattern)) {
        deletedCount++;
      }
    }
  }
  
  // 2. Analisis file yang tidak direferensi (opsional)
  console.log('\n🔍 Mencari file yang tidak direferensi dari entry point...');
  const unusedFiles = findUnusedFiles();
  
  if (unusedFiles.length > 0) {
    console.log('\n⚠️  File yang mungkin tidak digunakan (mohon periksa manual):');
    unusedFiles.forEach(file => {
      const relativePath = path.relative('.', file);
      console.log(`   - ${relativePath}`);
    });
    
    console.log('\n💡 File-file di atas tidak ditemukan referensinya dari App.js.');
    console.log('   Silakan periksa manual sebelum menghapus.');
  } else {
    console.log('✅ Semua file JS/JSX terlihat digunakan berdasarkan analisis import.');
  }
  
  console.log(`\n📊 Selesai!`);
  console.log(`   - File/direktori dihapus: ${deletedCount}`);
  
  if (deletedCount > 0) {
    console.log(`\n💡 Tips:`);
    console.log(`   - Jika aplikasi mengalami error, periksa import yang hilang`);
    console.log(`   - Jalankan 'npm start' atau 'expo start' untuk memastikan aplikasi berjalan`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { findUnusedFiles, UNUSED_FILES };
