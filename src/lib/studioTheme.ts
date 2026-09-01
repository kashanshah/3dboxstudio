export type StudioThemePreference = "light" | "dark" | "system";

/** Resolved appearance applied to the studio UI. */
export type StudioTheme = "dark" | "light";

export const STUDIO_THEME_STORAGE_KEY = "3dboxstudio-studio-theme";

export const DEFAULT_STUDIO_THEME_PREFERENCE: StudioThemePreference = "system";

export const STUDIO_THEME_COLORS: Record<StudioTheme, string> = {
  dark: "#0c0e12",
  light: "#eef2f8",
};

export function isStudioThemePreference(value: string | null | undefined): value is StudioThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function readStoredStudioThemePreference(): StudioThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STUDIO_THEME_STORAGE_KEY);
    return isStudioThemePreference(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeStudioThemePreference(preference: StudioThemePreference): void {
  try {
    window.localStorage.setItem(STUDIO_THEME_STORAGE_KEY, preference);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Resolve a stored or chosen preference to the theme actually painted on screen. */
export function resolveStudioTheme(
  preference: StudioThemePreference,
  prefersDark: boolean
): StudioTheme {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }
  return preference;
}

export function readSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readInitialStudioThemePreference(): StudioThemePreference {
  return readStoredStudioThemePreference() ?? DEFAULT_STUDIO_THEME_PREFERENCE;
}

export function readInitialResolvedStudioTheme(): StudioTheme {
  if (typeof document !== "undefined") {
    const fromDom = document.documentElement.dataset.studioTheme;
    if (fromDom === "light" || fromDom === "dark") return fromDom;
  }
  const preference = readInitialStudioThemePreference();
  return resolveStudioTheme(preference, readSystemPrefersDark());
}
