import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { contrastRatio, parseHexColor, WCAG_AA_NORMAL_TEXT } from "@/lib/wcag-contrast";

const WARNING_800 = "#8a4f00";
const WARNING_SURFACE = "rgb(179 106 0 / 0.12)";
const WARNING_BORDER = "rgb(179 106 0 / 0.28)";

/** Approximate Warning Badge surface on white (12% #B36A00). */
const WARNING_SURFACE_ON_WHITE = "#f6ede0";

const SHIPPED_TEXT: Record<Exclude<BadgeVariant, never>, string> = {
  neutral: "#17181b",
  info: "#1e4f9c",
  success: "#156b3f",
  warning: WARNING_800,
  error: "#9f1f2d",
};

describe("Badge Stable-v1 R1 — warning foundation + Badge warning alias", () => {
  const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
  const badgeCss = readFileSync(resolve(process.cwd(), "components/ui/badge.module.css"), "utf8");
  const badgeTs = readFileSync(resolve(process.cwd(), "components/ui/Badge.tsx"), "utf8");

  it("declares exactly warning-100/500/700/800 with Figma hexes", () => {
    expect(tokens).toMatch(/--primitive-color-warning-100:\s*#fef3d6/i);
    expect(tokens).toMatch(/--primitive-color-warning-500:\s*#f5a524/i);
    expect(tokens).toMatch(/--primitive-color-warning-700:\s*#b9770e/i);
    expect(tokens).toMatch(/--primitive-color-warning-800:\s*#8a4f00/i);

    const steps = Array.from(tokens.matchAll(/--primitive-color-warning-(\d+):/g)).map(
      (m) => m[1],
    );
    expect(steps.sort()).toEqual(["100", "500", "700", "800"]);
  });

  it("aliases --badge-warning-text to warning-800 without changing the computed hex", () => {
    expect(tokens).toMatch(
      /--badge-warning-text:\s*var\(--primitive-color-warning-800\)/,
    );
    expect(tokens).not.toMatch(/--badge-warning-text:\s*#8a4f00/);
    expect(tokens).toMatch(/--primitive-color-warning-800:\s*#8a4f00/i);
  });

  it("keeps Warning Badge surface and border literals unchanged", () => {
    expect(tokens).toContain(`--badge-warning-surface: ${WARNING_SURFACE};`);
    expect(tokens).toContain(`--badge-warning-border: ${WARNING_BORDER};`);
  });

  it("preserves accessibility-safe Badge text hexes for all shipped variants", () => {
    expect(tokens).toMatch(/--badge-neutral-text:\s*var\(--semantic-text-primary\)/);
    expect(tokens).toMatch(/--semantic-text-primary:\s*var\(--primitive-color-neutral-900\)/);
    expect(tokens).toMatch(/--primitive-color-neutral-900:\s*#17181b/i);

    expect(tokens).toMatch(/--badge-info-text:\s*#1e4f9c/i);
    expect(tokens).toMatch(/--badge-success-text:\s*#156b3f/i);
    expect(tokens).toMatch(/--badge-error-text:\s*#9f1f2d/i);
    expect(tokens).toMatch(
      /--badge-warning-text:\s*var\(--primitive-color-warning-800\)/,
    );
    expect(SHIPPED_TEXT.warning.toLowerCase()).toBe(WARNING_800);
  });

  it("keeps Warning Badge text contrast ≥ 4.5:1 on the current React surface", () => {
    const ratio = contrastRatio(
      parseHexColor(WARNING_800),
      parseHexColor(WARNING_SURFACE_ON_WHITE),
    );
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
  });

  it("does not retarget --semantic-feedback-warning (literal #b36a00 remains)", () => {
    expect(tokens).toMatch(/--semantic-feedback-warning:\s*#b36a00/i);
    expect(tokens).not.toMatch(
      /--semantic-feedback-warning:\s*var\(--primitive-color-warning/,
    );
  });

  it("does not introduce a Primary Badge API or CSS family", () => {
    expect(badgeTs).not.toMatch(/["']primary["']/);
    expect(badgeTs).toMatch(
      /export type BadgeVariant = "neutral" \| "info" \| "success" \| "warning" \| "error"/,
    );
    expect(tokens).not.toMatch(/--badge-primary-/);
    expect(badgeCss).not.toMatch(/\.primary\b/);
    expect(typeof Badge).toBe("function");
  });

  it("keeps representative semantic-feedback-warning consumers on the semantic token", () => {
    const validation = readFileSync(
      resolve(process.cwd(), "components/ui/validation-message.module.css"),
      "utf8",
    );
    const progress = readFileSync(
      resolve(process.cwd(), "components/ui/progress-bar.module.css"),
      "utf8",
    );
    const banking = readFileSync(
      resolve(process.cwd(), "components/ui/banking-transaction-row.module.css"),
      "utf8",
    );

    expect(validation).toMatch(/var\(--semantic-feedback-warning\)/);
    expect(progress).toMatch(/var\(--semantic-feedback-warning\)/);
    expect(banking).toMatch(/var\(--semantic-feedback-warning\)/);
  });
});
