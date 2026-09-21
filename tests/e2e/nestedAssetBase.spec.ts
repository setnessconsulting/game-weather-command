import { expect, test } from "@playwright/test";

test("same production build works beneath the games-site versioned prefix", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1, name: "Weather Command" })).toBeVisible();

  const assetFailures: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) assetFailures.push(response.url());
  });
  await page.reload();
  expect(assetFailures).toEqual([]);
});
