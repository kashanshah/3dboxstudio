import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("three") ||
            id.includes("@react-three/fiber") ||
            id.includes("@react-three/drei")
          ) {
            return "three";
          }
          if (id.includes("@fancyapps/ui")) {
            return "fancybox";
          }
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("/react/")
          ) {
            return "react-vendor";
          }
        },
      },
    },
  },
});
