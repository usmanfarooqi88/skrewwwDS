import { chromium, type Browser, type LaunchOptions, type Page } from "@playwright/test";
import type { FocusEvidence, FoundationEvidence, RecordedAssertion, ScenarioEvidence, SuppliedEvidence } from "@/lib/ccv/css/runtime-judge";
import { assertShapeAndSurface } from "@/lib/consumer-scenarios/react-package-scenario";

/**
 * CCV-4 — evidence collection in real Chromium (sandboxed, contained env, one
 * browser per run, one context per scenario). No judgement happens here; see
 * runtime-judge.ts. Navigation targets only the loopback consumer server.
 */

export const SCENARIO_TIMEOUT_MS = 60_000;

export async function collectFoundation(page: Page, names: readonly string[]): Promise<FoundationEvidence> {
  const empty = await page.evaluate((list) => {
    const style = getComputedStyle(document.documentElement);
    return list.filter((name) => style.getPropertyValue(name).trim() === "");
  }, [...names]);
  return { checked: names.length, empty };
}

export async function collectFocusVisible(page: Page, label: string): Promise<FocusEvidence> {
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-skrewww-shape", "rounded");
    document.documentElement.setAttribute("data-skrewww-surface", "flat");
    (document.activeElement as HTMLElement | null)?.blur();
  });
  let presses = 0;
  let reached = false;
  for (; presses < 20 && !reached; ) {
    await page.keyboard.press("Tab");
    presses += 1;
    reached = await page.evaluate((name) => (document.activeElement?.textContent ?? "").trim() === name, label);
  }
  const style = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const cs = getComputedStyle(el);
    return { matchesFocusVisible: el.matches(":focus-visible"), outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, boxShadow: cs.boxShadow };
  });
  return { reached, tabPresses: presses, ...style };
}

export async function collectSupplied(page: Page, prop: string, scenario: string): Promise<SuppliedEvidence> {
  const found = await page.evaluate((name) => {
    let count = 0;
    let sample: string | undefined;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      const own = el.style.getPropertyValue(name).trim();
      if (own) {
        count += 1;
        sample ??= own;
      }
    }
    return { count, sample };
  }, prop);
  return { prop, scenario, elementsWithValue: found.count, sample: found.sample };
}

const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} exceeded ${ms / 1000} s`)), ms))]);

export type ScenarioRun = { name: string; kind: "render" | "runtime"; url: string; browserAssert?: (ctx: { page: Page; baseUrl: string }) => Promise<void>; supplied?: string[] };

export type ShadcnRuntimeEvidence = {
  foundation: FoundationEvidence;
  focus: FocusEvidence;
  modes: RecordedAssertion[];
  scenarios: ScenarioEvidence[];
  supplied: SuppliedEvidence[];
};

async function withPage<T>(browser: Browser, fn: (page: Page, errors: string[]) => Promise<T>): Promise<T> {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text().slice(0, 300));
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message.slice(0, 300)}`));
  try {
    return await fn(page, errors);
  } finally {
    await context.close();
  }
}

export async function runShadcnRuntime(options: {
  commonUrl: string;
  controlLabel: string;
  rootDeclared: readonly string[];
  scenarios: readonly ScenarioRun[];
  launchOptions: LaunchOptions;
}): Promise<ShadcnRuntimeEvidence> {
  const browser = await chromium.launch(options.launchOptions);
  try {
    const common = await withPage(browser, async (page) => {
      await page.goto(options.commonUrl, { waitUntil: "networkidle" });
      const foundation = await collectFoundation(page, options.rootDeclared);
      const modes: RecordedAssertion[] = [];
      await assertShapeAndSurface(page, (name, ok, detail) => modes.push({ name, ok, detail }), options.controlLabel);
      const focus = await collectFocusVisible(page, options.controlLabel);
      return { foundation, modes, focus };
    });
    const scenarios: ScenarioEvidence[] = [];
    const supplied: SuppliedEvidence[] = [];
    for (const scenario of options.scenarios) {
      scenarios.push(
        await withPage(browser, async (page, errors) => {
          let httpStatus: number | null = null;
          let assertionError: string | undefined;
          try {
            const response = await page.goto(scenario.url, { waitUntil: "networkidle", timeout: 30_000 });
            httpStatus = response?.status() ?? null;
            if (scenario.browserAssert) await withTimeout(scenario.browserAssert({ page, baseUrl: scenario.url }), SCENARIO_TIMEOUT_MS, scenario.name);
            for (const prop of scenario.supplied ?? []) supplied.push(await collectSupplied(page, prop, scenario.name));
          } catch (error) {
            assertionError = (error instanceof Error ? error.message : String(error)).split("\n")[0].slice(0, 300);
          }
          const renderedElements = await page.evaluate(() => document.body?.querySelectorAll("*").length ?? 0).catch(() => 0);
          return { name: scenario.name, kind: scenario.kind, httpStatus, renderedElements, ...(assertionError ? { assertionError } : {}), consoleErrors: [...errors] };
        }),
      );
    }
    return { ...common, scenarios, supplied };
  } finally {
    await browser.close();
  }
}

export async function runCommonChecks(options: { url: string; controlLabel: string; rootDeclared: readonly string[]; launchOptions: LaunchOptions }): Promise<{ foundation: FoundationEvidence; focus: FocusEvidence }> {
  const browser = await chromium.launch(options.launchOptions);
  try {
    return await withPage(browser, async (page) => {
      await page.goto(options.url, { waitUntil: "networkidle" });
      const foundation = await collectFoundation(page, options.rootDeclared);
      const focus = await collectFocusVisible(page, options.controlLabel);
      return { foundation, focus };
    });
  } finally {
    await browser.close();
  }
}
