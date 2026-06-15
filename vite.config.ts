import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base "./" keeps asset paths relative so the build works on any static host
// (GitHub Pages project sites, Netlify drops, S3, a sub-path, etc.).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
