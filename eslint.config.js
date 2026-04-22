import js from '@eslint/js'
import importX from 'eslint-plugin-import-x'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.tanstack/**',
      '.netlify/**',
      '.agents/**',
      '.github/**',
      'src/routeTree.gen.ts',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  // Base JS recommended
  js.configs.recommended,

  // TypeScript recommended (type-aware)
  ...tseslint.configs.recommended,

  // Prettier must be last to override formatting rules
  eslintConfigPrettier,

  // Project-wide settings
  {
    files: ['**/*.{ts,tsx}'],
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import-x': importX,
    },
    rules: {
      // ── React ───────────────────────────────────────
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],

      // ── TypeScript ──────────────────────────────────
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      // ── Imports ─────────────────────────────────────
      'import-x/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [{ pattern: '@/**', group: 'internal', position: 'before' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',

      // ── General ─────────────────────────────────────
      'no-console': 'warn',
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'prefer-template': 'error',
    },
  },
  {
    files: ['scripts/**/*.{ts,js,mjs,cjs}', 'ia-config/**/*.js', '**/*.cjs'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/**/*.fn.ts', 'src/modules/ai/**/*.ts', 'src/shared/lib/db/index.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/components/data-table.tsx', 'src/shared/ui/DataTable.tsx'],
    rules: {
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    files: ['src/modules/tasks/ui/views/KanbanBoard.tsx'],
    rules: {
      'react-hooks/incompatible-library': 'off',
    },
  },
)
