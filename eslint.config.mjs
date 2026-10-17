// @ts-check
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      'coverage/**',
      'node_modules/**',
      '3rd_party/**',
      'public/**',
      'models/**',
      'scripts/archive/**',
      // Non-app trees that are not part of any tsconfig project
      'experiments/**',
      'hf_spaces/**',
      'backend/**',
      'material/**',
      'verification/**',
      'patches/**',
      'utils/**',
      'docs/**',
      'screenshot.js',
    ],
  },

  tseslint.configs.base,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.es2022 },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports', disallowTypeAnnotations: false },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      // `arguments`/`attributes` are off: `addEventListener('click', async () => ...)` and async
      // callbacks handed to the chat manager are the project's idiom. The conditional/spread/
      // property/return checks (the real bug classes) stay on.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { arguments: false, attributes: false } },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
          minimumDescriptionLength: 10,
        },
      ],
      // Ratcheted by scripts/check-any-ratchet.mjs: the count may only go down.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Node-side files
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'scripts/**/*.ts', 'tests/perf/ci-runner.ts', 'tests/perf/setup-env.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['src/service-worker.ts'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    files: ['src/**/worker/**/*.ts', 'src/**/*.worker.ts'],
    languageOptions: { globals: { ...globals.worker } },
  },
)
