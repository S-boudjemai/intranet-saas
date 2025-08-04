// OneSignal Service Worker avec support PWA iOS
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Configuration pour iOS et PWA
self.addEventListener('install', function (event) {
  console.log('[OneSignal SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  console.log('[OneSignal SW] Activating...');
  event.waitUntil(self.clients.claim());
});

// Support notifications iOS PWA
self.addEventListener('push', function (event) {
  console.log('[OneSignal SW] Push received', event);
});

self.addEventListener('notificationclick', function (event) {
  console.log('[OneSignal SW] Notification clicked', event);
  event.notification.close();
  
  // Ouvrir l'app PWA
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});