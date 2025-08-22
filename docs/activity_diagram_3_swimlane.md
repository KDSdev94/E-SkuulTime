# Activity Diagram - 3 Swimlane (Admin, Sistem, Kaprodi)

## Kolom Admin:
1. **Start** → Login ke sistem
2. Pilih menu kelola jadwal
3. Input form jadwal
4. Simpan sebagai **DRAFT**
5. **Decision**: Langsung ajukan?
   - **Tidak** → End
   - **Ya** → Lanjut ke langkah 6
6. Klik "**Ajukan ke Kaprodi**"
7. **Menunggu response** dari Kaprodi
8. **Decision** hasil approval:
   - **Approved** → Lanjut ke publikasi
   - **Rejected** → Revisi jadwal → kembali ke langkah 3
9. **Publikasi jadwal** aktif ke sistem
10. **End**

---

## Kolom Sistem:
1. **Menerima pengajuan** ←── (dari Admin langkah 6)
2. **Update status** → "Pending Approval"
3. **Kirim notifikasi otomatis** ke Kaprodi ───→ (ke kolom Kaprodi)
4. **Menunggu** keputusan Kaprodi
5. **Menerima keputusan** ←── (dari Kaprodi)
6. **Update status jadwal**:
   - Approved → "Disetujui"
   - Rejected → "Ditolak"
7. **Kirim notifikasi otomatis** ke Admin ───→ (kembali ke Admin)
8. Jika **Approved** → **Aktivasi publikasi**
9. **Kirim notifikasi publikasi** ke semua pengguna terkait
10. **End**

---

## Kolom Kaprodi:
1. **Menerima notifikasi** ←── (dari Sistem langkah 3)
2. Login ke sistem
3. Pilih menu **review jadwal**
4. **Review detail jadwal**
5. **Decision**: Setuju?
   - **Ya** → Status "**Approved**"
   - **Tidak** → Status "**Rejected**" + tambah catatan
6. **Submit keputusan** ───→ (ke Sistem langkah 5)
7. **End**

---

## Keuntungan 3 Swimlane ini:
- **Admin**: Fokus pada input dan publikasi
- **Sistem**: Handle semua notifikasi otomatis dan status
- **Kaprodi**: Fokus pada review dan approval
- **Tidak ada notifikasi manual** - semua otomatis oleh sistem
- **Lebih efisien** dan mengurangi kesalahan human error
