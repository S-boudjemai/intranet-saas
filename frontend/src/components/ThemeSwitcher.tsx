import React from "react";
import { useTheme } from "../contexts/ThemeContext";

// --- ICÔNES SVG ---
const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591"
    />
  </svg>
);
const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25c0 5.385 4.365 9.75 9.75 9.75 2.572 0 4.92-.99 6.752-2.698z"
    />
  </svg>
);
const SystemIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
    />
  </svg>
);

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: "light", icon: <SunIcon />, label: "Clair" },
    { name: "dark", icon: <MoonIcon />, label: "Sombre" },
    { name: "system", icon: <SystemIcon />, label: "Système" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border">
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => setTheme(t.name as "light" | "dark" | "system")}
          className={`p-2 rounded-md transition-all duration-200 ${
            theme === t.name
              ? "bg-primary text-primary-foreground shadow-sm scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
          title={`Thème ${t.label}`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
