import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("mission collection boots with bounded runtime behaviour and no accessibility violations", async ({ page }) => {
  const unexpected: string[] = [];
  const consoleErrors: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") unexpected.push(request.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Weather Command" })).toBeVisible();
  await expect(page.getByText(/Simulation, not live weather/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Open briefing for Cold Front Shift/ })).toBeVisible();
  expect(unexpected).toEqual([]);
  expect(consoleErrors).toEqual([]);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("the guided mission can be started from the briefing by keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Open briefing for Cold Front Shift/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Cold Front Shift" })).toBeVisible();
  await page.getByRole("button", { name: /Start observing Central Station/ }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Simulated clock" })).toBeVisible();
  await expect(page.getByRole("table", { name: /All stations at/ })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("stays usable at a 360 px viewport with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: /Open briefing for Cold Front Shift/ }).click();
  await page.getByRole("button", { name: /Start observing Central Station/ }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Simulated clock" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("reflows cleanly at 200% zoom", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: /Open briefing for Cold Front Shift/ }).click();
  await page.getByRole("button", { name: /Start observing Central Station/ }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Simulated clock" })).toBeVisible();

  await page.evaluate(() => {
    document.body.style.zoom = "2";
  });
  await expect(page.getByRole("table", { name: /All stations at/ })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
