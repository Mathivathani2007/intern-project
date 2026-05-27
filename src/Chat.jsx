import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, messaging } from './firebase';

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [fcmToken, setFcmToken] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize FCM and request permissions
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Note: To actually get a token, you need a VAPID key from the console
          // const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
          // setFcmToken(token);
          setFcmToken('Permission granted (Requires VAPID key for real token)');
        }
      } catch (error) {
        console.error('FCM Permission error:', error);
      }
    };
    
    requestPermission();

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      alert(`New Notification: ${payload.notification.title} - ${payload.notification.body}`);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore chat messages
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'globalChat'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs.reverse());
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'globalChat'), {
        text: newMessage,
        uid: user.uid,
        email: user.email || user.phoneNumber,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="card large" style={{ marginTop: '2rem' }}>
      <h2>Real-Time Chat & Messaging</h2>
      <p className="subtitle">Global Chat Room (Tasks 26 & 27) and Cloud Messaging (Tasks 24 & 25)</p>
      
      <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#333', borderRadius: '4px', fontSize: '0.9rem' }}>
        <strong>Push Notifications Status:</strong> {fcmToken ? fcmToken : 'Requesting permission...'}
      </div>

      <div style={{
        height: '300px',
        overflowY: 'auto',
        backgroundColor: '#1a1a1a',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            style={{ 
              alignSelf: msg.uid === user.uid ? 'flex-end' : 'flex-start',
              backgroundColor: msg.uid === user.uid ? '#4285F4' : '#333',
              padding: '0.5rem 1rem',
              borderRadius: '16px',
              maxWidth: '80%'
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#ccc', marginBottom: '0.2rem' }}>
              {msg.email}
            </div>
            <div>{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <button type="submit" style={{ width: 'auto' }}>Send</button>
      </form>
    </div>
  );
};

export default Chat;
