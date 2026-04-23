import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,
    open: true,           // Auto open browser
    proxy: {
      '/api': {
        target: 'http://localhost:3001',   // Change this to your backend port (Express/Node)
        changeOrigin: true,
        secure: false,
      },
    },
  },
});