import { db } from '../config/firebase.js';
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { createNotification } from '../services/notificationService.js';

/**
 * Script to fix schedules with missing or invalid guruId/namaGuru
 * and send notifications to affected teachers
 */
async function fixSchedulesAndNotify() {
    console.log('🔧 Starting schedule fix process...');
    
    try {
        // 1. Get all gurus from database
        console.log('📚 Fetching all teachers...');
        const guruSnapshot = await getDocs(collection(db, 'guru'));
        const guruMap = new Map();
        const guruList = [];
        
        guruSnapshot.forEach((guruDoc) => {
            const guruData = { id: guruDoc.id, ...guruDoc.data() };
            guruMap.set(guruDoc.id, guruData);
            guruList.push(guruData);
        });
        
        console.log(`👥 Found ${guruList.length} teachers in database`);
        
        // 2. Get all schedules from database
        console.log('📅 Fetching all schedules...');
        const jadwalSnapshot = await getDocs(collection(db, 'jadwal'));
        const jadwalList = [];
        
        jadwalSnapshot.forEach((jadwalDoc) => {
            jadwalList.push({ id: jadwalDoc.id, ...jadwalDoc.data() });
        });
        
        console.log(`📋 Found ${jadwalList.length} schedules in database`);
        
        // 3. Find schedules with missing or invalid teacher info
        const brokenSchedules = jadwalList.filter(jadwal => {
            return !jadwal.guruId || 
                   jadwal.guruId === '-' || 
                   !jadwal.namaGuru || 
                   jadwal.namaGuru === '-' ||
                   jadwal.namaGuru === 'Guru Tidak Diketahui';
        });
        
        console.log(`🔍 Found ${brokenSchedules.length} schedules with missing teacher info`);
        
        if (brokenSchedules.length === 0) {
            console.log('✅ No broken schedules found. All schedules have valid teacher information.');
            return;
        }
        
        // 4. Function to find best matching teacher for a schedule
        function findBestMatchingTeacher(schedule) {
            const mapel = schedule.namaMataPelajaran?.toLowerCase() || '';
            const kelas = schedule.namaKelas || '';
            
            // Priority 1: Find teacher who teaches this subject
            let matchingTeacher = guruList.find(guru => {
                if (!guru.mataPelajaran || !Array.isArray(guru.mataPelajaran)) return false;
                return guru.mataPelajaran.some(mp => 
                    mp.toLowerCase().includes(mapel) || mapel.includes(mp.toLowerCase())
                );
            });
            
            // Priority 2: Find teacher who teaches this class
            if (!matchingTeacher) {
                matchingTeacher = guruList.find(guru => {
                    if (!guru.kelasAmpu || !Array.isArray(guru.kelasAmpu)) return false;
                    return guru.kelasAmpu.some(ka => 
                        ka.toLowerCase().includes(kelas.toLowerCase()) || 
                        kelas.toLowerCase().includes(ka.toLowerCase())
                    );
                });
            }
            
            // Priority 3: Find teacher by subject category
            if (!matchingTeacher) {
                if (mapel.includes('matematika') || mapel.includes('fisika')) {
                    matchingTeacher = guruList.find(guru => 
                        guru.mataPelajaran?.some(mp => 
                            mp.toLowerCase().includes('matematika') || 
                            mp.toLowerCase().includes('fisika')
                        )
                    );
                } else if (mapel.includes('bahasa') || mapel.includes('indonesia') || mapel.includes('inggris')) {
                    matchingTeacher = guruList.find(guru => 
                        guru.mataPelajaran?.some(mp => 
                            mp.toLowerCase().includes('bahasa')
                        )
                    );
                } else if (mapel.includes('komputer') || mapel.includes('tkj') || mapel.includes('jaringan')) {
                    matchingTeacher = guruList.find(guru => 
                        guru.mataPelajaran?.some(mp => 
                            mp.toLowerCase().includes('komputer') || 
                            mp.toLowerCase().includes('jaringan') ||
                            mp.toLowerCase().includes('tkj')
                        )
                    );
                } else if (mapel.includes('otomotif') || mapel.includes('tkr') || mapel.includes('kendaraan')) {
                    matchingTeacher = guruList.find(guru => 
                        guru.mataPelajaran?.some(mp => 
                            mp.toLowerCase().includes('otomotif') || 
                            mp.toLowerCase().includes('tkr') ||
                            mp.toLowerCase().includes('kendaraan')
                        )
                    );
                }
            }
            
            // Priority 4: Just pick any active teacher
            if (!matchingTeacher) {
                matchingTeacher = guruList.find(guru => 
                    guru.statusAktif === 'Aktif' || !guru.statusAktif
                );
            }
            
            // Priority 5: Pick the first teacher available
            if (!matchingTeacher) {
                matchingTeacher = guruList[0];
            }
            
            return matchingTeacher;
        }
        
        // 5. Fix each broken schedule
        const updatePromises = [];
        const notificationPromises = [];
        const affectedTeachers = new Set();
        let fixedCount = 0;
        
        for (const schedule of brokenSchedules) {
            const matchingTeacher = findBestMatchingTeacher(schedule);
            
            if (matchingTeacher) {
                console.log(`🔧 Fixing schedule: ${schedule.namaMataPelajaran} (${schedule.namaKelas}) -> ${matchingTeacher.namaLengkap}`);
                
                // Update the schedule
                const jadwalRef = doc(db, 'jadwal', schedule.id);
                const updateData = {
                    guruId: matchingTeacher.id,
                    namaGuru: matchingTeacher.namaLengkap,
                    nipGuru: matchingTeacher.nip || undefined,
                    updatedAt: Timestamp.now(),
                    fixedByScript: true,
                    fixedAt: Timestamp.now()
                };
                
                updatePromises.push(updateDoc(jadwalRef, updateData));
                
                // Prepare notification for the teacher
                const notificationMessage = `📅 Anda telah ditugaskan untuk mengajar ${schedule.namaMataPelajaran} di kelas ${schedule.namaKelas} pada hari ${schedule.hari} jam ke-${schedule.jamKe}. Silakan cek jadwal mengajar Anda.`;
                
                notificationPromises.push(
                    createNotification(
                        matchingTeacher.id, 
                        notificationMessage, 
                        { 
                            name: 'Administrator', 
                            type: 'admin', 
                            id: '001' 
                        }, 
                        'jadwal', 
                        'guru'
                    )
                );
                
                affectedTeachers.add(matchingTeacher.id);
                fixedCount++;
            } else {
                console.warn(`⚠️ No suitable teacher found for schedule: ${schedule.namaMataPelajaran} (${schedule.namaKelas})`);
            }
        }
        
        // 6. Execute all updates
        console.log(`💾 Updating ${updatePromises.length} schedules...`);
        await Promise.all(updatePromises);
        
        // 7. Send notifications
        console.log(`📧 Sending ${notificationPromises.length} notifications...`);
        await Promise.all(notificationPromises);
        
        // 8. Send summary notification to admin
        const adminSummaryMessage = `✅ Schedule Fix Complete:\n• Fixed ${fixedCount} broken schedules\n• Notified ${affectedTeachers.size} teachers\n• All schedules now have valid teacher assignments`;
        
        await createNotification(
            '001', // Admin ID
            adminSummaryMessage,
            { 
                name: 'System', 
                type: 'system', 
                id: 'system' 
            },
            'system',
            'admin'
        );
        
        console.log('✅ SUCCESS! Schedule fix process completed:');
        console.log(`   • Fixed ${fixedCount} broken schedules`);
        console.log(`   • Notified ${affectedTeachers.size} teachers`);
        console.log('   • All schedules now have valid teacher assignments');
        console.log('   • Teachers can now see their schedules in the app');
        
    } catch (error) {
        console.error('❌ ERROR: Failed to fix schedules:', error);
        
        // Send error notification to admin
        try {
            await createNotification(
                '001', // Admin ID
                `❌ Schedule Fix Failed: ${error.message}`,
                { 
                    name: 'System', 
                    type: 'system', 
                    id: 'system' 
                },
                'error',
                'admin'
            );
        } catch (notifError) {
            console.error('Failed to send error notification:', notifError);
        }
    }
}

// Helper function to run the script
async function runScript() {
    console.log('🚀 Starting Schedule Fix Script...');
    console.log('=' + '='.repeat(50));
    
    await fixSchedulesAndNotify();
    
    console.log('=' + '='.repeat(50));
    console.log('🏁 Script execution completed.');
}

// Run the script if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runScript();
}

export { fixSchedulesAndNotify, runScript };

