// src/pages/UnifiedDashboard.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardPage from './DashboardPage';

const UnifiedDashboard: React.FC = () => {
  const { user } = useAuth();

  // UnifiedDashboard est maintenant uniquement pour les managers
  // Les admins vont directement sur AdminGlobalDashboard
  if (user?.role === 'admin') {
    // Ne devrait pas arriver avec le nouveau routing
    return <div>Redirection vers l'espace admin...</div>;
  }

  return <DashboardPage />;
};

export default UnifiedDashboard;