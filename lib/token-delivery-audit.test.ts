import { describe, expect, it } from "vitest";
import { buildDistributedRegistryItems, type ShadcnRegistryItem } from "@/lib/shadcn-registry-generator";

/**
 * Cross-cutting token-delivery regression test (OSS-1A).
 *
 * `lib/chart-token-delivery.test.ts` proved, per-chart, that every
 * fallback-less `var(--token)` a chart's transported payload references is
 * actually declared somewhere in that payload. This file generalizes the
 * same proof to *every* distributed manifest, using the exact bytes a
 * consumer installs (`buildDistributedRegistryItems()`), not repo source.
 *
 * A "gap" is a `var(--token)` reference with no CSS fallback
 * (`var(--token, fallback)` is fine — the consumer's own app can supply a
 * value) that is not defined anywhere in the component's own registry
 * dependency closure: its own files, Foundation, and every
 * `registryDependencies` target resolved transitively. Both CSS
 * declarations (`--token: value;`) and React inline custom-property
 * definitions (`style={{ "--token": value }}`, e.g. Slider) count as
 * defining a token — a naive `.css`-only scanner would misreport Slider as
 * broken.
 *
 * `--control-checkbox-radius-max` is deliberately excluded from the scan
 * (see IGNORED_REFERENCES below): it is referenced once, inside
 * Foundation's own `--squircle-clip-path-checkbox` definition in
 * `styles/tokens.css`, but that variable is itself consumed nowhere except
 * `checkbox.module.css`. For every component other than Checkbox this is a
 * dead declaration with zero visible effect.
 *
 * OSS-1A found 35 of 55 components failing this check — 315 tokens that no
 * consumer ever received — and tracked them in a temporary allowlist.
 * OSS-1B fixed the cause (the Foundation transport now carries the
 * component tier of styles/tokens.css, in its original source position
 * ahead of the Shape/Surface mode blocks) and **deleted that allowlist**.
 * Expanding the tier also exposed three latent holes in the source itself
 * (`--primitive-shadow-blur-4`, `--primitive-shadow-color-4`,
 * `--radius-full`) that every install graph now sees via Foundation; those
 * are closed in `styles/tokens.css`, not by re-allowlisting. The bar is
 * absolute: every distributed component must resolve every fallback-less
 * token it references. There is no exception list, and one must not be
 * reintroduced — a failure here is a real consumer defect, the kind that
 * shipped an installed Badge with `padding: 0`, `border-radius: 0`, a
 * transparent background and a black border.
 */

const IGNORED_REFERENCES = new Set(["--control-checkbox-radius-max"]);

function cssDeclarations(css: string): Set<string> {
  const set = new Set<string>();
  for (const match of Array.from(css.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*[^;]+;/g))) {
    set.add(match[1]);
  }
  return set;
}

// React inline custom-property definitions: `"--token":` / `'--token':` as
// an object key (e.g. style={{ "--slider-track-height": "0.25rem" }}).
function jsInlineDeclarations(text: string): Set<string> {
  const set = new Set<string>();
  for (const match of Array.from(text.matchAll(/["'](--[a-zA-Z0-9-]+)["']\s*:/g))) {
    set.add(match[1]);
  }
  return set;
}

// Fallback-less var() usage only: var(--token) with nothing after the name.
function fallbackLessReferences(text: string): Set<string> {
  const set = new Set<string>();
  for (const match of Array.from(text.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g))) {
    if (!IGNORED_REFERENCES.has(match[1])) set.add(match[1]);
  }
  return set;
}

function closureFor(item: ShadcnRegistryItem, byName: Map<string, ShadcnRegistryItem>): ShadcnRegistryItem[] {
  const seen = new Set<string>();
  const result: ShadcnRegistryItem[] = [];
  function visit(name: string) {
    if (seen.has(name)) return;
    seen.add(name);
    const found = byName.get(name);
    if (!found) return;
    result.push(found);
    for (const dep of found.registryDependencies) visit(dep.replace("@skrewww/", ""));
  }
  visit(item.name);
  return result;
}

function gapsFor(item: ShadcnRegistryItem, byName: Map<string, ShadcnRegistryItem>): string[] {
  const closure = closureFor(item, byName);
  const declared = new Set<string>();
  const referenced = new Set<string>();
  for (const manifest of closure) {
    for (const file of manifest.files) {
      if (file.path.endsWith(".css")) {
        for (const token of Array.from(cssDeclarations(file.content))) declared.add(token);
      }
      for (const token of Array.from(fallbackLessReferences(file.content))) referenced.add(token);
      for (const token of Array.from(jsInlineDeclarations(file.content))) declared.add(token);
    }
  }
  return Array.from(referenced)
    .filter((token) => !declared.has(token))
    .sort();
}

const items = buildDistributedRegistryItems();
const byName = new Map(items.map((item) => [item.name, item]));
const distributedComponents = items.filter((item) => item.name !== "foundation");

describe("cross-cutting token delivery (all distributed manifests)", () => {
  it.each(distributedComponents.map((item) => item.name))(
    "%s: every fallback-less var() it references is delivered by its own install graph",
    (name) => {
      const item = byName.get(name)!;
      expect(gapsFor(item, byName), `${name} references token(s) no consumer receives`).toEqual([]);
    },
  );

  it("the whole distributed surface resolves — no exceptions, no allowlist", () => {
    const broken = distributedComponents
      .map((item) => ({ name: item.name, gaps: gapsFor(item, byName) }))
      .filter((row) => row.gaps.length > 0);
    expect(broken, "components with undelivered tokens").toEqual([]);
  });

  // The defect OSS-1B fixed was specifically that component-tier defaults
  // never left the repo. Assert the transported Foundation carries them, so a
  // future change to the extraction boundary fails here with a clear reason
  // rather than as 35 separate mystery failures above.
  it("the transported Foundation carries component-tier defaults ahead of the mode blocks", () => {
    const foundation = byName.get("foundation")!;
    const css = foundation.files.map((file) => file.content).join("\n");
    for (const token of ["--badge-gap", "--feedback-padding", "--menu-surface", "--popover-surface", "--calendar-day-size"]) {
      expect(css.includes(`${token}:`), `${token} missing from the Foundation transport`).toBe(true);
    }
    // Mode overrides must still come last, or an ancestor [data-skrewww-*]
    // could no longer beat the default it is meant to override.
    const firstModeSelector = css.search(/^\[data-skrewww-(shape|surface)="[a-z]+"\] \{/m);
    expect(firstModeSelector).toBeGreaterThan(-1);
    expect(css.indexOf("--menu-surface:")).toBeLessThan(firstModeSelector);
    expect(css.indexOf("--badge-gap:")).toBeLessThan(firstModeSelector);
  });

  // Mutation proof for the OSS-1B "previously-clean components fail" root
  // cause: Foundation's own CSS must be self-consistent. Expanding the
  // component tier without closing source holes (--primitive-shadow-*-4,
  // --radius-full) made *every* install graph fail — including button/card.
  it("Foundation CSS is self-consistent — every fallback-less var() it references is declared in Foundation", () => {
    const foundation = byName.get("foundation")!;
    const css = foundation.files.map((file) => file.content).join("\n");
    const declared = cssDeclarations(css);
    const referenced = fallbackLessReferences(css);
    const gaps = Array.from(referenced)
      .filter((token) => !declared.has(token))
      .sort();
    expect(gaps, "Foundation references token(s) it does not declare").toEqual([]);
  });

  it("mutation: stripping a Foundation-declared primitive resurfaces the clean-component regression", () => {
    const foundation = byName.get("foundation")!;
    const original = foundation.files.map((file) => file.content).join("\n");
    expect(original).toMatch(/--primitive-shadow-blur-4:\s*[^;]+;/);
    expect(original).toMatch(/var\(\s*--primitive-shadow-blur-4\s*\)/);

    const mutilated = original.replace(/--primitive-shadow-blur-4:\s*[^;]+;\s*/g, "");
    const declared = cssDeclarations(mutilated);
    const referenced = fallbackLessReferences(mutilated);
    expect(declared.has("--primitive-shadow-blur-4")).toBe(false);
    expect(referenced.has("--primitive-shadow-blur-4")).toBe(true);

    // Same gap shape the audit reports when Foundation leaks an undeclared
    // reference into every component's install graph.
    const button = byName.get("button")!;
    const mutatedByName = new Map(byName);
    mutatedByName.set("foundation", {
      ...foundation,
      files: foundation.files.map((file) =>
        file.path.endsWith(".css") ? { ...file, content: mutilated } : file,
      ),
    });
    expect(gapsFor(button, mutatedByName)).toContain("--primitive-shadow-blur-4");
    expect(gapsFor(button, byName)).not.toContain("--primitive-shadow-blur-4");
  });

  it("multi-install order: Foundation payload is identical regardless of which component pulls it in", () => {
    const foundation = byName.get("foundation")!;
    const css = foundation.files.map((file) => file.content).join("\n");
    // Any two install graphs that include Foundation must see the same bytes —
    // there is one Foundation manifest, not a merge of per-component slices.
    for (const name of ["badge", "alert", "button", "select", "date-picker", "menu"]) {
      const item = byName.get(name)!;
      const closure = closureFor(item, byName);
      const found = closure.find((entry) => entry.name === "foundation");
      expect(found, `${name} must depend on foundation`).toBeTruthy();
      expect(found!.files.map((file) => file.content).join("\n")).toBe(css);
    }
  });
});
