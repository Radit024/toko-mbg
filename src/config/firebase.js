import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "toko-mbg.firebaseapp.com",
    projectId: "toko-mbg",
    storageBucket: "toko-mbg.firebasestorage.app",
    messagingSenderId: "298104850594",
    appId: "1:298104850594:web:17a719e5ab1386fa32effb",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Export appId biar bisa dipakai di tempat lain
export const appId = 'toko-mbg-default'; 