"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readStoredStudioTheme,
  STUDIO_THEME_COLORS,
  storeStudioTheme,
  type StudioTheme,
} from "@/lib/studioTheme";

type StudioThemeContextValue = {
  theme: StudioTheme;
  setTheme: (theme: StudioTheme) => void;
  toggleTheme: () => void;
};

const StudioThemeContext = createContext<StudioThemeContextValue | null>(null);

function resolveInitialTheme(): StudioTheme {
  if (typeof document === "undefined") return "dark";
  const stored = readStoredStudioTheme();
  if (stored) return stored;
  if (document.documentElement.dataset.studioTheme === "light") return "light";
  return "dark";
}

function syncStudioTheme(theme: StudioTheme) {
  document.documentElement.dataset.studioTheme = theme;
  document.querySelectorAll<HTMLElement>(".studio-shell").forEach((el) => {
    el.dataset.studioTheme = theme;
  });

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", STUDIO_THEME_COLORS[theme]);
  }
}

export function StudioThemeShell({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<StudioTheme>("dark");

  useLayoutEffect(() => {
    const initial = resolveInitialTheme();
    setThemeState(initial);
    syncStudioTheme(initial);
  }, []);

  const setTheme = useCallback((next: StudioTheme) => {
    setThemeState(next);
    storeStudioTheme(next);
    syncStudioTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      storeStudioTheme(next);
      syncStudioTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  );

  return (
    <StudioThemeContext.Provider value={value}>
      <div className="studio-shell" data-studio-theme={theme} suppressHydrationWarning>
        {children}
      </div>
    </StudioThemeContext.Provider>
  );
}

export function useStudioTheme(): StudioThemeContextValue {
  const ctx = useContext(StudioThemeContext);
  if (!ctx) {
    throw new Error("useStudioTheme must be used within StudioThemeShell");
  }
  return ctx;
}
