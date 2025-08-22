# 🔔 Panduan Troubleshooting Notifikasi Jadwal

## 📊 Status Sistem Saat Ini

### ✅ Yang Sudah Berhasil:
- **Jadwal Status**: Semua 804 jadwal sudah published dan dapat dilihat guru/murid
- **Logic Approval**: Sistem sudah diperbaiki untuk auto-send notifikasi saat ACC
- **Workflow Baru**: Admin buat jadwal → Kaprodi ACC → Otomatis published + notifikasi

### ❌ Masalah yang Ditemukan:
- **Notifikasi Existing**: Gagal mengirim notifikasi untuk jadwal yang sudah ada
- **Error**: Firebase Database permission denied

## 🛠️ Langkah Perbaikan

### 1. Perbaikan Immediate (Sudah Dilakukan)
```javascript
// File: services/JadwalService.js
// Fungsi approveSchedules() sudah diperbaiki untuk auto-send notifikasi
```

### 2. Test Workflow Baru
1. **Admin**: Buat jadwal baru → Status: draft
2. **Kaprodi**: ACC jadwal → Status: published + notifikasi terkirim otomatis
3. **Murid/Guru**: Terima notifikasi dan bisa lihat jadwal

### 3. Perbaikan Firebase Database Rules
Jika notifikasi masih gagal, cek Firebase Console:

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Pilih project `expo-firebase-f28df`
3. Ke bagian "Realtime Database" 
4. Tab "Rules"
5. Pastikan rules seperti ini:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "notifications": {
      ".indexOn": ["userId", "createdAt", "read"]
    }
  }
}
```

### 4. Manual Test Notifikasi
Jalankan script test:
```bash
node scripts/testNotification.js
```

## 🎯 Workflow Baru (Post-Fix)

### Untuk Jadwal Baru:
1. **Admin** membuat jadwal → `status: draft`, `approvalStatus: pending`
2. **Kaprodi** meng-ACC jadwal → Otomatis:
   - `status: published`
   - `approvalStatus: approved` 
   - `isPublished: true`
   - **Notifikasi dikirim ke murid & guru terkait**

### Untuk Verifikasi:
1. Cek status jadwal: `node -e "import('./services/JadwalService.js').then(async ({default: JS}) => console.log(await JS.getPublishedSchedules()))"`
2. Test kirim notifikasi: `node scripts/sendScheduleNotifications.js`

## 📱 Notifikasi yang Akan Dikirim

### Untuk Murid:
> 📅 Jadwal pelajaran kelas [KELAS] telah disetujui dan dipublikasi oleh [KAPRODI]. Silakan cek aplikasi untuk melihat jadwal pelajaran Anda.

### Untuk Guru:
> 📅 Jadwal mengajar Anda telah disetujui dan dipublikasi oleh [KAPRODI]. Silakan cek aplikasi untuk melihat jadwal terbaru.

## 🔧 Script Utilitas

### Publish All Drafts (Emergency):
```bash
node scripts/publishAllSimple.js
```

### Send Manual Notifications:
```bash
node scripts/sendScheduleNotifications.js
```

### Check Schedule Status:
```bash
node -e "import('./services/JadwalService.js').then(async ({default: JS}) => { const all = await JS.getAllJadwal(); console.log('Published:', all.filter(s => s.isPublished).length); console.log('Draft:', all.filter(s => s.status === 'draft').length); })"
```

## 📞 Support

Jika masih ada masalah:
1. Cek log error di console
2. Pastikan Firebase rules benar
3. Test dengan satu notifikasi dulu
4. Periksa koneksi internet dan Firebase

## ✅ Checklist Verifikasi

- [ ] Jadwal sudah published (isPublished: true)
- [ ] Approval logic sudah diperbaiki
- [ ] Firebase rules mengizinkan write ke notifications
- [ ] Test notifikasi berhasil
- [ ] Murid menerima notifikasi
- [ ] Guru menerima notifikasi

---

**Update**: Sistem sudah diperbaiki untuk workflow baru. Notifikasi akan otomatis terkirim saat Kaprodi meng-ACC jadwal.
