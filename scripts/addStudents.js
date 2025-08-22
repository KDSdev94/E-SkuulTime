import { db } from '../config/firebase.js';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Script untuk menambahkan 20 data murid
 * Document ID format: murid_nis
 * Password uniform: murid123
 */

const studentsData = [
  {
    nis: "2024001",
    nisn: "1234567890123",
    namaLengkap: "Ahmad Rizki Pratama",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Jakarta",
    tanggalLahir: "2008-03-15",
    tingkat: "X",
    kelasNumber: "1",
    kelas: "X TKJ 1",
    rombel: "X TKJ 1",
    jurusan: "TKJ",
    tahunMasuk: "2024",
    statusSiswa: "Aktif",
    nomorHP: "081234567801",
    alamat: "Jl. Merdeka No. 123, Jakarta",
    namaOrtu: "Budi Pratama",
    nomorHPOrtu: "081234567001",
    nomorHPWali: "081234567001",
    fotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    username: "ahmad2024001",
    email: "ahmad2024001@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2024002",
    nisn: "1234567890124",
    namaLengkap: "Siti Nurhaliza",
    jenisKelamin: "Perempuan",
    tempatLahir: "Bandung",
    tanggalLahir: "2008-05-22",
    tingkat: "X",
    kelasNumber: "1",
    kelas: "X TKJ 1",
    rombel: "X TKJ 1",
    jurusan: "TKJ",
    tahunMasuk: "2024",
    statusSiswa: "Aktif",
    nomorHP: "081234567802",
    alamat: "Jl. Kebon Jeruk No. 45, Jakarta",
    namaOrtu: "Hasan Nurdin",
    nomorHPOrtu: "081234567002",
    nomorHPWali: "081234567002",
    fotoUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b212?w=300&h=300&fit=crop&crop=face",
    username: "siti2024002",
    email: "siti2024002@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2024003",
    nisn: "1234567890125",
    namaLengkap: "Budi Santoso",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Surabaya",
    tanggalLahir: "2008-01-10",
    tingkat: "X",
    kelasNumber: "2",
    kelas: "X TKJ 2",
    rombel: "X TKJ 2",
    jurusan: "TKJ",
    tahunMasuk: "2024",
    statusSiswa: "Aktif",
    nomorHP: "081234567803",
    alamat: "Jl. Sudirman No. 78, Jakarta",
    namaOrtu: "Sari Santoso",
    nomorHPOrtu: "081234567003",
    nomorHPWali: "081234567003",
    fotoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    username: "budi2024003",
    email: "budi2024003@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2024004",
    nisn: "1234567890126",
    namaLengkap: "Dewi Lestari",
    jenisKelamin: "Perempuan",
    tempatLahir: "Medan",
    tanggalLahir: "2008-07-18",
    tingkat: "X",
    kelasNumber: "2",
    kelas: "X TKJ 2",
    rombel: "X TKJ 2",
    jurusan: "TKJ",
    tahunMasuk: "2024",
    statusSiswa: "Aktif",
    nomorHP: "081234567804",
    alamat: "Jl. Thamrin No. 56, Jakarta",
    namaOrtu: "Agus Lestari",
    nomorHPOrtu: "081234567004",
    nomorHPWali: "081234567004",
    fotoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
    username: "dewi2024004",
    email: "dewi2024004@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2024005",
    namaLengkap: "Eko Prasetyo",
    kelas: "X TKR 1",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "2008-09-12",
    alamat: "Jl. Gatot Subroto No. 34, Jakarta",
    noTelepon: "081234567805",
    email: "eko.prasetyo@student.school.id",
    namaWali: "Sri Prasetyo",
    noTeleponWali: "081234567005",
    foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024006",
    namaLengkap: "Fitri Ramadhani",
    kelas: "X TKR 1",
    jenisKelamin: "Perempuan",
    tanggalLahir: "2008-11-25",
    alamat: "Jl. Kuningan No. 67, Jakarta",
    noTelepon: "081234567806",
    email: "fitri.ramadhani@student.school.id",
    namaWali: "Ahmad Ramadhani",
    noTeleponWali: "081234567006",
    foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024007",
    namaLengkap: "Galih Wijaya",
    kelas: "X TKR 2",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "2008-04-08",
    alamat: "Jl. Pancoran No. 89, Jakarta",
    noTelepon: "081234567807",
    email: "galih.wijaya@student.school.id",
    namaWali: "Rina Wijaya",
    noTeleponWali: "081234567007",
    foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024008",
    namaLengkap: "Hesti Permatasari",
    kelas: "X TKR 2",
    jenisKelamin: "Perempuan",
    tanggalLahir: "2008-06-14",
    alamat: "Jl. Menteng No. 12, Jakarta",
    noTelepon: "081234567808",
    email: "hesti.permatasari@student.school.id",
    namaWali: "Bambang Permata",
    noTeleponWali: "081234567008",
    foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024009",
    namaLengkap: "Indra Gunawan",
    kelas: "XI TKJ 1",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "2007-02-20",
    alamat: "Jl. Cikini No. 23, Jakarta",
    noTelepon: "081234567809",
    email: "indra.gunawan@student.school.id",
    namaWali: "Siti Gunawan",
    noTeleponWali: "081234567009",
    foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024010",
    namaLengkap: "Jihan Aulia",
    kelas: "XI TKJ 1",
    jenisKelamin: "Perempuan",
    tanggalLahir: "2007-08-30",
    alamat: "Jl. Kemang No. 45, Jakarta",
    noTelepon: "081234567810",
    email: "jihan.aulia@student.school.id",
    namaWali: "Dedi Aulia",
    noTeleponWali: "081234567010",
    foto: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024011",
    namaLengkap: "Krisna Adiputra",
    kelas: "XI TKJ 2",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "2007-12-05",
    alamat: "Jl. Tebet No. 67, Jakarta",
    noTelepon: "081234567811",
    email: "krisna.adiputra@student.school.id",
    namaWali: "Made Adiputra",
    noTeleponWali: "081234567011",
    foto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024012",
    namaLengkap: "Lina Sari",
    kelas: "XI TKJ 2",
    jenisKelamin: "Perempuan",
    tanggalLahir: "2007-10-17",
    alamat: "Jl. Senayan No. 89, Jakarta",
    noTelepon: "081234567812",
    email: "lina.sari@student.school.id",
    namaWali: "Joko Sari",
    noTeleponWali: "081234567012",
    foto: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024013",
    namaLengkap: "Muhammad Fajar",
    kelas: "XI TKR 1",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "2007-03-28",
    alamat: "Jl. Blok M No. 34, Jakarta",
    noTelepon: "081234567813",
    email: "muhammad.fajar@student.school.id",
    namaWali: "Fatimah Fajar",
    noTeleponWali: "081234567013",
    foto: "https://images.unsplash.com/photo-1507081323647-4066c0576e31?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024014",
    namaLengkap: "Nadia Putri",
    kelas: "XI TKR 1",
    jenisKelamin: "Perempuan",
    tanggalLahir: "2007-09-11",
    alamat: "Jl. Pondok Indah No. 56, Jakarta",
    noTelepon: "081234567814",
    email: "nadia.putri@student.school.id",
    namaWali: "Rahman Putri",
    noTeleponWali: "081234567014",
    foto: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024015",
    namaLengkap: "Oscar Ramadhan",
    kelas: "XI TKR 2",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "2007-05-03",
    alamat: "Jl. Kelapa Gading No. 78, Jakarta",
    noTelepon: "081234567815",
    email: "oscar.ramadhan@student.school.id",
    namaWali: "Lia Ramadhan",
    noTeleponWali: "081234567015",
    foto: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024016",
    namaLengkap: "Putri Maharani",
    kelas: "XI TKR 2",
    jenisKelamin: "Perempuan",
    tanggalLahir: "2007-07-19",
    alamat: "Jl. PIK No. 12, Jakarta",
    noTelepon: "081234567816",
    email: "putri.maharani@student.school.id",
    namaWali: "Hendra Maharani",
    noTeleponWali: "081234567016",
    foto: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024017",
    namaLengkap: "Rizki Pratama",
    kelas: "XII TKJ 1",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "2006-01-15",
    alamat: "Jl. Sunter No. 23, Jakarta",
    noTelepon: "081234567817",
    email: "rizki.pratama@student.school.id",
    namaWali: "Nina Pratama",
    noTeleponWali: "081234567017",
    foto: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024018",
    namaLengkap: "Sari Dewi",
    kelas: "XII TKJ 1",
    jenisKelamin: "Perempuan",
    tanggalLahir: "2006-11-08",
    alamat: "Jl. Pluit No. 45, Jakarta",
    noTelepon: "081234567818",
    email: "sari.dewi@student.school.id",
    namaWali: "Andi Dewi",
    noTeleponWali: "081234567018",
    foto: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024019",
    namaLengkap: "Taufik Hidayat",
    kelas: "XII TKJ 2",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "2006-04-22",
    alamat: "Jl. Ancol No. 67, Jakarta",
    noTelepon: "081234567819",
    email: "taufik.hidayat@student.school.id",
    namaWali: "Ratna Hidayat",
    noTeleponWali: "081234567019",
    foto: "https://images.unsplash.com/photo-1522075469751-3847130b686e?w=300&h=300&fit=crop&crop=face"
  },
  {
    nis: "2024020",
    namaLengkap: "Umi Kalsum",
    kelas: "XII TKR 1",
    jenisKelamin: "Perempuan",
    tanggalLahir: "2006-06-30",
    alamat: "Jl. Cempaka Putih No. 89, Jakarta",
    noTelepon: "081234567820",
    email: "umi.kalsum@student.school.id",
    namaWali: "Usman Kalsum",
    noTeleponWali: "081234567020",
    foto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face"
  }
];

async function addStudents() {
  try {
    console.log('🚀 Starting to add 20 students...');
    console.log('📝 Document ID format: murid_nis');
    console.log('🔐 Password uniform: murid123');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const student of studentsData) {
      try {
        const documentId = `murid_${student.nis}`;
        
        const studentDoc = {
          nis: student.nis || '',
          nisn: student.nisn || '',
          namaLengkap: student.namaLengkap || '',
          jenisKelamin: student.jenisKelamin || 'Laki-laki',
          tempatLahir: student.tempatLahir || '',
          tanggalLahir: student.tanggalLahir || '',
          tingkat: student.tingkat || 'X',
          kelasNumber: student.kelasNumber || '1',
          kelas: student.kelas || '',
          rombel: student.rombel || student.kelas || '',
          jurusan: student.jurusan || 'TKJ',
          tahunMasuk: student.tahunMasuk || new Date().getFullYear().toString(),
          statusSiswa: student.statusSiswa || 'Aktif',
          nomorHP: student.nomorHP || '',
          alamat: student.alamat || '',
          namaOrtu: student.namaOrtu || '',
          nomorHPOrtu: student.nomorHPOrtu || '',
          nomorHPWali: student.nomorHPWali || '',
          fotoUrl: student.fotoUrl || '',
          username: student.username || '',
          email: student.email || '',
          password: student.password || "murid123",
          userType: "murid",
          status: "aktif",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add to Firestore with custom document ID
        await setDoc(doc(db, 'murid', documentId), studentDoc);
        
        console.log(`✅ Added: ${student.namaLengkap} (${documentId}) - ${student.kelas}`);
        successCount++;
        
        // Small delay to avoid overwhelming Firebase
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to add ${student.namaLengkap}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('==========================================');
    console.log(`✅ Successfully added: ${successCount} students`);
    console.log(`❌ Failed to add: ${errorCount} students`);
    console.log(`📋 Total attempts: ${studentsData.length} students`);
    console.log('==========================================');
    
    if (successCount > 0) {
      console.log('\n🎉 SUCCESS! Students have been added to Firestore!');
      console.log('\n📍 DETAILS:');
      console.log(`📝 Document ID format: murid_[NIS]`);
      console.log(`🔐 All passwords set to: murid123`);
      console.log(`📸 Profile photos from Unsplash included`);
      console.log(`📚 Classes covered: X TKJ 1-2, X TKR 1-2, XI TKJ 1-2, XI TKR 1-2, XII TKJ 1-2, XII TKR 1`);
      
      console.log('\n👥 Students by Class:');
      const classCounts = {};
      studentsData.forEach(student => {
        classCounts[student.kelas] = (classCounts[student.kelas] || 0) + 1;
      });
      
      Object.entries(classCounts).forEach(([kelas, count]) => {
        console.log(`   📚 ${kelas}: ${count} students`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in adding students:', error);
    throw error;
  }
}

// Run the script
console.log('👥 STUDENT DATA ADDITION SCRIPT');
console.log('================================');
console.log('🎯 Adding 20 students with uniform password and photos');

addStudents()
  .then(() => {
    console.log('\n✅ Student addition process completed successfully!');
    console.log('🔍 Check your Firebase console to verify the data.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Student addition process failed:', error);
    console.log('\n🔍 Please check:');
    console.log('- Firebase configuration');
    console.log('- Network connectivity');
    console.log('- Firestore permissions');
    process.exit(1);
  });
