// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { validateJWTStructure, clearInvalidToken, debugToken } from "../utils/tokenValidation";

interface JwtUser {
  userId: number;
  email: string;
  tenant_id: number | null;
  role: 'admin' | 'manager' | 'viewer';
  restaurant_id?: number | null;
}

interface AuthContextType {
  token: string | null;
  user: JwtUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialisation synchrone du token depuis localStorage
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<JwtUser | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour rafraîchir le token automatiquement
  const refreshToken = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Pour envoyer les cookies
      });

      if (!res.ok) {
        throw new Error('Token refresh failed');
      }

      const { access_token } = await res.json();
      localStorage.setItem("token", access_token);
      setToken(access_token);
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      return false;
    }
  };

  // Programmer le refresh automatique
  const scheduleTokenRefresh = (token: string) => {
    try {
      const validation = validateJWTStructure(token);
      if (!validation.isValid) {
        console.error('Token malformé pour refresh scheduling:', validation.error);
        return;
      }

      const payload = jwtDecode<any>(token);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Rafraîchir 2 minutes avant expiration (120 secondes)
      const refreshTime = Math.max(0, (timeUntilExpiry - 120) * 1000);
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        refreshToken();
      }, refreshTime);
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
      debugToken(token);
    }
  };

  // Dès que le token change, on décode le payload pour en extraire tenant_id et role
  useEffect(() => {
    if (token) {
      // Valider la structure du token avant de tenter de le décoder
      const validation = validateJWTStructure(token);
      
      if (!validation.isValid) {
        console.error('Token JWT invalide:', validation.error);
        debugToken(token);
        clearInvalidToken();
        setToken(null);
        setUser(null);
        return;
      }

      try {
        const payload = jwtDecode<any>(token);
        setUser({
          userId: payload.userId,
          email: payload.email,
          tenant_id: payload.tenant_id,
          role: payload.role,
          restaurant_id: payload.restaurant_id,
        });
        
        // Programmer le refresh automatique
        scheduleTokenRefresh(token);
      } catch (e) {
        console.error("Impossible de décoder le JWT", e);
        debugToken(token);
        clearInvalidToken();
        setToken(null);
        setUser(null);
      }
    } else {
      setUser(null);
      // Clear timeout si pas de token
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Pour recevoir les cookies de refresh
    });

    if (!res.ok) {
      throw new Error("Email ou mot de passe invalide");
    }

    const responseData = await res.json();
    
    // Le token peut être soit directement dans responseData, soit dans responseData.data
    const access_token = responseData.access_token || responseData.data?.access_token;
    
    localStorage.setItem("token", access_token);
    setToken(access_token);
    // le useEffect se chargera de décoder et remplir `user`
  };

  const logout = async () => {
    // Clear timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Clear localStorage
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    
    // Appeler endpoint logout pour clear le cookie
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    
    // Rediriger vers login après déconnexion
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
