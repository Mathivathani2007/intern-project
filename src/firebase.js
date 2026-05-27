import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, addDoc, collection, enableIndexedDbPersistence, connectFirestoreEmulator } from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getMessaging, getToken } from "firebase/messaging";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getPerformance, trace } from "firebase/performance";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChAInuXIEKVKHpT-tmW8Ujq-NvpTCRe0g",
  authDomain: "my-app-4667f.firebaseapp.com",
  projectId: "my-app-4667f",
  storageBucket: "my-app-4667f.firebasestorage.app",
  messagingSenderId: "124306665003",
  appId: "1:124306665003:web:23ddb52af2273ff415446e",
  measurementId: "G-3MXTMDJKL9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
export const functions = getFunctions(app);
const isEmulator = typeof window !== 'undefined' && window.location.hostname === 'localhost';
export const apiBaseUrl = isEmulator
  ? `http://127.0.0.1:5001/${firebaseConfig.projectId}/us-central1/api`
  : `https://us-central1.${firebaseConfig.projectId}.cloudfunctions.net/api`;

if (isEmulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectDatabaseEmulator(database, "127.0.0.1", 9000);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}

let analyticsInstance = null;
let performanceInstance = null;

try {
  analyticsInstance = getAnalytics(app);
} catch (error) {
  console.warn("Firebase Analytics initialization failed:", error);
}

try {
  performanceInstance = getPerformance(app);
} catch (error) {
  console.warn("Firebase Performance initialization failed:", error);
}

enableIndexedDbPersistence(db).catch((err) => {
  console.warn("Unable to enable IndexedDB persistence:", err);
});

export const analytics = analyticsInstance;
export const performance = performanceInstance;
export const googleProvider = new GoogleAuthProvider();

export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const currentToken = await getToken(messaging, {
        vapidKey: "BCM5xefywhHBCLpkGSxOjgBWTEBCTAJYSuIUB63ETjTCfmUx1WdtjSTR5wEsG1WXIv40Pg1_yEyA3AtXWLIuaHg"
      });
      if (currentToken) {
        console.log("FCM Token:", currentToken);
      } else {
        console.log("No registration token available.");
      }
    }
  } catch (err) {
    console.log("Error getting token: ", err);
  }
};

export const logAnalyticsEvent = (eventName, params = {}) => {
  if (!analyticsInstance) return;
  logEvent(analyticsInstance, eventName, params);
};

export const startTrace = (traceName) => {
  if (!performanceInstance) return null;
  try {
    return trace(performanceInstance, traceName);
  } catch (error) {
    console.warn("Performance trace failed:", error);
    return null;
  }
};

export const recordCrashReport = async (error, payload = {}) => {
  try {
    await addDoc(collection(db, 'crashReports'), {
      message: error?.message || 'Unknown error',
      stack: error?.stack || null,
      context: payload,
      user: payload.userEmail || null,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Error storing crash report:', err);
  }
};

export const saveAnalyticsEvent = async (eventName, data = {}) => {
  try {
    await addDoc(collection(db, 'analyticsEvents'), {
      eventName,
      data,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Error saving analytics event:', error);
  }
};
