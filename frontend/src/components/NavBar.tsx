// src/components/NavBar.tsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { parseJwt, type JwtPayload } from "../utils/jwt"; // Assurez-vous que ce chemin est correct
import Button from "./ui/Button";
import NotificationBadge from "./NotificationBadge";
import { useNotifications } from "../contexts/NotificationContext";
import GlobalSearch from "./GlobalSearch";

export default function NavBar() {
  const { token, logout } = useAuth();
  const { notificationCounts, markAllAsRead, isProcessing } = useNotifications();
  const navigate = useNavigate();

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const canManage = raw?.role === "manager" || raw?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleDocumentsClick = async () => {
    // Marquer toutes les notifications de documents comme lues quand on clique
    await markAllAsRead('document_uploaded');
  };

  const handleTicketsClick = async () => {
    // Marquer toutes les notifications de tickets comme lues quand on clique
    await markAllAsRead('ticket_created');
  };

  const handleAnnouncementsClick = async () => {
    // Marquer toutes les notifications d'annonces comme lues quand on clique
    await markAllAsRead('announcement_posted');
  };

  // Classes pour les liens de navigation, utilisant les nouvelles couleurs sémantiques
  const linkClasses =
    "px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors";
  const activeLinkClasses = "bg-secondary text-secondary-foreground font-semibold"; // Style pour le lien actif

  return (
    <div className="flex items-center justify-between w-full">
      <nav className="flex items-center space-x-4">
        {/* Logo ou nom de l'application */}
        <Link
          to={canManage ? "/dashboard" : "/documents"} // Le logo renvoie au dashboard pour les managers, aux documents pour les autres
          className="text-xl font-bold text-foreground tracking-wider mr-4"
        >
          FRANCHISE<span className="text-primary">HUB</span>
        </Link>

        {/* Séparateur visuel */}
        <div className="w-px h-6 bg-border"></div>

        {/* Liens de navigation */}
        {/* --- CORRECTION APPLIQUÉE ICI --- */}
        {/* Le lien Dashboard n'est maintenant visible que pour les managers et admins */}
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

        {/* Liens Audits réservés aux admin/manager */}
        {canManage && (
          <>
            <NavLink
              to="/audit-templates"
              className={({ isActive }) =>
                `${linkClasses} ${isActive ? activeLinkClasses : ""}`
              }
            >
              Templates Audits
            </NavLink>
            <NavLink
              to="/audit-planning"
              className={({ isActive }) =>
                `${linkClasses} ${isActive ? activeLinkClasses : ""}`
              }
            >
              Planning Audits
            </NavLink>
            <NavLink
              to="/corrective-actions"
              className={({ isActive }) =>
                `${linkClasses} ${isActive ? activeLinkClasses : ""}`
              }
            >
              Actions Correctives
            </NavLink>
          </>
        )}

        {/* Le lien Utilisateurs est déjà correctement conditionné */}
        {canManage && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `${linkClasses} ${isActive ? activeLinkClasses : ""}`
            }
          >
            Utilisateurs
          </NavLink>
        )}
      </nav>
      
      {/* Barre de recherche globale */}
      <div className="flex items-center gap-4">
        <GlobalSearch />
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="sm"
        >
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
