import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts', 'src/services/simulado/**'],
      reporter: ['text-summary', 'text'],
      // Mínimo de CodeFactory 7.2 para el equipo básico
      thresholds: { lines: 40, statements: 40, functions: 40, branches: 40 },
    },
  },
});
