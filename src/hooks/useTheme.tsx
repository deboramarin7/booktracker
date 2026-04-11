import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

const PRESETS: ThemePreset[] = [
  {
    id: "classic", name: "Clásico", emoji: "🌿",
    light: { "--primary": "152 45% 28%", "--accent": "142 40% 45%", "--ring": "152 45% 28%", "--reading": "142 52% 36%", "--finished": "152 45% 28%", "--want-to-read": "142 40% 45%" },
    dark:  { "--primary": "142 40% 45%", "--accent": "142 40% 45%", "--ring": "142 40% 45%", "--reading": "142 52% 36%", "--finished": "142 40% 45%", "--want-to-read": "142 40% 45%" },
  },
  {
    id: "ocean", name: "Océano", emoji: "🌊",
    light: { "--primary": "210 65% 35%", "--accent": "200 55% 50%", "--ring": "210 65% 35%", "--reading": "200 60% 45%", "--finished": "210 65% 35%", "--want-to-read": "195 50% 55%" },
    dark:  { "--primary": "200 55% 50%", "--accent": "200 55% 50%", "--ring": "200 55% 50%", "--reading": "200 60% 45%", "--finished": "200 55% 50%", "--want-to-read": "195 50% 55%" },
  },
  {
    id: "forest", name: "Bosque", emoji: "🌲",
    light: { "--primary": "160 40% 25%", "--accent": "95 35% 45%", "--ring": "160 40% 25%", "--reading": "95 40% 40%", "--finished": "160 40% 25%", "--want-to-read": "80 30% 50%" },
    dark:  { "--primary": "95 35% 45%", "--accent": "95 35% 45%", "--ring": "95 35% 45%", "--reading": "95 40% 40%", "--finished": "95 35% 45%", "--want-to-read": "80 30% 50%" },
  },
  {
    id: "sunset", name: "Atardecer", emoji: "🌅",
    light: { "--primary": "15 70% 45%", "--accent": "35 80% 55%", "--ring": "15 70% 45%", "--reading": "35 75% 50%", "--finished": "15 70% 45%", "--want-to-read": "45 80% 55%" },
    dark:  { "--primary": "25 75% 55%", "--accent": "35 80% 55%", "--ring": "25 75% 55%", "--reading": "35 75% 50%", "--finished": "25 75% 55%", "--want-to-read": "45 80% 55%" },
  },
  {
    id: "lavender", name: "Lavanda", emoji: "💜",
    light: { "--primary": "270 45% 45%", "--accent": "280 40% 55%", "--ring": "270 45% 45%", "--reading": "280 45% 50%", "--finished": "270 45% 45%", "--want-to-read": "260 35% 60%" },
    dark:  { "--primary": "275 40% 55%", "--accent": "280 40% 55%", "--ring": "275 40% 55%", "--reading": "280 45% 50%", "--finished": "275 40% 55%", "--want-to-read": "260 35% 60%" },
  },
  {
    id: "midnight", name: "Medianoche", emoji: "🌙",
    light: { "--primary": "230 50% 35%", "--accent": "220 45% 50%", "--ring": "230 50% 35%", "--reading": "220 50% 45%", "--finished": "230 50% 35%", "--want-to-read": "215 40% 55%" },
    dark:  { "--primary": "220 45% 50%", "--accent": "220 45% 50%", "--ring": "220 45% 50%", "--reading": "220 50% 45%", "--finished": "220 45% 50%", "--want-to-read": "215 40% 55%" },
  },
];

// All CSS variables that change between light and dark mode
// These must be set explicitly so Portals (Sheet, Dialog, etc.) always read the correct values
const DARK_VARS: Record<string, string> = {
  "--background": "220 20% 8%",
  "--foreground": "220 10% 92%",
  "--card": "220 16% 12%",
  "--card-foreground": "220 10% 92%",
  "--popover": "220 16% 12%",
  "--popover-foreground": "220 10% 92%",
  "--primary-foreground": "220 20% 8%",
  "--secondary": "220 12% 16%",
  "--secondary-foreground": "220 10% 92%",
  "--muted": "220 10% 16%",
  "--muted-foreground": "220 8% 50%",
  "--accent-foreground": "220 20% 8%",
  "--destructive": "0 55% 42%",
  "--destructive-foreground": "0 0% 100%",
  "--border": "220 10% 17%",
  "--input": "220 10% 17%",
};

const LIGHT_VARS: Record<string, string> = {
  "--background": "220 14% 96%",
  "--foreground": "220 15% 12%",
  "--card": "220 14% 98%",
  "--card-foreground": "220 15% 12%",
  "--popover": "220 14% 98%",
  "--popover-foreground": "220 15% 12%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "220 10% 91%",
  "--secondary-foreground": "220 15% 12%",
  "--muted": "220 8% 92%",
  "--muted-foreground": "220 8% 46%",
  "--accent-foreground": "0 0% 100%",
  "--destructive": "0 62% 48%",
  "--destructive-foreground": "0 0% 100%",
  "--border": "220 10% 87%",
  "--input": "220 10% 87%",
};

interface ThemeContextType {
  themeId: string;
  setThemeId: (id: string) => void;
  customHue: number | null;
  setCustomHue: (hue: number | null) => void;
  presets: ThemePreset[];
  dark: boolean;
  setDark: (d: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}

function applyVars(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

function clearColorVars() {
  const root = document.documentElement;
  ["--primary", "--accent", "--ring", "--reading", "--finished", "--want-to-read"].forEach(k =>
    root.style.removeProperty(k)
  );
}

function generateCustomTheme(hue: number): { light: Record<string, string>; dark: Record<string, string> } {
  return {
    light: { "--primary": `${hue} 50% 35%`, "--accent": `${(hue + 15) % 360} 45% 50%`, "--ring": `${hue} 50% 35%`, "--reading": `${(hue + 10) % 360} 50% 42%`, "--finished": `${hue} 50% 35%`, "--want-to-read": `${(hue + 20) % 360} 40% 55%` },
    dark:  { "--primary": `${hue} 45% 50%`, "--accent": `${(hue + 15) % 360} 45% 50%`, "--ring": `${hue} 45% 50%`, "--reading": `${(hue + 10) % 360} 50% 42%`, "--finished": `${hue} 45% 50%`, "--want-to-read": `${(hue + 20) % 360} 40% 55%` },
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(() => {
    return localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const [themeId, setThemeIdState] = useState(() => localStorage.getItem("color-theme") || "classic");
  const [customHue, setCustomHueState] = useState<number | null>(() => {
    const h = localStorage.getItem("custom-hue");
    return h ? Number(h) : null;
  });

  const setDark = useCallback((d: boolean) => {
    setDarkState(d);
    document.documentElement.classList.toggle("dark", d);
    localStorage.setItem("theme", d ? "dark" : "light");
  }, []);

  const applyCurrentTheme = useCallback((id: string, hue: number | null, isDark: boolean) => {
    // 1. Apply light/dark base variables explicitly so Portals always read correct values
    applyVars(isDark ? DARK_VARS : LIGHT_VARS);

    // 2. Apply color preset on top
    if (id === "custom" && hue !== null) {
      const t = generateCustomTheme(hue);
      applyVars(isDark ? t.dark : t.light);
    } else {
      const preset = PRESETS.find(p => p.id === id);
      if (preset) {
        applyVars(isDark ? preset.dark : preset.light);
      } else {
        clearColorVars();
      }
    }
  }, []);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    localStorage.setItem("color-theme", id);
    applyCurrentTheme(id, customHue, dark);
  }, [customHue, dark, applyCurrentTheme]);

  const setCustomHue = useCallback((hue: number | null) => {
    setCustomHueState(hue);
    if (hue !== null) {
      localStorage.setItem("custom-hue", String(hue));
      setThemeIdState("custom");
      localStorage.setItem("color-theme", "custom");
      applyCurrentTheme("custom", hue, dark);
    }
  }, [dark, applyCurrentTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    applyCurrentTheme(themeId, customHue, dark);
  }, [dark, themeId, customHue, applyCurrentTheme]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, customHue, setCustomHue, presets: PRESETS, dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
