import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GUARD_CONSUMER_RULE_COUNT,
  SHAPE_MODES,
  SURFACE_MODES,
  UNVERIFIED_VALUE,
  VERIFIED_AT,
  comparisonGroups,
  comparisonSources,
  comparisonSystems,
  formatVerifiedDate,
  getBuildNotes,
  getComparisonCategories,
  getComparisonValue,
  getSkrewwwFacts,
} from "@/lib/comparison";
import { getImplementedComponentCount } from "@/lib/component-registry";
import { GUARD_RULE_CATALOG } from "@/lib/guard/rules";

const categories = getComparisonCategories();
const systemIds = comparisonSystems.map((system) => system.id);
const competitorIds = systemIds.filter((id) => id !== "skrewww");
const cell = (categoryId: string, systemId: (typeof systemIds)[number]) => {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) throw new Error(`unknown category ${categoryId}`);
  return getComparisonValue(category, systemId);
};
const allText = (value: ReturnType<typeof cell>) => `${value.label ?? ""} ${value.note ?? ""}`;

describe("comparison data model", () => {
  it("compares exactly the intended set, with Skrewww as the only subject", () => {
    expect(systemIds).toEqual(["skrewww", "carbon", "fluent-2", "spectrum", "atlassian"]);
    expect(comparisonSystems.filter((s) => s.isSubject).map((s) => s.id)).toEqual(["skrewww"]);
  });

  it("has unique category ids that all belong to a declared group", () => {
    const ids = categories.map((category) => category.id);
    expect(ids).toHaveLength(16);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = new Set(comparisonGroups.map((group) => group.id));
    for (const category of categories) expect(groups.has(category.group)).toBe(true);
  });

  it("only references known systems in values", () => {
    for (const category of categories) {
      for (const key of Object.keys(category.values)) expect(systemIds).toContain(key);
    }
  });

  it("derives Skrewww counts from the registry instead of hardcoding them", () => {
    expect(cell("component-coverage", "skrewww").label).toBe(`${getImplementedComponentCount()} React components`);
  });

  it("falls back to the neutral unverified state, which needs no source", () => {
    const category = categories[0];
    const missing = getComparisonValue({ ...category, values: {} }, "carbon");
    expect(missing).toBe(UNVERIFIED_VALUE);
    expect(missing.status).toBe("unverified");
    expect(missing.sources).toBeUndefined();
    expect(missing.verifiedAt).toBeUndefined();
  });
});

describe("provenance", () => {
  it("gives every populated value (competitors and Skrewww) a source and a verification date", () => {
    for (const category of categories) {
      for (const id of systemIds) {
        const value = getComparisonValue(category, id);
        if (value.status === "unverified") continue;
        const where = `${category.id}/${id}`;
        expect(value.sources?.length, `${where} needs a source`).toBeGreaterThan(0);
        expect(value.verifiedAt, `${where} needs verifiedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Number.isNaN(Date.parse(`${value.verifiedAt}T00:00:00Z`)), `${where} date is valid`).toBe(false);
      }
    }
  });

  it("uses the approved verification date for this research set", () => {
    expect(VERIFIED_AT).toBe("2026-10-17");
    for (const category of categories) {
      for (const id of systemIds) {
        const value = getComparisonValue(category, id);
        if (value.status !== "unverified") expect(value.verifiedAt).toBe("2026-10-17");
      }
    }
    expect(formatVerifiedDate("2026-10-17")).toBe("Oct 17, 2026");
  });

  it("resolves every source id to a public https URL, with no unused or duplicate entries", () => {
    const used = new Set<string>();
    for (const category of categories) {
      for (const id of systemIds) {
        for (const sourceId of getComparisonValue(category, id).sources ?? []) {
          expect(comparisonSources[sourceId], `unknown source ${sourceId}`).toBeDefined();
          used.add(sourceId);
        }
      }
    }
    const urls = Object.values(comparisonSources).map((source) => source.url);
    for (const url of urls) expect(url).toMatch(/^https:\/\//);
    expect(new Set(urls).size).toBe(urls.length);
    expect(Object.keys(comparisonSources).filter((id) => !used.has(id))).toEqual([]);
  });

  it("never records a competitor value without a source", () => {
    for (const category of categories) {
      for (const id of competitorIds) {
        const value = getComparisonValue(category, id);
        if (value.status !== "unverified") expect(value.sources?.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("neutrality", () => {
  it("has no score, rank or winner fields, and no superlative or comparative-marketing wording", () => {
    const serialized = JSON.stringify({ categories, comparisonSystems, comparisonGroups }).toLowerCase();
    expect(serialized).not.toMatch(/"(score|rank|ranking|winner|rating)"/);
    expect(serialized).not.toMatch(/\b(winner|best|most advanced|only|superior|outperform|beats?)\b/);
  });

  it("never records a competitor as No", () => {
    for (const category of categories) {
      for (const id of competitorIds) expect(getComparisonValue(category, id).status).not.toBe("no");
    }
  });

  it("keeps rows that are not like-for-like unverified for every competitor", () => {
    for (const id of competitorIds) {
      expect(cell("component-coverage", id).status).toBe("unverified");
      expect(cell("maturity", id).status).toBe("unverified");
    }
  });
});

describe("evidence follow-up decisions", () => {
  it("rates Spectrum agent-readable contracts Partial: design-level schemas, not React Spectrum's API", () => {
    const value = cell("agent-contracts", "spectrum");
    expect(value.status).toBe("partial");
    expect(value.note).toMatch(/design-level/);
    expect(value.note).toMatch(/does not plug into React Spectrum/);
  });

  it("keeps Spectrum's agent skill at Yes only because a public React Spectrum skill is directly sourced", () => {
    const value = cell("agent-skill", "spectrum");
    expect(value.status).toBe("yes");
    expect(value.label).toBe("React Spectrum S2 agent skill");
    expect(value.sources).toContain("spectrum-skills-index");
    expect(comparisonSources["spectrum-skills-index"].url).toBe("https://react-spectrum.adobe.com/.well-known/skills/index.json");
  });

  it("records the newly sourced cells", () => {
    expect(cell("figma-support", "atlassian").status).toBe("yes");
    expect(cell("figma-support", "atlassian").sources).toEqual(["atlassian-figma"]);
    expect(cell("open-source", "atlassian").status).toBe("yes");
    expect(cell("open-source", "atlassian").sources).toContain("atlassian-mirror");
    const fluent = cell("deterministic-validation", "fluent-2");
    expect(fluent.status).toBe("partial");
    expect(fluent.sources).toEqual(["fluent-eslint"]);
  });

  it("leaves exactly the remaining competitor cells unverified, so any change is deliberate", () => {
    const unverified: string[] = [];
    for (const category of categories) {
      for (const id of competitorIds) {
        if (getComparisonValue(category, id).status === "unverified") unverified.push(`${category.id}/${id}`);
      }
    }
    expect(unverified.sort()).toEqual(
      [
        ...competitorIds.map((id) => `component-coverage/${id}`),
        ...competitorIds.map((id) => `maturity/${id}`),
        "figma-support/spectrum",
        "shape-system/carbon",
        "surface-system/carbon",
        ...["carbon", "fluent-2", "atlassian"].map((id) => `shadcn-distribution/${id}`),
        ...["carbon", "fluent-2", "atlassian"].map((id) => `registry-installability/${id}`),
        "agent-skill/fluent-2",
        "deterministic-validation/carbon",
        "deterministic-validation/spectrum",
      ].sort(),
    );
  });

  it("keeps total and installable component counts distinct and derived", () => {
    const f = getSkrewwwFacts();
    expect(f.installable).toBeLessThanOrEqual(f.implemented);
    expect(cell("component-coverage", "skrewww").label).toBe(`${f.implemented} React components`);
    expect(cell("registry-installability", "skrewww").label).toBe(`${f.installable} of ${f.implemented} components`);
  });

  it("describes Skrewww maturity precisely: beta packages, per-component status, separate platform release", () => {
    const f = getSkrewwwFacts();
    const value = cell("maturity", "skrewww");
    expect(value.label).toBe(`Beta packages; ${f.stable} of ${f.implemented} components Stable`);
    expect(value.note).toMatch(/@skrewww\/react, Agent Kit and Guard are in beta/);
    expect(value.note).toMatch(/platform release 1\.0\.0, which is separate from package versions/);
  });
});

describe("approved judgement decisions", () => {
  it("scopes Spectrum's shadcn support to React Aria as Partial, not a generic Spectrum Yes", () => {
    for (const row of ["shadcn-distribution", "registry-installability"]) {
      const value = cell(row, "spectrum");
      expect(value.status).toBe("partial");
      expect(allText(value)).toMatch(/React Aria/);
      expect(allText(value)).toMatch(/not React Spectrum S2/);
    }
    for (const id of ["carbon", "fluent-2", "atlassian"] as const) {
      expect(cell("shadcn-distribution", id).status).toBe("unverified");
    }
  });

  it("does not present Guard as an unrestricted Yes", () => {
    const guard = cell("deterministic-validation", "skrewww");
    expect(guard.status).toBe("partial");
    expect(guard.label).toBe(`Guard Beta, ${getSkrewwwFacts().guardConsumerRules} consumer rules`);
    expect(guard.note).toMatch(/does not replace TypeScript, linting, accessibility review or visual validation/i);
  });

  it("states Skrewww Shape and Surface as selectable modes, matching the CSS", () => {
    expect(cell("shape-system", "skrewww").label).toBe("4 selectable modes");
    expect(cell("surface-system", "skrewww").label).toBe("3 selectable modes");

    const cssDir = join(process.cwd(), "styles");
    const css = readdirSync(cssDir)
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFileSync(join(cssDir, file), "utf8"))
      .join("\n");
    const found = (attribute: string) =>
      Array.from(
        new Set(Array.from(css.matchAll(new RegExp(`data-skrewww-${attribute}="([a-z-]+)"`, "g"))).map((m) => m[1])),
      ).sort();
    expect(found("shape")).toEqual(SHAPE_MODES.map((m) => m.toLowerCase()).sort());
    expect(found("surface")).toEqual(SURFACE_MODES.map((m) => m.toLowerCase()).sort());
  });

  it("keeps competitor Shape and Surface values at Partial or unverified", () => {
    for (const row of ["shape-system", "surface-system"]) {
      for (const id of competitorIds) expect(["partial", "unverified"]).toContain(cell(row, id).status);
    }
  });

  it("describes the shadcn directory index and Awesome shadcn/ui as separate facts, without endorsement wording", () => {
    const note = cell("shadcn-distribution", "skrewww").note ?? "";
    expect(note).toMatch(/Indexed in the shadcn registry directory\./);
    expect(note).toMatch(/community-curated Awesome shadcn\/ui directory/);
    expect(note).toMatch(/not a shadcn endorsement/);
    expect(note).not.toMatch(/official/i);
    expect(note.split(". ").length).toBeGreaterThanOrEqual(2);
  });

  it("names the npm package without a published version", () => {
    const npm = cell("npm-distribution", "skrewww");
    expect(npm.label).toBe("@skrewww/react (beta)");
    expect(allText(npm)).not.toMatch(/\d+\.\d+\.\d+/);
  });

  it("does not claim full or per-component Figma and React parity", () => {
    const notes = getBuildNotes();
    const parity = notes.find((note) => /Figma and React/.test(note.title));
    expect(parity?.body).toBe(
      "Skrewww ships Figma libraries and a React implementation. A parity audit has been completed on five pilot components; full parity is not claimed.",
    );
    const everything = JSON.stringify({ notes, categories }).toLowerCase();
    expect(everything).not.toMatch(/parity audited per component/);
    expect(everything).not.toMatch(/full (component )?parity (is )?(achieved|complete)/);
  });

  it("starts every card sentence with a capital letter", () => {
    for (const note of getBuildNotes()) expect(note.body).toMatch(/^[A-Z]/);
    expect(getBuildNotes().find((n) => n.title === "Selectable Shape modes")?.body).toMatch(/^Four modes \(Sharp, Rounded, Pill, Squircle\)/);
  });

  it("keeps card copy neutral, with the shadcn directory and Awesome shadcn/ui as separate statements", () => {
    const notes = getBuildNotes();
    const shadcn = notes.find((note) => note.title === "shadcn-compatible distribution");
    expect(shadcn?.body).toMatch(/indexed in the shadcn registry directory\. Separately, Skrewww is listed in the community-curated Awesome shadcn\/ui directory, which is not a shadcn endorsement/);
    expect(shadcn?.body).not.toMatch(/official/i);
    expect(JSON.stringify(notes).toLowerCase()).not.toMatch(/\b(winner|best|most advanced|only|superior|outperform|beats?)\b/);
    expect(notes.find((note) => note.title === "Guard verification")?.body).toMatch(
      /does not replace TypeScript, linting, accessibility review or visual validation/,
    );
  });

  it("derives Skrewww facts from canonical sources", () => {
    const facts = getSkrewwwFacts();
    expect(facts.guardConsumerRules).toBe(GUARD_RULE_CATALOG.filter((rule) => rule.domain === "public").length);
    expect(facts.guardConsumerRules).toBe(GUARD_CONSUMER_RULE_COUNT);
    expect(facts.guardConsumerRules).toBe(3);
    expect(facts.pilotCount).toBe(5);
    expect(facts.installable).toBeGreaterThan(0);
    expect(facts.installable).toBeLessThanOrEqual(facts.implemented);
  });
});
