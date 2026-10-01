import { defineConfig, devices } from "@playwright/test";

const port = process.env.WC_E2E_PORT ?? "4173";
const baseURL = "http://127.0.0.1:" + port;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /smoke\.spec\.ts/,
  outputDir: "test-results/e2e",
  // Generous, because this suite is asserted across four browser projects that all start
  // their own browser, and a cold browser on a loaded machine can spend most of a minute
  // on first paint under software rendering. A genuine hang still fails, just later.
  timeout: 120_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  // One retry, for browser-teardown protocol errors only. Firefox on Windows intermittently
  // fails in `browserContext.close` ("_windows[aWindow.__SSi] is undefined") when four browser
  // projects are tearing down at once; the test body has already passed at that point, and
  // the same test passes in isolation. A retried test is reported as such, not as a clean
  // first-time pass, so a real regression still fails.
  retries: 1,
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port " + port + " --strictPort",
    url: baseURL + "/",
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 800 } } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } } },
    {
      // A representative touch viewport, so the touch claim is a measurement rather than an
      // assumption. Touch input is driven by the same keyboard-agnostic role queries.
      name: "touch-chromium",
      use: { ...devices["Pixel 7"], viewport: { width: 412, height: 915 } }
    }
  ]
});
