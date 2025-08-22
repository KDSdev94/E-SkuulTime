import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PermissionService from '../services/PermissionService';

/**
 * Component untuk mengontrol akses berdasarkan role dan permissions
 * @param {Object} props
 * @param {string} props.permission - Permission yang diperlukan
 * @param {string} props.role - Role yang diperlukan
 * @param {Array<string>} props.roles - Array role yang diizinkan
 * @param {Array<string>} props.permissions - Array permissions yang diperlukan
 * @param {boolean} props.requireAll - Apakah memerlukan semua permissions/roles (default: false)
 * @param {React.Component} props.children - Component yang akan diproteksi
 * @param {React.Component} props.fallback - Component fallback jika akses ditolak
 * @param {boolean} props.showFallback - Tampilkan fallback atau hide component (default: true)
 */
const ProtectedComponent = ({ 
  permission, 
  role, 
  roles, 
  permissions, 
  requireAll = false,
  children, 
  fallback, 
  showFallback = true 
}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [permission, role, roles, permissions, requireAll]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      let access = false;

      // Check single permission
      if (permission) {
        access = await PermissionService.hasPermission(permission);
      }
      // Check single role
      else if (role) {
        access = await PermissionService.hasRole(role);
      }
      // Check multiple roles
      else if (roles && roles.length > 0) {
        if (requireAll) {
          // User must have ALL specified roles
          const checks = await Promise.all(
            roles.map(r => PermissionService.hasRole(r))
          );
          access = checks.every(check => check === true);
        } else {
          // User must have ANY of the specified roles
          access = await PermissionService.hasAnyRole(roles);
        }
      }
      // Check multiple permissions
      else if (permissions && permissions.length > 0) {
        if (requireAll) {
          // User must have ALL specified permissions
          const checks = await Promise.all(
            permissions.map(p => PermissionService.hasPermission(p))
          );
          access = checks.every(check => check === true);
        } else {
          // User must have ANY of the specified permissions
          const checks = await Promise.all(
            permissions.map(p => PermissionService.hasPermission(p))
          );
          access = checks.some(check => check === true);
        }
      }
      // If no specific permission/role is specified, check if user can access admin dashboard
      else {
        access = await PermissionService.canAccessAdminDashboard();
      }

      setHasAccess(access);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return null; // or a loading spinner if needed
  }

  // If has access, show children
  if (hasAccess) {
    return children;
  }

  // If no access and showFallback is false, hide component
  if (!showFallback) {
    return null;
  }

  // Show custom fallback or default access denied message
  if (fallback) {
    return fallback;
  }

  // Default access denied component
  return (
    <View style={styles.accessDeniedContainer}>
      <Ionicons name="lock-closed" size={48} color="#DC2626" />
      <Text style={styles.accessDeniedTitle}>Akses Ditolak</Text>
      <Text style={styles.accessDeniedMessage}>
        Anda tidak memiliki izin untuk mengakses fitur ini
      </Text>
    </View>
  );
};

/**
 * Higher-order component untuk mengwrap component yang memerlukan proteksi
 * @param {React.Component} WrappedComponent 
 * @param {Object} accessConfig 
 * @returns {React.Component}
 */
export const withPermission = (WrappedComponent, accessConfig = {}) => {
  return (props) => (
    <ProtectedComponent {...accessConfig}>
      <WrappedComponent {...props} />
    </ProtectedComponent>
  );
};

/**
 * Hook untuk mengecek akses di dalam functional component
 * @param {Object} config 
 * @returns {Object} { hasAccess, loading, checkAccess }
 */
export const usePermission = (config = {}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = async () => {
    try {
      setLoading(true);
      let access = false;

      const { permission, role, roles, permissions, requireAll = false } = config;

      if (permission) {
        access = await PermissionService.hasPermission(permission);
      } else if (role) {
        access = await PermissionService.hasRole(role);
      } else if (roles && roles.length > 0) {
        if (requireAll) {
          const checks = await Promise.all(
            roles.map(r => PermissionService.hasRole(r))
          );
          access = checks.every(check => check === true);
        } else {
          access = await PermissionService.hasAnyRole(roles);
        }
      } else if (permissions && permissions.length > 0) {
        if (requireAll) {
          const checks = await Promise.all(
            permissions.map(p => PermissionService.hasPermission(p))
          );
          access = checks.every(check => check === true);
        } else {
          const checks = await Promise.all(
            permissions.map(p => PermissionService.hasPermission(p))
          );
          access = checks.some(check => check === true);
        }
      } else {
        access = await PermissionService.canAccessAdminDashboard();
      }

      setHasAccess(access);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, [config.permission, config.role, config.roles, config.permissions, config.requireAll]);

  return { hasAccess, loading, checkAccess };
};

const styles = StyleSheet.create({
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9f9f9',
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ProtectedComponent;
