import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { allComponents } from "@/lib/data";
import { CHART_COMPONENT_SLUGS } from "@/lib/global-nav";
import { REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";
import { sectionNavModels } from "@/lib/section-nav-models";

const root = process.cwd();

function resolveLocal(spec: string, from: string): string | null {
  const base = spec.startsWith("@/") ? spec.slice(2) : spec.startsWith(".") ? join(from, "..", spec) : null;
  if (base === null) return null; // package import
  const rel = base.startsWith(root) ? base.slice(root.length + 1) : base;
  for (const candidate of [rel, `${rel}.ts`, `${rel}.tsx`, `${rel}/index.ts`, `${rel}/index.tsx`]) {
    if (/\.(ts|tsx)$/.test(candidate) && existsSync(join(root, candidate))) return candidate;
  }
  return null;
}

/** Transitive local (non-package) import closure of a source file. */
function importClosure(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(join(root, file), "utf8");
    const specs = Array.from(
      source.matchAll(/(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']/g),
    ).map((m) => m[1] ?? m[2]);
    for (const spec of specs) {
      const resolved = resolveLocal(spec, join(root, file));
      if (resolved) queue.push(resolved);
    }
  }
  return seen;
}

// Modules that carry component documentation prose (whenToUse, commonMistakes, …).
const PROSE_MODULES = [/^lib\/data\.ts$/, /^content\//, /^lib\/component-registry/, /^lib\/category-content\.ts$/, /^lib\/industry-content\.ts$/];

describe("sitewide client navigation bundle boundary", () => {
  it("DocsChrome is a server component; only DocsChromeClient is a client boundary", () => {
    const server = readFileSync(join(root, "components/DocsChrome.tsx"), "utf8");
    const client = readFileSync(join(root, "components/DocsChromeClient.tsx"), "utf8");
    expect(server).not.toMatch(/^["']use client["']/m);
    expect(client).toMatch(/^["']use client["']/m);
    expect(server).toContain("@/lib/section-nav-models");
  });

  it("the root client graph does not import component documentation prose", () => {
    for (const entry of ["components/DocsChromeClient.tsx", "components/providers/AppProviders.tsx"]) {
      const offenders = Array.from(importClosure(entry)).filter((file) => PROSE_MODULES.some((re) => re.test(file)));
      expect(offenders, entry).toEqual([]);
    }
  });

  it("the client section-nav module imports no documentation data", () => {
    const files = Array.from(importClosure("lib/section-nav.ts"));
    expect(files.filter((f) => PROSE_MODULES.some((re) => re.test(f)))).toEqual([]);
  });

  it("the walker can see prose when it is imported (guards against a vacuous pass)", () => {
    const files = Array.from(importClosure("lib/section-nav-models.ts"));
    expect(files).toContain("lib/data.ts");
    expect(files.some((f) => f.startsWith("content/"))).toBe(true);
  });
});

describe("navigation projection", () => {
  const items = (section: keyof typeof sectionNavModels) =>
    sectionNavModels[section].groups.flatMap((group) => group.items);

  it("contains only label/href pairs — no documentation fields", () => {
    const serialized = JSON.stringify(sectionNavModels);
    for (const doc of allComponents) {
      expect(serialized).not.toContain(doc.whenToUse);
      expect(serialized).not.toContain(doc.commonMistakes);
    }
    for (const item of [...items("docs"), ...items("components"), ...items("charts")]) {
      expect(Object.keys(item).sort()).toEqual(["href", "label"]);
    }
  });

  it("lists every canonical component exactly once, derived from the docs source", () => {
    const hrefs = items("components").map((item) => item.href);
    const chart = new Set<string>(CHART_COMPONENT_SLUGS);
    const redirected = new Set<string>(REDIRECTED_COMPONENT_SLUGS);
    const expected = allComponents.filter((c) => !chart.has(c.slug) && !redirected.has(c.slug));
    for (const doc of expected) {
      expect(hrefs.filter((h) => h === `/components/${doc.slug}`), doc.slug).toHaveLength(1);
    }
    for (const slug of Array.from(chart).concat(Array.from(redirected))) expect(hrefs).not.toContain(`/components/${slug}`);
  });

  it("charts navigation lists exactly the chart slugs", () => {
    const hrefs = items("charts").map((item) => item.href);
    for (const slug of CHART_COMPONENT_SLUGS) expect(hrefs).toContain(`/components/${slug}`);
  });
});
