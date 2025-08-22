import { resetKaprodiData } from './resetKaprodiData.js';

console.log('🔄 KAPRODI DATA RESET RUNNER');
console.log('================================');
console.log('This script will:');
console.log('1. Delete all existing kaprodi data (TKJ & TKR)');
console.log('2. Create new comprehensive kaprodi data');
console.log('3. Include additional fields from management form');
console.log('');

// Confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askConfirmation() {
  return new Promise((resolve) => {
    rl.question('Are you sure you want to reset all kaprodi data? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  try {
    console.log('⚠️  WARNING: This will permanently delete existing kaprodi data!');
    const confirmed = await askConfirmation();
    
    if (!confirmed) {
      console.log('❌ Operation cancelled by user');
      process.exit(0);
    }
    
    console.log('✅ User confirmed. Starting reset process...');
    console.log('');
    
    await resetKaprodiData();
    
    console.log('');
    console.log('🎊 Reset process completed successfully!');
    console.log('You can now test the login with the new kaprodi accounts.');
    
  } catch (error) {
    console.error('💥 Failed to reset kaprodi data:', error);
    process.exit(1);
  }
}

main();
