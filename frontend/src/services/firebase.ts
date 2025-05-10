// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";

// Firebase configuration should be stored in environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if all environment variables are defined
if (!firebaseConfig.apiKey || 
    !firebaseConfig.authDomain || 
    !firebaseConfig.projectId) {
  console.error('Firebase environment variables are missing. Please check your .env file.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

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

// Music data functions
export interface MusicData {
  id?: string;
  userId: string;
  name: string;
  description: string;
  mood: string;
  genre: string;
  instruments: string;
  tempo: string;
  duration: number;
  audioUrl: string;
  created: Date | Timestamp;
}

export const saveUserMusic = async (musicData: Omit<MusicData, 'id' | 'created'>) => {
  try {
    const docRef = await addDoc(collection(db, "music"), {
      ...musicData,
      created: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving music: ", error);
    throw error;
  }
};

export const getUserMusic = async (userId: string) => {
  try {
    const q = query(collection(db, "music"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const music: MusicData[] = [];
    querySnapshot.forEach((doc) => {
      music.push({ id: doc.id, ...doc.data() } as MusicData);
    });
    return music;
  } catch (error) {
    console.error("Error fetching user music: ", error);
    throw error;
  }
};

export const updateUserMusic = async (musicId: string, updates: Partial<MusicData>) => {
  try {
    const musicRef = doc(db, "music", musicId);
    await updateDoc(musicRef, updates);
    return true;
  } catch (error) {
    console.error("Error updating music: ", error);
    throw error;
  }
};

export const getMusicById = async (musicId: string) => {
  try {
    const docRef = doc(db, "music", musicId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MusicData;
    } else {
      throw new Error("Music not found");
    }
  } catch (error) {
    console.error("Error fetching music: ", error);
    throw error;
  }
};

export { auth, db }; 