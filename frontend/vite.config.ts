import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import fs from 'fs';

export default defineConfig({
  base: '/',
  server: {
    port: 3001,
    host: '13.0.0.87',
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../certs/13.0.0.87+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../certs/13.0.0.87+2.pem')),
    },
  },
  plugins: [react()],
  define: {
    // No hay variables de entorno específicas para definir
  },
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.'),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          ui: ['@mui/material', '@mui/icons-material'],
          icons: ['react-icons', 'lucide-react']
        }
      }
    }
  },
  preview: {
    port: 3001,
    host: '13.0.0.87',
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../certs/13.0.0.87+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../certs/13.0.0.87+2.pem')),
    },
  }
});