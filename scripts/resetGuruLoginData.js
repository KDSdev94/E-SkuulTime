const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, writeBatch } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

// Firebase configuration - direct config instead of import due to module type mismatch
const firebaseConfig = {
  apiKey: "AIzaSyBW4V8LafNVkvhkQlfXBKBMT0Hd8uHjYAM",
  authDomain: "expo-firebase-f28df.firebaseapp.com",
  databaseURL: "https://expo-firebase-f28df-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "expo-firebase-f28df",
  storageBucket: "expo-firebase-f28df.firebasestorage.app",
  messagingSenderId: "444588763749",
  appId: "1:444588763749:android:5ae27f5975be4ac615b48c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Script untuk menghapus data login guru (username, email, password)
 * Data profil guru tetap ada, cuma tidak bisa login
 */
async function resetGuruLoginData() {
  try {
    console.log('🔄 Starting guru login data reset...');
    
    // Get all guru data
    const guruRef = collection(db, 'guru');
    const querySnapshot = await getDocs(guruRef);
    
    if (querySnapshot.empty) {
      console.log('⚠️ No guru data found in database');
      return;
    }
    
    console.log(`📋 Found ${querySnapshot.size} guru records`);
    
    // Use batch for efficient updates
    const batch = writeBatch(db);
    let updateCount = 0;
    let guruWithLoginData = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;
      
      // Check if guru has login credentials
      if (data.username || data.email || data.password) {
        guruWithLoginData.push({
          id: docId,
          namaLengkap: data.namaLengkap || 'Unknown',
          nip: data.nip || 'Unknown',
          username: data.username || '',
          email: data.email || '',
          hasPassword: !!data.password
        });
        
        // Prepare update - remove login credentials
        const docRef = doc(db, 'guru', docId);
        const updateData = {};
        
        // Remove login fields
        if (data.username) updateData.username = null;
        if (data.email) updateData.email = null;
        if (data.password) updateData.password = null;
        
        // Add timestamp
        updateData.updatedAt = new Date();
        updateData.loginDataResetAt = new Date();
        updateData.resetReason = 'Login credentials reset for new registration system';
        
        batch.update(docRef, updateData);
        updateCount++;
      }
    });
    
    if (updateCount === 0) {
      console.log('✅ No guru with login credentials found. Nothing to reset.');
      return;
    }
    
    console.log(`📊 Guru with login credentials found: ${updateCount}`);
    console.log('📋 Guru details:');
    guruWithLoginData.forEach((guru, index) => {
      console.log(`   ${index + 1}. ${guru.namaLengkap} (NIP: ${guru.nip})`);
      console.log(`      - Username: ${guru.username || 'None'}`);
      console.log(`      - Email: ${guru.email || 'None'}`);
      console.log(`      - Has Password: ${guru.hasPassword ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Confirm before proceeding
    console.log('⚠️  WARNING: This will remove login credentials from all guru above!');
    console.log('⚠️  Affected guru will need to register again to get new login credentials.');
    console.log('⚠️  Profile data (nama, NIP, mata pelajaran, etc.) will NOT be deleted.');
    
    // In production, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically
    
    console.log('🔄 Proceeding with batch update...');
    
    // Execute batch update
    await batch.commit();
    
    console.log(`✅ Successfully reset login data for ${updateCount} guru`);
    console.log('✅ Reset completed successfully!');
    
    // Log summary
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   - Total guru in database: ${querySnapshot.size}`);
    console.log(`   - Guru with login credentials: ${updateCount}`);
    console.log(`   - Guru login data reset: ${updateCount}`);
    console.log(`   - Guru unaffected: ${querySnapshot.size - updateCount}`);
    
  } catch (error) {
    console.error('❌ Error resetting guru login data:', error);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
}

/**
 * Script untuk melihat status guru tanpa melakukan perubahan
 */
async function checkGuruLoginStatus() {
  try {
    console.log('🔍 Checking guru login status...');
    
    const guruRef = collection(db, 'guru');
    const querySnapshot = await getDocs(guruRef);
    
    if (querySnapshot.empty) {
      console.log('⚠️ No guru data found in database');
      return;
    }
    
    let guruWithLogin = 0;
    let guruWithoutLogin = 0;
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      if (data.username || data.email || data.password) {
        guruWithLogin++;
      } else {
        guruWithoutLogin++;
      }
    });
    
    console.log('📊 Guru login status:');
    console.log(`   - Total guru: ${querySnapshot.size}`);
    console.log(`   - Guru with login credentials: ${guruWithLogin}`);
    console.log(`   - Guru without login credentials: ${guruWithoutLogin}`);
    
    return {
      total: querySnapshot.size,
      withLogin: guruWithLogin,
      withoutLogin: guruWithoutLogin
    };
    
  } catch (error) {
    console.error('❌ Error checking guru login status:', error);
    throw error;
  }
}

// Run the script
async function main() {
  console.log('🎯 Guru Login Data Reset Script');
  console.log('================================');
  
  try {
    // Check current status first
    await checkGuruLoginStatus();
    
    console.log('');
    console.log('================================');
    
    // Reset login data
    await resetGuruLoginData();
    
    console.log('');
    console.log('================================');
    
    // Check status after reset
    console.log('🔍 Checking status after reset...');
    await checkGuruLoginStatus();
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  resetGuruLoginData,
  checkGuruLoginStatus
};

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed with error:', error);
      process.exit(1);
    });
}