#!/usr/bin/env node

/**
 * CommonJS wrapper untuk menjalankan script ES module runScheduleNotification.js
 * Ini diperlukan karena ada konflik dengan React Native dan ES modules
 */

const { spawn } = require('child_process');
const path = require('path');

// Path ke script ES module
const scriptPath = path.join(__dirname, 'runScheduleNotification.js');

// Ambil argumen dari command line (kecuali node dan nama file ini)
const args = process.argv.slice(2);

console.log('🚀 Menjalankan script notifikasi jadwal...');
console.log('=' .repeat(50));

// Spawn proses Node.js baru untuk menjalankan ES module
const nodeProcess = spawn('node', [scriptPath, ...args], {
    stdio: 'inherit',  // Teruskan output ke konsol parent
    cwd: path.dirname(__dirname)  // Set working directory ke root project
});

// Handle ketika proses selesai
nodeProcess.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Script berhasil dijalankan');
    } else {
        console.log(`\n❌ Script gagal dengan kode: ${code}`);
    }
    process.exit(code);
});

// Handle error
nodeProcess.on('error', (error) => {
    console.error('❌ Error menjalankan script:', error.message);
    process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    console.log('\n⚠️ Script dihentikan oleh user');
    nodeProcess.kill('SIGINT');
});
