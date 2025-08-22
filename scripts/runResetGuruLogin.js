const { resetGuruLoginData, checkGuruLoginStatus } = require('./resetGuruLoginData');

/**
 * Simple script runner untuk reset guru login data
 * Run dengan: node scripts/runResetGuruLogin.js
 */

console.log('🎯 Reset Guru Login Data Script');
console.log('=================================');
console.log('');

// Import firebase config
try {
  // Try to use the existing firebase config
  const firebaseConfig = require('../config/firebase.node.js');
  console.log('✅ Firebase config loaded successfully');
} catch (error) {
  console.error('❌ Error loading firebase config:', error);
  console.log('⚠️  Please make sure firebase.node.js config exists');
  process.exit(1);
}

async function main() {
  try {
    console.log('📊 Checking current guru login status...');
    const initialStatus = await checkGuruLoginStatus();
    
    if (initialStatus.withLogin === 0) {
      console.log('ℹ️  No guru with login credentials found. Nothing to reset.');
      return;
    }
    
    console.log('');
    console.log('⚠️  WARNING: This will remove login credentials from guru!');
    console.log('⚠️  Affected guru will need to register again.');
    console.log('⚠️  Profile data will NOT be deleted.');
    console.log('');
    
    // In production environment, you might want to add confirmation
    console.log('🔄 Proceeding with reset...');
    
    await resetGuruLoginData();
    
    console.log('');
    console.log('✅ Reset completed successfully!');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('');
    console.log('🎉 All done!');
    console.log('📋 Next steps:');
    console.log('   1. Guru can now use the new registration system');
    console.log('   2. They will select their NIP from dropdown');
    console.log('   3. Create username and password');
    console.log('   4. Admin will get notified of new registrations');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });