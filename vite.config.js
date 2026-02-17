import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  server: {
    // This tells Vite to listen on all public network interfaces (0.0.0.0)
    // making it accessible from other devices on the same network.
    host: true, 
    open: true,
    
  },
});
