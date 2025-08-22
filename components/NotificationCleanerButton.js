import React, { useState } from 'react';
import { AppNotificationCleaner } from '../utils/cleanNotificationsHelper.js';

const NotificationCleanerButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleGetStats = async () => {
    setIsLoading(true);
    try {
      const notificationStats = await AppNotificationCleaner.getNotificationStats();
      setStats(notificationStats);
      setShowModal(true);
    } catch (error) {
      console.error('Error getting stats:', error);
      alert('Error getting notification stats: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickClean = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus notifikasi yang sudah dibaca dan yang lebih dari 7 hari?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const deletedCount = await AppNotificationCleaner.quickClean();
      alert(`Berhasil menghapus ${deletedCount} notifikasi!`);
      // Refresh stats setelah pembersihan
      await handleGetStats();
    } catch (error) {
      console.error('Error during quick clean:', error);
      alert('Error during cleaning: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRead = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua notifikasi yang sudah dibaca?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const deletedCount = await AppNotificationCleaner.deleteReadNotifications();
      alert(`Berhasil menghapus ${deletedCount} notifikasi yang sudah dibaca!`);
      await handleGetStats();
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      alert('Error deleting read notifications: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOld = async (days = 30) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus semua notifikasi yang lebih dari ${days} hari?`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const deletedCount = await AppNotificationCleaner.deleteOldNotifications(days);
      alert(`Berhasil menghapus ${deletedCount} notifikasi lama!`);
      await handleGetStats();
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      alert('Error deleting old notifications: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA notifikasi? Tindakan ini tidak dapat dibatalkan!')) {
      return;
    }
    
    if (!confirm('Konfirmasi sekali lagi: Hapus SEMUA notifikasi?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const deletedCount = await AppNotificationCleaner.deleteAllNotifications();
      alert(`Berhasil menghapus semua ${deletedCount} notifikasi!`);
      await handleGetStats();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      alert('Error deleting all notifications: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3 style={{ marginBottom: '15px', color: '#333' }}>🧹 Pembersihan Notifikasi</h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        <button 
          onClick={handleGetStats}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          📊 Lihat Statistik
        </button>
        
        <button 
          onClick={handleQuickClean}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          ⚡ Pembersihan Cepat
        </button>
        
        <button 
          onClick={handleDeleteRead}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          📖 Hapus Yang Dibaca
        </button>
        
        <button 
          onClick={() => handleDeleteOld(7)}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          📅 Hapus >7 Hari
        </button>
        
        <button 
          onClick={() => handleDeleteOld(30)}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          📅 Hapus >30 Hari
        </button>
        
        <button 
          onClick={handleDeleteAll}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          ⚠️ Hapus Semua
        </button>
      </div>

      {isLoading && (
        <div style={{ color: '#666', fontStyle: 'italic' }}>
          ⏳ Sedang memproses...
        </div>
      )}

      {/* Modal untuk menampilkan statistik */}
      {showModal && stats && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3>📊 Statistik Notifikasi</h3>
            <div style={{ marginBottom: '15px' }}>
              <p><strong>Total notifikasi:</strong> {stats.total}</p>
              <p><strong>Sudah dibaca:</strong> {stats.read}</p>
              <p><strong>Belum dibaca:</strong> {stats.unread}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Berdasarkan tipe:</strong>
              <ul>
                {Object.entries(stats.byType).map(([type, count]) => (
                  <li key={type}>{type}: {count}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Berdasarkan pengirim:</strong>
              <ul>
                {Object.entries(stats.bySender).map(([sender, count]) => (
                  <li key={sender}>{sender}: {count}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Berdasarkan target user:</strong>
              <ul>
                {Object.entries(stats.byTargetUser).map(([target, count]) => (
                  <li key={target}>{target}: {count}</li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => setShowModal(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <p><strong>Petunjuk:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li><strong>Pembersihan Cepat:</strong> Hapus notifikasi yang sudah dibaca + lebih dari 7 hari</li>
          <li><strong>Hapus Yang Dibaca:</strong> Hapus hanya notifikasi yang sudah dibaca</li>
          <li><strong>Hapus >7/30 Hari:</strong> Hapus notifikasi yang lebih dari X hari</li>
          <li><strong>Hapus Semua:</strong> ⚠️ HATI-HATI! Menghapus SEMUA notifikasi</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationCleanerButton;
