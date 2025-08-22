import { resetKaprodiData } from './resetKaprodiData.js';

console.log('🔄 KAPRODI DATA RESET - SIMPLE VERSION');
console.log('=====================================');
console.log('This script will:');
console.log('1. Delete all existing kaprodi data (TKJ & TKR)');
console.log('2. Create new comprehensive kaprodi data');
console.log('3. Include additional fields from management form');
console.log('');
console.log('⚠️  WARNING: This will permanently delete existing kaprodi data!');
console.log('Starting in 3 seconds...');
console.log('');

// Wait 3 seconds then start
setTimeout(async () => {
  try {
    await resetKaprodiData();
    
    console.log('');
    console.log('🎊 Reset process completed successfully!');
    console.log('You can now test the login with the new kaprodi accounts.');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Failed to reset kaprodi data:', error);
    process.exit(1);
  }
}, 3000);
