import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";
import mantine from 'eslint-config-mantine';


export default tseslint.config(
  ...mantine,
  { ignores: ["dist", '**/*.{mjs,cjs,js,d.ts,d.mts}', "**/*.stories.{ts,tsx}", "**/*.test.{ts,tsx}"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      storybook.configs.recommended,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  }
);
