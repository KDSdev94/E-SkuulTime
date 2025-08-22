import { db } from '../config/firebase-node.js';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Script untuk menghapus data kaprodi TKJ dan TKR yang sudah ada
 * dan membuat ulang dengan data yang lebih lengkap
 */

const kaprodiData = [
  {
    id: "9cny8785lX3pa095oDe2", // Keep existing ID for TKJ
    adminId: "KAP001",
    namaLengkap: "Drs. Ahmad Kusuma, M.T.",
    username: "kaprodi.tkj",
    email: "kaprodi.tkj@sekolah.edu",
    password: "kaprodi2025",
    role: "kaprodi_tkj",
    department: "TKJ",
    nip: "196512301990031003",
    noTelepon: "081234567100",
    alamat: "Jl. Pendidikan No. 15, Jakarta Timur",
    tanggalLahir: "1965-12-30",
    jenisKelamin: "L",
    pendidikanTerakhir: "S2 Teknik Informatika",
    bidangKeahlian: "Jaringan Komputer dan Telekomunikasi",
    jabatan: "Kepala Program Studi TKJ",
    status: "aktif",
    userType: "admin",
    permissions: [
      "view_curriculum",
      "view_schedule", 
      "view_users",
      "view_classes",
      "view_academic_reports",
      "view_statistics"
    ]
  },
  {
    id: "kaprodi_tkr_001",
    adminId: "KAP002", 
    namaLengkap: "Ir. Siti Rahayu, M.T.",
    username: "kaprodi.tkr",
    email: "kaprodi.tkr@sekolah.edu",
    password: "kaprodi2025",
    role: "kaprodi_tkr",
    department: "TKR",
    nip: "197203151995032002",
    noTelepon: "081234567200",
    alamat: "Jl. Teknik Mesin No. 22, Jakarta Selatan",
    tanggalLahir: "1972-03-15",
    jenisKelamin: "P",
    pendidikanTerakhir: "S2 Teknik Mesin",
    bidangKeahlian: "Teknik Kendaraan Ringan Otomotif",
    jabatan: "Kepala Program Studi TKR",
    status: "aktif",
    userType: "admin",
    permissions: [
      "view_curriculum",
      "view_schedule",
      "view_users", 
      "view_classes",
      "view_academic_reports",
      "view_statistics"
    ]
  },
  {
    id: "kaprodi_tkj_002",
    adminId: "KAP003",
    namaLengkap: "Drs. Bambang Priyanto, M.Kom.",
    username: "wakil.kaprodi.tkj",
    email: "wakil.kaprodi.tkj@sekolah.edu", 
    password: "kaprodi2025",
    role: "kaprodi_tkj",
    department: "TKJ",
    nip: "197508201998021001",
    noTelepon: "081234567101",
    alamat: "Jl. Komputer No. 8, Jakarta Utara",
    tanggalLahir: "1975-08-20",
    jenisKelamin: "L",
    pendidikanTerakhir: "S2 Ilmu Komputer",
    bidangKeahlian: "Sistem Informasi dan Database",
    jabatan: "Wakil Kepala Program Studi TKJ",
    status: "aktif",
    userType: "admin",
    permissions: [
      "view_curriculum",
      "view_schedule",
      "view_users",
      "view_classes", 
      "view_academic_reports",
      "view_statistics"
    ]
  },
  {
    id: "kaprodi_tkr_002",
    adminId: "KAP004",
    namaLengkap: "Drs. Eko Wahyudi, M.T.",
    username: "wakil.kaprodi.tkr",
    email: "wakil.kaprodi.tkr@sekolah.edu",
    password: "kaprodi2025", 
    role: "kaprodi_tkr",
    department: "TKR",
    nip: "197011101995031001",
    noTelepon: "081234567201",
    alamat: "Jl. Otomotif No. 12, Jakarta Barat",
    tanggalLahir: "1970-11-10",
    jenisKelamin: "L",
    pendidikanTerakhir: "S2 Teknik Mesin",
    bidangKeahlian: "Sistem Kelistrikan Otomotif",
    jabatan: "Wakil Kepala Program Studi TKR",
    status: "aktif",
    userType: "admin",
    permissions: [
      "view_curriculum",
      "view_schedule",
      "view_users",
      "view_classes",
      "view_academic_reports", 
      "view_statistics"
    ]
  }
];

async function deleteExistingKaprodi() {
  try {
    console.log('🗑️ Starting to delete existing kaprodi data...');
    
    // Query untuk mencari semua admin dengan role kaprodi
    const adminCollection = collection(db, 'admin');
    const kaprodiQuery = query(
      adminCollection, 
      where('role', 'in', ['kaprodi_tkj', 'kaprodi_tkr'])
    );
    
    const querySnapshot = await getDocs(kaprodiQuery);
    console.log(`Found ${querySnapshot.size} kaprodi records to delete`);
    
    // Delete each kaprodi document
    const deletePromises = [];
    querySnapshot.forEach((docSnapshot) => {
      console.log(`Deleting kaprodi: ${docSnapshot.data().namaLengkap} (${docSnapshot.id})`);
      deletePromises.push(deleteDoc(doc(db, 'admin', docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    console.log('✅ All existing kaprodi data deleted successfully');
    
  } catch (error) {
    console.error('❌ Error deleting existing kaprodi data:', error);
    throw error;
  }
}

async function createNewKaprodiData() {
  try {
    console.log('📝 Starting to create new kaprodi data...');
    
    const createPromises = kaprodiData.map(async (kaprodi) => {
      const kaprodiWithTimestamp = {
        ...kaprodi,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "System Script",
        updatedBy: "System Script"
      };
      
      console.log(`Creating kaprodi: ${kaprodi.namaLengkap} (${kaprodi.role})`);
      
      // Use the specified ID for the document
      await setDoc(doc(db, 'admin', kaprodi.id), kaprodiWithTimestamp);
      return kaprodi;
    });
    
    await Promise.all(createPromises);
    console.log('✅ All new kaprodi data created successfully');
    
  } catch (error) {
    console.error('❌ Error creating new kaprodi data:', error);
    throw error;
  }
}

async function resetKaprodiData() {
  try {
    console.log('🚀 Starting Kaprodi Data Reset Process...');
    console.log('=' .repeat(50));
    
    // Step 1: Delete existing kaprodi data
    await deleteExistingKaprodi();
    
    console.log('⏱️ Waiting 2 seconds before creating new data...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Create new kaprodi data
    await createNewKaprodiData();
    
    console.log('=' .repeat(50));
    console.log('🎉 Kaprodi Data Reset Process Completed Successfully!');
    console.log('📊 Summary:');
    console.log(`- Total Kaprodi Created: ${kaprodiData.length}`);
    console.log('- TKJ Kaprodi: 2 (1 Kepala + 1 Wakil)');
    console.log('- TKR Kaprodi: 2 (1 Kepala + 1 Wakil)');
    console.log('');
    console.log('🔐 Login Credentials:');
    kaprodiData.forEach(kaprodi => {
      console.log(`- ${kaprodi.namaLengkap}`);
      console.log(`  Username: ${kaprodi.username}`);
      console.log(`  Password: ${kaprodi.password}`);
      console.log(`  Role: ${kaprodi.role}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('💥 Kaprodi Data Reset Process Failed:', error);
    throw error;
  }
}

// Export function untuk digunakan dari file lain
export { resetKaprodiData };

// Run script jika dijalankan langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  resetKaprodiData()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
