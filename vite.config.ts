import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { reverseGeocodeMiddleware } from "./vite/reverseGeocode";

export default defineConfig({
  plugins: [react(), reverseGeocodeMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 5173,
  },
});
