import React, { useState, useEffect } from 'react';
import { pushNotifications, PushNotificationService } from '../services/pushNotifications';
import { Bell, BellOff, Smartphone, Check, X, MessageSquare, FileText, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const PushNotificationTest: React.FC = () => {
  // Masquer en production
  if (import.meta.env.PROD) {
    return null;
  }
  const { token } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    checkStatus();
  }, []);

  const addDebug = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(`[Push Debug] ${message}`);
  };

  const checkStatus = async () => {
    const supported = PushNotificationService.isSupported();
    setIsSupported(supported);
    addDebug(`Support navigateur: ${supported}`);
    
    if (supported) {
      const perm = PushNotificationService.getPermissionStatus();
      setPermission(perm);
      addDebug(`Permission: ${perm}`);
      
      try {
        const subscription = await pushNotifications.getSubscription();
        setIsSubscribed(!!subscription);
        addDebug(`Abonnement: ${subscription ? 'Actif' : 'Inactif'}`);
        
        if (subscription) {
          addDebug(`Endpoint: ${subscription.endpoint}`);
        }
      } catch (error) {
        addDebug(`Erreur getSubscription: ${error}`);
      }
    }
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    addDebug('Demande de permission...');
    try {
      const newPermission = await pushNotifications.requestPermission();
      setPermission(newPermission);
      addDebug(`Permission accordée: ${newPermission}`);
      await checkStatus();
    } catch (error) {
      addDebug(`Erreur permission: ${error}`);
      console.error('Erreur permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    addDebug('Test notification locale...');
    try {
      await pushNotifications.testNotification();
      addDebug('Notification envoyée !');
    } catch (error) {
      addDebug(`Erreur test: ${error}`);
      console.error('Erreur test notification:', error);
    }
  };

  const testServerPush = async (type: string) => {
    if (!token) {
      addDebug('Vous devez être connecté');
      return;
    }

    addDebug(`Test push serveur: ${type}...`);
    try {
      const testData = {
        ticket: {
          title: 'Test - Nouveau ticket',
          body: 'Un nouveau ticket de test a été créé',
          data: { type: 'TICKET_CREATED', targetId: 'test-123', url: '/tickets' }
        },
        document: {
          title: 'Test - Nouveau document', 
          body: 'Un nouveau document de test a été uploadé',
          data: { type: 'DOCUMENT_UPLOADED', targetId: 'test-456', url: '/documents' }
        },
        announcement: {
          title: 'Test - Nouvelle annonce',
          body: 'Une nouvelle annonce de test a été publiée', 
          data: { type: 'ANNOUNCEMENT_POSTED', targetId: 'test-789', url: '/announcements' }
        }
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/test-push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData[type as keyof typeof testData])
      });

      if (response.ok) {
        addDebug(`Push ${type} envoyé depuis le serveur !`);
      } else {
        addDebug(`Erreur serveur: ${response.status}`);
      }
    } catch (error) {
      addDebug(`Erreur: ${error}`);
    }
  };

  const handleToggleSubscription = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        await pushNotifications.unsubscribeFromNotifications();
      } else {
        await pushNotifications.subscribeToNotifications();
      }
      await checkStatus();
    } catch (error) {
      console.error('Erreur toggle subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border dark:border-gray-700 max-w-sm">
        <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Test Notifications Push
        </h3>
        
        {/* Statut */}
        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2">
            {isSupported ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-red-500" />
            )}
            <span className="text-gray-700 dark:text-gray-300">
              Support navigateur: {isSupported ? 'Oui' : 'Non'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              permission === 'granted' ? 'bg-green-500' : 
              permission === 'denied' ? 'bg-red-500' : 
              'bg-yellow-500'
            }`} />
            <span className="text-gray-700 dark:text-gray-300">
              Permission: {permission}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isSubscribed ? (
              <BellOff className="w-4 h-4 text-green-500" />
            ) : (
              <Bell className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-gray-700 dark:text-gray-300">
              Abonnement: {isSubscribed ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {permission === 'default' && (
            <button
              onClick={handleRequestPermission}
              disabled={loading}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Demander permission
            </button>
          )}
          
          {permission === 'granted' && (
            <>
              <button
                onClick={handleToggleSubscription}
                disabled={loading}
                className={`w-full px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isSubscribed 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <BellOff className="w-4 h-4" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Activer
                  </>
                )}
              </button>
              
              {isSubscribed && (
                <div className="space-y-2">
                  <button
                    onClick={handleTestNotification}
                    className="w-full px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 flex items-center justify-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Test Local
                  </button>
                  
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => testServerPush('ticket')}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center gap-1"
                      title="Test notification ticket"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Ticket
                    </button>
                    <button
                      onClick={() => testServerPush('document')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center gap-1"
                      title="Test notification document"
                    >
                      <FileText className="w-3 h-3" />
                      Doc
                    </button>
                    <button
                      onClick={() => testServerPush('announcement')}
                      className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 flex items-center justify-center gap-1"
                      title="Test notification annonce"
                    >
                      <Megaphone className="w-3 h-3" />
                      Annonce
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {permission === 'denied' && (
            <p className="text-xs text-red-600 dark:text-red-400 text-center">
              Les notifications sont bloquées. Activez-les dans les paramètres du navigateur.
            </p>
          )}
        </div>

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <div className="mt-3 pt-3 border-t dark:border-gray-700">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Debug Log:</p>
              <button
                onClick={() => setDebugInfo([])}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Clear
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs font-mono">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-gray-600 dark:text-gray-400">
                  {info}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="mt-3 pt-3 border-t dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">
            Comment tester sur mobile:
          </p>
          <ol className="text-xs text-gray-500 dark:text-gray-400 list-decimal list-inside space-y-1">
            <li>Installez la PWA (bouton installer dans Chrome)</li>
            <li>Ouvrez la PWA installée</li>
            <li>Acceptez les notifications</li>
            <li>Les notifs apparaîtront dans le centre de notifications</li>
          </ol>
        </div>
      </div>
    </div>
  );
};