export type StudioTheme = "dark" | "light";

export const STUDIO_THEME_STORAGE_KEY = "3dboxstudio-studio-theme";

export const STUDIO_THEME_COLORS: Record<StudioTheme, string> = {
  dark: "#0c0e12",
  light: "#eef2f8",
};

export function readStoredStudioTheme(): StudioTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STUDIO_THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function storeStudioTheme(theme: StudioTheme): void {
  try {
    window.localStorage.setItem(STUDIO_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
}
