import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface ServiceWorkerContextType {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: () => Promise<void>;
  isOnline: boolean;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType>({
  needRefresh: false,
  offlineReady: false,
  updateServiceWorker: async () => {},
  isOnline: true,
});

export function ServiceWorkerProvider({ children }: { children: ReactNode }) {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegisteredSW(swScriptUrl, registration) {
        // Service Worker registered
        
        // Check for updates every hour
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        // Service Worker registration error
      },
    });

    setUpdateSW(() => update);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateServiceWorker = async () => {
    if (updateSW) {
      await updateSW(true); // true = reload page after update
      setNeedRefresh(false);
    }
  };

  return (
    <ServiceWorkerContext.Provider
      value={{
        needRefresh,
        offlineReady,
        updateServiceWorker,
        isOnline,
      }}
    >
      {children}
    </ServiceWorkerContext.Provider>
  );
}

export function useServiceWorker() {
  const context = useContext(ServiceWorkerContext);
  if (!context) {
    throw new Error('useServiceWorker must be used within a ServiceWorkerProvider');
  }
  return context;
}