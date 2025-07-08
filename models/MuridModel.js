export class MuridModel {
  constructor({
    id = '',
    nis = '',
    namaLengkap = '',
    kelas = '',
    jurusan = '',
    jenisKelamin = '',
    tanggalLahir = null,
    alamat = '',
    nomorTelepon = '',
    email = '',
    createdAt = new Date(),
    updatedAt = new Date(),
    isActive = true
  } = {}) {
    this.id = id;
    this.nis = nis;
    this.namaLengkap = namaLengkap;
    this.kelas = kelas;
    this.jurusan = jurusan;
    this.jenisKelamin = jenisKelamin;
    this.tanggalLahir = tanggalLahir;
    this.alamat = alamat;
    this.nomorTelepon = nomorTelepon;
    this.email = email;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isActive = isActive;
  }

  static fromSnapshot(snapshot) {
    const data = snapshot.data();
    return new MuridModel({
      id: snapshot.id,
      nis: data.nis || '',
      namaLengkap: data.namaLengkap || '',
      kelas: data.kelas || '',
      jurusan: data.jurusan || '',
      jenisKelamin: data.jenisKelamin || '',
      tanggalLahir: data.tanggalLahir ? data.tanggalLahir.toDate() : null,
      alamat: data.alamat || '',
      nomorTelepon: data.nomorTelepon || '',
      email: data.email || '',
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      isActive: data.isActive !== undefined ? data.isActive : true
    });
  }

  toMap() {
    return {
      nis: this.nis,
      namaLengkap: this.namaLengkap,
      kelas: this.kelas,
      jurusan: this.jurusan,
      jenisKelamin: this.jenisKelamin,
      tanggalLahir: this.tanggalLahir,
      alamat: this.alamat,
      nomorTelepon: this.nomorTelepon,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive
    };
  }

  copyWith(updates) {
    return new MuridModel({
      ...this,
      ...updates,
      updatedAt: new Date()
    });
  }

  toString() {
    return `MuridModel(id: ${this.id}, nis: ${this.nis}, namaLengkap: ${this.namaLengkap})`;
  }
}
