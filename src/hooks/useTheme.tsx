import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface ThemeColors {
  "--background": string;
  "--foreground": string;
  "--primary": string;
  "--primary-foreground": string;
  "--surface": string;
  "--card": string;
  "--card-foreground": string;
  "--border": string;
  "--muted": string;
  "--muted-foreground": string;
  "--accent": string;
  "--accent-foreground": string;
  "--popover": string;
  "--popover-foreground": string;
  "--secondary": string;
  "--secondary-foreground": string;
  "--destructive": string;
  "--destructive-foreground": string;
  "--input": string;
  "--ring": string;
  "--radius": string;
  "--shelf-wood": string;
  "--shelf-shadow": string;
  "--book-shadow": string;
  [key: string]: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  emoji: string;
  light: ThemeColors;
  dark: ThemeColors;
}

// Generate a full theme from a single hex color
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateCustomTheme(primaryHex: string): ThemeDefinition {
  const { h, s } = hexToHSL(primaryHex);

  return {
    id: "custom",
    name: "Personalizado",
    emoji: "\ud83c\udfa8",
    light: {
      "--background": hslToHex(h, Math.max(s - 30, 5), 97),
      "--foreground": hslToHex(h, Math.min(s, 20), 10),
      "--primary": primaryHex,
      "--primary-foreground": "#FFFFFF",
      "--surface": hslToHex(h, Math.max(s - 20, 5), 95),
      "--card": hslToHex(h, Math.max(s - 20, 5), 95),
      "--card-foreground": hslToHex(h, Math.min(s, 20), 10),
      "--border": hslToHex(h, Math.max(s - 25, 5), 88),
      "--muted": hslToHex(h, Math.max(s - 25, 5), 88),
      "--muted-foreground": hslToHex(h, Math.max(s - 15, 10), 40),
      "--accent": hslToHex(h, Math.min(s + 10, 100), 40),
      "--accent-foreground": "#FFFFFF",
      "--popover": hslToHex(h, Math.max(s - 20, 5), 95),
      "--popover-foreground": hslToHex(h, Math.min(s, 20), 10),
      "--secondary": hslToHex(h, Math.max(s - 25, 5), 88),
      "--secondary-foreground": hslToHex(h, Math.min(s, 20), 10),
      "--destructive": "#DC2626",
      "--destructive-foreground": "#FFFFFF",
      "--input": hslToHex(h, Math.max(s - 25, 5), 88),
      "--ring": primaryHex,
      "--radius": "0.75rem",
      "--shelf-wood": "transparent",
      "--shelf-shadow": "transparent",
      "--book-shadow": "rgba(0,0,0,0.15)",
    },
    dark: {
      "--background": hslToHex(h, Math.max(s - 20, 8), 6),
      "--foreground": hslToHex(h, Math.max(s - 30, 5), 92),
      "--primary": hslToHex(h, Math.min(s + 5, 90), 60),
      "--primary-foreground": hslToHex(h, Math.max(s - 20, 8), 6),
      "--surface": hslToHex(h, Math.max(s - 15, 8), 10),
      "--card": hslToHex(h, Math.max(s - 15, 8), 10),
      "--card-foreground": hslToHex(h, Math.max(s - 30, 5), 92),
      "--border": hslToHex(h, Math.max(s - 15, 8), 16),
      "--muted": hslToHex(h, Math.max(s - 15, 8), 16),
      "--muted-foreground": hslToHex(h, Math.max(s - 10, 10), 55),
      "--accent": hslToHex(h, Math.min(s + 10, 100), 55),
      "--accent-foreground": hslToHex(h, Math.max(s - 20, 8), 6),
      "--popover": hslToHex(h, Math.max(s - 15, 8), 10),
      "--popover-foreground": hslToHex(h, Math.max(s - 30, 5), 92),
      "--secondary": hslToHex(h, Math.max(s - 15, 8), 16),
      "--secondary-foreground": hslToHex(h, Math.max(s - 30, 5), 92),
      "--destructive": "#DC2626",
      "--destructive-foreground": "#FFFFFF",
      "--input": hslToHex(h, Math.max(s - 15, 8), 16),
      "--ring": hslToHex(h, Math.min(s + 5, 90), 60),
      "--radius": "0.75rem",
      "--shelf-wood": "transparent",
      "--shelf-shadow": "transparent",
      "--book-shadow": "rgba(0,0,0,0.3)",
    },
  };
}

const THEMES: Record<string, ThemeDefinition> = {
  cozy: {
    id: "cozy",
    name: "Biblioteca Acogedora",
    emoji: "\ud83d\udcda",
    light: {
      "--background": "#F5EFEB", "--foreground": "#2C1E16", "--primary": "#D97757",
      "--primary-foreground": "#FFFFFF", "--surface": "#EAE0D8", "--card": "#EAE0D8",
      "--card-foreground": "#2C1E16", "--border": "#D5C8BC", "--muted": "#D5C8BC",
      "--muted-foreground": "#6B5A4E", "--accent": "#B85C3D", "--accent-foreground": "#FFFFFF",
      "--popover": "#EAE0D8", "--popover-foreground": "#2C1E16", "--secondary": "#D5C8BC",
      "--secondary-foreground": "#2C1E16", "--destructive": "#DC2626",
      "--destructive-foreground": "#FFFFFF", "--input": "#D5C8BC", "--ring": "#D97757",
      "--radius": "0.75rem", "--shelf-wood": "transparent", "--shelf-shadow": "transparent",
      "--book-shadow": "rgba(0,0,0,0.2)",
    },
    dark: {
      "--background": "#1E1611", "--foreground": "#EAE0D8", "--primary": "#D97757",
      "--primary-foreground": "#1E1611", "--surface": "#2C1E16", "--card": "#2C1E16",
      "--card-foreground": "#EAE0D8", "--border": "#3A2B22", "--muted": "#3A2B22",
      "--muted-foreground": "#9A8578", "--accent": "#E8956F", "--accent-foreground": "#1E1611",
      "--popover": "#2C1E16", "--popover-foreground": "#EAE0D8", "--secondary": "#3A2B22",
      "--secondary-foreground": "#EAE0D8", "--destructive": "#DC2626",
      "--destructive-foreground": "#FFFFFF", "--input": "#3A2B22", "--ring": "#D97757",
      "--radius": "0.75rem", "--shelf-wood": "transparent", "--shelf-shadow": "transparent",
      "--book-shadow": "rgba(0,0,0,0.2)",
    },
  },
  night: {
    id: "night",
    name: "Rincon Nocturno",
    emoji: "\ud83c\udf19",
    light: {
      "--background": "#F0F4F8", "--foreground": "#0A0A1A", "--primary": "#1E3A8A",
      "--primary-foreground": "#FFFFFF", "--surface": "#FFFFFF", "--card": "#FFFFFF",
      "--card-foreground": "#0A0A1A", "--border": "#E2E8F0", "--muted": "#E2E8F0",
      "--muted-foreground": "#64748B", "--accent": "#F59E0B", "--accent-foreground": "#0A0A1A",
      "--popover": "#FFFFFF", "--popover-foreground": "#0A0A1A", "--secondary": "#E2E8F0",
      "--secondary-foreground": "#0A0A1A", "--destructive": "#DC2626",
      "--destructive-foreground": "#FFFFFF", "--input": "#E2E8F0", "--ring": "#1E3A8A",
      "--radius": "1rem", "--shelf-wood": "transparent", "--shelf-shadow": "transparent",
      "--book-shadow": "rgba(0,0,0,0.2)",
    },
    dark: {
      "--background": "#030810", "--foreground": "#E2F0FF", "--primary": "#7DD3FC",
      "--primary-foreground": "#030810", "--surface": "#070F1A", "--card": "#070F1A",
      "--card-foreground": "#E2F0FF", "--border": "#0D1E30", "--muted": "#0D1E30",
      "--muted-foreground": "#6FA8C8", "--accent": "#38BDF8", "--accent-foreground": "#030810",
      "--popover": "#070F1A", "--popover-foreground": "#E2F0FF", "--secondary": "#0D1E30",
      "--secondary-foreground": "#E2F0FF", "--destructive": "#DC2626",
      "--destructive-foreground": "#FFFFFF", "--input": "#0D1E30", "--ring": "#7DD3FC",
      "--radius": "1rem", "--shelf-wood": "transparent", "--shelf-shadow": "transparent",
      "--book-shadow": "rgba(0,0,0,0.2)",
    },
  },
  editorial: {
    id: "editorial",
    name: "Galeria Editorial",
    emoji: "\u2728",
    light: {
      "--background": "#FAFAFA", "--foreground": "#050505", "--primary": "#166534",
      "--primary-foreground": "#FFFFFF", "--surface": "#FFFFFF", "--card": "#FFFFFF",
      "--card-foreground": "#050505", "--border": "#E5E5E5", "--muted": "#E5E5E5",
      "--muted-foreground": "#737373", "--accent": "#15803d", "--accent-foreground": "#FFFFFF",
      "--popover": "#FFFFFF", "--popover-foreground": "#050505", "--secondary": "#E5E5E5",
      "--secondary-foreground": "#050505", "--destructive": "#DC2626",
      "--destructive-foreground": "#FFFFFF", "--input": "#E5E5E5", "--ring": "#166534",
      "--radius": "0.5rem", "--shelf-wood": "transparent", "--shelf-shadow": "transparent",
      "--book-shadow": "rgba(0,0,0,0.2)",
    },
    dark: {
      "--background": "#09090B", "--foreground": "#FAFAFA", "--primary": "#22c55e",
      "--primary-foreground": "#09090B", "--surface": "#121214", "--card": "#121214",
      "--card-foreground": "#FAFAFA", "--border": "#27272A", "--muted": "#27272A",
      "--muted-foreground": "#A1A1AA", "--accent": "#16a34a", "--accent-foreground": "#09090B",
      "--popover": "#121214", "--popover-foreground": "#FAFAFA", "--secondary": "#27272A",
      "--secondary-foreground": "#FAFAFA", "--destructive": "#DC2626",
      "--destructive-foreground": "#FFFFFF", "--input": "#27272A", "--ring": "#22c55e",
      "--radius": "0.5rem", "--shelf-wood": "transparent", "--shelf-shadow": "transparent",
      "--book-shadow": "rgba(0,0,0,0.2)",
    },
  },
};

interface ThemeContextType {
  themeId: string;
  setThemeId: (id: string) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  themes: Record<string, ThemeDefinition>;
  currentTheme: ThemeDefinition;
  customColor: string;
  setCustomColor: (color: string) => void;
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(() => {
    const saved = localStorage.getItem("booktracker-dark");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [themeId, setThemeIdState] = useState(
    () => localStorage.getItem("booktracker-theme") || "night"
  );

  const [customColor, setCustomColorState] = useState(
    () => localStorage.getItem("booktracker-custom-color") || "#8B5CF6"
  );

  const setDark = useCallback((d: boolean) => {
    setDarkState(d);
    document.documentElement.classList.toggle("dark", d);
    localStorage.setItem("booktracker-dark", String(d));
  }, []);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    localStorage.setItem("booktracker-theme", id);
  }, []);

  const setCustomColor = useCallback((color: string) => {
    setCustomColorState(color);
    localStorage.setItem("booktracker-custom-color", color);
  }, []);

  // Build themes including custom
  const allThemes: Record<string, ThemeDefinition> = {
    ...THEMES,
    custom: generateCustomTheme(customColor),
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    const theme = allThemes[themeId] || allThemes.night;
    const vars = dark ? theme.dark : theme.light;
    applyVars(vars);
    document.documentElement.setAttribute("data-theme", themeId);
  }, [dark, themeId, customColor]);

  const currentTheme = allThemes[themeId] || allThemes.night;

  return (
    <ThemeContext.Provider
      value={{ dark, setDark, themeId, setThemeId, themes: allThemes, currentTheme, customColor, setCustomColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
