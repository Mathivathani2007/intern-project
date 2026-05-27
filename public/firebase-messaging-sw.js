importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyChAInuXIEKVKHpT-tmW8Ujq-NvpTCRe0g",
  authDomain: "my-app-4667f.firebaseapp.com",
  projectId: "my-app-4667f",
  storageBucket: "my-app-4667f.firebasestorage.app",
  messagingSenderId: "124306665003",
  appId: "1:124306665003:web:23ddb52af2273ff415446e"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
