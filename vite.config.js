import { defineConfig } from 'vite';

// Use a relative base so the production build works on GitHub Pages,
// Netlify, Vercel or any subpath without extra configuration.
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
