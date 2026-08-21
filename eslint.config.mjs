import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["scripts/**/*.{js,mjs}", "playwright.config.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly"
      }
    }
  },
  {
    files: ["public/sw.js"],
    languageOptions: {
      globals: {
        caches: "readonly",
        fetch: "readonly",
        Response: "readonly",
        self: "readonly",
        URL: "readonly"
      }
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    ".test-dist/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts"
  ])
]);
