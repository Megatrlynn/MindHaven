import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';
import Pages from 'vite-plugin-pages'
import Sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        copyFileSync('public/_redirects', 'dist/_redirects');
      },
    },
    Pages(),
    Sitemap({
      hostname: 'https://mind-haven.netlify.app',
    })
  ],
  assetsInclude: ['**/_redirects'],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
