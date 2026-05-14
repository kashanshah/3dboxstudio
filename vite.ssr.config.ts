import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: ["@fancyapps/ui"],
  },
  build: {
    ssr: "src/entry-server.tsx",
    outDir: "dist/.prerender-server",
    emptyOutDir: true,
  },
});
