# Sistem Manajemen Data Guru - SIMARA

## 📋 Overview
Sistem manajemen data guru yang terintegrasi dengan Firebase Firestore untuk aplikasi SIMARA (Sistem Informasi Manajemen Sekolah). Sistem ini memungkinkan admin untuk mengelola data guru secara lengkap dengan fitur CRUD (Create, Read, Update, Delete).

## 🚀 Fitur Utama

### 1. Dashboard Data Guru
- **Statistik Real-time**: Total guru, breakdown berdasarkan status kepegawaian (PNS, PPPK, Honorer), dan jenis kelamin
- **UI Modern**: Design yang responsif dengan cards statistik yang informatif
- **Real-time Updates**: Data diperbarui secara real-time menggunakan Firebase onSnapshot

### 2. Generate Data Guru Otomatis
- **30+ Data Template**: Generate otomatis 30+ data guru dengan berbagai jabatan dan mata pelajaran
- **Data Realistis**: Nama, NIP, mata pelajaran, dan informasi lainnya sesuai dengan struktur sekolah SMK
- **Progress Tracking**: Progress bar untuk menampilkan kemajuan generate data

### 3. Manajemen CRUD Lengkap
- **Tambah Manual**: Form lengkap untuk menambah guru secara manual
- **Edit Data**: Form edit dengan pre-filled data guru yang dipilih
- **Hapus Data**: Konfirmasi hapus dengan alert untuk keamanan
- **Detail View**: Modal popup untuk melihat detail lengkap guru

### 4. Struktur Data Guru Lengkap
```javascript
{
  nip: "2510001",
  namaLengkap: "Ahmad Supardi",
  jenisKelamin: "Laki-laki",
  tempatLahir: "Surabaya",
  tanggalLahir: Date,
  alamat: "Jl. Ahmad Yani No. 123, Surabaya",
  nomorHP: "081234567890",
  email: "ahmad.supardi@simara.sch.id",
  pendidikanTerakhir: "S1",
  jurusan: ["TKJ", "TKR"], // atau ["TKJ"] atau ["TKR"]
  mataPelajaran: ["Matematika", "Informatika"],
  tingkatanMengajar: {
    "Matematika": ["X", "XI", "XII"],
    "Informatika": ["X", "XI"]
  },
  jabatan: "Guru", // atau "Wali Kelas", "Kepala Sekolah", dll
  waliKelas: "X TKJ 1", // jika jabatan Wali Kelas
  statusKepegawaian: "PNS", // atau "PPPK", "Honorer"
  username: "2510001", // sama dengan NIP
  password: "2510001", // sama dengan NIP
  fotoUrl: null,
  createdAt: Date,
  updatedAt: Date
}
```

## 📁 Struktur File

### Komponen Utama
```
Pages/admin/
├── GuruDataManagement.js     # Main dashboard guru
├── FormTambahGuru.js         # Form tambah guru manual
├── EditGuruForm.js           # Form edit guru
└── admin_dashboard.js        # Integration point

services/
├── generate_guru_data.js     # Generator data guru
└── GuruService.js           # Firebase operations

config/
└── firebase.js              # Firebase configuration
```

### Data Generator (generate_guru_data.js)
- **30+ Konfigurasi Guru**: Mencakup semua mata pelajaran TKJ dan TKR
- **Jabatan Beragam**: Guru, Wali Kelas, Kepala Sekolah, Wakil Kepala, Koordinator, BK
- **Data Realistis**: Nama Indonesia, alamat Jawa Timur, nomor HP valid
- **Mata Pelajaran Lengkap**:
  - Umum/Normatif: Matematika, B.Indonesia, PPKn, PAI, B.Inggris, dll
  - TKJ: Dasar TKJ, IoT, Pemrograman Web, Teknik Komputer Jaringan, dll
  - TKR: Dasar Otomotif, Electric Vehicle, Body Repair, dll
  - Projek: Projek IPAS, Projek Kreatif dan KWU

## 🎯 Fitur UI/UX

### 1. Statistics Cards
- **Horizontal Scroll**: Cards dapat di-scroll horizontal untuk melihat semua statistik
- **Color Coding**: Setiap kategori memiliki warna yang konsisten
- **Icons**: Ionicons untuk visual yang menarik

### 2. Action Buttons
- **Tambah Manual**: Biru (#1E3A8A) - untuk input manual
- **Generate Data**: Hijau (#10B981) - untuk generate otomatis
- **Hapus Semua**: Merah (#EF4444) - untuk reset data

### 3. Guru List Items
- **Avatar Initial**: Lingkaran dengan inisial nama guru
- **Status Badge**: Badge warna untuk status kepegawaian
- **Quick Actions**: Tombol edit dan delete per item
- **Touch Feedback**: Animasi press yang responsif

### 4. Modal Forms
- **Full Screen**: Form yang memenuhi layar untuk input yang nyaman
- **Section Based**: Form dibagi dalam section (Pribadi, Kontak, Akademik, Login)
- **Validation**: Validasi real-time dengan pesan error yang jelas
- **Dropdown Select**: Custom dropdown untuk pilihan yang terbatas

## 🔧 Integrasi Firebase

### Collections Structure
```
firestore/
└── guru/
    ├── {docId1}/
    ├── {docId2}/
    └── ...
```

### Operations
- **Real-time Listener**: `onSnapshot` untuk update otomatis
- **Batch Operations**: Untuk generate data dalam jumlah besar
- **Error Handling**: Try-catch dengan user feedback
- **Loading States**: Loading indicators untuk UX yang baik

## 📱 Responsive Design

### Breakpoints
- **Mobile First**: Design optimized untuk mobile
- **Tablet Support**: Layout yang adaptive untuk tablet
- **Card Layout**: Flexible grid system untuk berbagai ukuran layar

### Accessibility
- **Touch Targets**: Minimum 44px untuk semua touchable elements
- **Color Contrast**: Warna dengan kontras yang baik untuk readability
- **Feedback**: Visual dan haptic feedback untuk user actions

## 🛠️ Setup & Usage

### Prerequisites
```bash
npm install @expo/vector-icons
npm install firebase
npm install @react-native-async-storage/async-storage
```

### Firebase Setup
1. Buat project Firebase baru
2. Enable Firestore Database
3. Update `config/firebase.js` dengan konfigurasi Anda
4. Setup rules Firestore yang sesuai

### Integration
1. Import `GuruDataManagement` ke dalam `admin_dashboard.js`
2. Tambahkan route menu "Data Guru" di sidebar
3. Pastikan Firebase sudah dikonfigurasi dengan benar

### Usage Flow
1. **Admin Login** → Dashboard Admin
2. **Pilih Menu "Data Guru"** → GuruDataManagement
3. **Generate Data** → Klik "Generate Data" untuk data sample
4. **Tambah Manual** → Klik "Tambah Manual" untuk input guru baru
5. **Edit/Delete** → Gunakan tombol di setiap item guru
6. **View Detail** → Tap item guru untuk melihat detail lengkap

## 🎨 Color Scheme

### Primary Colors
- **Navy Blue**: #1E3A8A (Primary actions, headers)
- **Success Green**: #10B981 (Generate, success states)
- **Warning Orange**: #F59E0B (Honorer status, warnings)
- **Danger Red**: #EF4444 (Delete actions, errors)
- **Info Blue**: #3B82F6 (PPPK status, info)

### Status Colors
- **PNS**: #10B981 (Green)
- **PPPK**: #3B82F6 (Blue)
- **Honorer**: #F59E0B (Orange)

## 📈 Performance Optimizations

### Data Loading
- **Lazy Loading**: Load data saat dibutuhkan
- **Real-time Optimization**: Efficient listener management
- **Error Boundaries**: Graceful error handling

### Memory Management
- **Component Cleanup**: Proper useEffect cleanup
- **Modal Management**: Efficient modal state management
- **Image Optimization**: Placeholder untuk foto guru

## 🔜 Future Enhancements

### Planned Features
1. **Upload Foto**: Fitur upload foto guru ke Firebase Storage
2. **Export Data**: Export data guru ke Excel/PDF
3. **Import Data**: Import data guru dari Excel
4. **Advanced Search**: Filter dan pencarian advanced
5. **Jadwal Integration**: Integrasi dengan sistem jadwal
6. **Absensi Integration**: Integrasi dengan sistem absensi

### Technical Improvements
1. **Offline Support**: Cache data untuk akses offline
2. **Push Notifications**: Notifikasi untuk update data
3. **Advanced Analytics**: Dashboard analytics yang lebih detail
4. **Role-based Access**: Permission system untuk berbagai role

## 📝 Notes

### Best Practices Applied
- **Clean Code**: Penamaan variabel dan function yang descriptive
- **Component Separation**: Separation of concerns yang baik
- **Error Handling**: Comprehensive error handling
- **User Feedback**: Loading states dan success/error messages
- **Performance**: Optimized rendering dan data fetching

### Known Limitations
- **Photo Upload**: Belum ada fitur upload foto (placeholder saja)
- **Bulk Edit**: Belum ada fitur edit multiple guru sekaligus
- **Advanced Filtering**: Filter masih basic, belum ada date range, dll
- **Backup/Restore**: Belum ada fitur backup dan restore data

Sistem ini siap digunakan dan dapat dikembangkan lebih lanjut sesuai kebutuhan sekolah!
