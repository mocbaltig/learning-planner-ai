import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': { target: 'http://server:3000', changeOrigin: true },
      '/health': { target: 'http://server:3000', changeOrigin: true },
      '/metrics': { target: 'http://server:3000', changeOrigin: true },
    },
  },
});
