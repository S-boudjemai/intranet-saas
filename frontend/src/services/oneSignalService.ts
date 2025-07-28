import OneSignal from 'react-onesignal';

export class OneSignalService {
  private static initialized = false;
  private static isSupported = false;
  private static readonly APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

  /**
   * Initialiser OneSignal
   */
  static async initialize(): Promise<boolean> {
    if (this.initialized) {
      return this.isSupported;
    }

    try {
      await OneSignal.init({
        appId: this.APP_ID,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
        autoRegister: true,
      });

      this.initialized = true;
      this.isSupported = true;

      const permissionGranted = await this.requestPermission();
      if (permissionGranted) {
        await this.subscribeUser();
      }

      return true;

    } catch (error) {
      console.error('[OneSignal] Initialization error:', error);
      this.isSupported = false;
      return false;
    }
  }

  /**
   * Demander permission notifications
   */
  static async requestPermission(): Promise<boolean> {
    try {
      await OneSignal.Notifications.requestPermission();
      return OneSignal.Notifications.permission;
    } catch (error) {
      console.error('[OneSignal] Permission error:', error);
      return false;
    }
  }

  /**
   * S'abonner aux notifications
   */
  static async subscribeUser(): Promise<void> {
    try {
      const userId = OneSignal.User.onesignalId;

      if (userId) {
        await this.sendUserIdToBackend(userId);
        localStorage.setItem('onesignal-user-id', userId);
      }

    } catch (error) {
      console.error('[OneSignal] Subscribe error:', error);
    }
  }

  /**
   * Envoyer User ID au backend
   */
  private static async sendUserIdToBackend(oneSignalUserId: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/onesignal-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oneSignalUserId,
          userAgent: navigator.userAgent,
          platform: this.detectPlatform()
        })
      });

      if (!response.ok) {
        console.error('[OneSignal] Backend sync error:', response.status);
      }

    } catch (error) {
      console.error('[OneSignal] Backend sync error:', error);
    }
  }

  /**
   * Test notification locale
   */
  static async testLocalNotification(): Promise<void> {
    try {
      if (this.isSupported && this.initialized) {
        // OneSignal handles notification display automatically
        return;
      }
      
      // Fallback to native notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Test FranchiseHUB', {
          body: 'Notification de test - système fonctionnel !',
          icon: '/pwa-192x192.svg',
          tag: 'test'
        });
      }

    } catch (error) {
      console.error('[OneSignal] Test notification error:', error);
    }
  }

  /**
   * Se désabonner
   */
  static async unsubscribe(): Promise<void> {
    try {
      if (this.initialized) {
        OneSignal.User.removeAlias('external_id');
        localStorage.removeItem('onesignal-user-id');
      }
    } catch (error) {
      console.error('[OneSignal] Unsubscribe error:', error);
    }
  }

  /**
   * Vérifier support
   */
  static isBrowserSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Détection plateforme
   */
  private static detectPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/windows/.test(userAgent)) return 'windows';
    if (/mac/.test(userAgent)) return 'mac';
    return 'web';
  }

  /**
   * Obtenir statut
   */
  static getStatus(): { initialized: boolean; supported: boolean } {
    return {
      initialized: this.initialized,
      supported: this.isSupported
    };
  }
}

// Export singleton
export const oneSignalService = OneSignalService;