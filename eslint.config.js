import globals from "./client/node_modules/globals/index.js";
export default [
  { ignores: ["**/node_modules/**", "dist/**", ".server/**"] },
  {
    files: ["**/*.{js,mjs,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-undef": "error",
      "no-unreachable": "error",
      "no-constant-condition": "error",
      "no-duplicate-case": "error",
      "valid-typeof": "error",
    },
  },
];
