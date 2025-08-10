import { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import oneSignalService from '../services/oneSignalService';

export const OneSignalDebugPage = () => {
  const { token } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Collecter les infos de debug côté frontend
  const collectDebugInfo = async () => {
    const info: any = {
      browser: {
        notificationSupport: 'Notification' in window,
        serviceWorkerSupport: 'serviceWorker' in navigator,
        permission: 'Notification' in window ? Notification.permission : 'non supporté',
        userAgent: navigator.userAgent
      },
      oneSignal: {
        initialized: oneSignalService.getStatus().initialized,
        supported: oneSignalService.getStatus().supported,
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID ? '✅ Configuré' : '❌ Manquant'
      },
      localStorage: {
        hasToken: !!localStorage.getItem('token'),
        hasSubscriptionId: !!localStorage.getItem('onesignal-subscription-id'),
        subscriptionId: localStorage.getItem('onesignal-subscription-id') || 'Aucun'
      }
    };

    // Tenter de récupérer le subscription ID actuel
    try {
      if (window.OneSignal) {
        const subscriptionId = await window.OneSignal.User.PushSubscription.id;
        info.oneSignal.currentSubscriptionId = subscriptionId || 'Non abonné';
        info.oneSignal.sdkLoaded = true;
      } else {
        info.oneSignal.sdkLoaded = false;
      }
    } catch (error) {
      info.oneSignal.error = error.message;
    }

    // Vérifier le Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        info.serviceWorkers = registrations.map(reg => ({
          scope: reg.scope,
          active: !!reg.active,
          scriptURL: reg.active?.scriptURL || 'Aucun'
        }));
      } catch (error) {
        info.serviceWorkers = 'Erreur: ' + error.message;
      }
    }

    setDebugInfo(info);
  };

  // Récupérer les infos du backend
  const fetchBackendInfo = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/onesignal-debug`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setBackendInfo(data.data);
      }
    } catch (error) {
      console.error('Erreur fetch backend:', error);
    }
    setLoading(false);
  };

  // Test d'initialisation OneSignal
  const testInitialization = async () => {
    setLoading(true);
    try {
      const result = await oneSignalService.initialize();
      alert(`Initialisation: ${result ? '✅ Réussie' : '❌ Échouée'}`);
      await collectDebugInfo();
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
    setLoading(false);
  };

  // Test de permission
  const testPermission = async () => {
    try {
      const granted = await oneSignalService.requestPermission();
      alert(`Permission: ${granted ? '✅ Accordée' : '❌ Refusée'}`);
      await collectDebugInfo();
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
  };

  // Test d'envoi de notification
  const testNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/onesignal-test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      alert(result.message || 'Test envoyé');
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    collectDebugInfo();
    fetchBackendInfo();
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🔧 Debug OneSignal</h1>

      {/* Actions */}
      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">Actions de test</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={testInitialization} disabled={loading}>
            Tester Initialisation
          </Button>
          <Button onClick={testPermission} disabled={loading}>
            Demander Permission
          </Button>
          <Button onClick={testNotification} disabled={loading}>
            Envoyer Test Notification
          </Button>
          <Button onClick={() => { collectDebugInfo(); fetchBackendInfo(); }} disabled={loading}>
            Rafraîchir Infos
          </Button>
        </div>
      </Card>

      {/* Infos Frontend */}
      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">📱 Frontend (Navigateur)</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </Card>

      {/* Infos Backend */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🖥️ Backend (Serveur)</h2>
        {backendInfo ? (
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(backendInfo, null, 2)}
          </pre>
        ) : (
          <p className="text-gray-500">Chargement...</p>
        )}
      </Card>

      {/* Instructions */}
      <Card className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="font-semibold mb-2">📋 Checklist de vérification :</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>✅ Permission notifications = "granted"</li>
          <li>✅ Service Worker OneSignal actif</li>
          <li>✅ Subscription ID présent (36 caractères)</li>
          <li>✅ Backend a bien reçu le subscription ID</li>
          <li>✅ App ID configuré des deux côtés</li>
        </ul>
      </Card>
    </div>
  );
};