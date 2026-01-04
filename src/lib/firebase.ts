import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    projectId: "group-balance-buddy-hp7",
    appId: "1:421572220302:web:b0922ab6efd44c729dc0df",
    storageBucket: "group-balance-buddy-hp7.firebasestorage.app",
    apiKey: "AIzaSyAiOcsVNsl0U1r3jDY3xECKCS1Z0L2B31g",
    authDomain: "group-balance-buddy-hp7.firebaseapp.com",
    messagingSenderId: "421572220302",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
