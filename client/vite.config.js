import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const PORT = process.env['PORT']

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: `http://localhost:${PORT}`, changeOrigin: true },
      '/health': { target: `http://localhost:${PORT}`, changeOrigin: true },
      '/metrics': { target: `http://localhost:${PORT}`, changeOrigin: true },
    },
  },
});
