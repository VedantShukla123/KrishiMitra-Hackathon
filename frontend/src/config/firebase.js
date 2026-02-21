import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyD0U6RdXKk8X_Q1xRbS2qvv87B5NkySxxg',
  authDomain: 'krishimitra-c74ac.firebaseapp.com',
  projectId: 'krishimitra-c74ac',
  storageBucket: 'krishimitra-c74ac.firebasestorage.app',
  messagingSenderId: '727685418039',
  appId: '1:727685418039:web:ce254e2b6138d54fc143b2',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
