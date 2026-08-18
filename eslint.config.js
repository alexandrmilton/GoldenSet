const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
  {
    files: ['src/**/*.tsx'],
    rules: {
      // Every user-facing string goes through t('key'). See docs/PLAN.md §11.
      'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true, allowedStrings: [] }],
    },
  },
]);
