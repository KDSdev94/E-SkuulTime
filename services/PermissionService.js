import AsyncStorage from '@react-native-async-storage/async-storage';

class PermissionService {
  // Define available roles
  static ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    WAKASEK_KURIKULUM: 'wakasek_kurikulum',
    WAKASEK_KESISWAAN: 'wakasek_kesiswaan',
    KEPALA_SEKOLAH: 'kepala_sekolah',
    KAPRODI_TKJ: 'kaprodi_tkj',
    KAPRODI_TKR: 'kaprodi_tkr'
  };

  // Define available permissions
  static PERMISSIONS = {
    // Curriculum Management
    MANAGE_CURRICULUM: 'manage_curriculum',
    VIEW_CURRICULUM: 'view_curriculum',
    
    // Academic Management
    MANAGE_SCHEDULE: 'manage_schedule',
    VIEW_SCHEDULE: 'view_schedule',
    MANAGE_SUBJECTS: 'manage_subjects',
    
    // User Management
    MANAGE_TEACHERS: 'manage_teachers',
    MANAGE_STUDENTS: 'manage_students',
    MANAGE_ADMINS: 'manage_admins',
    VIEW_USERS: 'view_users',
    
    // Reports & Analytics
    VIEW_ACADEMIC_REPORTS: 'view_academic_reports',
    GENERATE_REPORTS: 'generate_reports',
    VIEW_STATISTICS: 'view_statistics',
    VIEW_STUDENT_REGISTRATION_REPORTS: 'view_student_registration_reports',
    
    // Schedule Approval (for Kaprodi)
    APPROVE_SCHEDULE: 'approve_schedule',
    REJECT_SCHEDULE: 'reject_schedule',
    
    // System Management
    SYSTEM_SETTINGS: 'system_settings',
    MANAGE_NOTIFICATIONS: 'manage_notifications',
    
    // Class Management
    MANAGE_CLASSES: 'manage_classes',
    VIEW_CLASSES: 'view_classes',
    
    // CRUD Operations
    CREATE_DATA: 'create_data',
    EDIT_DATA: 'edit_data',
    DELETE_DATA: 'delete_data'
  };

  // Define role-based permission mapping
  static ROLE_PERMISSIONS = {
    [this.ROLES.SUPER_ADMIN]: [
      // Super admin has all permissions
      ...Object.values(this.PERMISSIONS)
    ],
    
    [this.ROLES.ADMIN]: [
      this.PERMISSIONS.MANAGE_TEACHERS,
      this.PERMISSIONS.MANAGE_STUDENTS,
      this.PERMISSIONS.MANAGE_CLASSES,
      this.PERMISSIONS.VIEW_CLASSES,
      this.PERMISSIONS.MANAGE_SCHEDULE,
      this.PERMISSIONS.VIEW_SCHEDULE,
      this.PERMISSIONS.MANAGE_SUBJECTS,
      this.PERMISSIONS.MANAGE_CURRICULUM,
      this.PERMISSIONS.VIEW_CURRICULUM,
      this.PERMISSIONS.VIEW_USERS,
      this.PERMISSIONS.VIEW_ACADEMIC_REPORTS,
      this.PERMISSIONS.VIEW_STUDENT_REGISTRATION_REPORTS,
      this.PERMISSIONS.GENERATE_REPORTS,
      this.PERMISSIONS.MANAGE_NOTIFICATIONS,
      this.PERMISSIONS.CREATE_DATA,
      this.PERMISSIONS.EDIT_DATA,
      this.PERMISSIONS.DELETE_DATA
    ],
    
    [this.ROLES.WAKASEK_KURIKULUM]: [
      this.PERMISSIONS.MANAGE_CURRICULUM,
      this.PERMISSIONS.VIEW_CURRICULUM,
      this.PERMISSIONS.MANAGE_SUBJECTS,
      this.PERMISSIONS.MANAGE_SCHEDULE,
      this.PERMISSIONS.VIEW_SCHEDULE,
      this.PERMISSIONS.VIEW_USERS,
      this.PERMISSIONS.MANAGE_CLASSES,
      this.PERMISSIONS.VIEW_CLASSES,
      this.PERMISSIONS.VIEW_ACADEMIC_REPORTS,
      this.PERMISSIONS.GENERATE_REPORTS,
      this.PERMISSIONS.VIEW_STATISTICS,
      this.PERMISSIONS.CREATE_DATA,
      this.PERMISSIONS.EDIT_DATA,
      this.PERMISSIONS.DELETE_DATA
    ],
    
    [this.ROLES.WAKASEK_KESISWAAN]: [
      this.PERMISSIONS.MANAGE_STUDENTS,
      this.PERMISSIONS.VIEW_USERS,
      this.PERMISSIONS.VIEW_CLASSES,
      this.PERMISSIONS.VIEW_ACADEMIC_REPORTS,
      this.PERMISSIONS.VIEW_STUDENT_REGISTRATION_REPORTS,
      this.PERMISSIONS.GENERATE_REPORTS,
      this.PERMISSIONS.MANAGE_NOTIFICATIONS,
      this.PERMISSIONS.CREATE_DATA,
      this.PERMISSIONS.EDIT_DATA,
      this.PERMISSIONS.DELETE_DATA
    ],
    
    [this.ROLES.KEPALA_SEKOLAH]: [
      this.PERMISSIONS.VIEW_CURRICULUM,
      this.PERMISSIONS.VIEW_SCHEDULE,
      this.PERMISSIONS.VIEW_USERS,
      this.PERMISSIONS.VIEW_CLASSES,
      this.PERMISSIONS.VIEW_ACADEMIC_REPORTS,
      this.PERMISSIONS.GENERATE_REPORTS,
      this.PERMISSIONS.VIEW_STATISTICS
    ],
    
    // Kaprodi TKJ - View access + Schedule approval for TKJ department data
    [this.ROLES.KAPRODI_TKJ]: [
      this.PERMISSIONS.VIEW_CURRICULUM,
      this.PERMISSIONS.MANAGE_CURRICULUM,
      this.PERMISSIONS.MANAGE_SUBJECTS,
      this.PERMISSIONS.VIEW_SCHEDULE,
      this.PERMISSIONS.VIEW_USERS,
      this.PERMISSIONS.VIEW_CLASSES,
      this.PERMISSIONS.VIEW_ACADEMIC_REPORTS,
      this.PERMISSIONS.VIEW_STATISTICS,
      this.PERMISSIONS.APPROVE_SCHEDULE,
      this.PERMISSIONS.REJECT_SCHEDULE
    ],
    
    // Kaprodi TKR - View access + Schedule approval for TKR department data
    [this.ROLES.KAPRODI_TKR]: [
      this.PERMISSIONS.VIEW_CURRICULUM,
      this.PERMISSIONS.MANAGE_CURRICULUM,
      this.PERMISSIONS.MANAGE_SUBJECTS,
      this.PERMISSIONS.VIEW_SCHEDULE,
      this.PERMISSIONS.VIEW_USERS,
      this.PERMISSIONS.VIEW_CLASSES,
      this.PERMISSIONS.VIEW_ACADEMIC_REPORTS,
      this.PERMISSIONS.VIEW_STATISTICS,
      this.PERMISSIONS.APPROVE_SCHEDULE,
      this.PERMISSIONS.REJECT_SCHEDULE
    ]
  };

  /**
   * Check if current user has specific permission
   * @param {string} permission - Permission to check
   * @returns {Promise<boolean>}
   */
  static async hasPermission(permission) {
    try {
      // Get user data directly from AsyncStorage to avoid circular dependency
      const userType = await AsyncStorage.getItem('currentUserType');
      
      if (!userType || userType !== 'admin') {
        return false;
      }
      
      const loginDataJSON = await AsyncStorage.getItem(`loginData_${userType}`);
      if (!loginDataJSON) {
        return false;
      }
      
      const loginData = JSON.parse(loginDataJSON);
      if (!loginData.isLoggedIn) {
        return false;
      }
      
      const userData = loginData.userData;
      

      const userRole = userData.userData?.role || userData.role;
      const userPermissions = userData.userData?.permissions || userData.permissions;

      // Cek permission dari user terlebih dahulu
      if (userPermissions && Array.isArray(userPermissions)) {
        if (userPermissions.includes(permission)) {
          return true;
        }
        // Jangan return false di sini, lanjutkan ke pengecekan role
      }

      // Fallback: cek permission berdasarkan role
      if (userRole) {
        // Special handling untuk admin biasa yang belum ada explicit role
        let effectiveRole = userRole;
        if (userRole === 'admin' || !this.ROLE_PERMISSIONS[userRole]) {
          effectiveRole = this.ROLES.ADMIN;
        }
        
        const rolePermissions = this.ROLE_PERMISSIONS[effectiveRole] || [];
        
        return rolePermissions.includes(permission);
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if current user has specific role
   * @param {string} role - Role to check
   * @returns {Promise<boolean>}
   */
  static async hasRole(role) {
    try {
      // Get user data directly from AsyncStorage to avoid circular dependency
      const userType = await AsyncStorage.getItem('currentUserType');
      
      if (!userType || userType !== 'admin') {
        return false;
      }
      
      const loginDataJSON = await AsyncStorage.getItem(`loginData_${userType}`);
      if (!loginDataJSON) {
        return false;
      }
      
      const loginData = JSON.parse(loginDataJSON);
      if (!loginData.isLoggedIn) {
        return false;
      }
      
      const userData = loginData.userData;
      
      
      const currentRole = userData.userData?.role || userData.role;
      
      // Special handling untuk admin biasa
      if (role === this.ROLES.ADMIN && (currentRole === 'admin' || currentRole === this.ROLES.ADMIN)) {
        return true;
      }
      
      return currentRole === role;
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  /**
   * Check if current user has any of the specified roles
   * @param {Array<string>} roles - Array of roles to check
   * @returns {Promise<boolean>}
   */
  static async hasAnyRole(roles) {
    try {
      // Get user data directly from AsyncStorage to avoid circular dependency
      const userType = await AsyncStorage.getItem('currentUserType');
      
      if (!userType || userType !== 'admin') {
        return false;
      }
      
      const loginDataJSON = await AsyncStorage.getItem(`loginData_${userType}`);
      if (!loginDataJSON) {
        return false;
      }
      
      const loginData = JSON.parse(loginDataJSON);
      if (!loginData.isLoggedIn) {
        return false;
      }
      
      const userData = loginData.userData;
      const userRole = userData.userData?.role;
      return roles.includes(userRole);
    } catch (error) {
      console.error('Error checking roles:', error);
      return false;
    }
  }

  /**
   * Get current user's role
   * @returns {Promise<string|null>}
   */
  static async getCurrentUserRole() {
    try {
      // Get user data directly from AsyncStorage to avoid circular dependency
      const userType = await AsyncStorage.getItem('currentUserType');
      
      if (!userType || userType !== 'admin') {
        return null;
      }
      
      const loginDataJSON = await AsyncStorage.getItem(`loginData_${userType}`);
      if (!loginDataJSON) {
        return null;
      }
      
      const loginData = JSON.parse(loginDataJSON);
      if (!loginData.isLoggedIn) {
        return null;
      }
      
      const userData = loginData.userData;
      
      const userRole = userData.userData?.role || userData.role;
      
      // Special handling untuk admin biasa yang belum ada explicit role
      let effectiveRole = userRole;
      if (userRole === 'admin' || !userRole) {
        effectiveRole = this.ROLES.ADMIN;
      }
      
      
      return effectiveRole;
    } catch (error) {
      console.error('Error getting current user role:', error);
      return null;
    }
  }

  /**
   * Get current user's permissions
   * @returns {Promise<Array<string>>}
   */
  static async getCurrentUserPermissions() {
    try {
      // Get user data directly from AsyncStorage to avoid circular dependency
      const userType = await AsyncStorage.getItem('currentUserType');
      
      if (!userType || userType !== 'admin') {
        return [];
      }
      
      const loginDataJSON = await AsyncStorage.getItem(`loginData_${userType}`);
      if (!loginDataJSON) {
        return [];
      }
      
      const loginData = JSON.parse(loginDataJSON);
      if (!loginData.isLoggedIn) {
        return [];
      }
      
      const userData = loginData.userData;
      const userRole = userData.userData?.role;
      const userPermissions = userData.userData?.permissions;

      // Return explicit permissions if available
      if (userPermissions && Array.isArray(userPermissions)) {
        return userPermissions;
      }

      // Return role-based permissions
      if (userRole) {
        return this.ROLE_PERMISSIONS[userRole] || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting current user permissions:', error);
      return [];
    }
  }

  /**
   * Get permissions for a specific role
   * @param {string} role - Role to get permissions for
   * @returns {Array<string>}
   */
  static getPermissionsForRole(role) {
    return this.ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Get human-readable role name
   * @param {string} role - Role key
   * @returns {string}
   */
  static getRoleName(role) {
    const roleNames = {
      [this.ROLES.SUPER_ADMIN]: 'Super Administrator',
      [this.ROLES.ADMIN]: 'Administrator',
      [this.ROLES.WAKASEK_KURIKULUM]: 'Wakil Kepala Sekolah Kurikulum',
      [this.ROLES.WAKASEK_KESISWAAN]: 'Wakil Kepala Sekolah Kesiswaan',
      [this.ROLES.KEPALA_SEKOLAH]: 'Kepala Sekolah',
      [this.ROLES.KAPRODI_TKJ]: 'Kepala Program Studi TKJ',
      [this.ROLES.KAPRODI_TKR]: 'Kepala Program Studi TKR'
    };

    return roleNames[role] || role;
  }

  /**
   * Get human-readable permission name
   * @param {string} permission - Permission key
   * @returns {string}
   */
  static getPermissionName(permission) {
    const permissionNames = {
      [this.PERMISSIONS.MANAGE_CURRICULUM]: 'Kelola Kurikulum',
      [this.PERMISSIONS.VIEW_CURRICULUM]: 'Lihat Kurikulum',
      [this.PERMISSIONS.MANAGE_SCHEDULE]: 'Kelola Jadwal',
      [this.PERMISSIONS.VIEW_SCHEDULE]: 'Lihat Jadwal',
      [this.PERMISSIONS.MANAGE_SUBJECTS]: 'Kelola Mata Pelajaran',
      [this.PERMISSIONS.MANAGE_TEACHERS]: 'Kelola Data Guru',
      [this.PERMISSIONS.MANAGE_STUDENTS]: 'Kelola Data Siswa',
      [this.PERMISSIONS.MANAGE_ADMINS]: 'Kelola Data Admin',
      [this.PERMISSIONS.VIEW_USERS]: 'Lihat Data Pengguna',
      [this.PERMISSIONS.VIEW_ACADEMIC_REPORTS]: 'Lihat Laporan Akademik',
      [this.PERMISSIONS.GENERATE_REPORTS]: 'Generate Laporan',
      [this.PERMISSIONS.VIEW_STATISTICS]: 'Lihat Statistik',
      [this.PERMISSIONS.SYSTEM_SETTINGS]: 'Pengaturan Sistem',
      [this.PERMISSIONS.MANAGE_NOTIFICATIONS]: 'Kelola Notifikasi',
      [this.PERMISSIONS.MANAGE_CLASSES]: 'Kelola Kelas',
      [this.PERMISSIONS.VIEW_CLASSES]: 'Lihat Data Kelas'
    };

    return permissionNames[permission] || permission;
  }

  /**
   * Check if user can access admin dashboard
   * @returns {Promise<boolean>}
   */
  static async canAccessAdminDashboard() {
    try {
      // Get user data directly from AsyncStorage to avoid circular dependency
      const userType = await AsyncStorage.getItem('currentUserType');
      
      if (!userType || userType !== 'admin') {
        return false;
      }
      
      const loginDataJSON = await AsyncStorage.getItem(`loginData_${userType}`);
      if (!loginDataJSON) {
        return false;
      }
      
      const loginData = JSON.parse(loginDataJSON);
      return loginData.isLoggedIn;
    } catch (error) {
      console.error('Error checking admin dashboard access:', error);
      return false;
    }
  }

  /**
   * Check if current user is a Kaprodi (either TKJ or TKR)
   * @returns {Promise<boolean>}
   */
  static async isKaprodi() {
    try {
      const userRole = await this.getCurrentUserRole();
      return userRole === this.ROLES.KAPRODI_TKJ || userRole === this.ROLES.KAPRODI_TKR;
    } catch (error) {
      console.error('Error checking if user is Kaprodi:', error);
      return false;
    }
  }

  /**
   * Get current user's department (for Kaprodi users)
   * @returns {Promise<string|null>} - Returns 'TKJ', 'TKR', or null
   */
  static async getUserDepartment() {
    try {
      const userRole = await this.getCurrentUserRole();
      
      if (userRole === this.ROLES.KAPRODI_TKJ) return 'TKJ';
      if (userRole === this.ROLES.KAPRODI_TKR) return 'TKR';
      return null;
    } catch (error) {
      console.error('Error getting user department:', error);
      return null;
    }
  }

  /**
   * Check if user can view data for a specific department
   * @param {string} department - Department to check access for ('TKJ' or 'TKR')
   * @returns {Promise<boolean>}
   */
  static async canViewDepartmentData(department) {
    try {
      const userRole = await this.getCurrentUserRole();
      
      // Super admin and regular admin can view all departments
      if (userRole === this.ROLES.SUPER_ADMIN || userRole === this.ROLES.ADMIN) {
        return true;
      }
      
      // Wakasek can view all departments
      if (userRole === this.ROLES.WAKASEK_KURIKULUM || 
          userRole === this.ROLES.WAKASEK_KESISWAAN || 
          userRole === this.ROLES.KEPALA_SEKOLAH) {
        return true;
      }
      
      // Kaprodi can only view their own department
      if (userRole === this.ROLES.KAPRODI_TKJ) {
        return department === 'TKJ';
      }
      
      if (userRole === this.ROLES.KAPRODI_TKR) {
        return department === 'TKR';
      }
      
      return false;
    } catch (error) {
      console.error('Error checking department data access:', error);
      return false;
    }
  }
}

export default PermissionService;
