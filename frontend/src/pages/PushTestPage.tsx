import React, { useState, useEffect } from 'react';
import { pushNotifications, PushNotificationService } from '../services/pushNotifications';
import { useAuth } from '../contexts/AuthContext';

export default function PushTestPage() {
  const { token } = useAuth();
  const [swStatus, setSwStatus] = useState<string>('checking...');
  const [fcmToken, setFcmToken] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    checkServiceWorkers();
  }, []);

  const checkServiceWorkers = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const swInfo = registrations.map(reg => ({
        scope: reg.scope,
        active: reg.active?.state,
        scriptURL: reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL
      }));
      setSwStatus(JSON.stringify(swInfo, null, 2));
    } else {
      setSwStatus('Service Workers non supportés');
    }
  };

  const getFCMToken = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Attendre que Firebase soit prêt
        const { messaging } = await import('../config/firebase');
        if (messaging) {
          const { getToken } = await import('firebase/messaging');
          const token = await getToken(messaging, {
            vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
          });
          setFcmToken(token);
        } else {
          setFcmToken('Firebase messaging non disponible');
        }
      } else {
        setFcmToken('Permission refusée');
      }
    } catch (error) {
      setFcmToken(`Erreur: ${error}`);
    }
  };

  const testServerPush = async () => {
    if (!token) {
      setTestResult('Vous devez être connecté');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/test-push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test FranchiseHUB',
          body: 'Notification de test depuis le serveur',
          data: { test: true, timestamp: Date.now() }
        })
      });

      if (response.ok) {
        setTestResult('Notification envoyée depuis le serveur !');
      } else {
        setTestResult(`Erreur serveur: ${response.status}`);
      }
    } catch (error) {
      setTestResult(`Erreur: ${error}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Test Notifications Push PWA</h1>

      {/* Service Workers */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Service Workers</h2>
        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto">
          {swStatus}
        </pre>
        <button
          onClick={checkServiceWorkers}
          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Rafraîchir
        </button>
      </div>

      {/* FCM Token */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Firebase Cloud Messaging</h2>
        <button
          onClick={getFCMToken}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Obtenir FCM Token
        </button>
        {fcmToken && (
          <div className="mt-3">
            <p className="text-sm font-medium mb-1">FCM Token:</p>
            <p className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs break-all">
              {fcmToken}
            </p>
          </div>
        )}
      </div>

      {/* Test Server Push */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Test Push depuis Serveur</h2>
        <button
          onClick={testServerPush}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Envoyer notification test
        </button>
        {testResult && (
          <p className="mt-3 text-sm">{testResult}</p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Instructions de Test</h2>
        <div className="space-y-3 text-sm">
          <div>
            <h3 className="font-semibold">Sur Chrome Desktop:</h3>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>Ouvrez les DevTools (F12)</li>
              <li>Application → Service Workers</li>
              <li>Vérifiez que firebase-messaging-sw.js est actif</li>
              <li>Application → Notifications → Test</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-semibold">Sur Mobile:</h3>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>Installez la PWA via le menu Chrome</li>
              <li>Ouvrez l'app installée</li>
              <li>Les notifications apparaîtront nativement</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold">Debug Android:</h3>
            <p className="ml-2">chrome://inspect → Inspect PWA → Console</p>
          </div>
        </div>
      </div>
    </div>
  );
}