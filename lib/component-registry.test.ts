import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";

const root = process.cwd();

function extractVarRefs(css: string): string[] {
  const matches = css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g);
  return Array.from(new Set(Array.from(matches, (m) => m[1])));
}

describe("component registry — cssTokens accuracy", () => {
  it("declares exactly the custom properties actually referenced via var(--...) in each entry's own CSS files", () => {
    const violations: string[] = [];

    for (const entry of componentRegistry) {
      const cssFiles = (entry.files ?? []).filter((relPath) => relPath.endsWith(".css"));
      if (cssFiles.length === 0) continue;

      const found = new Set<string>();
      for (const relPath of cssFiles) {
        const absPath = join(root, relPath);
        if (!existsSync(absPath)) continue;
        for (const token of extractVarRefs(readFileSync(absPath, "utf8"))) {
          found.add(token);
        }
      }

      const declared = new Set(entry.cssTokens ?? []);
      const missing = Array.from(found)
        .filter((token) => !declared.has(token))
        .sort();
      if (missing.length > 0) {
        violations.push(`${entry.slug}: missing from cssTokens: ${missing.join(", ")}`);
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});

describe("component registry — Card distribution metadata", () => {
  const card = componentRegistry.find((entry) => entry.slug === "card");

  it("has a real Card entry", () => {
    expect(card).toBeDefined();
  });

  it("declares no npm dependencies (react is a host requirement, not an installable package)", () => {
    expect(card?.dependencies).toEqual([]);
  });

  it("declares host requirements without next (Card has no next/link import, unlike Button)", () => {
    expect(card?.hostRequirements).toEqual(["react", "react-dom"]);
  });

  it("declares lib/cn.ts as its only internal dependency", () => {
    expect(card?.internalDependencies).toEqual(["lib/cn.ts"]);
  });

  it("declares @skrewww/foundation as a registry dependency", () => {
    expect(card?.registryDependencies).toEqual(["@skrewww/foundation"]);
  });
});
