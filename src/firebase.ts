import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
// React Native persistence helper (available in firebase 9.3+)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require('firebase/auth');
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  projectId: 'gen-lang-client-0799600946',
  appId: '1:503162804685:web:a9a1446c022fc0a553cc84',
  apiKey: 'AIzaSyAXI8jFegj8rGK_rQ5xVZaSGajjQli3n0I',
  authDomain: 'gen-lang-client-0799600946.firebaseapp.com',
  storageBucket: 'gen-lang-client-0799600946.firebasestorage.app',
  messagingSenderId: '503162804685',
};

const FIRESTORE_DB_ID = 'ai-studio-934be5ac-fb1f-47e7-a89d-cbc72af93b11';

const app = initializeApp(firebaseConfig);

// Auth with AsyncStorage persistence so session survives app restarts
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app, FIRESTORE_DB_ID);

const functions = getFunctions(app);

export {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDocFromServer,
};

export async function deleteAuthUser(uid: string): Promise<void> {
  const fn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'deleteAuthUser');
  await fn({ uid });
}

export async function createOrLinkUser(
  name: string,
  email: string,
  password: string,
  role: string
): Promise<{ status: string; uid?: string }> {
  const fn = httpsCallable<
    { name: string; email: string; password: string; role: string },
    { status: string; uid?: string }
  >(functions, 'createOrLinkUser');
  const result = await fn({ name, email, password, role });
  return result.data;
}

// Test Firebase connection
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch {
    return false;
  }
}
