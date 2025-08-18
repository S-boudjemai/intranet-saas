import { useState } from 'react';
import { BellIcon } from './icons';
import axios from 'axios';

export const TestPushButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleTestPush = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/notifications/test-push`,
        {
          title: '🎉 Test Notifications Push',
          body: 'Les notifications push fonctionnent correctement!'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setMessage('✅ Notification envoyée! Vérifiez vos notifications.');
    } catch (error) {
      console.error('Erreur test push:', error);
      setMessage('❌ Erreur lors de l\'envoi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={handleTestPush}
        disabled={isLoading}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait shadow-lg"
      >
        <BellIcon className="h-4 w-4" />
        {isLoading ? 'Envoi...' : 'Tester Push'}
      </button>
      {message && (
        <div className="mt-2 text-sm text-center">
          {message}
        </div>
      )}
    </div>
  );
};