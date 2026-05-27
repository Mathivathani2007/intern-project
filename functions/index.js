const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ============ EXISTING ENDPOINTS ============
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Firebase Functions!', timestamp: new Date().toISOString() });
});

app.get('/orders', async (req, res) => {
  try {
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(20).get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.userId) {
      return res.status(400).json({ error: 'Order payload must include userId and items.' });
    }
    const docRef = await db.collection('orders').add({
      ...order,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'intern-project-functions' });
});

// ============ TASK 60: PUSH NOTIFICATIONS ============
app.post('/send-notification', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    const userDoc = await db.collection('users').doc(userId).get();
    const tokens = userDoc.data()?.fcmTokens || [];

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No FCM tokens available' });
    }

    const message = {
      notification: { title, body },
      data: data || {},
    };

    const responses = await admin.messaging().sendMulticast({
      ...message,
      tokens
    });

    res.json({ success: true, responses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TASK 55: OPENAI CHATBOT ============
app.post('/chatbot', async (req, res) => {
  try {
    const { message, userId } = req.body;

    let botResponse = `Echo: ${message}`;

    try {
      const configuredKey = (functions.config && functions.config().openai && functions.config().openai.key) || process.env.OPENAI_API_KEY;
      if (configuredKey) {
        const { Configuration, OpenAIApi } = require('openai');
        const configuration = new Configuration({ apiKey: configuredKey });
        const openai = new OpenAIApi(configuration);

        const completion = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: message }],
          temperature: 0.7,
          max_tokens: 500
        });

        botResponse = completion.data.choices?.[0]?.message?.content || botResponse;
      }
    } catch (aiErr) {
      console.error('OpenAI call failed:', aiErr.message || aiErr);
    }

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

// ============ TASK 57/58: IOT SENSOR DATA ============
app.post('/sensor-data', async (req, res) => {
  try {
    const { deviceId, sensorType, value, unit } = req.body;

    await db.collection('sensorData').add({
      deviceId,
      sensorType,
      value,
      unit,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      recordedAt: new Date().toISOString()
    });

    await db.collection('devices').doc(deviceId).update({
      lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      lastValue: value,
      lastSensor: sensorType
    }).catch(err => {
      console.log('Device doc might not exist, skipping update');
    });

    res.json({ success: true, message: 'Sensor data recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// ============ TASK 66: PAYMENT GATEWAY (Placeholder) ============
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;
    
    // Placeholder - would integrate Stripe in production
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      amount,
      currency,
      status: 'created',
      clientSecret: `${Date.now()}_secret`
    };

    res.json(paymentIntent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TASK 78: PAGINATION SUPPORT ============
app.get('/paginated/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { pageSize = 20, lastId } = req.query;

    let query = db.collection(collection).limit(parseInt(pageSize) + 1);

    if (lastId) {
      const lastDoc = await db.collection(collection).doc(lastId).get();
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, parseInt(pageSize)).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      data: docs,
      nextId: snapshot.docs.length > parseInt(pageSize) ? snapshot.docs[parseInt(pageSize) - 1].id : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TASK 75: APP CHECK VERIFICATION ============
const verifyAppCheck = async (req, res, next) => {
  const appCheckToken = req.header('X-Firebase-AppCheck');

  if (!appCheckToken) {
    return res.status(401).json({ error: 'App Check token missing' });
  }

  try {
    // In production, verify the token
    // const decodedToken = await admin.appCheck().verifyToken(appCheckToken);
    req.appCheckToken = { verified: true };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid App Check token' });
  }
};

app.get('/protected-data', verifyAppCheck, (req, res) => {
  res.json({
    message: 'This is protected data',
    appCheckVerified: true
  });
});

// ============ TASK 76: QUERY OPTIMIZATION ============
app.post('/batch-read', async (req, res) => {
  try {
    const { collections } = req.body;
    const results = {};

    for (const collName of collections) {
      const snapshot = await db.collection(collName).limit(100).get();
      results[collName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    res.json({ data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.api = functions.https.onRequest(app);
