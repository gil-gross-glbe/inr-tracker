import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjw5NhGeBRIWO5EVWkGFXdfjspEDEOQsM",
  authDomain: "coumadin-tracker-app-652ea.firebaseapp.com",
  projectId: "coumadin-tracker-app-652ea",
  storageBucket: "coumadin-tracker-app-652ea.firebasestorage.app",
  messagingSenderId: "781153295365",
  appId: "1:781153295365:web:0cc02b98dccb2c844f506c",
  measurementId: "G-K279RVQEDL",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with persistent cache, falling back to memory cache
// if IndexedDB is unavailable (e.g. private browsing, unsupported browser).
let firestore: Firestore;
try {
  firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  console.warn(
    "Persistent cache unavailable, falling back to memory cache",
    e
  );
  firestore = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
}
export const db = firestore;
