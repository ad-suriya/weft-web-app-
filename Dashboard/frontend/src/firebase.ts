import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Project: the-last-minute-life-saver. The web apiKey is not a secret — it only
// identifies the project; access is gated by Firebase Auth + backend token
// verification (Dashboard/backend/auth.py).
const firebaseConfig = {
  apiKey: 'AIzaSyD9g_eFvtJ_PEGlegDO6vZbh8bb-HmyXhI',
  authDomain: 'the-last-minute-life-saver.firebaseapp.com',
  projectId: 'the-last-minute-life-saver',
  storageBucket: 'the-last-minute-life-saver.firebasestorage.app',
  messagingSenderId: '699426432892',
  appId: '1:699426432892:web:f0d9bfdc885557a67026f9',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
