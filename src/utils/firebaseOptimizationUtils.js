/**
 * Task 77: Use Firebase indexing
 * Configuration and utility for Firestore indexes
 */

export const firestoreIndexes = {
  // Task 77: Index configuration for optimized queries
  indexConfiguration: {
    orders: {
      "indexes": [
        {
          "collectionId": "orders",
          "fields": [
            { "fieldPath": "userId", "order": "ASCENDING" },
            { "fieldPath": "status", "order": "ASCENDING" },
            { "fieldPath": "createdAt", "order": "DESCENDING" }
          ]
        },
        {
          "collectionId": "orders",
          "fields": [
            { "fieldPath": "userId", "order": "ASCENDING" },
            { "fieldPath": "createdAt", "order": "DESCENDING" }
          ]
        }
      ]
    },
    appointments: {
      "indexes": [
        {
          "collectionId": "appointments",
          "fields": [
            { "fieldPath": "userId", "order": "ASCENDING" },
            { "fieldPath": "status", "order": "ASCENDING" },
            { "fieldPath": "appointmentDate", "order": "ASCENDING" }
          ]
        }
      ]
    },
    sensorData: {
      "indexes": [
        {
          "collectionId": "sensorData",
          "fields": [
            { "fieldPath": "deviceId", "order": "ASCENDING" },
            { "fieldPath": "timestamp", "order": "DESCENDING" }
          ]
        }
      ]
    }
  },

  /**
   * Generate firestore.indexes.json content
   */
  getIndexesJSON() {
    return JSON.stringify({
      indexes: [
        // Orders index
        {
          collectionGroup: "orders",
          queryScope: "COLLECTION",
          fields: [
            { fieldPath: "userId", order: "ASCENDING" },
            { fieldPath: "status", order: "ASCENDING" },
            { fieldPath: "createdAt", order: "DESCENDING" }
          ]
        },
        // Appointments index
        {
          collectionGroup: "appointments",
          queryScope: "COLLECTION",
          fields: [
            { fieldPath: "userId", order: "ASCENDING" },
            { fieldPath: "status", order: "ASCENDING" },
            { fieldPath: "appointmentDate", order: "ASCENDING" }
          ]
        },
        // Sensor data index
        {
          collectionGroup: "sensorData",
          queryScope: "COLLECTION",
          fields: [
            { fieldPath: "deviceId", order: "ASCENDING" },
            { fieldPath: "timestamp", order: "DESCENDING" }
          ]
        },
        // Users index
        {
          collectionGroup: "users",
          queryScope: "COLLECTION",
          fields: [
            { fieldPath: "role", order: "ASCENDING" },
            { fieldPath: "createdAt", order: "DESCENDING" }
          ]
        }
      ]
    }, null, 2);
  }
};

/**
 * Task 75: Implement Firebase App Check
 */
export class FirebaseAppCheck {
  /**
   * Initialize App Check
   */
  static async initializeAppCheck() {
    try {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
      const { app } = await import('../firebase');

      // Initialize App Check with reCAPTCHA v3
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_V3_PUBLIC_KEY'),
        isTokenAutoRefreshEnabled: true
      });

      return { success: true };
    } catch (error) {
      console.error('App Check initialization error:', error);
      return { success: false, error };
    }
  }

  /**
   * Get App Check token
   */
  static async getAppCheckToken() {
    try {
      const { getAppCheck, getToken } = await import('firebase/app-check');
      const appCheck = getAppCheck();
      const token = await getToken(appCheck, true);
      return token.token;
    } catch (error) {
      console.error('Error getting App Check token:', error);
      return null;
    }
  }
}

export default {
  firestoreIndexes,
  FirebaseAppCheck
};
