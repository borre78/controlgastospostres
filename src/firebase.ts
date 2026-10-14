
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6oZw5SQ4w2gw_T776-SnLgXCs3290mdk",
  authDomain: "postresmila-4bf18.firebaseapp.com",
  projectId: "postresmila-4bf18",
  storageBucket: "postresmila-4bf18.firebasestorage.app",
  messagingSenderId: "99304660714",
  appId: "1:99304660714:web:8545a713d5477284a98193",
  measurementId: "G-46112TELHY"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
