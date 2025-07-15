// src/components/ProtectedRoute.tsx
import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { token } = useAuth();
  const location = useLocation();

  // ⚡️ On attend un premier cycle de rendu pour laisser AuthContext hydrater le token
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  // tant que ready===false, on ne redirige pas et on n'affiche rien
  if (!ready) return null;

  // une fois ready, si pas de token, on envoie vers login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // token OK, on rend la page protégée
  return <Outlet />;
}
