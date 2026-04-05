import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");

export default defineConfig({
  root: path.resolve(rootDir, "client"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": rootDir,
      "next/link": path.resolve(rootDir, "client/src/shims/next-link.tsx"),
      "next/navigation": path.resolve(
        rootDir,
        "client/src/shims/next-navigation.ts"
      ),
      "next/image": path.resolve(rootDir, "client/src/shims/next-image.tsx"),
      "@vercel/analytics/next": path.resolve(
        rootDir,
        "client/src/shims/vercel-analytics.tsx"
      ),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  build: {
    outDir: path.resolve(rootDir, "client/dist"),
    emptyOutDir: true,
  },
});
