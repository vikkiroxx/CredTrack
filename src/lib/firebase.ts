import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyARMOBCzPANMylXnpo2i6qvH38dFbrVm-4",
    authDomain: "credtrack-41671.firebaseapp.com",
    projectId: "credtrack-41671",
    storageBucket: "credtrack-41671.firebasestorage.app",
    messagingSenderId: "347195704186",
    appId: "1:347195704186:web:f8a4748bfa51267d9e4cc3",
    measurementId: "G-4NDKQ8DQ56"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
// Optional: Global setting as backup
// @ts-expect-error - ignoreUndefinedProperties is valid in recent SDKs but types might lag
if (db._settings) db._settings.ignoreUndefinedProperties = true;
