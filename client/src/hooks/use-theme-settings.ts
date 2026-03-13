import { useState, useEffect, useCallback } from "react";

export interface ThemeSettings {
  colorTheme: string;
  fontFamily: string;
  fontSize: number;
  contentWidth: number;
}

const STORAGE_KEY = "gear-vault-theme";

const defaults: ThemeSettings = {
  colorTheme: "forest",
  fontFamily: "system",
  fontSize: 16,
  contentWidth: 1280,
};

// Color themes define primary + secondary + sidebar HSL values
export const COLOR_THEMES: Record<string, { label: string; primary: string; secondary: string; sidebar: string; sidebarAccent: string }> = {
  forest: {
    label: "Forest",
    primary: "150 45% 30%",
    secondary: "25 70% 45%",
    sidebar: "150 45% 30%",
    sidebarAccent: "148 45% 22%",
  },
  ocean: {
    label: "Ocean",
    primary: "210 80% 40%",
    secondary: "180 60% 40%",
    sidebar: "210 80% 30%",
    sidebarAccent: "210 80% 22%",
  },
  sunset: {
    label: "Sunset",
    primary: "15 80% 50%",
    secondary: "35 90% 50%",
    sidebar: "15 70% 35%",
    sidebarAccent: "15 70% 28%",
  },
  slate: {
    label: "Slate",
    primary: "220 15% 40%",
    secondary: "200 20% 50%",
    sidebar: "220 15% 25%",
    sidebarAccent: "220 15% 18%",
  },
  berry: {
    label: "Berry",
    primary: "280 60% 45%",
    secondary: "320 70% 50%",
    sidebar: "280 55% 30%",
    sidebarAccent: "280 55% 22%",
  },
  earth: {
    label: "Earth",
    primary: "30 50% 40%",
    secondary: "15 60% 45%",
    sidebar: "30 40% 28%",
    sidebarAccent: "30 40% 20%",
  },
};

export const FONT_OPTIONS: { value: string; label: string; css: string; category: string }[] = [
  // Sans-serif
  { value: "system", label: "System Default", css: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', category: "Sans-serif" },
  { value: "inter", label: "Inter", css: '"Inter", sans-serif', category: "Sans-serif" },
  { value: "raleway", label: "Raleway", css: '"Raleway", sans-serif', category: "Sans-serif" },
  { value: "space-grotesk", label: "Space Grotesk", css: '"Space Grotesk", sans-serif', category: "Sans-serif" },
  { value: "outfit", label: "Outfit", css: '"Outfit", sans-serif', category: "Sans-serif" },
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans", css: '"Plus Jakarta Sans", sans-serif', category: "Sans-serif" },
  { value: "dm-sans", label: "DM Sans", css: '"DM Sans", sans-serif', category: "Sans-serif" },
  { value: "nunito", label: "Nunito", css: '"Nunito", sans-serif', category: "Sans-serif" },
  { value: "poppins", label: "Poppins", css: '"Poppins", sans-serif', category: "Sans-serif" },
  { value: "open-sans", label: "Open Sans", css: '"Open Sans", sans-serif', category: "Sans-serif" },
  { value: "lato", label: "Lato", css: '"Lato", sans-serif', category: "Sans-serif" },
  { value: "rubik", label: "Rubik", css: '"Rubik", sans-serif', category: "Sans-serif" },
  { value: "work-sans", label: "Work Sans", css: '"Work Sans", sans-serif', category: "Sans-serif" },
  // Monospace
  { value: "jetbrains-mono", label: "JetBrains Mono", css: '"JetBrains Mono", monospace', category: "Monospace" },
  { value: "fira-code", label: "Fira Code", css: '"Fira Code", monospace', category: "Monospace" },
  // Serif
  { value: "merriweather", label: "Merriweather", css: '"Merriweather", serif', category: "Serif" },
  { value: "lora", label: "Lora", css: '"Lora", serif', category: "Serif" },
  { value: "playfair-display", label: "Playfair Display", css: '"Playfair Display", serif', category: "Serif" },
];

// Google Fonts URLs for non-system fonts
const FONT_URLS: Record<string, string> = {
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
  raleway: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap",
  "space-grotesk": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
  outfit: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap",
  "plus-jakarta-sans": "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap",
  "dm-sans": "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap",
  nunito: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap",
  poppins: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap",
  "open-sans": "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap",
  lato: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap",
  rubik: "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap",
  "work-sans": "https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap",
  "jetbrains-mono": "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap",
  "fira-code": "https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap",
  merriweather: "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap",
  lora: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
  "playfair-display": "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap",
};

function loadSettings(): ThemeSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaults, ...JSON.parse(stored) };
  } catch {}
  return defaults;
}

function applyTheme(settings: ThemeSettings) {
  const root = document.documentElement;
  const theme = COLOR_THEMES[settings.colorTheme] ?? COLOR_THEMES.forest;

  // Color
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--ring", theme.primary);
  root.style.setProperty("--chart-1", theme.primary);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--chart-2", theme.secondary);
  root.style.setProperty("--sidebar-background", theme.sidebar);
  root.style.setProperty("--sidebar-primary-foreground", theme.sidebar);
  root.style.setProperty("--sidebar-accent", theme.sidebarAccent);
  root.style.setProperty("--sidebar-border", theme.sidebarAccent);

  // Font family
  const font = FONT_OPTIONS.find((f) => f.value === settings.fontFamily) ?? FONT_OPTIONS[0];
  root.style.setProperty("--font-family", font.css);
  document.body.style.fontFamily = font.css;

  // Load Google Font if needed
  const fontUrl = FONT_URLS[settings.fontFamily];
  const existingLink = document.getElementById("theme-font-link");
  if (fontUrl) {
    if (existingLink) {
      (existingLink as HTMLLinkElement).href = fontUrl;
    } else {
      const link = document.createElement("link");
      link.id = "theme-font-link";
      link.rel = "stylesheet";
      link.href = fontUrl;
      document.head.appendChild(link);
    }
  } else if (existingLink) {
    existingLink.remove();
  }

  // Font size
  root.style.fontSize = `${settings.fontSize}px`;

  // Content width
  root.style.setProperty("--content-width", `${settings.contentWidth}px`);
}

export function useThemeSettings() {
  const [settings, setSettingsState] = useState<ThemeSettings>(loadSettings);

  // Apply on mount and whenever settings change
  useEffect(() => {
    applyTheme(settings);
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<ThemeSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettingsState(defaults);
  }, []);

  return { settings, updateSettings, resetSettings };
}
