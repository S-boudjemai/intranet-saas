// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyA9z11WU2xeIIly2s69Em1eBhj9r2UfiWs",
  authDomain: "intranet-saas.firebaseapp.com",
  projectId: "intranet-saas",
  storageBucket: "intranet-saas.firebasestorage.app",
  messagingSenderId: "976595782279",
  appId: "1:976595782279:web:345d67a22f1521f0ed8622",
  measurementId: "G-VF0QSP15NJ"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'FranchiseHUB';
  const notificationOptions = {
    body: payload.notification?.body || 'Nouvelle notification',
    icon: payload.data?.icon || '/pwa-192x192.svg',
    badge: payload.data?.badge || '/pwa-192x192.svg',
    tag: payload.data?.tag || 'franchisehub-notification',
    data: payload.data,
    vibrate: [200, 100, 200],
    renotify: true,
    requireInteraction: false
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
  
  // Update app badge if available
  if ('setAppBadge' in self.navigator && payload.data?.badge_count) {
    self.navigator.setAppBadge(parseInt(payload.data.badge_count)).catch(console.error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Look for existing window
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler for communication with the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    if ('setAppBadge' in self.navigator) {
      self.navigator.setAppBadge(event.data.count).catch(console.error);
    }
  }
});