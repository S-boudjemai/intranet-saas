// src/App.tsx
import React from "react";
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
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ThemeSwitcher from "./components/ThemeSwitcher";
import { ErrorBoundary } from "./components/ErrorBoundary";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DocumentsPage from "./pages/DocumentsPage";
import TicketsPage from "./pages/TicketsPages";
import NavBar from "./components/NavBar";
import DashboardPage from "./pages/DashboardPage";
import Announcements from "./pages/AnnouncementsPage";
import LandingPage from "./pages/LandingPage";
import UsersPage from "./pages/UsersPage"; // <-- Import de la page Utilisateurs
import AuditTemplatesPage from "./pages/AuditTemplatesPage";
import AuditPlanningPage from "./pages/AuditPlanningPage";
import AuditExecutionPage from "./pages/AuditExecutionPage";
import CorrectiveActionsPage from "./pages/CorrectiveActionsPage";

// Ce composant interne gère l'affichage conditionnel de la NavBar
const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Pages où la NavBar ne doit PAS être affichée
  const noNavPages = ["/login", "/signup", "/"];

  // On affiche la navBar si un utilisateur est connecté ET qu'on n'est pas sur une page "publique"
  const showNav = user && !noNavPages.includes(location.pathname);

  return (
    <>
      {showNav && (
        <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border p-4">
          <div className="flex justify-between items-center gap-6">
            <NavBar />
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
            </div>
          </div>
        </header>
      )}

      {/* Le conteneur principal pour le contenu de la page */}
      <div className={showNav ? "p-4" : ""}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Routes protégées */}
          <Route element={<ProtectedRoute />}>
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/announcements" element={<Announcements />} />
            
            {/* Dashboard réservé aux admin/manager */}
            <Route 
              path="/dashboard" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <DashboardPage />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Users réservé aux admin/manager */}
            <Route 
              path="/users" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <UsersPage />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Audit Templates réservé aux admin/manager */}
            <Route 
              path="/audit-templates" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AuditTemplatesPage />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Audit Planning réservé aux admin/manager */}
            <Route 
              path="/audit-planning" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AuditPlanningPage />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Audit Execution - Accessible à tous les rôles */}
            <Route path="/audit/:id" element={<AuditExecutionPage />} />
            
            {/* Corrective Actions réservé aux admin/manager */}
            <Route 
              path="/corrective-actions" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <CorrectiveActionsPage />
                </RoleProtectedRoute>
              } 
            />
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
              <div className="bg-background text-foreground min-h-screen">
                <AppContent />
              </div>
            </BrowserRouter>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
