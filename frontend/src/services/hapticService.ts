// src/services/hapticService.ts
/**
 * Service pour gérer les vibrations haptic feedback en PWA
 * Compatible avec toutes les plateformes (Android, iOS PWA, Desktop)
 */

export interface HapticOptions {
  /** Durée de la vibration en ms */
  duration?: number;
  /** Pattern de vibration [vibration, pause, vibration, ...] */
  pattern?: number[];
  /** Intensité (iOS uniquement via Web API future) */
  intensity?: 'light' | 'medium' | 'heavy';
}

export class HapticService {
  private static isPWA = window.matchMedia('(display-mode: standalone)').matches;
  private static isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  private static isAndroid = /Android/.test(navigator.userAgent);
  private static isSupported = 'vibrate' in navigator;

  /**
   * Vibration simple
   */
  static vibrate(duration: number = 100): void {
    if (!this.canVibrate()) return;
    
    try {
      navigator.vibrate(duration);
    } catch (error) {
      console.warn('[Haptic] Simple vibration failed:', error);
    }
  }

  /**
   * Pattern de vibration
   */
  static vibratePattern(pattern: number[]): void {
    if (!this.canVibrate()) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('[Haptic] Pattern vibration failed:', error);
    }
  }

  /**
   * Vibrations prédéfinies par type d'action
   */
  
  /** Succès - pattern doux */
  static success(): void {
    this.vibratePattern([80, 50, 80]);
  }

  /** Erreur - pattern plus fort */
  static error(): void {
    this.vibratePattern([200, 100, 200]);
  }

  /** Warning - pattern moyen */
  static warning(): void {
    this.vibratePattern([150, 80, 100]);
  }

  /** Click/Tap - vibration courte */
  static tap(): void {
    this.vibrate(50);
  }

  /** Long press - vibration plus longue */
  static longPress(): void {
    this.vibrate(200);
  }

  /** Notification - pattern distinctif */
  static notification(): void {
    this.vibratePattern([100, 50, 100, 50, 300]);
  }

  /** Impact léger - iOS style */
  static impactLight(): void {
    this.vibrate(10);
  }

  /** Impact moyen */
  static impactMedium(): void {
    this.vibrate(20);
  }

  /** Impact fort */
  static impactHeavy(): void {
    this.vibrate(40);
  }

  /**
   * Vibration contextuelle selon l'action
   */
  static contextual(action: 'submit' | 'delete' | 'save' | 'cancel' | 'navigate' | 'toggle'): void {
    switch (action) {
      case 'submit':
      case 'save':
        this.success();
        break;
      case 'delete':
        this.error();
        break;
      case 'cancel':
        this.warning();
        break;
      case 'navigate':
        this.tap();
        break;
      case 'toggle':
        this.impactLight();
        break;
      default:
        this.tap();
    }
  }

  /**
   * Arrêter toutes les vibrations
   */
  static stop(): void {
    if (!this.isSupported) return;
    
    try {
      navigator.vibrate(0);
    } catch (error) {
      console.warn('[Haptic] Stop vibration failed:', error);
    }
  }

  /**
   * Vérifier si la vibration est possible
   */
  static canVibrate(): boolean {
    // Support natif requis
    if (!this.isSupported) return false;
    
    // En PWA sur mobile, vibration recommandée
    if (this.isPWA && (this.isIOS || this.isAndroid)) return true;
    
    // Sur Android natif, toujours OK
    if (this.isAndroid) return true;
    
    // Desktop généralement pas supporté, mais on essaie
    return this.isSupported;
  }

  /**
   * Informations sur le support haptic
   */
  static getSupport(): {
    supported: boolean;
    platform: string;
    isPWA: boolean;
    reason?: string;
  } {
    return {
      supported: this.canVibrate(),
      platform: this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Desktop',
      isPWA: this.isPWA,
      reason: !this.isSupported 
        ? 'Vibration API not supported' 
        : !this.isPWA && this.isIOS 
        ? 'iOS requires PWA mode for vibration'
        : undefined
    };
  }

  /**
   * Test de vibration pour l'utilisateur
   */
  static async test(): Promise<boolean> {
    if (!this.canVibrate()) {
      console.log('[Haptic] Test failed - not supported');
      return false;
    }

    try {
      // Pattern de test reconnaissable
      this.vibratePattern([100, 100, 100, 100, 200]);
      console.log('[Haptic] Test pattern sent');
      return true;
    } catch (error) {
      console.error('[Haptic] Test failed:', error);
      return false;
    }
  }
}

// Export par défaut pour facilité d'usage
export const haptic = HapticService;
export default HapticService;