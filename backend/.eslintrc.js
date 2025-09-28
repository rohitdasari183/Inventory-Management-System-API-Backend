// .eslintrc.js
module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals', 'eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
  },
  rules: {
    // keep rules minimal — adjust as you like
    'no-console': 'off',
  },
};
