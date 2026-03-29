import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import ts from "typescript";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { ts }, extends: ["ts/recommended"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
]);
