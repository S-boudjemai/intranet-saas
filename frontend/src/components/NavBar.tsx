// src/components/NavBar.tsx

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { parseJwt, type JwtPayload } from "../utils/jwt";
import Button from "./ui/Button";
import NotificationBadge from "./NotificationBadge";
import { useNotifications } from "../contexts/NotificationContext";
import { useTheme } from "../contexts/ThemeContext";
import GlobalSearch from "./GlobalSearch";
import { ChevronDownIcon, CogIcon, ArchiveIcon, SunIcon, MoonIcon, SystemIcon, UserCircleIcon } from "./icons";

interface NavbarInfo {
  tenant_name: string;
  restaurant_city: string | null;
}

// Interface TenantInfo supprimée - plus utilisée

export default function NavBar() {
  const { token, logout } = useAuth();
  const { notificationCounts, markAllAsRead } = useNotifications();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [navbarInfo, setNavbarInfo] = useState<NavbarInfo | null>(null);
  const [isRestaurantMenuOpen, setIsRestaurantMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const canManage = raw?.role === "manager" || raw?.role === "admin";
  
  console.log('🔵 JWT Info:', { 
    restaurant_id: raw?.restaurant_id, 
    tenant_id: raw?.tenant_id,
    role: raw?.role 
  });

  // Récupérer les informations pour la navbar
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      console.log('🔵 Fetching navbar data with:', { 
        token: token?.substring(0, 20) + '...', 
        tenant_id: raw?.tenant_id,
        restaurant_id: raw?.restaurant_id 
      });
      
      try {
        console.log('🔵 API URL:', import.meta.env.VITE_API_URL);
        
        // Récupérer les infos navbar (tenant name + restaurant city)
        const navbarResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/navbar-info`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (navbarResponse.ok) {
          const navbarData = await navbarResponse.json();
          console.log('🟩 Navbar API Response:', navbarData);
          setNavbarInfo(navbarData.data); // Accéder à la propriété 'data'
        } else {
          console.error('❌ Navbar API Error:', navbarResponse.status, await navbarResponse.text());
        }

        // Plus besoin d'appel tenant séparé
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchData();
  }, [token, raw?.tenant_id]);

  // Gestion du clic en dehors du dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRestaurantMenuOpen(false);
      }
    };

    if (isRestaurantMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRestaurantMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleDocumentsClick = async () => {
    await markAllAsRead('document_uploaded');
  };

  const handleTicketsClick = async () => {
    await markAllAsRead('ticket_created');
  };

  const handleAnnouncementsClick = async () => {
    await markAllAsRead('announcement_posted');
  };

  // Classes pour les liens de navigation - Style Waitify avec dark mode conditionnel
  const linkClasses =
    "px-4 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary/40 transition-all duration-300 ease-out relative";
  const activeLinkClasses = "bg-card text-foreground font-semibold shadow-md dark:shadow-lg dark:shadow-primary/40";

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm dark:shadow-lg dark:shadow-primary/20 px-6 py-3 flex items-center space-x-2 mx-4 mt-4" 
      style={{
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}
    >
      <div className="flex items-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            to="/dashboard"
            className="flex items-center mr-6 group"
          >
          <span className="text-lg sm:text-xl font-bold text-foreground tracking-wider transition-all duration-300 group-hover:text-primary">
            <span className="hidden sm:inline">
              {(navbarInfo?.tenant_name || 'Loading...').toUpperCase()}
              {navbarInfo?.restaurant_city && ` ${navbarInfo.restaurant_city.toUpperCase()}`}
            </span>
            <span className="sm:hidden">
              {(navbarInfo?.tenant_name?.substring(0, 4) || 'LOAD').toUpperCase()}
              {navbarInfo?.restaurant_city && ` ${navbarInfo.restaurant_city.substring(0, 3).toUpperCase()}`}
            </span>
          </span>
          </Link>
        </motion.div>

        {/* Séparateur visuel Waitify */}
        <div className="w-px h-8 bg-border mx-2"></div>

        {/* Liens de navigation standard */}
        {canManage && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${linkClasses} ${isActive ? activeLinkClasses : ""}`
            }
          >
            Dashboard
          </NavLink>
        )}
        
        <NavLink
          to="/documents"
          onClick={handleDocumentsClick}
          className={({ isActive }) =>
            `${linkClasses} ${isActive ? activeLinkClasses : ""} relative`
          }
        >
          Documents
          <NotificationBadge 
            count={notificationCounts.documents || 0} 
            className="absolute -top-1 -right-1"
          />
        </NavLink>
        
        <NavLink
          to="/tickets"
          onClick={handleTicketsClick}
          className={({ isActive }) =>
            `${linkClasses} ${isActive ? activeLinkClasses : ""} relative`
          }
        >
          Tickets
          <NotificationBadge 
            count={notificationCounts.tickets || 0} 
            className="absolute -top-1 -right-1"
          />
        </NavLink>
        
        <NavLink
          to="/announcements"
          onClick={handleAnnouncementsClick}
          className={({ isActive }) =>
            `${linkClasses} ${isActive ? activeLinkClasses : ""} relative`
          }
        >
          Annonces
          <NotificationBadge 
            count={notificationCounts.announcements || 0} 
            className="absolute -top-1 -right-1"
          />
        </NavLink>

        {/* Liens réservés aux admin/manager */}
        {canManage && (
          <>
            <NavLink
              to="/audits"
              className={({ isActive }) =>
                `${linkClasses} ${isActive ? activeLinkClasses : ""}`
              }
            >
              Audits & Conformité
            </NavLink>


            <NavLink
              to="/users"
              className={({ isActive }) =>
                `${linkClasses} ${isActive ? activeLinkClasses : ""}`
              }
            >
              Utilisateurs
            </NavLink>
          </>
        )}
      </div>

      {/* Section droite - Recherche et Actions */}
      <div className="flex items-center space-x-4 ml-auto">
        <GlobalSearch />
      </div>
      
      {/* Restaurant Dropdown Menu - Tout à droite */}
      <div className="relative mr-4" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => setIsRestaurantMenuOpen(!isRestaurantMenuOpen)}
            className="flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium text-foreground hover:bg-card hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary/40 transition-all duration-300 border border-border/50"
          >
            <UserCircleIcon className="w-4 h-4" />
            <span className="text-sm font-semibold leading-tight">
              Mon compte
            </span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isRestaurantMenuOpen ? 'rotate-180' : ''}`} />
          </motion.button>
          
          {/* Dropdown Menu */}
          {isRestaurantMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg dark:shadow-xl dark:shadow-primary/20 py-2 z-50"
            >
              {/* Theme Selector */}
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Thème</p>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                      theme === 'light' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                    title="Mode clair"
                  >
                    <SunIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                      theme === 'dark' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                    title="Mode sombre"
                  >
                    <MoonIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                      theme === 'system' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                    title="Système"
                  >
                    <SystemIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Menu Items */}
              {canManage && (
                <Link
                  to="/archives"
                  onClick={() => setIsRestaurantMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <ArchiveIcon className="w-4 h-4" />
                  <span>Archives</span>
                </Link>
              )}
              
              <button
                onClick={() => {
                  setIsRestaurantMenuOpen(false);
                  // Placeholder pour réglages futurs
                }}
                className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-muted transition-colors w-full text-left opacity-50 cursor-not-allowed"
                disabled
              >
                <CogIcon className="w-4 h-4" />
                <span>Réglages (Bientôt)</span>
              </button>
              
              {/* Séparateur */}
              <div className="border-t border-border my-1"></div>
              
              {/* Info utilisateur */}
              <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
                {raw?.email} ({raw?.role})
              </div>
              
              {/* Déconnexion */}
              <button
                onClick={() => {
                  setIsRestaurantMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-left text-destructive"
              >
                <span>Déconnexion</span>
              </button>
            </motion.div>
          )}
      </div>
    </motion.nav>
  );
}