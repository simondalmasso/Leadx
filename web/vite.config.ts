import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.LEADX_DEV_API_TARGET || "http://127.0.0.1:8787";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        secure: apiTarget.startsWith("https://"),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
