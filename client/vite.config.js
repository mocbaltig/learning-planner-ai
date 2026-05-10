import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // Gunakan nama service Docker, bukan localhost
        target: 'http://server:3000',
        changeOrigin: true,
      },
    },
  },
});