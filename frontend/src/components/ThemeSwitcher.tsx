import { useTheme } from "../contexts/ThemeContext";
import { SunIcon, MoonIcon, SystemIcon } from "../components/icons";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: "light", icon: <SunIcon className="w-5 h-5" />, label: "Clair" },
    { name: "dark", icon: <MoonIcon className="w-5 h-5" />, label: "Sombre" },
    { name: "system", icon: <SystemIcon className="w-5 h-5" />, label: "Système" },
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
