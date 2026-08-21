import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { tokenColorMap } from "@/lib/data";
import { contrastRatio, parseHexColor, WCAG_AA_UI_COMPONENT } from "@/lib/wcag-contrast";

const ICON_DANGER = "#e5484d";

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

describe("semantic-icon-danger (D2 foundation)", () => {
  const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");

  it("declares semantic-icon-danger as an alias of primitive danger-500 (#E5484D)", () => {
    expect(tokens).toMatch(/--primitive-color-danger-500:\s*#e5484d/i);
    expect(tokens).toMatch(
      /--semantic-icon-danger:\s*var\(--primitive-color-danger-500\)/,
    );
    expect(tokenColorMap["semantic/icon/danger"]?.toLowerCase()).toBe(ICON_DANGER);
  });

  it("does not invent semantic icon roles beyond muted + danger", () => {
    const steps = Array.from(tokens.matchAll(/--semantic-icon-([a-z0-9-]+):/g)).map((m) => m[1]);
    expect(steps.sort()).toEqual(["danger", "muted"]);
    expect(tokens).not.toMatch(/--semantic-icon-default:/);
  });

  it("preserves action-danger, text-danger, and icon-muted contracts", () => {
    expect(tokens).toMatch(
      /--semantic-action-danger:\s*var\(--primitive-color-danger-500\)/,
    );
    expect(tokens).toMatch(/--semantic-text-danger:\s*var\(--primitive-color-danger-600\)/);
    expect(tokens).toMatch(/--semantic-icon-muted:\s*var\(--primitive-color-neutral-400\)/);
    expect(tokens).toMatch(/--primitive-color-neutral-400:\s*#a0a3ac/i);
  });

  it("keeps non-text UI contrast ≥ 3:1 for icon-danger on white and elevated surfaces", () => {
    const fg = parseHexColor(ICON_DANGER);
    expect(contrastRatio(fg, parseHexColor("#ffffff"))).toBeGreaterThanOrEqual(WCAG_AA_UI_COMPONENT);
    expect(contrastRatio(fg, parseHexColor("#f7f7f8"))).toBeGreaterThanOrEqual(WCAG_AA_UI_COMPONENT);
  });

  it("D3+: feedback-error-icon, File Upload Error icon, and Link Danger are runtime consumers of semantic-icon-danger", () => {
    expect(tokens).toMatch(/--feedback-error-icon:\s*var\(--semantic-icon-danger\)/);

    const root = process.cwd();
    const cssFiles = [
      ...collectCssFiles(join(root, "components")),
      ...collectCssFiles(join(root, "styles")),
      ...collectCssFiles(join(root, "app")),
    ];

    const hits: string[] = [];
    for (const file of cssFiles) {
      const rel = file.slice(root.length + 1);
      const content = readFileSync(file, "utf8");
      for (const line of content.split("\n")) {
        if (!line.includes("var(--semantic-icon-danger)")) continue;
        if (
          rel === "styles/tokens.css" &&
          /--feedback-error-icon:\s*var\(--semantic-icon-danger\)/.test(line)
        ) {
          continue;
        }
        if (
          rel === "styles/tokens.css" &&
          /--semantic-icon-danger:\s*var\(--primitive-color-danger-500\)/.test(line)
        ) {
          continue;
        }
        if (
          rel === "components/ui/file-upload.module.css" &&
          /color:\s*var\(--semantic-icon-danger\)/.test(line)
        ) {
          continue;
        }
        if (
          rel === "components/ui/link.module.css" &&
          /color:\s*var\(--semantic-icon-danger\)/.test(line)
        ) {
          continue;
        }
        hits.push(rel);
      }
    }
    expect(hits).toEqual([]);
  });
});
