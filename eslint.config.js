import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import vitest from '@vitest/eslint-plugin';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js, vitest },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },
  },
]);