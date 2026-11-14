import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      // Whole app source; the soft floor is ratcheted by scripts/check-coverage-ratchet.mjs.
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.part*.ts', 'src/Director/modes/generated/**'],
      reporter: ['text-summary', 'json-summary'],
    },
  },
  esbuild: {
    keepNames: true, // preserves constructor.name
  },
});
