// src/hooks/useHaptic.ts
import { useCallback, useEffect, useState } from 'react';
import { HapticService } from '../services/hapticService';

export interface UseHapticReturn {
  /** Vibration simple */
  vibrate: (duration?: number) => void;
  /** Pattern de vibration */
  vibratePattern: (pattern: number[]) => void;
  /** Vibrations prédéfinies */
  success: () => void;
  error: () => void;
  warning: () => void;
  tap: () => void;
  longPress: () => void;
  notification: () => void;
  /** Vibration contextuelle */
  contextual: (action: 'submit' | 'delete' | 'save' | 'cancel' | 'navigate' | 'toggle') => void;
  /** Arrêter vibrations */
  stop: () => void;
  /** Test vibration */
  test: () => Promise<boolean>;
  /** Infos support */
  support: {
    supported: boolean;
    platform: string;
    isPWA: boolean;
    reason?: string;
  };
  /** État actuel */
  isSupported: boolean;
}

/**
 * Hook pour utiliser les vibrations haptic en React
 * Usage: const haptic = useHaptic();
 */
export const useHaptic = (): UseHapticReturn => {
  const [support] = useState(() => HapticService.getSupport());
  const [isSupported] = useState(() => HapticService.canVibrate());

  // Callbacks optimisés
  const vibrate = useCallback((duration?: number) => {
    HapticService.vibrate(duration);
  }, []);

  const vibratePattern = useCallback((pattern: number[]) => {
    HapticService.vibratePattern(pattern);
  }, []);

  const success = useCallback(() => {
    HapticService.success();
  }, []);

  const error = useCallback(() => {
    HapticService.error();
  }, []);

  const warning = useCallback(() => {
    HapticService.warning();
  }, []);

  const tap = useCallback(() => {
    HapticService.tap();
  }, []);

  const longPress = useCallback(() => {
    HapticService.longPress();
  }, []);

  const notification = useCallback(() => {
    HapticService.notification();
  }, []);

  const contextual = useCallback((action: 'submit' | 'delete' | 'save' | 'cancel' | 'navigate' | 'toggle') => {
    HapticService.contextual(action);
  }, []);

  const stop = useCallback(() => {
    HapticService.stop();
  }, []);

  const test = useCallback(async () => {
    return HapticService.test();
  }, []);

  return {
    vibrate,
    vibratePattern,
    success,
    error,
    warning,
    tap,
    longPress,
    notification,
    contextual,
    stop,
    test,
    support,
    isSupported
  };
};

/**
 * Hook pour vibration automatique sur événements boutons
 * Usage: const { onTap, onSubmit, onDelete } = useButtonHaptic();
 */
export const useButtonHaptic = () => {
  const haptic = useHaptic();

  const onTap = useCallback((originalHandler?: () => void) => {
    return () => {
      haptic.tap();
      originalHandler?.();
    };
  }, [haptic]);

  const onSubmit = useCallback((originalHandler?: () => void) => {
    return () => {
      haptic.contextual('submit');
      originalHandler?.();
    };
  }, [haptic]);

  const onDelete = useCallback((originalHandler?: () => void) => {
    return () => {
      haptic.contextual('delete');
      originalHandler?.();
    };
  }, [haptic]);

  const onCancel = useCallback((originalHandler?: () => void) => {
    return () => {
      haptic.contextual('cancel');
      originalHandler?.();
    };
  }, [haptic]);

  const onSave = useCallback((originalHandler?: () => void) => {
    return () => {
      haptic.contextual('save');
      originalHandler?.();
    };
  }, [haptic]);

  const onToggle = useCallback((originalHandler?: () => void) => {
    return () => {
      haptic.contextual('toggle');
      originalHandler?.();
    };
  }, [haptic]);

  return {
    onTap,
    onSubmit,
    onDelete,
    onCancel,
    onSave,
    onToggle,
    haptic
  };
};

export default useHaptic;