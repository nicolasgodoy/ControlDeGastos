import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBiT-tF-yAfBJaTT95W5ks1lwt0qvuFNkA",
    authDomain: "controldegastosmoneyflow.firebaseapp.com",
    projectId: "controldegastosmoneyflow",
    storageBucket: "controldegastosmoneyflow.firebasestorage.app",
    messagingSenderId: "446360723310",
    appId: "1:446360723310:web:de9a6953af45aec9536b7f",
    measurementId: "G-JB2E7NKX4T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
