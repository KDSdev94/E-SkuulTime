const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, writeBatch, doc } = require('firebase/firestore');

// Import existing firebase config
let firebaseConfig;
try {
  firebaseConfig = require('../config/firebase.node.js');
} catch (error) {
  console.error('❌ Error loading firebase config:', error);
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Generate dummy guru data for testing registration system
 */
const dummyGuruData = [
  {
    nip: '198501012010011001',
    namaLengkap: 'Drs. Ahmad Wijaya, M.Pd',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Jakarta',
    tanggalLahir: '1985-01-01',
    alamat: 'Jl. Pendidikan No. 123, Jakarta',
    nomorHP: '081234567890',
    pendidikanTerakhir: 'S2 Pendidikan Matematika',
    bidangKeahlian: 'Matematika',
    mataPelajaran: ['Matematika', 'Fisika'],
    kelasAmpu: ['X TKJ 1', 'X TKJ 2', 'XI TKJ 1'],
    jabatan: 'Guru Mata Pelajaran',
    golongan: 'III/c',
    pangkat: 'Penata',
    statusGuru: 'Aktif',
    statusAktif: 'Aktif'
  },
  {
    nip: '198703152010012002',
    namaLengkap: 'Siti Nurhaliza, S.Kom, M.T',
    jenisKelamin: 'Perempuan',
    tempatLahir: 'Bandung',
    tanggalLahir: '1987-03-15',
    alamat: 'Jl. Teknologi No. 456, Bandung',
    nomorHP: '081234567891',
    pendidikanTerakhir: 'S2 Teknik Informatika',
    bidangKeahlian: 'Pemrograman',
    mataPelajaran: ['Pemrograman Dasar', 'Basis Data', 'Jaringan Komputer'],
    kelasAmpu: ['X TKJ 1', 'X TKJ 2', 'XI TKJ 1', 'XI TKJ 2'],
    jabatan: 'Guru Mata Pelajaran',
    golongan: 'III/b',
    pangkat: 'Penata Muda Tingkat I',
    statusGuru: 'Aktif',
    statusAktif: 'Aktif'
  },
  {
    nip: '198209102009021003',
    namaLengkap: 'Budi Santoso, S.T, M.Eng',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Surabaya',
    tanggalLahir: '1982-09-10',
    alamat: 'Jl. Otomotif No. 789, Surabaya',
    nomorHP: '081234567892',
    pendidikanTerakhir: 'S2 Teknik Mesin',
    bidangKeahlian: 'Otomotif',
    mataPelajaran: ['Sistem Rem', 'Engine', 'Chasis dan Pemindah Tenaga'],
    kelasAmpu: ['X TKR 1', 'X TKR 2', 'XI TKR 1'],
    jabatan: 'Guru Mata Pelajaran',
    golongan: 'III/d',
    pangkat: 'Penata Tingkat I',
    statusGuru: 'Aktif',
    statusAktif: 'Aktif'
  },
  {
    nip: '198912252012022004',
    namaLengkap: 'Rina Sari, S.Pd, M.Pd',
    jenisKelamin: 'Perempuan',
    tempatLahir: 'Medan',
    tanggalLahir: '1989-12-25',
    alamat: 'Jl. Bahasa No. 321, Medan',
    nomorHP: '081234567893',
    pendidikanTerakhir: 'S2 Pendidikan Bahasa Indonesia',
    bidangKeahlian: 'Bahasa Indonesia',
    mataPelajaran: ['Bahasa Indonesia', 'Sastra Indonesia'],
    kelasAmpu: ['X TKJ 1', 'X TKJ 2', 'X TKR 1', 'X TKR 2'],
    jabatan: 'Guru Mata Pelajaran',
    golongan: 'III/a',
    pangkat: 'Penata Muda',
    statusGuru: 'Aktif',
    statusAktif: 'Aktif'
  },
  {
    nip: '198406082008011005',
    namaLengkap: 'Dr. Hendra Pratama, S.Si, M.Si',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '1984-06-08',
    alamat: 'Jl. Sains No. 654, Yogyakarta',
    nomorHP: '081234567894',
    pendidikanTerakhir: 'S3 Kimia',
    bidangKeahlian: 'Kimia',
    mataPelajaran: ['Kimia', 'IPA Terpadu'],
    kelasAmpu: ['X TKJ 1', 'X TKR 1'],
    jabatan: 'Guru Mata Pelajaran',
    golongan: 'IV/a',
    pangkat: 'Pembina',
    statusGuru: 'Aktif',
    statusAktif: 'Aktif'
  },
  {
    nip: '199002142014052006',
    namaLengkap: 'Lisa Amelia, S.Kom',
    jenisKelamin: 'Perempuan',
    tempatLahir: 'Semarang',
    tanggalLahir: '1990-02-14',
    alamat: 'Jl. Software No. 987, Semarang',
    nomorHP: '081234567895',
    pendidikanTerakhir: 'S1 Teknik Informatika',
    bidangKeahlian: 'Rekayasa Perangkat Lunak',
    mataPelajaran: ['Pemrograman Web', 'Mobile Programming', 'Software Engineering'],
    kelasAmpu: ['XII RPL 1', 'XII RPL 2'],
    jabatan: 'Guru Mata Pelajaran',
    golongan: 'II/d',
    pangkat: 'Pengatur Tingkat I',
    statusGuru: 'Aktif',
    statusAktif: 'Aktif'
  },
  {
    nip: '198511302011011007',
    namaLengkap: 'Agus Setiawan, S.Pd',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Solo',
    tanggalLahir: '1985-11-30',
    alamat: 'Jl. Olahraga No. 147, Solo',
    nomorHP: '081234567896',
    pendidikanTerakhir: 'S1 Pendidikan Jasmani',
    bidangKeahlian: 'Pendidikan Jasmani',
    mataPelajaran: ['PJOK', 'Kesehatan'],
    kelasAmpu: ['Semua Kelas'],
    jabatan: 'Guru Mata Pelajaran',
    golongan: 'III/b',
    pangkat: 'Penata Muda Tingkat I',
    statusGuru: 'Aktif',
    statusAktif: 'Aktif'
  },
  {
    nip: '198808172013052008',
    namaLengkap: 'Dewi Kartika, S.Ag, M.Pd.I',
    jenisKelamin: 'Perempuan',
    tempatLahir: 'Malang',
    tanggalLahir: '1988-08-17',
    alamat: 'Jl. Agama No. 258, Malang',
    nomorHP: '081234567897',
    pendidikanTerakhir: 'S2 Pendidikan Islam',
    bidangKeahlian: 'Pendidikan Agama Islam',
    mataPelajaran: ['Pendidikan Agama Islam', 'Akhlak'],
    kelasAmpu: ['Semua Kelas'],
    jabatan: 'Guru Mata Pelajaran',
    golongan: 'III/a',
    pangkat: 'Penata Muda',
    statusGuru: 'Aktif',
    statusAktif: 'Aktif'
  }
];

/**
 * Generate dummy guru data in Firestore
 */
async function generateDummyGuru() {
  try {
    console.log('🔄 Generating dummy guru data...');
    
    // Check if guru collection already has data
    const existingGuru = await getDocs(collection(db, 'guru'));
    
    if (!existingGuru.empty) {
      console.log(`📋 Found ${existingGuru.size} existing guru records`);
      console.log('⚠️  Guru data already exists. Skipping generation.');
      console.log('ℹ️  If you want to reset, please delete existing guru data first.');
      return { 
        success: true, 
        message: 'Guru data already exists', 
        existing: existingGuru.size,
        generated: 0 
      };
    }
    
    console.log('📝 No existing guru data found. Generating dummy data...');
    
    // Use batch for efficient writes
    const batch = writeBatch(db);
    const guruCollection = collection(db, 'guru');
    let generatedCount = 0;
    
    for (const guru of dummyGuruData) {
      // Add timestamps
      const guruWithTimestamp = {
        ...guru,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Explicitly set to null/undefined to indicate no login credentials
        username: null,
        email: null,
        password: null,
        loginDataResetAt: new Date(),
        resetReason: 'Initial data generation - no login credentials'
      };
      
      // Add to batch
      const docRef = doc(guruCollection);
      batch.set(docRef, guruWithTimestamp);
      generatedCount++;
      
      console.log(`   ✅ ${guru.namaLengkap} (${guru.nip}) - ${guru.mataPelajaran.join(', ')}`);
    }
    
    // Commit batch
    await batch.commit();
    
    console.log(`✅ Successfully generated ${generatedCount} dummy guru records`);
    
    return { 
      success: true, 
      message: 'Dummy guru data generated successfully', 
      existing: 0,
      generated: generatedCount 
    };
    
  } catch (error) {
    console.error('❌ Error generating dummy guru data:', error);
    throw error;
  }
}

/**
 * Check current guru status
 */
async function checkGuruStatus() {
  try {
    console.log('🔍 Checking guru database status...');
    
    const guruSnapshot = await getDocs(collection(db, 'guru'));
    
    if (guruSnapshot.empty) {
      console.log('📋 Guru collection is empty');
      return { total: 0, withLogin: 0, withoutLogin: 0 };
    }
    
    let withLogin = 0;
    let withoutLogin = 0;
    
    guruSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.username || data.email || data.password) {
        withLogin++;
      } else {
        withoutLogin++;
      }
    });
    
    console.log('📊 Guru Status:');
    console.log(`   - Total guru: ${guruSnapshot.size}`);
    console.log(`   - With login credentials: ${withLogin}`);
    console.log(`   - Without login credentials: ${withoutLogin}`);
    
    return {
      total: guruSnapshot.size,
      withLogin,
      withoutLogin
    };
    
  } catch (error) {
    console.error('❌ Error checking guru status:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🎯 Dummy Guru Data Generator');
  console.log('============================');
  console.log('');
  
  try {
    // Check current status
    const status = await checkGuruStatus();
    
    if (status.total === 0) {
      console.log('');
      console.log('🚀 Generating dummy guru data...');
      const result = await generateDummyGuru();
      
      console.log('');
      console.log('📊 Generation Summary:');
      console.log(`   - Existing guru: ${result.existing}`);
      console.log(`   - Generated guru: ${result.generated}`);
      console.log(`   - Total guru: ${result.existing + result.generated}`);
      
    } else {
      console.log('');
      console.log('ℹ️  Guru data already exists. No generation needed.');
    }
    
    console.log('');
    console.log('✅ Process completed successfully!');
    
  } catch (error) {
    console.error('💥 Process failed:', error);
    process.exit(1);
  }
}

// Export functions
module.exports = {
  generateDummyGuru,
  checkGuruStatus
};

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('');
      console.log('🎉 All done!');
      console.log('📋 Next steps:');
      console.log('   1. Use the new guru registration system');
      console.log('   2. Guru will select their NIP from dropdown');
      console.log('   3. Create username and password');
      console.log('   4. Admin will get notifications');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}