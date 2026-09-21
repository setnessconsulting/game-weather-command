import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("foundation build boots with bounded runtime behavior", async ({ page }) => {
  const unexpected: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") unexpected.push(request.url());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Weather Command" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Simulation, not live weather" })).toBeVisible();
  await expect(page.getByRole("img", { name: /three forecast stations/i })).toBeVisible();
  expect(unexpected).toEqual([]);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
