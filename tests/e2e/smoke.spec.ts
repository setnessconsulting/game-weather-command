import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The gameplay runtime is zero-network. Anything outside the origin the app was served from
 * is a privacy defect, so the origin is taken from the project config rather than hardcoded:
 * a hardcoded origin silently inverts this assertion when WC_E2E_PORT is changed.
 */
function watchRuntime(page: Page): { unexpectedRequests: string[]; consoleErrors: string[] } {
  const unexpectedRequests: string[] = [];
  const consoleErrors: string[] = [];
  const origin = new URL(String(test.info().project.use.baseURL ?? "")).origin;
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== origin) unexpectedRequests.push(request.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  return { unexpectedRequests, consoleErrors };
}

const expectNoAxeViolations = async (page: Page): Promise<void> => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
};

const horizontalOverflow = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** The text of whatever currently holds focus, so focus assertions do not depend on there being one match. */
const focusedText = (page: Page): Promise<string> =>
  page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");

const startGuidedMission = async (page: Page): Promise<void> => {
  await page.goto("/");
  await page.getByRole("button", { name: /Open briefing for Cold Front Shift/ }).click();
  await page.getByRole("button", { name: /Start observing Central Station/ }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Simulated clock" })).toBeVisible();
};

test("mission collection boots with bounded runtime behaviour and no accessibility violations", async ({ page }) => {
  const runtime = watchRuntime(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Weather Command" })).toBeVisible();
  await expect(page.getByText(/Simulation, not live weather/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Open briefing for Cold Front Shift/ })).toBeVisible();
  expect(runtime.unexpectedRequests).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);

  await expectNoAxeViolations(page);
});

test("the guided mission can be started and driven from the keyboard alone", async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto("/");

  // Tab to the guided mission's briefing button and activate it with the keyboard only.
  const openBriefing = page.getByRole("button", { name: /Open briefing for Cold Front Shift/ });
  await openBriefing.focus();
  await expect(openBriefing).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2, name: "Cold Front Shift" })).toBeVisible();

  // The skip link resolves on the briefing screen, which it previously did not.
  await expect(page.locator("#workspace")).toHaveCount(1);
  const skipLink = page.getByRole("link", { name: "Skip to the workspace" });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#workspace")).toBeFocused();

  // Entering the observation changes phase, and the change must land on a visible element
  // so a sighted keyboard user can see where focus went and what phase they are in.
  const start = page.getByRole("button", { name: /Start observing Central Station/ });
  await start.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 3, name: "Simulated clock" })).toBeVisible();
  expect(await focusedText(page)).toBe("Observing");
  await expect(page.getByRole("table", { name: /All stations at/ })).toBeVisible();

  // Station selection is a real button, reachable and operable without a pointer.
  const station = page.getByRole("button", { name: "West Station", exact: true });
  await station.focus();
  await page.keyboard.press(" ");
  await expect(station).toHaveAttribute("aria-pressed", "true");

  expect(runtime.unexpectedRequests).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
  await expectNoAxeViolations(page);
});

test("stays usable at a 360 px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await startGuidedMission(page);

  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  await expectNoAxeViolations(page);
});

/**
 * WCAG 1.4.10 Reflow is about the layout viewport the player ends up with after zooming,
 * not about a CSS `zoom` property, which never asks the layout engine to reflow. Browser
 * zoom at 200% of a 1280 px window is a ~640 CSS px viewport, and the 400% case is 320 px.
 */
test("reflows cleanly at 200% browser zoom", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  await startGuidedMission(page);

  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  await expectNoAxeViolations(page);
});

test("reflows cleanly at 400% browser zoom, which is the WCAG 1.4.10 threshold", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await startGuidedMission(page);

  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  await expectNoAxeViolations(page);
});

test("the operating-system reduced-motion preference reaches application state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startGuidedMission(page);

  // Automatic time advance is unavailable without asking for motion first, and the
  // equivalent information is stated rather than implied.
  const play = page.getByRole("button", { name: /Play automatic time advance/ });
  await expect(play).toBeDisabled();
  await expect(page.getByRole("button", { name: /Motion reduced/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/Motion is reduced: automatic time advance is unavailable/)).toBeVisible();
  await expect(page.getByText(/Motion is reduced: the map shows each state directly/)).toBeVisible();
  await expectNoAxeViolations(page);
});

test("motion is not reduced by default and can be switched on and off in-session", async ({ page }) => {
  await startGuidedMission(page);

  const play = page.getByRole("button", { name: /Play automatic time advance/ });
  const toggle = page.getByRole("button", { name: "Reduce motion" });
  await expect(play).toBeEnabled();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await toggle.click();
  await expect(play).toBeDisabled();
  await expect(page.getByRole("button", { name: /Motion reduced/ })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /Motion reduced/ }).click();
  await expect(play).toBeEnabled();
  await expectNoAxeViolations(page);
});

test("automatic time advance runs, updates the record, and leaves no timer behind", async ({ page }) => {
  await startGuidedMission(page);

  const clock = page.locator("input#simulated-minute");
  await expect(clock).toHaveValue("0");
  await page.getByRole("button", { name: /Play automatic time advance/ }).click();
  await expect(clock).not.toHaveValue("0", { timeout: 10_000 });

  await page.getByRole("button", { name: /Pause automatic time advance/ }).click();
  const paused = await clock.inputValue();
  await page.waitForTimeout(2_000);
  expect(await clock.inputValue()).toBe(paused);

  // The interval is owned by the screen: leaving the mission must stop it for good.
  await page.getByRole("button", { name: "Mission list" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Weather Command" })).toBeVisible();
  await expectNoAxeViolations(page);
});
