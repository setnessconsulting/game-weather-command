import { defineConfig, devices } from "@playwright/test";

const port = process.env.WC_E2E_PORT ?? "4173";
const baseURL = "http://127.0.0.1:" + port;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /smoke\.spec\.ts/,
  outputDir: "test-results/e2e",
  timeout: 60_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port " + port + " --strictPort",
    url: baseURL + "/",
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } }
  ]
});
