import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/domain/**/*.ts", "src/scenarios/**/*.ts"],
      reporter: ["text", "json-summary", "lcov"],
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90
      }
    }
  }
});
