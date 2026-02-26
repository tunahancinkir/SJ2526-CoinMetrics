// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Make sure to place it before react()
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    // ...,
  ],
});