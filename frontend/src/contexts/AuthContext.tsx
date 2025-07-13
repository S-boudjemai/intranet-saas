// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";

interface UserPayload {
  tenant_id: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: UserPayload | null;
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
  const [user, setUser] = useState<UserPayload | null>(null);

  // Dès que le token change, on décode le payload pour en extraire tenant_id et role
  useEffect(() => {
    if (token) {
      try {
        const payload = jwtDecode<any>(token);
        setUser({
          tenant_id: payload.tenant_id,
          role: payload.role,
        });
      } catch (e) {
        console.error("Impossible de décoder le JWT", e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Email ou mot de passe invalide");
    }

    const { access_token } = await res.json();
    localStorage.setItem("token", access_token);
    setToken(access_token);
    // le useEffect se chargera de décoder et remplir `user`
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
