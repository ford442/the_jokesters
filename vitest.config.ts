import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: [
        'src/comedy/callbackEngine.ts',
        'src/comedy/qualityFilter.ts',
        'src/utils/dynamicContext.ts',
        'src/utils/tokenEstimator.ts',
        'src/config/contextDepth.ts',
      ],
      reporter: ['text', 'text-summary'],
    },
  },
});
