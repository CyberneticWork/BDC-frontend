import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

const SPA_FALLBACK_DIRS = [
  "cybernetic-admin",
  "admin",
  "dashboard",
  "otp-login",
  "employee-portal",
  "employee-login",
];

function spaFallbackPages() {
  return {
    name: "spa-fallback-pages",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const indexFile = path.join(dist, "index.html");
      if (!fs.existsSync(indexFile)) {
        return;
      }
      const html = fs.readFileSync(indexFile, "utf8");
      for (const dir of SPA_FALLBACK_DIRS) {
        const destDir = path.join(dist, dir);
        fs.mkdirSync(destDir, { recursive: true });
        fs.writeFileSync(path.join(destDir, "index.html"), html);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallbackPages()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/storage": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@dashboard": path.resolve(__dirname, "./src/pages/Dashboard"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@contexts": path.resolve(__dirname, "./src/contexts"),
      "@src": path.resolve(__dirname, "./src"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@Accounting": path.resolve(__dirname, "./src/Pages/Accounting"),
      "@Inventory": path.resolve(__dirname, "./src/Pages/Inventory/MasterFile"),
    },
  },
});
