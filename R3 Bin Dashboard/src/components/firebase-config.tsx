import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAntJAPzq075eX8f9cce3VIB0Sw92vmmdM",
  authDomain: "fostride-f56ea.firebaseapp.com",
  projectId: "fostride-f56ea",
  storageBucket: "fostride-f56ea.firebasestorage.app",
  messagingSenderId: "391340825157",
  appId: "1:391340825157:web:49df7a979e3cb05bce212c",
  measurementId: "G-5TZSVCB1HB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);