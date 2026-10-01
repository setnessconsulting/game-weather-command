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
    setupFiles: ["./tests/setup.ts"],
    // Rendering the whole mission shell in jsdom is legitimately slow: a single full-app
    // render costs 1-3s, and the component suites deliberately walk the whole loop. The
    // default 5s made those suites fail on CPU contention rather than on behaviour. A real
    // hang still fails, just later.
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      // The whole production surface, not just the pure kernel. WC-06 through WC-09 own
      // src/game, src/viz, src/app and src/audio; leaving them outside the gate meant a
      // regression in any of them could not fail `npm run verify`.
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/vite-env.d.ts", "src/domain/weatherTypes.ts", "src/main.tsx"],
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
