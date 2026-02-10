// src/lib/infrastructure/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: 'AIzaSyD2JWxdRU6AhI5WMBHgvLMb6v8x9tLzqw0',
    authDomain: 'coral-swimmer.firebaseapp.com',
    projectId: 'coral-swimmer',
    storageBucket: 'coral-swimmer.appspot.com',
    messagingSenderId: '528677262049',
    appId: '1:528677262049:web:89c2b229471e4cef505da0',
    measurementId: 'G-Q61LGSCMEX'
};

// Initialize Firebase
let app;
let analytics;
let messaging;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  messaging = getMessaging(app);
}

export { app, analytics, messaging };
