import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD-xhzuqHm_MgUyU0GwADPKqhF4w33arEY",
  authDomain: "todolist-3607.firebaseapp.com",
  databaseURL: "https://todolist-3607-default-rtdb.firebaseio.com", 
  projectId: "todolist-3607",
  storageBucket: "todolist-3607.firebasestorage.app",
  messagingSenderId: "765894827747",
  appId: "1:765894827747:web:feec0038724812a05f2fd6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
