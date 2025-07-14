import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'manager' | 'viewer')[];
  redirectTo?: string;
}

export default function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo 
}: RoleProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Si pas d'utilisateur connecté, ne pas afficher (géré par ProtectedRoute parent)
  if (!user) {
    return null;
  }

  // Si l'utilisateur n'a pas le bon rôle
  if (!allowedRoles.includes(user.role)) {
    // Redirection intelligente basée sur le rôle
    const defaultRedirect = user.role === 'viewer' ? '/documents' : '/dashboard';
    const redirectPath = redirectTo || defaultRedirect;
    
    return <Navigate to={redirectPath} replace />;
  }

  // Rôle autorisé, afficher le contenu
  return <>{children}</>;
}