module.exports = {
  root: true,
  env: { node: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'chai-friendly'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['node_modules', '/lib', 'tmp', 'fixtures'],
  rules: {
    'chai-friendly/no-unused-expressions': 2,
    'no-constant-condition': 0,
    'no-unused-vars': 0,
    quotes: [1, 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    '@typescript-eslint/explicit-module-boundary-types': 1,
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-inferrable-types': 0,
    '@typescript-eslint/no-non-null-assertion': 1,
    '@typescript-eslint/no-unused-expressions': 0,
    '@typescript-eslint/no-unused-vars': [1, { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-var-requires': 0
  }
};
