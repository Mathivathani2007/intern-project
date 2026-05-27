import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * Reusable Firestore module (Task 79)
 */

export const FirestoreModule = {
  collectionRef: (name) => collection(db, name),
  docRef: (collectionName, id) => doc(db, collectionName, id),
  getDoc: (ref) => getDoc(ref),
  getDocs: (q) => getDocs(q),
  add: (collectionName, data) => addDoc(collection(db, collectionName), data),
  set: (collectionName, id, data) => setDoc(doc(db, collectionName, id), data),
  update: (collectionName, id, data) => updateDoc(doc(db, collectionName, id), data),
  delete: (collectionName, id) => deleteDoc(doc(db, collectionName, id)),
  query: (collectionName, constraints) => query(collection(db, collectionName), ...constraints),
  where,
  orderBy,
  limit
};

export default FirestoreModule;
