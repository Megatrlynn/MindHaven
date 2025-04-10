import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        copyFileSync('public/_redirects', 'dist/_redirects');
      },
    },
  ],
  assetsInclude: ['**/_redirects'], // Ensure Vite includes _redirects
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
