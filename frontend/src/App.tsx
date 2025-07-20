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
import { ToastProvider } from "./contexts/ToastContext";
import { ToastContainer } from "./components/ui/ToastContainer";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ThemeSwitcher from "./components/ThemeSwitcher";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ServiceWorkerUI from "./components/ServiceWorkerUI";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ContactPage from "./pages/ContactPage";
import DocumentsPage from "./pages/DocumentsPage";
import TicketsPage from "./pages/TicketsPages";
import NavBar from "./components/NavBar";
import MobileNav from "./components/MobileNav";
import UnifiedDashboard from "./pages/UnifiedDashboard";
import AdminGlobalDashboard from "./pages/AdminGlobalDashboard";
import Announcements from "./pages/AnnouncementsPage";
import LandingPage from "./pages/LandingPage";
import UsersPage from "./pages/UsersPage"; // <-- Import de la page Utilisateurs
import AuditsPage from "./pages/AuditsPage";
import AuditExecutionPage from "./pages/AuditExecutionPage";
import ArchivesPage from "./pages/ArchivesPage";


// Ce composant interne gère l'affichage conditionnel de la NavBar
const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();

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
          <header className="hidden lg:block sticky top-0 z-10">
            <div className="flex justify-between items-center gap-6">
              <NavBar />
              <div className="flex items-center gap-4 mr-4 mt-4">
                <ThemeSwitcher />
              </div>
            </div>
          </header>
          
          {/* Mobile Navigation */}
          <MobileNav />
        </>
      )}

      {/* Le conteneur principal pour le contenu de la page */}
      <div className={showNav ? "p-4" : ""}>
        <ServiceWorkerUI />
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
            <Route path="/announcements" element={<Announcements />} />
            
            {/* Users - adaptatif selon le mode */}
            <Route 
              path="/users" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <UsersPage />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Audits unifié - réservé aux admin/manager */}
            <Route 
              path="/audits" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AuditsPage />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Audit Execution - Accessible à tous les rôles */}
            <Route path="/audit/:id" element={<AuditExecutionPage />} />
            
            {/* Archives - réservé aux admin/manager */}
            <Route 
              path="/archives" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <ArchivesPage />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Redirections pour compatibilité avec anciennes URLs */}
            <Route path="/audit-templates" element={<Navigate to="/audits?tab=templates" replace />} />
            <Route path="/audit-planning" element={<Navigate to="/audits?tab=planning" replace />} />
            <Route path="/corrective-actions" element={<Navigate to="/audits?tab=actions" replace />} />
            
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
              <ToastProvider>
                <BrowserRouter>
                  <div className="bg-background text-foreground min-h-screen">
                    <AppContent />
                    <ToastContainer />
                  </div>
                </BrowserRouter>
              </ToastProvider>
            </NotificationProvider>
          </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
