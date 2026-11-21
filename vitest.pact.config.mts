import { defineConfig } from 'vitest/config';

// Verificação dos contratos do Pact (o backend é o provedor).
// Precisa do broker no ar: npm run pact:broker:up
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/pact/**/*.spec.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    // npm run pact:verify também publica o resultado da verificação no broker.
    env: {
      PACT_PUBLISH_VERIFICATION:
        process.env.npm_lifecycle_event === 'pact:verify' ? 'true' : (process.env.PACT_PUBLISH_VERIFICATION ?? ''),
    },
  },
});
