// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import type { User } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqIZq8PL_9c1rdlU51SbuS32-uM1i5lVY",
  authDomain: "musemap-9d76c.firebaseapp.com",
  projectId: "musemap-9d76c",
  storageBucket: "musemap-9d76c.firebasestorage.app",
  messagingSenderId: "386842117150",
  appId: "1:386842117150:web:4fd6c13c20d0803a341a0f",
  measurementId: "G-BPWWJ5NJNR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);

// Auth functions
export const registerUser = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export { auth }; 