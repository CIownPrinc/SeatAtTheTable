import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";
import commentPolicy from "eslint-plugin-comment-policy";

export default [
  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      "@typescript-eslint": plugin,
      "comment-policy": commentPolicy
    },
    rules: {
      "comment-policy/enforce": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "no-undef": "off"
    }
  }
];
