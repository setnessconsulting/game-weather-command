import { defineConfig, devices } from "@playwright/test";

const port = process.env.WC_HOST_PORT ?? "4174";
const baseURL = "http://127.0.0.1:" + port + "/game-assets/weather-command/test-foundation/";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /nestedAssetBase\.spec\.ts/,
  outputDir: "test-results/host",
  timeout: 60_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-host", open: "never" }]],
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: "npm run serve:nested-host",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } }]
});
