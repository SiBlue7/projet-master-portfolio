import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "src/generated/**",
      "test-results/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
