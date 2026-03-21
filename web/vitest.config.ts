import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // Explicitly set Vite root to prevent monorepo root mis-detection
  root: __dirname,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, './vitest.setup.ts')],
    include: [resolve(__dirname, 'src/**/*.{test,spec}.{ts,tsx}')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
