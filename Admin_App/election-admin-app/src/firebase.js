// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDP9LtIW-qwDR5lp6U808v7Ivj2uC368s0",
  authDomain: "electionnew-app.firebaseapp.com",
  databaseURL: "https://electionnew-app-default-rtdb.firebaseio.com",
  projectId: "electionnew-app",
  storageBucket: "electionnew-app.firebasestorage.app",
  messagingSenderId: "350685026683",
  appId: "1:350685026683:web:7569e3d262f838430985de",
  measurementId: "G-VY03SSL34X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;