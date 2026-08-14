import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GRADIENT_FOUNDATION_EVIDENCE } from "@/lib/layer3-surface-figma-metadata";

const tokens = readFileSync(join(process.cwd(), "styles/tokens.css"), "utf8");

describe("Stable-v1 Gradient foundation", () => {
  it("records the canonical Figma variables and fixed geometry", () => {
    expect(GRADIENT_FOUNDATION_EVIDENCE.variables.start.id).toBe("VariableID:2329:2914");
    expect(GRADIENT_FOUNDATION_EVIDENCE.variables.end.id).toBe("VariableID:2329:2915");
    expect(GRADIENT_FOUNDATION_EVIDENCE.geometry.css).toContain("90deg");
    expect(GRADIENT_FOUNDATION_EVIDENCE.architecture.directionalApi).toBe(false);
    expect(GRADIENT_FOUNDATION_EVIDENCE.architecture.animation).toBe(false);
  });

  it("uses exact 8-bit overlay alphas without replacing the semantic base fill", () => {
    const gradientMode = tokens.match(
      /\[data-skrewww-surface="gradient"\]\s*\{([\s\S]*?)\n\}/,
    )?.[1];

    expect(gradientMode).toContain("--surface-fill-default: var(--semantic-surface-default)");
    expect(gradientMode).toContain("--surface-fill-control: var(--semantic-surface-default)");
    expect(gradientMode).toContain("--component-surface-gradient-overlay-start: #ffffff14");
    expect(gradientMode).toContain("--component-surface-gradient-overlay-end: #0000000a");
    expect(gradientMode).toContain("linear-gradient(");
    expect(gradientMode).toContain("90deg");
    expect(gradientMode).not.toContain("180deg");
  });

  it("keeps Flat and Glass overlay-free", () => {
    for (const mode of ["flat", "glass"]) {
      const body = tokens.match(
        new RegExp(`\\[data-skrewww-surface="${mode}"\\]\\s*\\{([\\s\\S]*?)\\n\\}`),
      )?.[1];
      expect(body).toContain("--component-surface-gradient-overlay-start: transparent");
      expect(body).toContain("--component-surface-gradient-overlay-end: transparent");
      expect(body).toContain("--component-surface-gradient-overlay: none");
    }
  });
});
