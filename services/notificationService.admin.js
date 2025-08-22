import { adminDatabase } from '../config/firebase-admin.js';

export const createNotification = async (userId, message, senderInfo = null, notificationType = 'general', userType = null, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Attempt ${attempt}/${maxRetries} - Creating notification for user: ${userId}`);
      
      const notificationsRef = adminDatabase.ref('notifications');
      const notificationData = {
        userId,
        message,
        read: false,
        createdAt: Date.now(), // Using timestamp instead of serverTimestamp for admin SDK
        type: notificationType,
        targetUserType: userType,
      };
      
      // Add sender information if provided
      if (senderInfo && typeof senderInfo === 'object') {
        notificationData.senderName = senderInfo.name || 'Unknown';
        notificationData.senderType = senderInfo.type || 'system';
        notificationData.senderId = senderInfo.id || null;
      }
      
      const result = await notificationsRef.push(notificationData);
      
      // Success - log and return
      if (attempt > 1) {
        console.log(`✅ Notification created successfully on attempt ${attempt} for user: ${userId}`);
      } else {
        console.log(`✅ Notification created for user: ${userId}`);
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
