// src/components/NavBar.tsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { parseJwt, type JwtPayload } from "../utils/jwt"; // Assurez-vous que ce chemin est correct

export default function NavBar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const canManage = raw?.role === "manager" || raw?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Classes pour les liens de navigation, utilisant les nouvelles couleurs sémantiques
  const linkClasses =
    "px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors";
  const activeLinkClasses = "bg-secondary text-foreground font-semibold"; // Style pour le lien actif

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
          className={({ isActive }) =>
            `${linkClasses} ${isActive ? activeLinkClasses : ""}`
          }
        >
          Documents
        </NavLink>
        <NavLink
          to="/tickets"
          className={({ isActive }) =>
            `${linkClasses} ${isActive ? activeLinkClasses : ""}`
          }
        >
          Tickets
        </NavLink>
        <NavLink
          to="/announcements"
          className={({ isActive }) =>
            `${linkClasses} ${isActive ? activeLinkClasses : ""}`
          }
        >
          Annonces
        </NavLink>

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
      <button
        onClick={handleLogout}
        className="px-4 py-2 text-sm font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-md hover:bg-destructive/20 transition-colors"
      >
        Déconnexion
      </button>
    </div>
  );
}
