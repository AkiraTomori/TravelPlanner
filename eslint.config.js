import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'coverage', 'PA'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: globals.node },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
);
