import { STUDIO_THEME_STORAGE_KEY } from "@/lib/studioTheme";

/** Inline script to set studio theme before first paint and reduce flash. */
export const studioThemeInitScript = `(function(){try{var t=localStorage.getItem("${STUDIO_THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.dataset.studioTheme=t;}}catch(e){}})();`;
