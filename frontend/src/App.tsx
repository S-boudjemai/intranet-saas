// src/App.tsx
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Toaster } from 'react-hot-toast';
// DEV ONLY - import { ToastTest } from "./components/ToastTest";
import { useState, useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ServiceWorkerUI from "./components/ServiceWorkerUI";
import { PushNotificationPrompt } from "./components/PushNotificationPrompt";
import { PageTransition } from "./components/ui/PageTransition";
import useIOSStatusBar from "./hooks/useIOSStatusBar";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ContactPage from "./pages/ContactPage";
import DocumentsPage from "./pages/DocumentsPage";
import TicketsPage from "./pages/TicketsPages";
import { OneSignalDebugPage } from "./pages/OneSignalDebugPage";
import NavBar from "./components/NavBar";
import MobileNav from "./components/MobileNav";
import UnifiedDashboard from "./pages/UnifiedDashboard";
import AdminGlobalDashboard from "./pages/AdminGlobalDashboard";
import Announcements from "./pages/AnnouncementsPage";
import AnnouncementsNew from "./pages/AnnouncementsPageNew";
import LandingPage from "./pages/LandingPage";
import UsersPage from "./pages/UsersPage"; // <-- Import de la page Utilisateurs
import AuditsPage from "./pages/AuditsPage"; // <-- Import de la page Audits
import PlanningPage from "./pages/PlanningPage"; // <-- Import de la page Planning
// DEV ONLY - import PushTestPage from "./pages/PushTestPage";


// Ce composant interne gère l'affichage conditionnel de la NavBar
const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Hook pour gérer la status bar iOS automatiquement
  useIOSStatusBar();

  // Pages où la NavBar ne doit PAS être affichée
  const noNavPages = ["/login", "/signup", "/", "/contact", "/forgot-password", "/reset-password"];

  // Admin global a son propre header, managers/viewers ont la navbar standard
  const isAdminGlobalView = user?.role === 'admin' && location.pathname === '/dashboard';
  const showNav = user && !noNavPages.includes(location.pathname) && !isAdminGlobalView;

  return (
    <>
      {showNav && (
        <>
          {/* Desktop Navigation - Style Waitify */}
          <header className="hidden lg:block">
            <NavBar />
          </header>
          
          {/* Mobile Navigation */}
          <MobileNav />
        </>
      )}

      {/* Le conteneur principal pour le contenu de la page */}
      <div className={`${showNav ? "p-4" : ""} animate-fade-in`}>
        <ServiceWorkerUI />
        {user && <PushNotificationPrompt />}
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Routes protégées avec rendu conditionnel */}
          <Route element={<ProtectedRoute />}>
            {/* Dashboard principal - admin va direct sur AdminGlobalDashboard */}
            <Route 
              path="/dashboard" 
              element={
                user?.role === 'admin' ? (
                  <AdminGlobalDashboard />
                ) : (
                  <RoleProtectedRoute allowedRoles={['manager']}>
                    <UnifiedDashboard />
                  </RoleProtectedRoute>
                )
              } 
            />
            
            {/* Routes communes - comportement conditionnel selon le mode */}
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/announcements" element={<AnnouncementsNew />} />
            <Route path="/audits" element={<AuditsPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            {/* <Route path="/announcements-old" element={<Announcements />} /> */}
            
            {/* Users - adaptatif selon le mode */}
            <Route 
              path="/users" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <UsersPage />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Debug OneSignal - dev only */}
            <Route 
              path="/onesignal-debug" 
              element={<OneSignalDebugPage />} 
            />
            
            {/* Test Push Notifications - dev only */}
            <Route 
              path="/push-test" 
              element={
                <div>Page de test push disponible seulement en développement</div>
              } 
            />
            
            {/* Redirection vers dashboard par défaut */}
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Redirige toute autre URL vers la page d'accueil */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
                <BrowserRouter>
                  <div className="bg-background text-foreground min-h-screen pwa-safe-all scroll-momentum">
                    <AppContent />
                  </div>
                </BrowserRouter>
            </NotificationProvider>
          </ThemeProvider>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
          success: {
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid #22c55e',
            },
          },
          error: {
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid #ef4444',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
}
