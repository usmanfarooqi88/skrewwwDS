import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ValidationMessage } from "@/components/ui/ValidationMessage";
import {
  contrastRatio,
  parseHexColor,
  WCAG_AA_NORMAL_TEXT,
} from "@/lib/wcag-contrast";

const WHITE = "#ffffff";
const ELEVATED = "#f7f7f8";

const TEXT = {
  error: "#cc3b37",
  warning: "#8a4f00",
  success: "#1f7a4d",
  info: "#1d4ed8",
} as const;

const ICON = {
  error: "#cc3b37",
  warning: "#b36a00",
  success: "#1a8b4c",
  info: "#2563c7",
} as const;

const EXPECTED_WHITE = {
  error: 4.94,
  warning: 6.56,
  success: 5.32,
  info: 6.7,
} as const;

const EXPECTED_ELEVATED = {
  error: 4.62,
  warning: 6.13,
  success: 4.97,
  info: 6.26,
} as const;

function readCss() {
  return readFileSync(resolve(process.cwd(), "components/ui/validation-message.module.css"), "utf8");
}

function readTokens() {
  return readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
}

describe("ValidationMessage", () => {
  it("hides decorative icons from assistive technology", () => {
    const { container } = render(
      <ValidationMessage type="error" announce="off">
        Error text
      </ValidationMessage>,
    );
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not live-announce static messages by default", () => {
    render(
      <ValidationMessage type="error" announce="off">
        Static error
      </ValidationMessage>,
    );
    expect(screen.getByText("Static error")).not.toHaveAttribute("role", "alert");
  });

  it("can announce dynamic errors assertively", () => {
    render(
      <ValidationMessage type="error" announce="assertive">
        Live error
      </ValidationMessage>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Live error");
  });

  it("binds typed text tokens independently of icon tokens", () => {
    const css = readCss();
    const tokens = readTokens();

    expect(css).toMatch(/\.error\s*\{[^}]*var\(--component-validation-message-error-text\)/);
    expect(css).toMatch(/\.warning\s*\{[^}]*var\(--component-validation-message-warning-text\)/);
    expect(css).toMatch(/\.success\s*\{[^}]*var\(--component-validation-message-success-text\)/);
    expect(css).toMatch(/\.info\s*\{[^}]*var\(--component-validation-message-info-text\)/);

    expect(css).toMatch(/\.icon\.iconError\s*\{[^}]*var\(--component-validation-message-text\)/);
    expect(css).toMatch(/\.icon\.iconWarning\s*\{[^}]*var\(--semantic-feedback-warning\)/);
    expect(css).toMatch(/\.icon\.iconSuccess\s*\{[^}]*var\(--semantic-feedback-success\)/);
    expect(css).toMatch(/\.icon\.iconInfo\s*\{[^}]*var\(--semantic-feedback-info\)/);

    expect(css).not.toMatch(/\.error\s*\{[^}]*var\(--semantic-action-danger\)/);
    expect(css).not.toMatch(/\.iconError\s*\{[^}]*var\(--semantic-action-danger\)/);
    expect(css).not.toMatch(/--badge-/);

    expect(tokens).toMatch(
      /--component-validation-message-text:\s*var\(--primitive-color-danger-600\)/,
    );
    expect(tokens).toMatch(
      /--component-validation-message-error-text:\s*var\(--primitive-color-danger-600\)/,
    );
    expect(tokens).toMatch(
      /--component-validation-message-warning-text:\s*var\(--primitive-color-warning-800\)/,
    );
    expect(tokens).toMatch(
      /--component-validation-message-success-text:\s*var\(--primitive-color-success-700\)/,
    );
    expect(tokens).toMatch(
      /--component-validation-message-info-text:\s*var\(--primitive-color-info-700\)/,
    );
    expect(tokens).toMatch(/--primitive-color-danger-600:\s*#cc3b37/);
    expect(tokens).toMatch(/--primitive-color-warning-800:\s*#8a4f00/);
    expect(tokens).toMatch(/--primitive-color-success-700:\s*#1f7a4d/);
    expect(tokens).toMatch(/--primitive-color-info-700:\s*#1d4ed8/);
    expect(tokens).toMatch(/--semantic-action-danger:\s*var\(--primitive-color-danger-500\)/);
  });

  it("keeps icon channels on the previous Error/untyped and semantic-feedback tokens", () => {
    const tokens = readTokens();
    expect(tokens).toMatch(/--semantic-feedback-warning:\s*#b36a00/i);
    expect(tokens).toMatch(/--semantic-feedback-success:\s*#1a8b4c/i);
    expect(tokens).toMatch(/--semantic-feedback-info:\s*#2563c7/i);
    expect(tokens).not.toMatch(/--semantic-feedback-warning:\s*var\(--primitive-color-warning/);
    expect(tokens).not.toMatch(/--semantic-feedback-success:\s*var\(--primitive-color-success/);
    expect(tokens).not.toMatch(/--semantic-feedback-info:\s*var\(--primitive-color-info/);

    expect(TEXT.warning).not.toBe(ICON.warning);
    expect(TEXT.success).not.toBe(ICON.success);
    expect(TEXT.info).not.toBe(ICON.info);
    expect(TEXT.error).toBe(ICON.error);
  });

  it.each(["error", "warning", "success", "info"] as const)(
    "meets WCAG AA normal-text contrast for %s on white and elevated surfaces",
    (type) => {
      const foreground = parseHexColor(TEXT[type]);
      const whiteRatio = contrastRatio(foreground, parseHexColor(WHITE));
      const elevatedRatio = contrastRatio(foreground, parseHexColor(ELEVATED));

      expect(whiteRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      expect(elevatedRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      expect(whiteRatio).toBeCloseTo(EXPECTED_WHITE[type], 1);
      expect(elevatedRatio).toBeCloseTo(EXPECTED_ELEVATED[type], 1);
    },
  );
});
