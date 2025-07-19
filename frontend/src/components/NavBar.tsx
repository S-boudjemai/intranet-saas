// src/components/NavBar.tsx

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { parseJwt, type JwtPayload } from "../utils/jwt";
import Button from "./ui/Button";
import NotificationBadge from "./NotificationBadge";
import { useNotifications } from "../contexts/NotificationContext";
import GlobalSearch from "./GlobalSearch";

interface TenantInfo {
  id: number;
  name: string;
  logo_url: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export default function NavBar() {
  const { token, logout } = useAuth();
  const { notificationCounts, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const canManage = raw?.role === "manager" || raw?.role === "admin";

  // Récupérer les informations du tenant
  useEffect(() => {
    const fetchTenantInfo = async () => {
      if (!token || !raw?.tenant_id) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tenants/${raw.tenant_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTenantInfo(data.data || data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du tenant:', error);
      }
    };

    fetchTenantInfo();
  }, [token, raw?.tenant_id]);

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
          {tenantInfo?.logo_url ? (
            <img
              src={tenantInfo.logo_url}
              alt={`Logo ${tenantInfo.name}`}
              className="h-6 sm:h-8 w-auto max-w-[120px] sm:max-w-[160px] md:max-w-[200px] object-contain transition-all duration-200"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
              }}
              onError={(e) => {
                // Fallback si l'image ne charge pas
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <span
            className={`text-lg sm:text-xl font-bold text-foreground tracking-wider transition-all duration-300 group-hover:text-primary ${
              tenantInfo?.logo_url ? 'hidden' : ''
            }`}
          >
            <span className="hidden sm:inline">{(tenantInfo?.name || 'FRANCHISE').toUpperCase()}</span>
            <span className="sm:hidden">{(tenantInfo?.name?.substring(0, 8) || 'FRAN').toUpperCase()}</span>
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
              to="/archives"
              className={({ isActive }) =>
                `${linkClasses} ${isActive ? activeLinkClasses : ""}`
              }
            >
              Archives
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
        <div className="flex items-center space-x-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {raw?.email} ({raw?.role})
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={handleLogout}
            className="px-4 py-2 rounded-full text-sm font-medium text-destructive hover:text-destructive-foreground hover:bg-destructive transition-all duration-300 border border-destructive/20 hover:border-destructive hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-destructive/40"
          >
            Déconnexion
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}