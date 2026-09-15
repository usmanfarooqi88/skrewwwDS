import { expect, test } from "./fixtures";

async function collectConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  return errors;
}

test.describe("Reference App forms + overlays", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      ["skrewww.analyticsConsent.v1", "denied"],
    );
  });

  test("new request validates, fills, submits, and toasts", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/reference/new");

    await expect(page.getByRole("heading", { name: "New request", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Create request" }).click();
    await expect(page.getByText("Enter a request title.")).toBeVisible();
    await expect(page.getByText("Choose an owner.")).toBeVisible();

    await page.getByLabel("Title").fill("RA-3 create proof");
    await page.getByLabel("Description").fill("Form composition validation.");
    await page.getByRole("combobox", { name: "Owner" }).click();
    await page.getByRole("option", { name: "Amina Cole" }).click();
    await page.getByRole("radio", { name: "High" }).click();
    await page.getByLabel("Billing").check();

    await page.getByRole("button", { name: "Create request" }).click();
    await expect(page.getByText(/Request validated/i)).toBeVisible();
    await expect(page).toHaveURL(/\/reference\/data$/);

    expect(errors.filter((message) => !message.includes("webcrx"))).toEqual([]);
  });

  test("edit prefills fixture, discard dialog, and update flow", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/reference/edit/req_001");

    await expect(page.getByRole("heading", { name: "Edit req_001", level: 1 })).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveValue("Reset SSO session for finance team");
    await expect(page.getByLabel("Description")).toHaveValue(
      "Finance users report stuck SSO redirects after IdP rotation.",
    );

    await page.getByLabel("Title").fill("Reset SSO session for finance team (edited)");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Discard unsaved changes?" })).toBeVisible();

    await page.getByRole("button", { name: "Continue editing" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByLabel("Title")).toHaveValue(
      "Reset SSO session for finance team (edited)",
    );

    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Discard changes" }).click();
    await expect(page).toHaveURL(/\/reference\/data$/);

    await page.goto("/reference/edit/req_001");
    await page.getByLabel("Title").fill("Reset SSO session for finance team (saved)");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/req_001 updated/i)).toBeVisible();
    await expect(page).toHaveURL(/\/reference\/data$/);

    expect(errors.filter((message) => !message.includes("webcrx"))).toEqual([]);
  });

  test("keyboard Popover/Combobox and Dialog focus restore", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/reference/new");

    const owner = page.getByRole("combobox", { name: "Owner" });
    await owner.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(owner).toBeFocused();

    await page.getByLabel("Title").fill("Dirty for dialog");
    await page.getByRole("button", { name: "Cancel" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  });

  test("Menu near viewport bottom flips or stays reachable", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.goto("/reference/new");

    const trigger = page.getByTestId("request-form-bottom-menu");
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="request-form-bottom-menu"]');
      if (!(el instanceof HTMLElement)) return;
      const rect = el.getBoundingClientRect();
      window.scrollBy(0, window.innerHeight - 48 - rect.bottom);
    });

    await trigger.click();
    const menu = page.getByRole("menu", { name: "More request actions" });
    await expect(menu).toBeVisible();
    const metrics = await menu.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        viewport: window.innerHeight,
      };
    });
    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewport + 1);
    await page.keyboard.press("Escape");

    const owner = page.getByRole("combobox", { name: "Owner" });
    await owner.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const input = document.querySelector('[role="combobox"]');
      if (!(input instanceof HTMLElement)) return;
      const rect = input.getBoundingClientRect();
      window.scrollBy(0, window.innerHeight - 64 - rect.bottom);
    });
    await owner.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    const listMetrics = await listbox.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, viewport: window.innerHeight };
    });
    expect(listMetrics.top).toBeGreaterThanOrEqual(0);
    expect(listMetrics.bottom).toBeLessThanOrEqual(listMetrics.viewport + 1);

    expect(errors).toEqual([]);
  });

  test("mobile form layout at 390px", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/reference/new");
    await expect(page.getByLabel("Title")).toBeVisible();
    await expect(page.getByLabel("Description")).toBeVisible();
    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
    expect(errors).toEqual([]);
  });

  test("narrow desktop edit at 900px", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto("/reference/edit/req_002");
    await expect(page.getByLabel("Title")).toHaveValue("Investigate invoice export timeout");
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  });
});
