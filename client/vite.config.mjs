import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
    server: {
    port: 3000,
    proxy: {
      '/api': {
        // Update if your FastAPI server is running on a different port
        target: 'http://localhost:8000',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  },
});