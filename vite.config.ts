import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const page = (name: string) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: page('index'),
        home: page('home'),
        map: page('map'),
        resources: page('resources'),
        alerts: page('alerts'),
        history: page('history'),
        command: page('command'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // When VITE_GEMMA_BASE_URL=/api/gemma, forward to the key-holding proxy so
  // the OpenRouter secret never reaches the browser. /api/sms goes to the same
  // proxy, which holds the TextBee key. Start it with `npm run proxy`.
  server: {
    proxy: {
      '/api/gemma': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/api/sms': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api/gemma': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/api/sms': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
