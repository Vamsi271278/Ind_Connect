// eslint-config-expo ships no type declarations; type its flat-config entry
// point for the Expo ESLint layer (eslint.expo.mjs).
declare module 'eslint-config-expo/flat.js' {
  import type { Linter } from 'eslint';

  const config: Linter.Config[];
  export default config;
}
