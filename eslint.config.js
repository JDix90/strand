import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage', '.next', 'test-results', 'playwright-report', 'next-env.d.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    files: ['src/screens/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '../lib/storage',
              message: 'Use store/service APIs instead of direct storage imports in UI modules.',
            },
            {
              name: '../../lib/storage',
              message: 'Use store/service APIs instead of direct storage imports in UI modules.',
            },
          ],
          patterns: [
            {
              group: ['**/lib/storage'],
              message: 'Use store/service APIs instead of direct storage imports in UI modules.',
            },
          ],
        },
      ],
    },
  },
]);
