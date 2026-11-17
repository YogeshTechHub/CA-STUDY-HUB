// firebase-config.js
// Centralized Firebase v10+ Modular SDK Configuration for CA Study Hub
// Works seamlessly in browsers for GitHub Pages (Spark Free Plan)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  getDocs,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase web configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDYw2OaSBD5p5Suz9jlTHmIf9_a3O6xNyo",
  authDomain: "ca-study-hub-f5479.firebaseapp.com",
  projectId: "ca-study-hub-f5479",
  storageBucket: "ca-study-hub-f5479.firebasestorage.app",
  messagingSenderId: "343921552547",
  appId: "1:343921552547:web:5fadf12e64816a84c72316"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  getDocs,
  serverTimestamp 
};
