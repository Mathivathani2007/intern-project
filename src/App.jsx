import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPhoneNumber,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  RecaptchaVerifier
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  ref as dbRef,
  set as setRealtime,
  onValue,
  remove as removeRealtime
} from 'firebase/database';
import { auth, db, database, googleProvider, requestForToken, logAnalyticsEvent, saveAnalyticsEvent, recordCrashReport } from './firebase';
import Gallery from './Gallery';
import Chat from './Chat';
import BusinessSuite from './BusinessSuite';
import './index.css';
import Attendance from './Attendance';
import StudentRecords from './StudentRecords';


function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  // Profile Form State
  const [profileData, setProfileData] = useState({
    displayName: '',
    role: '',
    company: ''
  });
  
  // Realtime DB State
  const [liveMessage, setLiveMessage] = useState('');
  const [liveData, setLiveData] = useState('');
  
  // UI State
    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchProfile(currentUser.uid);
        requestForToken();
      }
    });
    return () => unsubscribe();
  }, []);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      setLiveData('');
      return;
    }

    const realtimeRef = dbRef(database, `users/${user.uid}/realtimeMessage`);
    return onValue(realtimeRef, (snapshot) => {
      const value = snapshot.val();
      setLiveData(value || 'No message stored yet.');
    });
  }, [user]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const trackUserEvent = (eventName, params = {}) => {
    logAnalyticsEvent(eventName, params);
    saveAnalyticsEvent(eventName, { ...params, userId: user?.uid || null, email: user?.email || null });
  };

  const simulateCrash = () => {
    try {
      throw new Error('Controlled crash simulation from Task 41');
    } catch (error) {
      recordCrashReport(error, { section: 'crash_demo', userEmail: user?.email });
      showMessage('Crash report recorded. Check the crashReports collection in Firestore.');
    }
  };

  // --- Auth Functions ---
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      }, auth);
      window.recaptchaVerifier.render().catch(console.error);
    }
    return window.recaptchaVerifier;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        trackUserEvent('user_login', { method: 'email' });
        showMessage("Logged in successfully!");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create initial empty profile
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          role: 'user',
          createdAt: new Date().toISOString()
        });
        trackUserEvent('user_signup', { method: 'email' });
        showMessage("Account created successfully!");
      }
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleSendPhoneCode = async (e) => {
    e.preventDefault();
    try {
      const verifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      showMessage('Verification code sent. Check your phone.');
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleVerifyPhoneCode = async (e) => {
    e.preventDefault();
    try {
      if (!confirmationResult) return;
      const result = await confirmationResult.confirm(otp);
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          phone: result.user.phoneNumber,
          role: 'user',
          createdAt: new Date().toISOString()
        });
      }
      trackUserEvent('user_login', { method: 'phone' });
      showMessage('Phone authentication successful!');
      setConfirmationResult(null);
      setPhone('');
      setOtp('');
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleWriteRealtimeData = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const realtimeRef = dbRef(database, `users/${user.uid}/realtimeMessage`);
      await setRealtime(realtimeRef, liveMessage || '');
      showMessage('Realtime DB message saved successfully.');
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleDeleteRealtimeData = async () => {
    if (!user) return;
    try {
      const realtimeRef = dbRef(database, `users/${user.uid}/realtimeMessage`);
      await removeRealtime(realtimeRef);
      showMessage('Realtime DB message deleted.');
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Check if profile exists, if not create one
      const docRef = doc(db, "users", result.user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          role: 'user',
          createdAt: new Date().toISOString()
        });
      }
      trackUserEvent('user_login', { method: 'google' });
      showMessage("Google Sign-In successful!");
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleSignOut = () => {
    trackUserEvent('user_signout', {});
    signOut(auth);
    setProfileData({ displayName: '', role: '', company: '' });
  };

  // --- Firestore CRUD Functions ---
  const fetchProfile = async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData({
          displayName: data.displayName || '',
          role: data.role || 'user',
          company: data.company || ''
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        displayName: profileData.displayName,
        role: profileData.role,
        company: profileData.company,
        updatedAt: new Date().toISOString()
      });
      showMessage("Profile updated successfully! (Update)");
    } catch (error) {
      showMessage("Error updating profile: " + error.message);
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm("Are you sure you want to delete your profile data?")) {
      try {
        await deleteDoc(doc(db, "users", user.uid));
        setProfileData({ displayName: '', role: '', company: '' });
        showMessage("Profile data deleted successfully! (Delete)");
      } catch (error) {
        showMessage("Error deleting profile: " + error.message);
      }
    }
  };
  return (
    <>
      {message && <div className="toast" style={{ position: 'fixed', top: '20px', right: '20px', background: '#333', color: '#fff', padding: '10px 20px', borderRadius: '4px', zIndex: 9999 }}>{message}</div>}

      {!user ? (
        /* 🔒 AUTHENTICATION FLOW LAYER (Logged-Out View) */
        <div className="auth-container" style={{ maxWidth: '450px', margin: '60px auto', padding: '30px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' }}>
          
          {/* Email/Password Block */}
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label style={{ fontWeight: '600' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: '600' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <button type="submit" style={{ padding: '12px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isLogin ? 'Sign In with Email' : 'Register Account'}
            </button>
          </form>

          <p onClick={() => setIsLogin(!isLogin)} style={{ textAlign: 'center', margin: '15px 0', cursor: 'pointer', color: '#007bff' }}>
            {isLogin ? "Need an account? Sign Up Instead" : "Already registered? Sign In Instead"}
          </p>

          <div style={{ textTransform: 'uppercase', textAlign: 'center', color: '#888', fontSize: '12px', margin: '20px 0' }}>or</div>

          {/* Phone Authentication Verification Module */}
          <h3>📱 Sign In with Phone Number</h3>
          <div id="recaptcha-container"></div>
          
          {!confirmationResult ? (
            <form onSubmit={handleSendPhoneCode} style={{ display: 'flex', gap: '10px' }}>
              <input type="tel" placeholder="+1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <button type="submit" style={{ padding: '10px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Send Code</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneCode} style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Enter 6-Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <button type="submit" style={{ padding: '10px', background: '#9C27B0', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Verify OTP</button>
            </form>
          )}

          <div style={{ borderTop: '1px solid #eee', marginTop: '25px', paddingTop: '20px' }}>
            <button onClick={handleGoogleSignIn} style={{ width: '100%', padding: '12px', background: '#ea4335', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              🌐 Sign In with Google
            </button>
          </div>
        </div>
      ) : (
        /* 🔓 CORE DASHBOARD VIEW PORT (Logged-In View) */
        <DashboardLayout currentView={currentView} onViewChange={setCurrentView}>
          
          {/* Dynamic Render Controller */}
          {currentView === 'dashboard' && (
            <div>
              <h2>📋 Student Records & Administration</h2>
              <StudentRecords user={user} />
              
              <div style={{ marginTop: '30px', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3>👤 Profile Details Management (Firestore CRUD)</h3>
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Display Name" value={profileData.displayName} onChange={(e) => setProfileData({...profileData, displayName: e.target.value})} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <input type="text" placeholder="Role" value={profileData.role} onChange={(e) => setProfileData({...profileData, role: e.target.value})} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <input type="text" placeholder="Company" value={profileData.company} onChange={(e) => setProfileData({...profileData, company: e.target.value})} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <button type="submit" style={{ padding: '10px 20px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
                  <button type="button" onClick={handleDeleteProfile} style={{ padding: '10px 20px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete Profile Info</button>
                </form>
              </div>
            </div>
          )}

          {currentView === 'chat' && (
            <div>
              <h2>💬 Real-Time Shared Chatroom</h2>
              <Chat user={user} />
            </div>
          )}

          {currentView === 'attendance' && (
            <div>
              <h2>📅 Operational Attendance Log</h2>
              <Attendance user={user} />
            </div>
          )}

          {currentView === 'booking' && (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '8px' }}>
              <h2>📆 Appointment Scheduling Interface</h2>
              <p>Appointment booking management services connected asynchronously to localized instances.</p>
            </div>
          )}

          {currentView === 'events' && (
            <div>
              <h2>🎟️ Event Management & Tickets</h2>
              <Gallery user={user} />
            </div>
          )}

          {currentView === 'business' && (
            <div>
              <h2>💼 Enterprise Business Suite</h2>
              <BusinessSuite user={user} role={profileData?.role || 'user'} />
            </div>
          )}

          {currentView === 'admin' && (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '8px' }}>
              <h2>🛡️ Master Project Control Hub</h2>
              
              {/* Realtime Database Feature Integration */}
              <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
                <h4>📡 Realtime Database Messaging Tunnel</h4>
                <form onSubmit={handleWriteRealtimeData} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input type="text" placeholder="Type a sync string..." value={liveMessage} onChange={(e) => setLiveMessage(e.target.value)} style={{ flex: 1, padding: '10px' }} />
                  <button type="submit" style={{ padding: '10px', background: '#009688', color: '#fff', border: 'none' }}>Set String</button>
                </form>
                <div><strong>Current Cluster Value:</strong> <span style={{ color: '#007bff' }}>{liveData}</span></div>
                <button onClick={handleDeleteRealtimeData} style={{ marginTop: '10px', padding: '6px 12px', background: '#ff9800', border: 'none', color: '#fff', cursor: 'pointer' }}>Flush Realtime Path</button>
              </div>
            </div>
          )}

          {/* Operational Framework Footer System */}
          <div style={{ marginTop: '4rem', paddingTop: '20px', borderTop: '1px solid #ddd', display: 'flex', gap: '15px' }}>
            <button onClick={simulateCrash} style={{ padding: '10px 16px', cursor: 'pointer', background: '#e06c75', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              💥 Simulate Crashlytics Error
            </button>
            <button onClick={handleSignOut} style={{ padding: '10px 16px', cursor: 'pointer', background: '#5c6370', color: '#fff', border: 'none', borderRadius: '4px', marginLeft: 'auto' }}>
              🚪 Log Out Session
            </button>
          </div>

        </DashboardLayout>
      )}
    </>
  );
}

export default App;
