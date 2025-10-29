// frontend/src/firebaseClient.js
// Firebase client initialization for web app
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore'; // ✅ Added Firestore

const firebaseConfig = {
  apiKey: "AIzaSyAWZK-RRx-IrnOZzMOAC8A5lKiAg5ZTRjI",
  authDomain: "savkardatabase.firebaseapp.com",
  databaseURL: "https://savkardatabase-default-rtdb.firebaseio.com",
  projectId: "savkardatabase",
  storageBucket: "savkardatabase.firebasestorage.app",
  messagingSenderId: "646417372861",
  appId: "1:646417372861:web:964fb0559e6b9d8e0bc9d4",
  measurementId: "G-FKBZSEZSHP"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // ✅ Firestore initialized

let analytics = null;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (e) {
  // ignore analytics initialization issues
}

export { app, auth, db, analytics }; // ✅ Export db