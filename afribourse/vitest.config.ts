import { defineConfig } from 'vitest/config';

// Config de test isolee : on ne charge pas vite.config.ts, dont les plugins
// (PWA, imagetools, strip-source-mapping) n'ont aucun role dans les tests unitaires
// et ralentiraient chaque run.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    reporters: 'default'
  }
});
