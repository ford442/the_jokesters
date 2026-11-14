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
      'sidecar/**',
      'tools/**',
      'patches/**',
      'docs/**',
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

  // Lifecycle discipline: long-lived listeners/timers in app, stage and director code go through a
  // Scope (src/utils/lifecycle.ts) so a re-init or scene restart can release them.
  {
    files: ['src/app/**/*.ts', 'src/visuals/**/*.ts', 'src/Director/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='setInterval']",
          message: 'Use scope.interval() from src/utils/lifecycle.ts (or keep the handle and clear it in dispose()).',
        },
        {
          selector: "CallExpression[callee.object.name='window'][callee.property.name='setInterval']",
          message: 'Use scope.interval() from src/utils/lifecycle.ts (or keep the handle and clear it in dispose()).',
        },
        {
          selector: "CallExpression[callee.object.name='window'][callee.property.name='addEventListener']",
          message: 'Use scope.listen(window, …) from src/utils/lifecycle.ts so the listener is removed on dispose.',
        },
      ],
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
