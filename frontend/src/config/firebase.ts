import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyA9z11WU2xeIIly2s69Em1eBhj9r2UfiWs",
  authDomain: "intranet-saas.firebaseapp.com",
  projectId: "intranet-saas",
  storageBucket: "intranet-saas.firebasestorage.app",
  messagingSenderId: "976595782279",
  appId: "1:976595782279:web:345d67a22f1521f0ed8622",
  measurementId: "G-VF0QSP15NJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

// Check if messaging is supported in this browser
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export { app, messaging };