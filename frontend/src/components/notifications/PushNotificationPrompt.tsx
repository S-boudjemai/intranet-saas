import React, { useState, useEffect } from 'react';
import { Bell, X, Smartphone } from 'lucide-react';
import { pushNotifications, PushNotificationService } from '../../services/pushNotifications';
import { motion, AnimatePresence } from 'framer-motion';

export const PushNotificationPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Vérifier le support et le statut des notifications
    if (PushNotificationService.isSupported()) {
      const currentPermission = PushNotificationService.getPermissionStatus();
      setPermission(currentPermission);

      // Vérifier si déjà abonné
      pushNotifications.getSubscription().then((subscription) => {
        setIsSubscribed(!!subscription);
      });

      // Afficher le prompt si pas encore demandé
      if (currentPermission === 'default') {
        // Sur mobile, attendre 5s. Sur desktop, afficher immédiatement pour test
        const delay = isMobileDevice() ? 5000 : 2000;
        setTimeout(() => setShowPrompt(true), delay);
      }
    }
  }, []);

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleEnableNotifications = async () => {
    try {
      const newPermission = await pushNotifications.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        const subscription = await pushNotifications.subscribeToNotifications();
        setIsSubscribed(!!subscription);
        
        // Tester avec une notification
        await pushNotifications.testNotification();
      }
      
      setShowPrompt(false);
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      const result = await pushNotifications.unsubscribeFromNotifications();
      if (result) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error);
    }
  };

  // Composant de statut pour les paramètres
  const NotificationStatus = () => {
    if (!PushNotificationService.isSupported()) {
      return (
        <div className="text-sm text-gray-500">
          Les notifications push ne sont pas supportées sur ce navigateur
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <Bell className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="font-medium">Notifications push</p>
            <p className="text-sm text-gray-500">
              {permission === 'granted' && isSubscribed
                ? 'Activées - Vous recevrez des notifications'
                : permission === 'granted'
                ? 'Permission accordée - Cliquez pour activer'
                : permission === 'denied'
                ? 'Bloquées - Activez-les dans les paramètres du navigateur'
                : 'Non configurées'}
            </p>
          </div>
        </div>
        
        {permission === 'granted' && (
          <button
            onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubscribed
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isSubscribed ? 'Désactiver' : 'Activer'}
          </button>
        )}
        
        {permission === 'default' && (
          <button
            onClick={handleEnableNotifications}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Configurer
          </button>
        )}
      </div>
    );
  };

  // Bouton de test pour forcer l'affichage (dev only)
  const TestButton = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <button
        onClick={() => setShowPrompt(true)}
        className="fixed top-20 right-4 px-3 py-1 bg-purple-600 text-white text-xs rounded-lg z-50"
      >
        Test Notif Prompt
      </button>
    );
  };

  return (
    <>
      <TestButton />
      {/* Prompt mobile */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowPrompt(false)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                    <Smartphone className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Activez les notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Recevez des alertes instantanées pour les nouvelles annonces, documents et mises à jour importantes.
                  </p>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <button
                      onClick={handleEnableNotifications}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Activer
                    </button>
                    <button
                      onClick={() => setShowPrompt(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Plus tard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export du composant de statut pour utilisation dans les paramètres */}
      <NotificationStatus />
    </>
  );
};

// Export séparé du composant de statut pour utilisation dans les paramètres
export const NotificationStatusSettings = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (PushNotificationService.isSupported()) {
      setPermission(PushNotificationService.getPermissionStatus());
      pushNotifications.getSubscription().then((subscription) => {
        setIsSubscribed(!!subscription);
      });
    }
  }, []);

  const handleToggle = async () => {
    if (isSubscribed) {
      await pushNotifications.unsubscribeFromNotifications();
      setIsSubscribed(false);
    } else if (permission === 'granted') {
      const subscription = await pushNotifications.subscribeToNotifications();
      setIsSubscribed(!!subscription);
    } else {
      const newPermission = await pushNotifications.requestPermission();
      setPermission(newPermission);
      if (newPermission === 'granted') {
        const subscription = await pushNotifications.subscribeToNotifications();
        setIsSubscribed(!!subscription);
      }
    }
  };

  if (!PushNotificationService.isSupported()) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Bell className="h-5 w-5 text-gray-400" />
        <div>
          <p className="font-medium">Notifications push</p>
          <p className="text-sm text-gray-500">
            {isSubscribed ? 'Activées' : 'Désactivées'}
          </p>
        </div>
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isSubscribed}
          onChange={handleToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
      </label>
    </div>
  );
};