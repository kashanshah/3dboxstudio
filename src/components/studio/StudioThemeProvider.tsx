"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readInitialResolvedStudioTheme,
  readInitialStudioThemePreference,
  readSystemPrefersDark,
  resolveStudioTheme,
  STUDIO_THEME_COLORS,
  storeStudioThemePreference,
  type StudioTheme,
  type StudioThemePreference,
} from "@/lib/studioTheme";

type StudioThemeContextValue = {
  preference: StudioThemePreference;
  resolvedTheme: StudioTheme;
  setPreference: (preference: StudioThemePreference) => void;
};

const StudioThemeContext = createContext<StudioThemeContextValue | null>(null);

function syncResolvedTheme(theme: StudioTheme, preference: StudioThemePreference) {
  document.documentElement.dataset.studioTheme = theme;
  document.documentElement.dataset.studioThemePreference = preference;
  document.querySelectorAll<HTMLElement>(".studio-shell").forEach((el) => {
    el.dataset.studioTheme = theme;
  });

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", STUDIO_THEME_COLORS[theme]);
  }
}

export function StudioThemeShell({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<StudioThemePreference>(readInitialStudioThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState<StudioTheme>(readInitialResolvedStudioTheme);

  useLayoutEffect(() => {
    const initialPreference = readInitialStudioThemePreference();
    const initialResolved = readInitialResolvedStudioTheme();
    setPreferenceState(initialPreference);
    setResolvedTheme(initialResolved);
    syncResolvedTheme(initialResolved, initialPreference);
  }, []);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemTheme = () => {
      const next = resolveStudioTheme("system", media.matches);
      setResolvedTheme(next);
      syncResolvedTheme(next, "system");
    };
    applySystemTheme();
    media.addEventListener("change", applySystemTheme);
    return () => media.removeEventListener("change", applySystemTheme);
  }, [preference]);

  const setPreference = useCallback((nextPreference: StudioThemePreference) => {
    const nextResolved = resolveStudioTheme(nextPreference, readSystemPrefersDark());
    setPreferenceState(nextPreference);
    setResolvedTheme(nextResolved);
    storeStudioThemePreference(nextPreference);
    syncResolvedTheme(nextResolved, nextPreference);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
    }),
    [preference, resolvedTheme, setPreference]
  );

  return (
    <StudioThemeContext.Provider value={value}>
      <div className="studio-shell" data-studio-theme={resolvedTheme} suppressHydrationWarning>
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
