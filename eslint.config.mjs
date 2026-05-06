import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  // 🚫 Ignore config files
  {
    ignores: [
      'eslint.config.mjs',
      'next.config.js',
      'tailwind.config.js',
      'postcss.config.js',
      'node_modules',
      'dist',
      '.next',
      '.turbo',
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommendedTypeChecked.map(config => ({
    ...config,
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        project: ['./tsconfig.json', './apps/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
  })),

  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
