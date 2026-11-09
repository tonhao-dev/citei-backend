import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/app/**/*.ts'],
      exclude: ['src/app/entities/**', 'src/app/interfaces/**'],
    },
  },
});
