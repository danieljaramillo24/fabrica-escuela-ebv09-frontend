import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// Lint del frontend: TypeScript, reglas de hooks de React y accesibilidad (WCAG 2.2 AA, CodeFactory 8.2)
export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      // Las variables que empiezan con _ se descartan a propósito (p. ej. al quitar un campo de un objeto)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
);
