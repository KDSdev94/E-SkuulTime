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
    namaLengkap: "Budi Santoso",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Bandung",
    tanggalLahir: "2008-05-20",
    tingkat: "X",
    kelasNumber: "1",
    kelas: "X TKJ 1",
    rombel: "X TKJ 1",
    jurusan: "TKJ",
    tahunMasuk: "2024",
    statusSiswa: "Aktif",
    nomorHP: "081234567802",
    alamat: "Jl. Asia Afrika No. 45, Bandung",
    namaOrtu: "Joko Santoso",
    nomorHPOrtu: "081234567002",
    nomorHPWali: "081234567002",
    fotoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face",
    username: "budi2024002",
    email: "budi2024002@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2024003",
    nisn: "1234567890125",
    namaLengkap: "Citra Dewi Anggraeni",
    jenisKelamin: "Perempuan",
    tempatLahir: "Surabaya",
    tanggalLahir: "2008-07-12",
    tingkat: "X",
    kelasNumber: "2",
    kelas: "X TKJ 2",
    rombel: "X TKJ 2",
    jurusan: "TKJ",
    tahunMasuk: "2024",
    statusSiswa: "Aktif",
    nomorHP: "081234567803",
    alamat: "Jl. Diponegoro No. 78, Surabaya",
    namaOrtu: "Dewi Anggraeni",
    nomorHPOrtu: "081234567003",
    nomorHPWali: "081234567003",
    fotoUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=300&fit=crop&crop=face",
    username: "citra2024003",
    email: "citra2024003@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2024004",
    nisn: "1234567890126",
    namaLengkap: "Dedi Kurniawan",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Medan",
    tanggalLahir: "2008-01-30",
    tingkat: "X",
    kelasNumber: "1",
    kelas: "X TKR 1",
    rombel: "X TKR 1",
    jurusan: "TKR",
    tahunMasuk: "2024",
    statusSiswa: "Aktif",
    nomorHP: "081234567804",
    alamat: "Jl. Gatot Subroto No. 56, Medan",
    namaOrtu: "Eko Kurniawan",
    nomorHPOrtu: "081234567004",
    nomorHPWali: "081234567004",
    fotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face",
    username: "dedi2024004",
    email: "dedi2024004@murid.tkr.sch.id",
    password: "murid123"
  },
  {
    nis: "2024005",
    nisn: "1234567890127",
    namaLengkap: "Eka Putri Wulandari",
    jenisKelamin: "Perempuan",
    tempatLahir: "Yogyakarta",
    tanggalLahir: "2008-09-05",
    tingkat: "X",
    kelasNumber: "2",
    kelas: "X TKR 2",
    rombel: "X TKR 2",
    jurusan: "TKR",
    tahunMasuk: "2024",
    statusSiswa: "Aktif",
    nomorHP: "081234567805",
    alamat: "Jl. Malioboro No. 89, Yogyakarta",
    namaOrtu: "Fajar Wulandari",
    nomorHPOrtu: "081234567005",
    nomorHPWali: "081234567005",
    fotoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
    username: "eka2024005",
    email: "eka2024005@murid.tkr.sch.id",
    password: "murid123"
  },
  {
    nis: "2023006",
    nisn: "1234567890128",
    namaLengkap: "Fajar Setiawan",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Semarang",
    tanggalLahir: "2007-04-18",
    tingkat: "XI",
    kelasNumber: "1",
    kelas: "XI TKJ 1",
    rombel: "XI TKJ 1",
    jurusan: "TKJ",
    tahunMasuk: "2023",
    statusSiswa: "Aktif",
    nomorHP: "081234567806",
    alamat: "Jl. Pemuda No. 34, Semarang",
    namaOrtu: "Gunawan Setiawan",
    nomorHPOrtu: "081234567006",
    nomorHPWali: "081234567006",
    fotoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face",
    username: "fajar2023006",
    email: "fajar2023006@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2023007",
    nisn: "1234567890129",
    namaLengkap: "Gita Permata Sari",
    jenisKelamin: "Perempuan",
    tempatLahir: "Malang",
    tanggalLahir: "2007-11-25",
    tingkat: "XI",
    kelasNumber: "2",
    kelas: "XI TKJ 2",
    rombel: "XI TKJ 2",
    jurusan: "TKJ",
    tahunMasuk: "2023",
    statusSiswa: "Aktif",
    nomorHP: "081234567807",
    alamat: "Jl. Ijen No. 67, Malang",
    namaOrtu: "Hendra Sari",
    nomorHPOrtu: "081234567007",
    nomorHPWali: "081234567007",
    fotoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face",
    username: "gita2023007",
    email: "gita2023007@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2023008",
    nisn: "1234567890130",
    namaLengkap: "Hadi Prabowo",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Bogor",
    tanggalLahir: "2007-02-14",
    tingkat: "XI",
    kelasNumber: "1",
    kelas: "XI TKR 1",
    rombel: "XI TKR 1",
    jurusan: "TKR",
    tahunMasuk: "2023",
    statusSiswa: "Aktif",
    nomorHP: "081234567808",
    alamat: "Jl. Siliwangi No. 12, Bogor",
    namaOrtu: "Indra Prabowo",
    nomorHPOrtu: "081234567008",
    nomorHPWali: "081234567008",
    fotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    username: "hadi2023008",
    email: "hadi2023008@murid.tkr.sch.id",
    password: "murid123"
  },
  {
    nis: "2023009",
    nisn: "1234567890131",
    namaLengkap: "Indah Kusuma Wardani",
    jenisKelamin: "Perempuan",
    tempatLahir: "Denpasar",
    tanggalLahir: "2007-08-09",
    tingkat: "XI",
    kelasNumber: "2",
    kelas: "XI TKR 2",
    rombel: "XI TKR 2",
    jurusan: "TKR",
    tahunMasuk: "2023",
    statusSiswa: "Aktif",
    nomorHP: "081234567809",
    alamat: "Jl. Raya Kuta No. 23, Denpasar",
    namaOrtu: "Jaya Wardani",
    nomorHPOrtu: "081234567009",
    nomorHPWali: "081234567009",
    fotoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop&crop=face",
    username: "indah2023009",
    email: "indah2023009@murid.tkr.sch.id",
    password: "murid123"
  },
  {
    nis: "2023010",
    nisn: "1234567890132",
    namaLengkap: "Joko Susilo",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Solo",
    tanggalLahir: "2007-12-03",
    tingkat: "XI",
    kelasNumber: "1",
    kelas: "XI TKJ 1",
    rombel: "XI TKJ 1",
    jurusan: "TKJ",
    tahunMasuk: "2023",
    statusSiswa: "Aktif",
    nomorHP: "081234567810",
    alamat: "Jl. Slamet Riyadi No. 45, Solo",
    namaOrtu: "Kurnia Susilo",
    nomorHPOrtu: "081234567010",
    nomorHPWali: "081234567010",
    fotoUrl: "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=300&h=300&fit=crop&crop=face",
    username: "joko2023010",
    email: "joko2023010@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2022011",
    nisn: "1234567890133",
    namaLengkap: "Kartika Sari Dewi",
    jenisKelamin: "Perempuan",
    tempatLahir: "Makassar",
    tanggalLahir: "2006-06-22",
    tingkat: "XII",
    kelasNumber: "1",
    kelas: "XII TKJ 1",
    rombel: "XII TKJ 1",
    jurusan: "TKJ",
    tahunMasuk: "2022",
    statusSiswa: "Aktif",
    nomorHP: "081234567811",
    alamat: "Jl. Sultan Hasanuddin No. 56, Makassar",
    namaOrtu: "Lukman Dewi",
    nomorHPOrtu: "081234567011",
    nomorHPWali: "081234567011",
    fotoUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop&crop=face",
    username: "kartika2022011",
    email: "kartika2022011@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2022012",
    nisn: "1234567890134",
    namaLengkap: "Lukman Hakim",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Palembang",
    tanggalLahir: "2006-04-17",
    tingkat: "XII",
    kelasNumber: "2",
    kelas: "XII TKJ 2",
    rombel: "XII TKJ 2",
    jurusan: "TKJ",
    tahunMasuk: "2022",
    statusSiswa: "Aktif",
    nomorHP: "081234567812",
    alamat: "Jl. Jenderal Sudirman No. 78, Palembang",
    namaOrtu: "Mulyadi Hakim",
    nomorHPOrtu: "081234567012",
    nomorHPWali: "081234567012",
    fotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    username: "lukman2022012",
    email: "lukman2022012@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2022013",
    nisn: "1234567890135",
    namaLengkap: "Maya Indah Permatasari",
    jenisKelamin: "Perempuan",
    tempatLahir: "Balikpapan",
    tanggalLahir: "2006-09-28",
    tingkat: "XII",
    kelasNumber: "1",
    kelas: "XII TKR 1",
    rombel: "XII TKR 1",
    jurusan: "TKR",
    tahunMasuk: "2022",
    statusSiswa: "Aktif",
    nomorHP: "081234567813",
    alamat: "Jl. MT Haryono No. 34, Balikpapan",
    namaOrtu: "Nugroho Permatasari",
    nomorHPOrtu: "081234567013",
    nomorHPWali: "081234567013",
    fotoUrl: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=300&h=300&fit=crop&crop=face",
    username: "maya2022013",
    email: "maya2022013@murid.tkr.sch.id",
    password: "murid123"
  },
  {
    nis: "2022014",
    nisn: "1234567890136",
    namaLengkap: "Nur Hidayat",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Manado",
    tanggalLahir: "2006-01-15",
    tingkat: "XII",
    kelasNumber: "1",
    kelas: "XII TKJ 1",
    rombel: "XII TKJ 1",
    jurusan: "TKJ",
    tahunMasuk: "2022",
    statusSiswa: "Aktif",
    nomorHP: "081234567814",
    alamat: "Jl. Sam Ratulangi No. 67, Manado",
    namaOrtu: "Oman Hidayat",
    nomorHPOrtu: "081234567014",
    nomorHPWali: "081234567014",
    fotoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face",
    username: "nur2022014",
    email: "nur2022014@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2022015",
    nisn: "1234567890137",
    namaLengkap: "Oki Pratama",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Padang",
    tanggalLahir: "2006-03-10",
    tingkat: "XII",
    kelasNumber: "2",
    kelas: "XII TKJ 2",
    rombel: "XII TKJ 2",
    jurusan: "TKJ",
    tahunMasuk: "2022",
    statusSiswa: "Aktif",
    nomorHP: "081234567815",
    alamat: "Jl. Khatib Sulaiman No. 89, Padang",
    namaOrtu: "Paiman Pratama",
    nomorHPOrtu: "081234567015",
    nomorHPWali: "081234567015",
    fotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    username: "oki2022015",
    email: "oki2022015@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2022016",
    nisn: "1234567890138",
    namaLengkap: "Putri Ayu Lestari",
    jenisKelamin: "Perempuan",
    tempatLahir: "Banjarmasin",
    tanggalLahir: "2006-07-19",
    tingkat: "XII",
    kelasNumber: "1",
    kelas: "XII TKR 1",
    rombel: "XII TKR 1",
    jurusan: "TKR",
    tahunMasuk: "2022",
    statusSiswa: "Aktif",
    nomorHP: "081234567816",
    alamat: "Jl. Pangeran Antasari No. 12, Banjarmasin",
    namaOrtu: "Rudi Lestari",
    nomorHPOrtu: "081234567016",
    nomorHPWali: "081234567016",
    fotoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop&crop=face",
    username: "putri2022016",
    email: "putri2022016@murid.tkr.sch.id",
    password: "murid123"
  },
  {
    nis: "2022017",
    nisn: "1234567890139",
    namaLengkap: "Rahmat Hidayatullah",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Pekanbaru",
    tanggalLahir: "2006-10-05",
    tingkat: "XII",
    kelasNumber: "1",
    kelas: "XII TKJ 1",
    rombel: "XII TKJ 1",
    jurusan: "TKJ",
    tahunMasuk: "2022",
    statusSiswa: "Aktif",
    nomorHP: "081234567817",
    alamat: "Jl. Sudirman No. 45, Pekanbaru",
    namaOrtu: "Samsul Hidayatullah",
    nomorHPOrtu: "081234567017",
    nomorHPWali: "081234567017",
    fotoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face",
    username: "rahmat2022017",
    email: "rahmat2022017@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2022018",
    nisn: "1234567890140",
    namaLengkap: "Siti Aminah",
    jenisKelamin: "Perempuan",
    tempatLahir: "Banda Aceh",
    tanggalLahir: "2006-02-14",
    tingkat: "XII",
    kelasNumber: "2",
    kelas: "XII TKJ 2",
    rombel: "XII TKJ 2",
    jurusan: "TKJ",
    tahunMasuk: "2022",
    statusSiswa: "Aktif",
    nomorHP: "081234567818",
    alamat: "Jl. Teuku Umar No. 67, Banda Aceh",
    namaOrtu: "Taufik Aminah",
    nomorHPOrtu: "081234567018",
    nomorHPWali: "081234567018",
    fotoUrl: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=300&h=300&fit=crop&crop=face",
    username: "siti2022018",
    email: "siti2022018@murid.tkj.sch.id",
    password: "murid123"
  },
  {
    nis: "2022019",
    nisn: "1234567890141",
    namaLengkap: "Teguh Wijaya",
    jenisKelamin: "Laki-laki",
    tempatLahir: "Jayapura",
    tanggalLahir: "2006-05-30",
    tingkat: "XII",
    kelasNumber: "1",
    kelas: "XII TKR 1",
    rombel: "XII TKR 1",
    jurusan: "TKR",
    tahunMasuk: "2022",
    statusSiswa: "Aktif",
    nomorHP: "081234567819",
    alamat: "Jl. Percetakan No. 89, Jayapura",
    namaOrtu: "Umar Wijaya",
    nomorHPOrtu: "081234567019",
    nomorHPWali: "081234567019",
    fotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    username: "teguh2022019",
    email: "teguh2022019@murid.tkr.sch.id",
    password: "murid123"
  },
  {
    nis: "2022020",
    nisn: "1234567890142",
    namaLengkap: "Umi Kulsum",
    jenisKelamin: "Perempuan",
    tempatLahir: "Mataram",
    tanggalLahir: "2006-08-22",
    tingkat: "XII",
    kelasNumber: "1",
    kelas: "XII TKJ 1",
    rombel: "XII TKJ 1",
    jurusan: "TKJ",
    tahunMasuk: "2022",
    statusSiswa: "Aktif",
    nomorHP: "081234567820",
    alamat: "Jl. Pejanggik No. 23, Mataram",
    namaOrtu: "Wahyu Kulsum",
    nomorHPOrtu: "081234567020",
    nomorHPWali: "081234567020",
    fotoUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop&crop=face",
    username: "umi2022020",
    email: "umi2022020@murid.tkj.sch.id",
    password: "murid123"
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
          nis: student.nis,
          nisn: student.nisn,
          namaLengkap: student.namaLengkap,
          jenisKelamin: student.jenisKelamin,
          tempatLahir: student.tempatLahir,
          tanggalLahir: student.tanggalLahir,
          tingkat: student.tingkat,
          kelasNumber: student.kelasNumber,
          kelas: student.kelas,
          rombel: student.rombel,
          jurusan: student.jurusan,
          tahunMasuk: student.tahunMasuk,
          statusSiswa: student.statusSiswa,
          nomorHP: student.nomorHP,
          alamat: student.alamat,
          namaOrtu: student.namaOrtu,
          nomorHPOrtu: student.nomorHPOrtu,
          nomorHPWali: student.nomorHPWali,
          fotoUrl: student.fotoUrl,
          username: student.username,
          email: student.email,
          password: student.password,
          userType: "murid",
          status: "aktif",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'murid', documentId), studentDoc);
        console.log(`✅ Added: ${student.namaLengkap} (${documentId}) - ${student.kelas}`);
        successCount++;
        
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