import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'apps/backend/tests/**/*.test.ts', 'packages/*/tests/**/*.test.ts'],
    pool: process.env.VITEST_DURABLE_SUITE === "true" ? "forks" : "threads",
    fileParallelism: process.env.VITEST_DURABLE_SUITE === "true" ? false : true,
    dangerouslyIgnoreUnhandledErrors: process.env.VITEST_DURABLE_SUITE === "true",
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/cli/**/*.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
      '~': resolve(rootDir, 'apps/web/src'),
      '@tanstack/react-router': resolve(rootDir, 'apps/web/node_modules/@tanstack/react-router'),
      '@auth0/auth0-react': resolve(rootDir, 'apps/web/node_modules/@auth0/auth0-react')
    }
  }
});
