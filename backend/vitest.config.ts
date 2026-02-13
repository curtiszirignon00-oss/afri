import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/controllers/**'],
      exclude: ['**/*.test.ts', '**/__tests__/**'],
    },
    setupFiles: ['src/test/setup.ts'],
    testTimeout: 10000,
  },
});
