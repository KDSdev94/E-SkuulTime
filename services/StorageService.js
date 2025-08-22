import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import app from '../config/firebase.js';

class StorageService {
  constructor() {
    this.storage = getStorage(app);
  }

  /**
   * Upload profile image dengan progress tracking
   * @param {string} uri - URI gambar lokal
   * @param {string} userId - ID user
   * @param {string} userType - Tipe user (guru/murid)
   * @param {function} progressCallback - Callback untuk progress update
   * @returns {Promise<string>} - URL gambar yang di-upload
   */
  async uploadProfileImage(uri, userId, userType, progressCallback = null) {
    try {
      console.log('StorageService: Starting profile image upload', { uri, userId, userType });

      // Konversi URI ke blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Buat reference dengan path yang organized
      const fileName = `profile_${userId}_${Date.now()}.jpg`;
      const imageRef = ref(this.storage, `profiles/${userType}/${userId}/${fileName}`);

      // Upload dengan progress tracking
      const uploadTask = uploadBytesResumable(imageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress tracking
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('StorageService: Upload progress:', progress);
            if (progressCallback) {
              progressCallback(Math.round(progress));
            }
          },
          (error) => {
            console.error('StorageService: Upload error:', error);
            reject(new Error(`Gagal mengupload gambar: ${error.message}`));
          },
          async () => {
            try {
              // Upload selesai, ambil download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('StorageService: Upload completed, URL:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('StorageService: Error getting download URL:', error);
              reject(new Error('Gagal mendapatkan URL gambar'));
            }
          }
        );
      });
    } catch (error) {
      console.error('StorageService: Upload profile image error:', error);
      throw new Error(error.message || 'Gagal mengupload gambar profil');
    }
  }

  /**
   * Hapus gambar lama dari storage
   * @param {string} imageUrl - URL gambar yang akan dihapus
   */
  async deleteImageFromUrl(imageUrl) {
    try {
      if (!imageUrl || !imageUrl.includes('firebase')) {
        console.log('StorageService: No valid Firebase URL to delete');
        return;
      }

      // Extract path dari Firebase Storage URL
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
      if (imageUrl.includes(baseUrl)) {
        const pathStart = imageUrl.indexOf('/o/') + 3;
        const pathEnd = imageUrl.indexOf('?');
        const encodedPath = imageUrl.substring(pathStart, pathEnd);
        const decodedPath = decodeURIComponent(encodedPath);

        const imageRef = ref(this.storage, decodedPath);
        await deleteObject(imageRef);
        console.log('StorageService: Old image deleted:', decodedPath);
      }
    } catch (error) {
      console.error('StorageService: Error deleting old image:', error);
      // Don't throw error, deletion failure shouldn't block the process
    }
  }

  /**
   * Upload cover image
   * @param {string} uri - URI gambar lokal
   * @param {string} userId - ID user
   * @param {string} userType - Tipe user (guru/murid)
   * @param {function} progressCallback - Callback untuk progress update
   * @returns {Promise<string>} - URL gambar yang di-upload
   */
  async uploadCoverImage(uri, userId, userType, progressCallback = null) {
    try {
      console.log('StorageService: Starting cover image upload', { uri, userId, userType });

      const response = await fetch(uri);
      const blob = await response.blob();

      const fileName = `cover_${userId}_${Date.now()}.jpg`;
      const imageRef = ref(this.storage, `covers/${userType}/${userId}/${fileName}`);

      const uploadTask = uploadBytesResumable(imageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('StorageService: Cover upload progress:', progress);
            if (progressCallback) {
              progressCallback(Math.round(progress));
            }
          },
          (error) => {
            console.error('StorageService: Cover upload error:', error);
            reject(new Error(`Gagal mengupload cover: ${error.message}`));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('StorageService: Cover upload completed, URL:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('StorageService: Error getting cover download URL:', error);
              reject(new Error('Gagal mendapatkan URL cover'));
            }
          }
        );
      });
    } catch (error) {
      console.error('StorageService: Upload cover image error:', error);
      throw new Error(error.message || 'Gagal mengupload cover image');
    }
  }

  /**
   * Validate image file
   * @param {object} asset - Image asset dari expo-image-picker
   * @returns {boolean} - Valid atau tidak
   */
  validateImage(asset) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (asset.fileSize && asset.fileSize > maxSize) {
      throw new Error('Ukuran gambar terlalu besar. Maksimal 5MB.');
    }

    if (asset.mimeType && !allowedTypes.includes(asset.mimeType)) {
      throw new Error('Format gambar tidak didukung. Gunakan JPG atau PNG.');
    }

    return true;
  }
}

export default new StorageService();
