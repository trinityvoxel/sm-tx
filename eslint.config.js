import globals from "./client/node_modules/globals/index.js";
export default [
  { files: ["client/src/**/*.jsx"], ignores: ["client/src/components/Link.jsx"], rules: {"no-restricted-syntax": ["error", {selector: "JSXOpeningElement[name.name='a']", message: "Use Link so external destinations always open in a new tab."}]}},
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
