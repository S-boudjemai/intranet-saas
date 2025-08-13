// src/components/NavBar.tsx - Version Optimisée Frontend

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { parseJwt, type JwtPayload } from "../utils/jwt";
import NotificationBadge from "./NotificationBadge";
import { useNotifications } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import GlobalSearch from "./GlobalSearch";
import { 
  ChevronDownIcon, 
  CogIcon, 
  SunIcon, 
  MoonIcon, 
  SystemIcon, 
  UserCircleIcon,
  LogoutIcon
} from "./icons";

interface NavbarInfo {
  tenant_name: string;
  restaurant_city: string | null;
}

export default function NavBar() {
  const { token, logout } = useAuth();
  const { notificationCounts, markAllAsRead } = useNotifications();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [navbarInfo, setNavbarInfo] = useState<NavbarInfo | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const canManage = raw?.role === "manager" || raw?.role === "admin";

  // Récupérer les informations navbar (optimisé)
  useEffect(() => {
    const fetchNavbarInfo = async () => {
      if (!token) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/navbar-info`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNavbarInfo(data.data);
        }
      } catch (error) {
        // Silencieux en production
        if (import.meta.env.DEV) {
          console.error('Erreur navbar:', error);
        }
      }
    };

    fetchNavbarInfo();
  }, [token]);

  // Click outside optimisé
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Handlers optimisés
  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleNotificationClick = (type: 'document_uploaded' | 'ticket_created' | 'announcement_posted') => 
    () => markAllAsRead(type);

  // Classes CSS optimisées
  const navLinkClass = ({ isActive }: { isActive: boolean }) => [
    "relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
    "hover:bg-muted/60 hover:text-foreground",
    isActive 
      ? "bg-primary/10 text-primary font-semibold" 
      : "text-muted-foreground"
  ].join(" ");

  const displayName = navbarInfo?.tenant_name 
    ? `${navbarInfo.tenant_name}${navbarInfo.restaurant_city ? ` ${navbarInfo.restaurant_city}` : ''}`
    : null;

  return (
    <>
      {/* Backdrop pour mobile */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
      >
        <div className="w-full">
          <div className="flex items-center justify-between h-16 pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8">
            
            {/* Logo/Brand */}
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 font-bold text-lg hover:text-primary transition-colors"
            >
              <span className="hidden sm:block">
                {displayName?.toUpperCase() || 'FRANCHISEDESK'}
              </span>
              <span className="sm:hidden">
                {displayName?.substring(0, 8).toUpperCase() || 'FDESK'}
              </span>
            </Link>

            {/* Navigation principale - Desktop */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-1">
                {canManage && (
                  <NavLink to="/dashboard" className={navLinkClass}>
                    Dashboard
                  </NavLink>
                )}
                
                <NavLink 
                  to="/documents" 
                  onClick={handleNotificationClick('document_uploaded')}
                  className={navLinkClass}
                >
                  Documents
                  <NotificationBadge 
                    count={notificationCounts.documents} 
                    className="absolute -top-1 -right-1"
                  />
                </NavLink>
                
                <NavLink 
                  to="/tickets"
                  onClick={handleNotificationClick('ticket_created')}
                  className={navLinkClass}
                >
                  Tickets
                  <NotificationBadge 
                    count={notificationCounts.tickets} 
                    className="absolute -top-1 -right-1"
                  />
                </NavLink>
                
                <NavLink 
                  to="/announcements"
                  onClick={handleNotificationClick('announcement_posted')}
                  className={navLinkClass}
                >
                  Annonces
                  <NotificationBadge 
                    count={notificationCounts.announcements} 
                    className="absolute -top-1 -right-1"
                  />
                </NavLink>

                {canManage && (
                  <>
                    <NavLink 
                      to="/audits" 
                      className={navLinkClass}
                    >
                      Audits
                    </NavLink>

                    <NavLink 
                      to="/planning" 
                      className={navLinkClass}
                    >
                      Planning
                    </NavLink>
                  </>
                )}

                {canManage && (
                  <>
                    <NavLink to="/users" className={navLinkClass}>
                      Utilisateurs
                    </NavLink>
                  </>
                )}
              </div>
            </div>

            {/* Actions droite */}
            <div className="flex items-center space-x-3">
              <GlobalSearch />
              
              {/* Menu utilisateur */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span className="hidden md:block text-sm font-medium">
                    {raw?.email?.split('@')[0]}
                  </span>
                  <ChevronDownIcon 
                    className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50"
                    >
                      {/* Header utilisateur */}
                      <div className="p-4 border-b border-border">
                        <p className="font-medium text-sm">{raw?.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{raw?.role}</p>
                      </div>

                      {/* Navigation mobile */}
                      <div className="lg:hidden border-b border-border">
                        <div className="p-2 space-y-1">
                          {canManage && (
                            <Link
                              to="/dashboard"
                              className="block px-3 py-2 text-sm rounded-lg hover:bg-muted"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Dashboard
                            </Link>
                          )}
                          <Link
                            to="/documents"
                            className="block px-3 py-2 text-sm rounded-lg hover:bg-muted"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Documents
                          </Link>
                          <Link
                            to="/tickets"
                            className="block px-3 py-2 text-sm rounded-lg hover:bg-muted"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Tickets
                          </Link>
                          <Link
                            to="/announcements"
                            className="block px-3 py-2 text-sm rounded-lg hover:bg-muted"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Annonces
                          </Link>
                          {canManage && (
                            <Link
                              to="/audits"
                              className="block px-3 py-2 text-sm rounded-lg hover:bg-muted"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Audits
                            </Link>
                          )}
                          {canManage && (
                            <>
                              <Link
                                to="/users"
                                className="block px-3 py-2 text-sm rounded-lg hover:bg-muted"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                Utilisateurs
                              </Link>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Sélecteur de thème */}
                      <div className="p-4 border-b border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-3">Apparence</p>
                        <div className="flex space-x-1">
                          {[
                            { value: 'light', icon: SunIcon, label: 'Clair' },
                            { value: 'dark', icon: MoonIcon, label: 'Sombre' },
                            { value: 'system', icon: SystemIcon, label: 'Système' }
                          ].map(({ value, icon: Icon, label }) => (
                            <button
                              key={value}
                              onClick={() => setTheme(value as any)}
                              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                                theme === value 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              title={label}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-2 space-y-1">
                        
                        <button
                          disabled
                          className="flex items-center space-x-3 px-3 py-2 text-sm rounded-lg opacity-50 cursor-not-allowed w-full text-left"
                        >
                          <CogIcon className="w-4 h-4" />
                          <span>Paramètres</span>
                          <span className="ml-auto text-xs text-muted-foreground">Bientôt</span>
                        </button>
                        
                        <hr className="my-2 border-border" />
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-left text-destructive font-medium"
                        >
                          <LogoutIcon className="w-4 h-4" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
}