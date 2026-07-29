import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCXqI-JcCKkSnyXhcFhyK3_51DIYRdLzAA",
  authDomain: "servicoja-c3640.firebaseapp.com",
  projectId: "servicoja-c3640",
  storageBucket: "servicoja-c3640.firebasestorage.app",
  messagingSenderId: "1036752439227",
  appId: "1:1036752439227:web:e0828a09c882adc52d669e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;