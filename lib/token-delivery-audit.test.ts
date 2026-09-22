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
 * dead declaration with zero visible effect — Checkbox's own real gap
 * (`--control-checkbox-size`, load-bearing for its rendered box size) is
 * what correctly keeps Checkbox on the KNOWN_AFFECTED list below.
 *
 * KNOWN_AFFECTED is the current, exact list this audit found — see
 * docs/architecture/shadcn-distribution.md's "Cross-cutting component-token
 * delivery audit" section for the finding and disposition (a real,
 * consumer-visible bug in ~30 components: e.g. Badge installs with
 * `padding: 0`, `border-radius: 0`, a transparent background, and a black
 * border instead of its intended colored treatment — confirmed via a real
 * installed-consumer browser check, not just this static scan). This is a
 * large, deliberately-deferred migration (see the OSS-1A entry in
 * docs/project-status.md), not something this test fixes.
 *
 * This test is a **shrink-only allowlist**, not a snapshot: any component
 * NOT listed here must have zero gaps (locks in the already-clean 20/55 so
 * nothing new regresses), and any component listed here must still have at
 * least one real gap (so fixing a component and forgetting to remove it
 * from the list fails loudly, instead of the list silently going stale).
 */

const IGNORED_REFERENCES = new Set(["--control-checkbox-radius-max"]);

// Exact set found by this audit (2026-09-22) — see file header. Shrinks only
// as components are migrated to component-owned CSS; never grows silently.
const KNOWN_AFFECTED = new Set([
  "accordion",
  "alert",
  "avatar",
  "badge",
  "breadcrumb",
  "calendar-day",
  "calendar-grid",
  "chart-card",
  "checkbox",
  "combobox",
  "data-table",
  "date-picker",
  "dialog",
  "drawer",
  "empty-state",
  "file-upload",
  "list-item",
  "menu",
  "pagination",
  "phone-number-field",
  "popover",
  "progress-bar",
  "radio",
  "radio-group",
  "select",
  "skeleton",
  "switch",
  "table",
  "tabs",
  "tag",
  "textarea",
  "timeline",
  "toast",
  "tooltip",
  "tree-view",
]);

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
  it("KNOWN_AFFECTED only names real distributed components", () => {
    const distributedNames = new Set(distributedComponents.map((item) => item.name));
    for (const name of Array.from(KNOWN_AFFECTED)) {
      expect(distributedNames.has(name), `${name} is not a currently-distributed component`).toBe(true);
    }
  });

  it.each(distributedComponents.map((item) => item.name))(
    "%s: has no undelivered fallback-less var() unless it's on the known-affected allowlist",
    (name) => {
      const item = byName.get(name)!;
      const gaps = gapsFor(item, byName);
      if (KNOWN_AFFECTED.has(name)) {
        expect(gaps.length, `${name} is on KNOWN_AFFECTED but has no gaps — remove it from the allowlist`).toBeGreaterThan(0);
      } else {
        expect(gaps, `${name} has undelivered token(s) — add it to KNOWN_AFFECTED or fix the gap`).toEqual([]);
      }
    },
  );

  it("the allowlist shrinks over time: every fixed component must be removed, not left stale", () => {
    const stillBroken = distributedComponents
      .filter((item) => KNOWN_AFFECTED.has(item.name))
      .filter((item) => gapsFor(item, byName).length === 0)
      .map((item) => item.name);
    expect(stillBroken, "these components are fixed but still listed in KNOWN_AFFECTED").toEqual([]);
  });
});
