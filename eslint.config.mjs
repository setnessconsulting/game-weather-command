import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["node_modules/**", "dist/**", "coverage/**", "test-results/**", "playwright-report*/**", "*.tsbuildinfo"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}", "*.config.ts"],
    languageOptions: { globals: { ...globals.browser, ...globals.nodeBuiltin } },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error"
    }
  },
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [
          { name: "react", message: "Domain code must remain framework-free." },
          { name: "react-dom", message: "Domain code must remain framework-free." },
          { name: "zod", message: "Validation belongs at scenario/adaptor boundaries, not domain truth." }
        ],
        patterns: [
          { group: ["@/app/**", "@/viz/**", "@/audio/**", "@/scenarios/**"], message: "Domain code may not depend on outer layers." }
        ]
      }],
      "no-restricted-globals": [
        "error",
        { name: "window", message: "Domain code cannot read browser globals." },
        { name: "document", message: "Domain code cannot read browser globals." },
        { name: "localStorage", message: "Domain code cannot persist state." },
        { name: "fetch", message: "Domain code cannot perform network access." },
        { name: "setTimeout", message: "Domain time is explicit simulation time." },
        { name: "requestAnimationFrame", message: "Rendering time cannot drive science state." }
      ],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: "Use the injected seeded PRNG." },
        { object: "Date", property: "now", message: "Domain state cannot depend on wall-clock time." }
      ]
    }
  }
);
