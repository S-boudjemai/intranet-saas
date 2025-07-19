import { useServiceWorker } from '../hooks/useServiceWorker';
import Button from './ui/Button';

export default function ServiceWorkerUI() {
  const { needRefresh, offlineReady, updateServiceWorker, isOnline } = useServiceWorker();

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 p-4 rounded-lg shadow-lg z-50 animate-fade-in">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium">Mode hors ligne</p>
            <p className="text-sm opacity-90">L'application fonctionne en mode hors ligne</p>
          </div>
        </div>
      </div>
    );
  }

  if (needRefresh) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 p-4 rounded-lg shadow-lg z-50 animate-slide-up">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Nouvelle version disponible</p>
              <p className="text-sm opacity-90">Cliquez sur "Mettre à jour" pour obtenir les dernières fonctionnalités</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => updateServiceWorker()}
              size="sm"
              className="flex-1"
            >
              Mettre à jour
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              Plus tard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 p-4 rounded-lg shadow-lg z-50 animate-fade-in">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium">Application prête hors ligne</p>
            <p className="text-sm opacity-90">L'application peut maintenant fonctionner sans connexion</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}