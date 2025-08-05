// src/hooks/useIOSStatusBar.ts
import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook pour gérer la status bar iOS en mode PWA
 * Ajuste automatiquement la couleur selon le thème
 */
export const useIOSStatusBar = () => {
  const { isDark } = useTheme();

  useEffect(() => {
    // Vérifier si on est sur iOS en mode PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isIOS || !isPWA) return;

    // Mettre à jour la meta tag status bar
    const updateStatusBar = () => {
      let metaTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'apple-mobile-web-app-status-bar-style';
        document.head.appendChild(metaTag);
      }

      // Choisir le style selon le thème
      if (isDark) {
        metaTag.content = 'black-translucent'; // Status bar transparente avec texte blanc
      } else {
        metaTag.content = 'default'; // Status bar blanche avec texte noir
      }
    };

    updateStatusBar();
  }, [isDark]);

  // Fonction pour forcer un style spécifique
  const setStatusBarStyle = (style: 'default' | 'black' | 'black-translucent') => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isIOS || !isPWA) return;

    let metaTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(metaTag);
    }

    metaTag.content = style;
  };

  return {
    setStatusBarStyle
  };
};

export default useIOSStatusBar;