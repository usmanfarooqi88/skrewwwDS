import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarDay } from "@/components/ui/CalendarDay";
import styles from "@/components/ui/calendar-day.module.css";
import {
  contrastRatio,
  meetsWcagAaNormalText,
  mixBrandOverWhite,
  parseHexColor,
  WCAG_AA_NORMAL_TEXT,
} from "@/lib/wcag-contrast";

/** Verified primitive/semantic values from styles/tokens.css (flat theme). */
const TOKENS = {
  brand500: "#6c4cf2",
  brand600: "#5638d6",
  textPrimary: "#17181b",
  textInverse: "#ffffff",
  textMuted: "#5b5f68",
  textDisabled: "#a0a3ac",
  hoverSurface: "#ededf0",
} as const;

function injectCalendarDayTokens(container: HTMLElement) {
  container.style.setProperty("--calendar-day-text", TOKENS.textPrimary);
  container.style.setProperty("--calendar-day-muted-text", TOKENS.textMuted);
  container.style.setProperty("--calendar-day-hover-surface", TOKENS.hoverSurface);
  container.style.setProperty("--calendar-day-selected-surface", TOKENS.brand500);
  container.style.setProperty("--calendar-day-selected-hover-surface", TOKENS.brand600);
  container.style.setProperty("--calendar-day-selected-text", TOKENS.textInverse);
  container.style.setProperty("--calendar-day-disabled-text", TOKENS.textDisabled);
  container.style.setProperty(
    "--calendar-day-range-middle-surface",
    `color-mix(in srgb, ${TOKENS.brand500} 16%, transparent)`,
  );
  container.style.setProperty(
    "--calendar-day-range-middle-hover-surface",
    `color-mix(in srgb, ${TOKENS.brand500} 24%, transparent)`,
  );
  container.style.setProperty(
    "--calendar-day-range-preview-surface",
    `color-mix(in srgb, ${TOKENS.brand500} 8%, transparent)`,
  );
  container.style.setProperty(
    "--calendar-day-range-preview-hover-surface",
    `color-mix(in srgb, ${TOKENS.brand500} 14%, transparent)`,
  );
  container.style.setProperty(
    "--calendar-day-range-preview-border",
    `color-mix(in srgb, ${TOKENS.brand500} 50%, transparent)`,
  );
}

function renderWithTokens(ui: ReactElement) {
  const { container, ...rest } = render(<div data-testid="token-root">{ui}</div>);
  const root = screen.getByTestId("token-root");
  injectCalendarDayTokens(root);
  return { container, root, ...rest };
}

describe("CalendarDay hover contrast", () => {
  const cssSource = readFileSync(
    resolve(process.cwd(), "components/ui/calendar-day.module.css"),
    "utf8",
  );

  it("defines compound hover rules so selected/range states keep paired colors", () => {
    expect(cssSource).toContain(".selected:hover:not(:disabled)");
    expect(cssSource).toContain("var(--calendar-day-selected-hover-surface)");
    expect(cssSource).toContain(".rangeStart:hover:not(:disabled)");
    expect(cssSource).toContain(".rangeEnd:hover:not(:disabled)");
    expect(cssSource).toContain(".rangeMiddle:hover:not(:disabled)");
    expect(cssSource).toContain(".rangePreviewMiddle:hover:not(:disabled)");
    expect(cssSource).toContain(".rangePreviewEnd:hover:not(:disabled)");
  });

  it("documents WCAG AA contrast for selected + hover token pairing", () => {
    const foreground = parseHexColor(TOKENS.textInverse);
    const background = parseHexColor(TOKENS.brand600);
    expect(meetsWcagAaNormalText(foreground, background)).toBe(true);
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
  });

  it("documents WCAG AA contrast for range middle + hover token pairing", () => {
    const foreground = parseHexColor(TOKENS.textPrimary);
    const background = mixBrandOverWhite(TOKENS.brand500, 24);
    expect(meetsWcagAaNormalText(foreground, background)).toBe(true);
  });

  it("documents WCAG AA contrast for range preview + hover token pairing", () => {
    const foreground = parseHexColor(TOKENS.textPrimary);
    const background = mixBrandOverWhite(TOKENS.brand500, 14);
    expect(meetsWcagAaNormalText(foreground, background)).toBe(true);
  });

  it("documents WCAG AA contrast for today + hover (default day hover)", () => {
    const foreground = parseHexColor(TOKENS.textPrimary);
    const background = parseHexColor(TOKENS.hoverSurface);
    expect(meetsWcagAaNormalText(foreground, background)).toBe(true);
  });

  it("documents the pre-fix selected+hover failure mode as below AA", () => {
    const foreground = parseHexColor(TOKENS.textInverse);
    const background = parseHexColor(TOKENS.hoverSurface);
    expect(meetsWcagAaNormalText(foreground, background)).toBe(false);
  });

  it("applies the selected class for single-date selection", () => {
    renderWithTokens(<CalendarDay date="2026-07-29" selected />);
    const button = screen.getByRole("button", { name: "29 July 2026" });
    expect(button.className).toContain(styles.selected);
  });

  it("does not apply hover styles to disabled days", () => {
    renderWithTokens(<CalendarDay date="2026-07-20" disabled />);
    const button = screen.getByRole("button", { name: "20 July 2026" });
    fireEvent.mouseEnter(button);
    const computed = getComputedStyle(button);
    expect(computed.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  it("applies selected and range state classes together for single-day range", () => {
    renderWithTokens(<CalendarDay date="2026-07-14" rangeStart rangeEnd />);
    const button = screen.getByRole("button", { name: /Start and end of range/ });
    expect(button.className).toContain(styles.rangeStart);
    expect(button.className).toContain(styles.rangeEnd);
  });
});
