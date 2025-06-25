// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
// Replace 10.13.2 with latest version of the Firebase JS SDK.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: 'AIzaSyD2JWxdRU6AhI5WMBHgvLMb6v8x9tLzqw0',
    authDomain: 'coral-swimmer.firebaseapp.com',
    projectId: 'coral-swimmer',
    storageBucket: 'coral-swimmer.appspot.com',
    messagingSenderId: '528677262049',
    appId: '1:528677262049:web:89c2b229471e4cef505da0',
    measurementId: 'G-Q61LGSCMEX'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
        '[firebase-messaging-sw.js] Received background message ',
        payload
    );

    if (payload.notification) {
        console.log('Notification payload received:', payload.notification);
        return;
    }
    
    if (!payload.data || !payload.data.title || !payload.data.body) {
        console.error('Invalid payload data:', payload.data);
        return;
    }

    // Customize notification here
    const notificationTitle = payload.data.title;
    const notificationOptions = {
        body: payload.data.body,
        icon: '/coral-swimmer-athlete/logo_512.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});