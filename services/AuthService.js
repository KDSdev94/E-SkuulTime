import { collection, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminService from './AdminService.js';

class AuthService {
  static USER_TYPE_ADMIN = 'admin';
  static USER_TYPE_MURID = 'murid';
  static USER_TYPE_GURU = 'guru';

  static async loginMurid(identifier, password) {
    try {
      // NOTE: Login murid hanya untuk data murid yang sudah memiliki username dan password
      // Murid baru yang ditambah dari dashboard admin tidak otomatis bisa login
      // kecuali admin secara manual menambahkan username dan password
      
      let q = query(
        collection(db, 'murid'),
        where('username', '==', identifier),
        where('password', '==', password),
        limit(1)
      );
      
      let querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        q = query(
          collection(db, 'murid'),
          where('email', '==', identifier),
          where('password', '==', password),
          limit(1)
        );
        querySnapshot = await getDocs(q);
      }

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const userData = { id: doc.id, ...doc.data() };
        
        // Simpan data login untuk persistent session
        await this.saveLoginData(userData, this.USER_TYPE_MURID);
        
        // Tunggu sebentar untuk memastikan data tersimpan
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
          success: true,
          user: userData,
          userType: this.USER_TYPE_MURID
        };
      }
      
      return {
        success: false,
        message: 'Username/Email atau password salah'
      };
    } catch (error) {
      console.error('Error login murid:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat login'
      };
    }
  }

  static async loginGuru(identifier, password) {
    try {
      // Login dengan username
      let q = query(
        collection(db, 'guru'),
        where('username', '==', identifier),
        where('password', '==', password),
        limit(1)
      );
      
      let querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const userData = { id: doc.id, ...doc.data() };
        
        // Simpan data login untuk persistent session
        await this.saveLoginData(userData, this.USER_TYPE_GURU);
        
        // Tunggu sebentar untuk memastikan data tersimpan
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
          success: true,
          user: userData,
          userType: this.USER_TYPE_GURU
        };
      }
      
      return {
        success: false,
        message: 'Username atau password salah'
      };
    } catch (error) {
      console.error('Error login guru:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat login'
      };
    }
  }

  static async loginAdmin(username, password) {
    try {
      const adminFromDB = await AdminService.loginAdmin(username, password);
      
      if (adminFromDB) {
        await this.saveLoginData(adminFromDB, this.USER_TYPE_ADMIN);
        
        return {
          success: true,
          user: adminFromDB,
          userType: this.USER_TYPE_ADMIN
        };
      }
      
      if (username === 'admin.eskuultime' && password === 'eskuultime@2025') {
        const adminData = {
          id: 'admin',
          username: 'admin.eskuultime',
          namaLengkap: 'Super Admin',
          role: 'admin',
          permissions: [] // Will be set later to avoid circular dependency
        };
        
        await this.saveLoginData(adminData, this.USER_TYPE_ADMIN);
        
        return {
          success: true,
          user: adminData,
          userType: this.USER_TYPE_ADMIN
        };
      }
      
      return {
        success: false,
        message: 'Username atau password salah'
      };
    } catch (error) {
      
      return {
        success: false,
        message: 'Terjadi kesalahan saat login'
      };
    }
  }

  static async saveLoginData(userData, userType) {
    try {
      // Hapus data login lama untuk tipe user lain (tapi tidak untuk yang sedang login)
      if (userType !== this.USER_TYPE_ADMIN) {
        await AsyncStorage.removeItem('loginData_admin');
      }
      if (userType !== this.USER_TYPE_MURID) {
        await AsyncStorage.removeItem('loginData_murid');
      }
      if (userType !== this.USER_TYPE_GURU) {
        await AsyncStorage.removeItem('loginData_guru');
      }
      
      const currentTimestamp = Date.now();
      const loginData = {
        userData,
        userType,
        timestamp: currentTimestamp,
        isLoggedIn: true
      };

      // Simpan tipe user yang sedang login
      await AsyncStorage.setItem('currentUserType', userType);
      
      // Simpan data login lengkap
      await AsyncStorage.setItem(`loginData_${userType}`, JSON.stringify(loginData));
      
      // Tambahan: Simpan juga dengan key yang lebih sederhana untuk backward compatibility
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userType', userType);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('loginTimestamp', currentTimestamp.toString());
      
      // Simpan nama admin khusus untuk sidebar
      if (userType === this.USER_TYPE_ADMIN && userData.namaLengkap) {
        await AsyncStorage.setItem('adminName', userData.namaLengkap);
      }
      
      // Simpan role khusus untuk kaprodi agar bisa dibedakan saat restart app
      if (userType === this.USER_TYPE_ADMIN && userData.role && 
          (userData.role.includes('kaprodi') || userData.role === 'kaprodi_tkj' || userData.role === 'kaprodi_tkr')) {
        await AsyncStorage.setItem('isKaprodi', 'true');
        await AsyncStorage.setItem('kaprodiRole', userData.role);
      } else {
        await AsyncStorage.removeItem('isKaprodi');
        await AsyncStorage.removeItem('kaprodiRole');
      }

      console.log('✅ Login data saved successfully:', {
        userType,
        username: userData.username || userData.namaLengkap,
        timestamp: new Date(currentTimestamp).toLocaleString()
      });

    } catch (error) {
      console.error('❌ Error saving login data:', error);
    }
  }

  static async getCurrentUser() {
    try {
      const userType = await AsyncStorage.getItem('currentUserType');
      
      if (userType) {
        const loginDataJSON = await AsyncStorage.getItem(`loginData_${userType}`);
        
        if (loginDataJSON) {
          const loginData = JSON.parse(loginDataJSON);
          
          // Check if session is still valid
          if (loginData.timestamp) {
            const sessionAge = Date.now() - loginData.timestamp;
            const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            if (sessionAge > maxSessionAge) {
              await this.logout();
              return {
                isLoggedIn: false,
                userType: null,
                userData: null
              };
            }
          }
          
          // Return valid session
          return {
            isLoggedIn: loginData.isLoggedIn,
            userType: loginData.userType,
            userData: { ...loginData.userData, userType: loginData.userType }
          };
        }
      }
      
      return {
        isLoggedIn: false,
        userType: null,
        userData: null
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return {
        isLoggedIn: false,
        userType: null,
        userData: null
      };
    }
  }

  static async logout() {
    try {
      // Hapus semua key yang berkaitan dengan login
      const keysToRemove = [
        'currentUserType',
        'loginData_admin',
        'loginData_murid',
        'loginData_guru',
        'isLoggedIn',
        'userType',
        'userData',
        'loginTimestamp',
        'adminName',
        'isKaprodi',
        'kaprodiRole'
      ];

      await AsyncStorage.multiRemove(keysToRemove);
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  static async updatePassword(userType, userId, currentPassword, newPassword) {
    try {
      const collectionType = 'murid';
      const q = query(
        collection(db, collectionType),
        where('id', '==', userId),
        where('password', '==', currentPassword),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = doc(db, collectionType, userId);
        await updateDoc(docRef, { password: newPassword });
        return { success: true, message: 'Password updated successfully.' };
      }

      return { success: false, message: 'Current password is incorrect.' };
    } catch (error) {
      
      return { success: false, message: 'Failed to update password due to an error.' };
    }
  }

  // =============== FORGOT PASSWORD METHODS ===============
  
  /**
   * Generate random reset token
   */
  static generateResetToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  /**
   * Request password reset - Step 1
   */
  static async requestPasswordReset(email, userType = 'murid') {
    try {
      // 1. Cari user berdasarkan email
      const q = query(
        collection(db, userType),
        where('email', '==', email),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          message: 'Email tidak ditemukan dalam database'
        };
      }

      // 2. Generate reset token
      const resetToken = this.generateResetToken();
      const resetTokenExpiry = Date.now() + (30 * 60 * 1000); // 30 menit

      // 3. Update user document dengan reset token
      const userDoc = querySnapshot.docs[0];
      const userRef = doc(db, userType, userDoc.id);
      
      await updateDoc(userRef, {
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry,
        updatedAt: new Date()
      });

      // 4. Simpan info untuk debugging (dalam production, kirim email)
      const userData = userDoc.data();
      console.log('🔐 Password reset requested:', {
        email: email,
        userName: userData.namaLengkap || userData.username,
        resetToken: resetToken,
        expiresAt: new Date(resetTokenExpiry).toLocaleString()
      });

      // TODO: Implementasi pengiriman email
      // await this.sendResetEmail(email, resetToken, userData.namaLengkap);

      return {
        success: true,
        message: 'Kode reset password telah digenerate. Silakan check console untuk melihat token.',
        token: resetToken // Untuk development, hapus di production
      };

    } catch (error) {
      console.error('Error requesting password reset:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat memproses permintaan reset password'
      };
    }
  }

  /**
   * Verify reset token - Step 2
   */
  static async verifyResetToken(token, userType = 'murid') {
    try {
      const q = query(
        collection(db, userType),
        where('resetToken', '==', token),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          message: 'Token reset password tidak valid'
        };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Check if token expired
      if (Date.now() > userData.resetTokenExpiry) {
        // Clean up expired token
        const userRef = doc(db, userType, userDoc.id);
        await updateDoc(userRef, {
          resetToken: null,
          resetTokenExpiry: null
        });
        
        return {
          success: false,
          message: 'Token reset password sudah expired. Silakan request ulang.'
        };
      }

      return {
        success: true,
        userId: userDoc.id,
        userData: userData,
        message: 'Token valid'
      };

    } catch (error) {
      console.error('Error verifying reset token:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat memverifikasi token'
      };
    }
  }

  /**
   * Reset password with token - Step 3
   */
  static async resetPasswordWithToken(token, newPassword, userType = 'murid') {
    try {
      // 1. Verify token terlebih dahulu
      const tokenVerification = await this.verifyResetToken(token, userType);
      
      if (!tokenVerification.success) {
        return tokenVerification;
      }

      // 2. Validasi password baru
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          message: 'Password baru harus minimal 6 karakter'
        };
      }

      // 3. Update password dan hapus reset token
      const userRef = doc(db, userType, tokenVerification.userId);
      
      await updateDoc(userRef, {
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      });

      console.log('✅ Password reset successful for user:', tokenVerification.userData.namaLengkap || tokenVerification.userData.username);

      return {
        success: true,
        message: 'Password berhasil direset. Silakan login dengan password baru.'
      };

    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat mereset password'
      };
    }
  }

  /**
   * Get user by reset token (untuk UI purposes)
   */
  static async getUserByResetToken(token, userType = 'murid') {
    try {
      const verification = await this.verifyResetToken(token, userType);
      
      if (verification.success) {
        return {
          success: true,
          user: {
            id: verification.userId,
            namaLengkap: verification.userData.namaLengkap,
            username: verification.userData.username,
            email: verification.userData.email
          }
        };
      }
      
      return verification;
    } catch (error) {
      console.error('Error getting user by reset token:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan'
      };
    }
  }

  /**
   * Clean up expired reset tokens (untuk maintenance)
   */
  static async cleanupExpiredTokens(userType = 'murid') {
    try {
      const q = query(
        collection(db, userType),
        where('resetTokenExpiry', '<', Date.now())
      );
      
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(docSnapshot => {
        const userRef = doc(db, userType, docSnapshot.id);
        return updateDoc(userRef, {
          resetToken: null,
          resetTokenExpiry: null
        });
      });
      
      await Promise.all(updatePromises);
      
      console.log(`🧹 Cleaned up ${querySnapshot.docs.length} expired reset tokens for ${userType}`);
      
      return {
        success: true,
        message: `Cleaned up ${querySnapshot.docs.length} expired tokens`
      };
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return {
        success: false,
        message: 'Error cleaning up expired tokens'
      };
    }
  }
  
  static async isLoggedIn() {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
      
      if (isLoggedIn === 'true' && loginTimestamp) {
        const sessionAge = Date.now() - parseInt(loginTimestamp);
        const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (sessionAge > maxSessionAge) {
          await this.logout();
          return false;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      
      return false;
    }
  }

  static async getUserType() {
    try {
      return await AsyncStorage.getItem('userType');
    } catch (error) {
      
      return null;
    }
  }

  // Debug function to check AsyncStorage
  static async debugStorage() {
    try {
      const currentUserType = await AsyncStorage.getItem('currentUserType');
      const loginDataMurid = await AsyncStorage.getItem('loginData_murid');
      const loginDataAdmin = await AsyncStorage.getItem('loginData_admin');
      if (loginDataMurid) {
        const parsedMurid = JSON.parse(loginDataMurid);
      }
      
      if (loginDataAdmin) {
        const parsedAdmin = JSON.parse(loginDataAdmin);
      }
    } catch (error) {
      console.error('Error debugging storage:', error);
    }
  }
}

export default AuthService;

