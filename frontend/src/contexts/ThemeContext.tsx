import React, { createContext, useContext, useEffect, useState } from "react";

// Définit les thèmes possibles
type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Le fournisseur de thème qui va englober toute l'application
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise le state en lisant le thème depuis le localStorage, ou 'system' par défaut
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "system";
    }
    return "system";
  });

  // Effet qui s'exécute à chaque changement de thème
  useEffect(() => {
    const root = window.document.documentElement; // Cible la balise <html>
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";

    // Applique la bonne classe à la balise <html>
    if (theme === "system") {
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  }, [theme]);

  // Fonction pour changer le thème et le sauvegarder
  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook personnalisé pour utiliser facilement le contexte du thème
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
