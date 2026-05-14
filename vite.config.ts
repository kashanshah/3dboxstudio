import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { prerenderConfig, validatePrerenderConfig } from "./prerender.config";

validatePrerenderConfig(prerenderConfig);

export default defineConfig({
  plugins: [
    react(),
    {
      name: "route-prerender",
      apply: "build",
      async closeBundle() {
        const { runRoutePrerender } = await import("./scripts/prerender");
        await runRoutePrerender(prerenderConfig);
      },
    },
  ],
});
