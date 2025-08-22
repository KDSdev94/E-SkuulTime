import { db } from './config/firebase.js';
import { collection, getDocs, query, limit } from 'firebase/firestore';

async function sampleJadwal() {
  try {
    const jadwalCollection = collection(db, 'jadwal');
    const querySnapshot = await getDocs(query(jadwalCollection, limit(5)));
    
    console.log('🔍 Sample jadwal data:');
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\nDocument ID: ${doc.id}`);
      console.log('Fields:', {
        namaMataPelajaran: data.namaMataPelajaran,
        guruId: data.guruId,
        namaGuru: data.namaGuru,
        namaKelas: data.namaKelas,
        hari: data.hari,
        jamMulai: data.jamMulai,
        jamSelesai: data.jamSelesai,
        isPublished: data.isPublished,
        hasGuruData: data.guruId && data.guruId !== '-'
      });
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

sampleJadwal();
