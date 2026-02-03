import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Auto-increment if port in use
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.API_PORT || 3000}`,
        changeOrigin: true,
      },
    },
  },
});
