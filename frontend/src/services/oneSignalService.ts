import OneSignal from 'react-onesignal';

export class OneSignalService {
  private static initialized = false;
  private static isSupported = false;
  private static readonly APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

  /**
   * Initialiser OneSignal avec support iOS spécifique
   */
  static async initialize(): Promise<boolean> {
    if (this.initialized) {
      return this.isSupported;
    }

    // Détection iOS
    const isIOS = this.detectPlatform() === 'ios';
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;

    console.log('[OneSignal] Platform detected:', { isIOS, isPWA });

    try {
      await OneSignal.init({
        appId: this.APP_ID,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
        autoRegister: !isIOS, // Sur iOS, on enregistre manuellement après installation PWA
        safari_web_id: this.APP_ID, // Configuration Safari pour iOS
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: "push", // current types are "push" & "category"
                autoPrompt: !isIOS, // Sur iOS, on attend que la PWA soit installée
                text: {
                  actionMessage: "Nous aimerions vous envoyer des notifications pour les mises à jour importantes.",
                  acceptButton: "Autoriser",
                  cancelButton: "Non merci"
                },
                delay: {
                  pageViews: 1,
                  timeDelay: isIOS && !isPWA ? 10 : 3 // Délai plus long sur iOS si pas installé
                }
              }
            ]
          }
        }
      });

      this.initialized = true;
      this.isSupported = true;

      // Sur iOS, attendre que l'utilisateur interagisse
      if (isIOS && !isPWA) {
        console.log('[OneSignal] iOS détecté sans PWA - attente installation');
        return true;
      }

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
   * Forcer l'enregistrement sur iOS après installation PWA
   */
  static async forceIOSRegistration(): Promise<void> {
    const isIOS = this.detectPlatform() === 'ios';
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS && isPWA && this.initialized) {
      console.log('[OneSignal] Force iOS PWA registration');
      try {
        const permissionGranted = await this.requestPermission();
        if (permissionGranted) {
          await this.subscribeUser();
        }
      } catch (error) {
        console.error('[OneSignal] Force iOS registration error:', error);
      }
    }
  }

  /**
   * Vérifier support avec détection iOS/PWA
   */
  static isBrowserSupported(): boolean {
    const baseSupport = 'Notification' in window && 'serviceWorker' in navigator;
    const isIOS = this.detectPlatform() === 'ios';
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    // Sur iOS, les notifications ne marchent qu'en PWA installée
    if (isIOS) {
      return baseSupport && isPWA;
    }
    
    return baseSupport;
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