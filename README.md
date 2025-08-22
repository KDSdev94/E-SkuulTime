# E-SkuulTime - Smart School Management System

![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## Tentang Aplikasi

E-SkuulTime adalah sistem manajemen sekolah digital yang komprehensif, dibangun dengan Expo React Native dan Firebase. Aplikasi ini dirancang untuk memudahkan pengelolaan jadwal, aktivitas akademik, dan komunikasi antara admin, guru, dan siswa.

### Fitur Utama

- **Multi-Role System**: Admin, Guru, Siswa, dan Kaprodi
- **Schedule Management**: Kelola jadwal pelajaran dengan mudah
- **Academic Reports**: Laporan akademik dan statistik
- **Smart Notifications**: Notifikasi real-time untuk semua aktivitas
- **Responsive Design**: UI yang adaptif untuk semua perangkat
- **Analytics Dashboard**: Dashboard dengan insights mendalam
- **Activity Tracking**: Pelacakan aktivitas siswa dan guru
- **Assignment Management**: Kelola tugas dan penilaian
- **Communication Hub**: Sistem komunikasi terintegrasi
- **Secure Authentication**: Sistem login yang aman

## Quick Start

### Prasyarat

- Node.js LTS (v16 atau lebih baru)
- npm atau yarn
- Expo CLI (npm install -g @expo/cli)
- Akun Firebase (Firestore, Auth, Storage)
- Android Studio / Xcode (untuk emulator)

### Instalasi

```bash
# Clone repository
git clone https://github.com/KDSdev94/E-SkuulTime.git
cd EXPO\ e-skuultime

# Install dependencies
npm install

# Jalankan aplikasi
npx expo start
```

### Menjalankan di Device

1. **Android/iOS**: Scan QR code dengan Expo Go app
2. **Emulator**: Tekan 'a' untuk Android atau 'i' untuk iOS
3. **Web**: Tekan 'w' untuk membuka di browser

## Konfigurasi

### Firebase Setup

1. Buat project Firebase baru
2. Enable Authentication, Firestore, dan Storage
3. Setup Firestore rules dan indexes
4. Update konfigurasi di config/firebase.js

```javascript
// config/firebase.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};
```

## Struktur Proyek

```
E-SkuulTime/
├── Pages/                    # Halaman aplikasi
│   ├── admin/               # Halaman admin
│   ├── guru/                # Halaman guru
│   ├── murid/               # Halaman siswa
│   ├── Login/               # Halaman login
│   └── profile/             # Halaman profil
├── components/              # Komponen UI reusable
├── context/                 # React Context providers
├── services/                # Service layer & API calls
├── scripts/                 # Utility scripts
├── utils/                   # Helper functions
├── styles/                  # Style definitions
├── hooks/                   # Custom React hooks
├── stores/                  # State management
├── config/                  # Konfigurasi aplikasi
├── App.js                   # Entry point
└── package.json             # Dependencies
```

## Scripts Tersedia

```bash
# Development
npm start                    # Jalankan Expo dev server
npm run android             # Jalankan di Android
npm run ios                 # Jalankan di iOS
npm run web                 # Jalankan di web browser

# Database Management
node scripts/addStudents.js              # Tambah data siswa
node scripts/generateDummyGuru.js       # Generate data guru dummy
node scripts/cleanNotifications.js       # Bersihkan notifikasi
node scripts/publishAllSchedules.js     # Publish semua jadwal
node scripts/fixSchedules.js            # Perbaiki jadwal
node scripts/resetScheduleStatus.js     # Reset status jadwal
node scripts/sendScheduleNotifications.js # Kirim notifikasi jadwal
```

## Database Schema

### Collections Firestore

- **users**: Data pengguna (admin, guru, siswa, kaprodi)
- **schedules**: Jadwal pelajaran
- **classes**: Data kelas dan jurusan
- **subjects**: Mata pelajaran
- **notifications**: Sistem notifikasi
- **activities**: Log aktivitas pengguna
- **reports**: Laporan akademik
- **assignments**: Tugas dan penilaian

## Role-Based Features

### Admin

- Dashboard dengan statistik lengkap
- Manajemen pengguna (guru, siswa, kaprodi)
- Manajemen jadwal dan mata pelajaran
- Laporan dan analytics
- Pengaturan sistem

### Guru

- Jadwal mengajar personal
- Manajemen kelas dan siswa
- Input nilai dan absensi
- Komunikasi dengan siswa
- Laporan progress siswa

### Siswa

- Jadwal pelajaran personal
- Tugas dan pengumuman
- Nilai dan progress akademik
- Komunikasi dengan guru
- Profil dan pengaturan

### Kaprodi

- Oversight program studi
- Laporan akademik program studi
- Manajemen kurikulum
- Koordinasi dengan guru

## Screenshots

_Tambahkan screenshot aplikasi di sini_

## Contributing

1. Fork repository ini
2. Buat branch fitur: `git checkout -b feature/amazing-feature`
3. Commit perubahan: `git commit -m 'Add amazing feature'`
4. Push ke branch: `git push origin feature/amazing-feature`
5. Buka Pull Request

### Coding Standards

- Gunakan ESLint dan Prettier
- Ikuti konvensi penamaan React Native
- Tulis komentar untuk logika kompleks
- Test fitur sebelum commit
- Gunakan TypeScript untuk type safety

## License

Hak cipta 2024 E-SkuulTime. All rights reserved.

## Support

- Email: support@eskuultime.com
- Discord: Join our community
- WhatsApp: +62 xxx-xxxx-xxxx
- Website: www.eskuultime.com

---

Made with ❤️ by E-SkuulTime Team  
⭐ Star this repo if you find it helpful!
