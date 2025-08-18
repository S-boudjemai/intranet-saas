/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Import OneSignal SDK
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Precache assets
precacheAndRoute(self.__WB_MANIFEST);

// Immediate claim
self.skipWaiting();
clientsClaim();

// Cache strategies
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.href.includes('/api/auth/'),
  new NetworkOnly()
);

registerRoute(
  ({ url }) => url.href.includes('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

// Écouter les notifications push
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.warn('Push notification without data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'Nouvelle notification',
      body: event.data.text(),
      icon: '/pwa-192x192.svg',
      badge: '/pwa-192x192.svg'
    };
  }

  const options = {
    body: notificationData.body || 'Vous avez une nouvelle notification',
    icon: notificationData.icon || '/pwa-192x192.svg',
    badge: notificationData.badge || '/pwa-192x192.svg',
    vibrate: [200, 100, 200],
    tag: notificationData.tag || 'franchisehub-notification',
    renotify: true,
    requireInteraction: false,
    data: notificationData.data || {},
    actions: notificationData.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'FranchiseHUB',
      options
    )
  );

  // Mettre à jour le badge de l'application
  if ('setAppBadge' in self.navigator && notificationData.badge_count !== undefined) {
    self.navigator.setAppBadge(notificationData.badge_count).catch(console.error);
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Chercher une fenêtre existante
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Ouvrir une nouvelle fenêtre si aucune n'existe
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler pour communication avec l'app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    if ('setAppBadge' in self.navigator) {
      self.navigator.setAppBadge(event.data.count).catch(console.error);
    }
  }
});