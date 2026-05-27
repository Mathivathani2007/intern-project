/**
 * Task 50: Use Firebase with Node.js
 * Backend APIs using Firebase Admin SDK
 * These functions should be added to functions/index.js
 */

/**
 * Example: Setup Firebase Admin SDK in Node.js (for functions/index.js)
 * 
 * const admin = require('firebase-admin');
 * const express = require('express');
 * const cors = require('cors');
 * 
 * admin.initializeApp();
 * const db = admin.firestore();
 * const auth = admin.auth();
 * 
 * const app = express();
 * app.use(cors({ origin: true }));
 * app.use(express.json());
 */

/**
 * Task 55: Integrate OpenAI API with Firebase
 * Cloud Function for AI chatbot
 */
export const openaiIntegrationTemplate = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Configuration, OpenAIApi } = require('openai');
const cors = require('cors');
const express = require('express');

admin.initializeApp();
const db = admin.firestore();

const configuration = new Configuration({
  apiKey: process.env.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,
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Task 8: AI Chatbot endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      max_tokens: 500
    });

    const botResponse = completion.data.choices[0].message.content;

    // Store chat history
    await db.collection('chats').add({
      userId,
      userMessage: message,
      botResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ response: botResponse });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: error.message });
  }
});

exports.chatbot = functions.https.onRequest(app);
`;

/**
 * Task 57, 58: IoT Backend - Sensor Data Storage
 */
export const iotBackendTemplate = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Store sensor data
app.post('/sensor-data', async (req, res) => {
  try {
    const { deviceId, sensorType, value, unit, timestamp } = req.body;

    await db.collection('sensorData').add({
      deviceId,
      sensorType,
      value,
      unit,
      timestamp: timestamp || admin.firestore.FieldValue.serverTimestamp(),
      recordedAt: new Date().toISOString()
    });

    // Create real-time update
    await db.collection('devices').doc(deviceId).update({
      lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      lastValue: value,
      lastSensor: sensorType
    });

    res.json({ success: true, message: 'Sensor data recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sensor data with pagination
app.get('/sensor-data/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 100 } = req.query;

    const snapshot = await db.collection('sensorData')
      .where('deviceId', '==', deviceId)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.iot = functions.https.onRequest(app);
`;

/**
 * Task 60: Push Notification System
 */
export const pushNotificationTemplate = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Send notification
app.post('/send-notification', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    const tokens = userDoc.data().fcmTokens || [];

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No FCM tokens available' });
    }

    // Send to all tokens
    const message = {
      notification: { title, body },
      data: data || {},
    };

    const responses = await messaging.sendMulticast({
      ...message,
      tokens
    });

    res.json({ success: true, responses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to topic
app.post('/subscribe-topic', async (req, res) => {
  try {
    const { tokens, topic } = req.body;
    await messaging.subscribeToTopic(tokens, topic);
    res.json({ success: true, message: 'Subscribed to topic' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.notifications = functions.https.onRequest(app);
`;

/**
 * Task 75: Implement Firebase App Check
 */
export const appCheckTemplate = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Middleware to verify App Check token
const verifyAppCheck = async (req, res, next) => {
  const appCheckToken = req.header('X-Firebase-AppCheck');

  if (!appCheckToken) {
    return res.status(401).json({ error: 'App Check token missing' });
  }

  try {
    const decodedToken = await admin.appCheck().verifyToken(appCheckToken);
    req.appCheckToken = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid App Check token' });
  }
};

app.use(verifyAppCheck);

app.get('/protected-data', (req, res) => {
  res.json({ 
    message: 'This is protected data',
    appCheckVerified: true
  });
});

exports.appCheck = functions.https.onRequest(app);
`;

export default {
  openaiIntegrationTemplate,
  iotBackendTemplate,
  pushNotificationTemplate,
  appCheckTemplate
};
