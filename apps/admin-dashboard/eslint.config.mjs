import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const typeCheckedConfigs = tseslint.configs.recommendedTypeChecked.map(config => ({
  ...config,
  files: ['**/*.ts', '**/*.tsx'],
  languageOptions: {
    ...(config.languageOptions ?? {}),
    parserOptions: {
      ...(config.languageOptions?.parserOptions ?? {}),
      project: ['../../tsconfig.eslint.json'],
      tsconfigRootDir: __dirname,
    },
  },
}));

export default [
  // 1️⃣ Ignore build + config files
  {
    ignores: ['node_modules', '.next', 'dist', 'build', 'coverage', 'apps/*/.next'],
  },

  // 2️⃣ JS rules
  js.configs.recommended,

  // 3️⃣ TypeScript rules (chỉ áp dụng cho TS files)
  ...typeCheckedConfigs,

  // 4️⃣ Prettier
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
