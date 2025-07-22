// Service pour gérer les notifications push
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Convertir une ArrayBuffer en string base64 URL-safe
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Vérifier si les notifications push sont supportées
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Obtenir le statut de permission actuel
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Demander la permission pour les notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!PushNotificationService.isSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      // S'abonner automatiquement si la permission est accordée
      await this.subscribeToNotifications();
    } else {
      console.warn('Notification permission denied');
    }

    return permission;
  }

  // S'abonner aux notifications push
  async subscribeToNotifications(): Promise<PushSubscription | null> {
    try {
      // Obtenir l'enregistrement du service worker
      this.registration = await navigator.serviceWorker.ready;

      // Vérifier si déjà abonné
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('Already subscribed to push notifications');
        await this.sendSubscriptionToServer(this.subscription);
        return this.subscription;
      }

      // Créer un nouvel abonnement
      // TODO: Récupérer la clé publique VAPID depuis le serveur
      const vapidPublicKey = await this.getVapidPublicKey();
      
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('Subscribed to push notifications:', this.subscription);
      
      // Envoyer l'abonnement au serveur
      await this.sendSubscriptionToServer(this.subscription);
      
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Se désabonner des notifications
  async unsubscribeFromNotifications(): Promise<boolean> {
    try {
      if (!this.subscription) {
        this.subscription = await this.getSubscription();
      }

      if (!this.subscription) {
        console.log('No subscription found');
        return true;
      }

      const result = await this.subscription.unsubscribe();
      
      if (result) {
        await this.removeSubscriptionFromServer();
        this.subscription = null;
      }

      return result;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Obtenir l'abonnement actuel
  async getSubscription(): Promise<PushSubscription | null> {
    if (this.subscription) {
      return this.subscription;
    }

    if (!this.registration) {
      this.registration = await navigator.serviceWorker.ready;
    }

    this.subscription = await this.registration.pushManager.getSubscription();
    return this.subscription;
  }

  // Obtenir la clé publique VAPID depuis le serveur
  private async getVapidPublicKey(): Promise<string> {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/vapid-public-key`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.publicKey;
    } catch (error) {
      console.error('Failed to get VAPID public key:', error);
      // Clé par défaut pour le développement (à remplacer en production)
      return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    }
  }

  // Envoyer l'abonnement au serveur
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/api/notifications/subscribe`,
        {
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          platform: this.detectPlatform()
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  // Supprimer l'abonnement du serveur
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      await axios.delete(`${API_URL}/api/notifications/unsubscribe`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  // Détecter la plateforme
  private detectPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/windows/.test(userAgent)) return 'windows';
    if (/mac/.test(userAgent)) return 'macos';
    if (/linux/.test(userAgent)) return 'linux';
    return 'unknown';
  }

  // Mettre à jour le badge de l'application
  async updateAppBadge(count: number): Promise<void> {
    try {
      // API Badge pour PWA
      if ('setAppBadge' in navigator) {
        if (count > 0) {
          await (navigator as any).setAppBadge(count);
        } else {
          await (navigator as any).clearAppBadge();
        }
      }

      // Envoyer un message au service worker pour mettre à jour le badge
      if (this.registration?.active) {
        this.registration.active.postMessage({
          type: 'UPDATE_BADGE',
          count
        });
      }
    } catch (error) {
      console.error('Failed to update app badge:', error);
    }
  }

  // Tester l'envoi d'une notification locale
  async testNotification(): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const notification = new Notification('Test FranchiseHUB', {
      body: 'Ceci est une notification de test',
      icon: '/pwa-192x192.svg',
      badge: '/pwa-192x192.svg',
      vibrate: [200, 100, 200],
      tag: 'test-notification',
      requireInteraction: false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

// Export d'une instance unique
export const pushNotifications = PushNotificationService.getInstance();