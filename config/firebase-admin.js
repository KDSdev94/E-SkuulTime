import admin from 'firebase-admin';

// Service account configuration (menggunakan konfigurasi yang sama)
const serviceAccount = {
  type: "service_account",
  project_id: "expo-firebase-f28df",
  private_key_id: "dummy_key_id",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-xyz@expo-firebase-f28df.iam.gserviceaccount.com",
  client_id: "123456789",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xyz%40expo-firebase-f28df.iam.gserviceaccount.com"
};

// Initialize Admin SDK dengan fallback untuk development
let adminApp;
try {
  if (!admin.apps.length) {
    // Try to initialize with service account first
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://expo-firebase-f28df-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
  } else {
    adminApp = admin.app();
  }
} catch (error) {
  console.log('⚠️ Admin SDK initialization failed, using alternative approach...');
  
  // Alternative: Initialize without credentials for development
  try {
    if (!admin.apps.length) {
      adminApp = admin.initializeApp({
        databaseURL: "https://expo-firebase-f28df-default-rtdb.asia-southeast1.firebasedatabase.app"
      });
    } else {
      adminApp = admin.app();
    }
  } catch (altError) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', altError);
    throw altError;
  }
}

export const adminDatabase = admin.database();
export const adminAuth = admin.auth();

export default adminApp;
