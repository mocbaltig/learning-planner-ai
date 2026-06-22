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
        // Local dev: forward ke backend native (localhost)
        // Di production (Netlify), proxy ini tidak aktif — VITE_API_URL yang dipakai
        target: 'https://learning-planner-ai-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
});

