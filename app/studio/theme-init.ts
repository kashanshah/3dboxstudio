import { STUDIO_THEME_STORAGE_KEY } from "@/lib/studioTheme";

/**
 * Runs synchronously before React hydrates so the first paint uses the correct
 * resolved theme (including system preference when preference is "system").
 */
export const studioThemeInitScript = `(function(){try{var KEY="${STUDIO_THEME_STORAGE_KEY}";var pref=localStorage.getItem(KEY);if(pref!=="light"&&pref!=="dark"&&pref!=="system")pref="system";var prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;var resolved=pref==="system"?(prefersDark?"dark":"light"):pref;document.documentElement.dataset.studioTheme=resolved;document.documentElement.dataset.studioThemePreference=pref;}catch(e){}})();`;
