import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseHexColor, WCAG_AA_UI_COMPONENT } from "@/lib/wcag-contrast";

const ACTION_DANGER = "#e5484d";
const TEXT_DANGER = "#cc3b37";

/** Runtime CSS modules that may reference BASE --semantic-action-danger. */
const ALLOWED_BASE_CONSUMERS: Record<string, string[]> = {
  "components/ui/text-input.module.css": ["border/stroke", "focus ring"],
  "components/ui/checkbox.module.css": ["border/stroke", "fill/background"],
  "components/ui/radio.module.css": ["border/stroke"],
  "components/ui/progress-bar.module.css": ["fill/background"],
  "styles/tokens.css": ["File Upload error border alias"],
};

function collectCssFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "public") continue;
      files.push(...collectCssFiles(full));
    } else if (entry.name.endsWith(".css")) {
      files.push(full);
    }
  }
  return files;
}

describe("semantic-action-danger (D3)", () => {
  const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");

  it("aliases BASE semantic-action-danger to primitive danger-500 (#E5484D)", () => {
    expect(tokens).toMatch(/--primitive-color-danger-500:\s*#e5484d/i);
    expect(tokens).toMatch(
      /--semantic-action-danger:\s*var\(--primitive-color-danger-500\)/,
    );
    expect(tokens).not.toMatch(/--semantic-action-danger:\s*#d92d3e/i);
    expect(tokens).toMatch(/--semantic-action-danger-hover:\s*#b82433/i);
    expect(tokens).toMatch(/--semantic-action-danger-pressed:\s*#961d29/i);
    expect(tokens).toMatch(/--semantic-text-danger:\s*var\(--primitive-color-danger-600\)/);
  });

  it("keeps non-text chrome contrast ≥ 3:1 on white and elevated surfaces", () => {
    const fg = parseHexColor(ACTION_DANGER);
    expect(contrastRatio(fg, parseHexColor("#ffffff"))).toBeGreaterThanOrEqual(WCAG_AA_UI_COMPONENT);
    expect(contrastRatio(fg, parseHexColor("#f7f7f8"))).toBeGreaterThanOrEqual(WCAG_AA_UI_COMPONENT);
  });

  it("keeps accessible danger text on danger-600, not the BASE action token", () => {
    expect(parseHexColor(TEXT_DANGER)).toEqual(parseHexColor("#cc3b37"));
    expect(TEXT_DANGER.toLowerCase()).not.toBe(ACTION_DANGER.toLowerCase());
  });

  it("has ZERO normal-text runtime consumers of BASE semantic-action-danger", () => {
    const root = process.cwd();
    const cssFiles = [
      ...collectCssFiles(join(root, "components")),
      ...collectCssFiles(join(root, "styles")),
      ...collectCssFiles(join(root, "app")),
    ];

    const hits: { file: string; line: string }[] = [];
    for (const file of cssFiles) {
      const rel = file.slice(root.length + 1);
      const content = readFileSync(file, "utf8");
      if (!content.includes("var(--semantic-action-danger)")) continue;

      // Hover/pressed variants are out of D3 scope and must not be counted as BASE.
      const lines = content.split("\n");
      for (const line of lines) {
        if (!line.includes("var(--semantic-action-danger)")) continue;
        if (line.includes("var(--semantic-action-danger-hover)")) continue;
        if (line.includes("var(--semantic-action-danger-pressed)")) continue;
        if (!/\bvar\(--semantic-action-danger\)/.test(line)) continue;
        hits.push({ file: rel, line: line.trim() });
      }
    }

    for (const hit of hits) {
      expect(ALLOWED_BASE_CONSUMERS[hit.file], `unexpected BASE consumer: ${hit.file}`).toBeDefined();
    }

    expect(
      hits
        .filter((h) => h.file === "styles/tokens.css")
        .every((h) => /--file-upload-border-error:\s*var\(--semantic-action-danger\)/.test(h.line)),
    ).toBe(true);

    const colorLines = hits.filter((h) => /^\s*color\s*:/.test(h.line) || /\{[^}]*color\s*:/.test(h.line));
    // Link Danger icons moved onto --semantic-icon-danger; no BASE action-danger color consumers remain.
    expect(colorLines).toEqual([]);

    const linkCss = readFileSync(resolve(root, "components/ui/link.module.css"), "utf8");
    expect(linkCss).toMatch(/\.danger\s*\{[^}]*var\(--semantic-icon-danger\)/);
    expect(linkCss).toMatch(/\.danger \.label\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(linkCss).not.toMatch(/\.danger \.label\s*\{[^}]*var\(--semantic-action-danger\)/);
    expect(linkCss).not.toMatch(/\bvar\(--semantic-action-danger\)/);
  });
});
