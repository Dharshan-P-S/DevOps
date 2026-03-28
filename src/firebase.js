import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByawddO4lNyc3ePEEXm651HIifeb8yOAE",
  authDomain: "course-registration-devops.firebaseapp.com",
  projectId: "course-registration-devops",
  storageBucket: "course-registration-devops.firebasestorage.app",
  messagingSenderId: "298368154363",
  appId: "1:298368154363:web:15ede628be63b25d44ce5e"
};

const app        = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const provider = new GoogleAuthProvider();