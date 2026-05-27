import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';

/**
 * Reusable Auth module (Task 79)
 */

export const AuthModule = {
  signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signOut: () => signOut(auth),
  onAuthStateChanged: (cb) => onAuthStateChanged(auth, cb),
  sendPasswordReset: (email) => sendPasswordResetEmail(auth, email)
};

export default AuthModule;
