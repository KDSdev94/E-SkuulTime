import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBW4V8LafNVkvhkQlfXBKBMT0Hd8uHjYAM",
  authDomain: "expo-firebase-f28df.firebaseapp.com",
  projectId: "expo-firebase-f28df",
  storageBucket: "expo-firebase-f28df.firebasestorage.app",
  messagingSenderId: "444588763749",
  appId: "1:444588763749:android:5ae27f5975be4ac615b48c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
