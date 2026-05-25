// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Dateien die global ignoriert werden
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      'apps/api/prisma/migrations/**',
    ],
  },
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // React Hooks — nur die stabilen Regeln (react-hooks v7, React 18)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'warn',

      // Allgemein
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      'prefer-const': 'error',
    },
  },
  {
    // Next.js-spezifische Regeln deaktivieren (kein @next/eslint-plugin-next als root-dep)
    // — next lint läuft separat über `pnpm --filter web lint`
    files: ['apps/web/**'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
  {
    // Lockere Regeln für Konfigurationsdateien
    files: ['*.config.*', '**/*.config.*'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off', // CJS-Dateien (module, require, process) sind nicht ESM
    },
  },
  {
    // Expo/Babel/Metro CJS-Konfigurationsdateien
    files: ['apps/mobile/app.config.*', 'apps/mobile/babel.config.*', 'apps/mobile/metro.config.*'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
