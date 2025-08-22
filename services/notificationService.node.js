import { database, ensureAuth } from '../config/firebase.js';
import { ref, push, serverTimestamp } from 'firebase/database';

export const createNotification = async (userId, message, senderInfo = null, notificationType = 'general', userType = null, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure authentication before database operations
      await ensureAuth();

      const notificationsRef = ref(database, 'notifications');
      const notificationData = {
        userId,
        message,
        read: false,
        createdAt: serverTimestamp(),
        type: notificationType, // e.g., 'jadwal', 'data', 'profil', 'general'
        targetUserType: userType, // 'guru', 'murid', 'admin'
      };
      
      // Add sender information if provided
      if (senderInfo && typeof senderInfo === 'object') {
        notificationData.senderName = senderInfo.name || 'Unknown';
        notificationData.senderType = senderInfo.type || 'system';
        notificationData.senderId = senderInfo.id || null;
      }
      
      const result = await push(notificationsRef, notificationData);
      
      // Success - log and return
      if (attempt > 1) {
        console.log(`✅ Notification created successfully on attempt ${attempt} for user: ${userId}`);
      }
      return result;
      
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for user ${userId}:`, error.message);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`❌ Final attempt failed for user ${userId}:`, error);
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};
