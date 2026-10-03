import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compileMakeKit } from "@/lib/make-kit/compiler";
import { deriveModes, loadMakeKitInputs } from "@/lib/make-kit/inputs";
import { FIGMA_BOUNDARY, SOURCE_PRECEDENCE, STATUS_RULES } from "@/lib/make-kit/policy";
import { MakeKitCompileError, type MakeKitInput } from "@/lib/make-kit/types";

const root = process.cwd();
const FIXED = { sourceGitSha: "0".repeat(40), sourceGitCommitTimestamp: "2026-01-01T00:00:00+00:00" };

/** A fresh deep copy of the real canonical inputs, safe to mutate per test. */
function realInput(): MakeKitInput {
  return JSON.parse(JSON.stringify(loadMakeKitInputs(root, FIXED)));
}
const content = (out: ReturnType<typeof compileMakeKit>, path: string) => out.files.find((file) => file.path === path)!.content;
const failures = (mutate: (input: MakeKitInput) => void): string => {
  const input = realInput();
  mutate(input);
  try {
    compileMakeKit(input);
  } catch (error) {
    expect(error).toBeInstanceOf(MakeKitCompileError);
    return (error as MakeKitCompileError).issues.join("\n");
  }
  throw new Error("expected compileMakeKit to throw");
};

describe("Make Kit guideline compiler — real canonical inputs", () => {
  const out = compileMakeKit(realInput());
  const manifest = out.manifest;

  it("is byte-deterministic for unchanged inputs", () => {
    const again = compileMakeKit(realInput());
    expect(again.files).toEqual(out.files);
  });

  it("emits one guideline per pilot component plus system, accessibility, composition, overview, setup and manifest", () => {
    expect(out.files.map((f) => f.path)).toEqual([
      "guidelines/Guidelines.md",
      "guidelines/accessibility.md",
      "guidelines/components/button.md",
      "guidelines/components/card.md",
      "guidelines/components/dialog.md",
      "guidelines/components/form-field.md",
      "guidelines/components/link.md",
      "guidelines/components/spinner.md",
      "guidelines/components/text-input.md",
      "guidelines/components/validation-message.md",
      "guidelines/composition.md",
      "guidelines/setup.md",
      "guidelines/system.md",
      "manifest.json",
    ]);
  });

  it("derives the package surface from package.json and the entry: name, version, stylesheet, peers", () => {
    const pkg = JSON.parse(readFileSync(join(root, "packages/react/package.json"), "utf8"));
    expect(manifest.package.name).toBe(pkg.name);
    expect(manifest.package.version).toBe(pkg.version);
    expect(manifest.package.stylesheet).toBe(`${pkg.name}/styles.css`);
    expect(manifest.package.peerDependencies).toEqual(pkg.peerDependencies);
  });

  it("derives npm imports for every component from the actual public exports (no hand-maintained paths)", () => {
    for (const component of manifest.components) {
      const md = content(out, component.guideline);
      expect(md).toContain(`import { ${component.exports.values.join(", ")} } from "@skrewww/react";`);
      for (const name of component.exports.values) expect(manifest.exportIndex[name]).toBe("@skrewww/react");
    }
    expect(manifest.exportIndex.SkrewwwRouterProvider).toBe("@skrewww/react");
  });

  it("represents Dialog's real compound exports", () => {
    const dialog = manifest.components.find((c) => c.slug === "dialog")!;
    expect(dialog.exports.values).toEqual(expect.arrayContaining(["Dialog", "DialogTrigger", "DialogContent", "DialogTitle", "DialogDescription", "DialogClose"]));
    const md = content(out, "guidelines/components/dialog.md");
    expect(md).toContain("`DialogContent`");
    expect(md).toMatch(/props are not individually modeled/);
  });

  it("carries canonical status from the contracts, never a hard-coded one", () => {
    for (const component of manifest.components) {
      expect(content(out, component.guideline)).toContain(`Status: **${component.status}**`);
    }
    const beta = realInput();
    beta.components = beta.components.map((c) => (c.slug === "spinner" ? { ...c, status: "beta" as const } : c));
    beta.contracts = beta.contracts.map((c) => (c.slug === "spinner" ? { ...c, status: "beta" as const } : c));
    const betaOut = compileMakeKit(beta);
    expect(content(betaOut, "guidelines/components/spinner.md")).toContain("Status: **beta**");
    expect(content(betaOut, "guidelines/system.md")).toMatch(/beta — Spinner/);
  });

  it("derives Shape and Surface modes from the token stylesheet and covers document-level placement", () => {
    expect(manifest.modes.shape).toEqual(["sharp", "rounded", "pill", "squircle"]);
    expect(manifest.modes.surface).toEqual(["flat", "gradient", "glass"]);
    const system = content(out, "guidelines/system.md");
    for (const mode of [...manifest.modes.shape, ...manifest.modes.surface]) expect(system).toContain(`\`${mode}\``);
    const setup = content(out, "guidelines/setup.md");
    expect(setup).toContain("<html data-skrewww-shape=");
    expect(setup).toMatch(/portal/);
    expect(content(out, "guidelines/components/button.md")).toMatch(/does not declare per-component Shape or Surface/);
  });

  it("includes only recipes fully covered by the package and keeps their accessibility notes out of composition.md", () => {
    expect(manifest.recipes.map((r) => r.id)).toEqual(["destructive-confirmation", "validated-text-field"]);
    const composition = content(out, "guidelines/composition.md");
    expect(composition).not.toMatch(/Loading and inline feedback|Search no results/i);
    const accessibility = content(out, "guidelines/accessibility.md");
    expect(accessibility).toMatch(/Composition-level notes/);
  });

  it("never includes Figma node ids, snapshots or file keys", () => {
    const all = out.files.map((f) => f.content).join("\n");
    expect(all).not.toMatch(/U6KUuNf7DF4CP9QBOkLSUx|KrQIUWznpBdP0ZuWjOu2e3/);
    expect(all).not.toMatch(/\b\d{3,5}:\d{3,5}\b/);
    expect(all).not.toMatch(/figma-snapshots|capturedAt/);
    expect(manifest.authority).toEqual({ isAuthority: false, figmaReferencesAreReferenceOnly: true, figmaSnapshotsIncluded: false, liveFigmaRequired: false });
  });

  it("records provenance and a digest of the guideline files", () => {
    expect(manifest.provenance.sourceGitSha).toBe(FIXED.sourceGitSha);
    expect(manifest.provenance.guidelinesDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest.sources.agentContractSchemaVersion).toBeTruthy();
    expect(manifest.sources.registrySchemaVersion).toBeTruthy();
    // Guideline files carry no commit-specific data, so they are byte-stable across commits.
    const other = compileMakeKit({ ...realInput(), provenance: { sourceGitSha: "f".repeat(40), sourceGitCommitTimestamp: "2027-01-01T00:00:00+00:00" } });
    expect(other.files.filter((f) => f.path !== "manifest.json")).toEqual(out.files.filter((f) => f.path !== "manifest.json"));
  });

  it("never mentions next, recharts, @vercel, shadcn, npx, repository paths or non-package @skrewww specifiers", () => {
    const all = out.files.map((f) => f.content).join("\n");
    expect(all).not.toMatch(/\bnext\/[a-z]|\brecharts\b|@vercel\/|\bshadcn\b|\bnpx\s|components\/ui/i);
    const specifiers = new Set(all.match(/@skrewww\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]*[A-Za-z0-9_-])?/g));
    expect(Array.from(specifiers).sort()).toEqual(["@skrewww/react", "@skrewww/react/styles.css"]);
  });
});

const out2 = compileMakeKit(realInput());

describe("Make Kit guideline compiler — drift and validation", () => {
  it("fails when a public export disappears from the package entry", () => {
    expect(failures((i) => { i.exportsByModule.Dialog.values = i.exportsByModule.Dialog.values.filter((n) => n !== "Dialog"); })).toMatch(/does not export "Dialog"/);
    expect(failures((i) => { i.exportsByModule.Button.values = []; })).toMatch(/no public exports for module "Button"/);
    expect(failures((i) => { delete i.exportsByModule.Dialog; })).toMatch(/no public exports for module "Dialog"/);
    expect(failures((i) => { delete i.exportsByModule["router-navigation"]; })).toMatch(/router module/);
  });

  it("fails when the stylesheet export is missing", () => {
    expect(failures((i) => { delete i.package.exports["./styles.css"]; })).toMatch(/styles\.css/);
  });

  it("fails on a component status mismatch between registry and contract", () => {
    expect(failures((i) => { i.contracts = i.contracts.map((c) => (c.slug === "dialog" ? { ...c, status: "beta" as const } : c)); })).toMatch(/status mismatch for "dialog"/);
  });

  it("fails when a pilot component has no contract", () => {
    expect(failures((i) => { i.contracts = i.contracts.filter((c) => c.slug !== "card"); })).toMatch(/no Agent contract/);
  });

  it("fails on missing accessibility or system metadata", () => {
    expect(failures((i) => { i.contracts = i.contracts.map((c) => (c.slug === "link" ? { ...c, accessibilityLevel: "" } : c)); })).toMatch(/accessibilityLevel/);
    expect(failures((i) => { i.system.accessibilityBaseline = []; })).toMatch(/accessibilityBaseline/);
    expect(failures((i) => { i.system.shapePolicy = []; })).toMatch(/shapePolicy/);
  });

  it("fails if a contract starts declaring per-component Shape/Surface support (the guidance would be stale)", () => {
    expect(failures((i) => { i.contracts = i.contracts.map((c) => (c.slug === "button" ? ({ ...c, shapeSupport: ["pill"] } as typeof c) : c)); })).toMatch(/per-component mode support/);
  });

  it("fails on forbidden npm-facing content, including injected guidance", () => {
    expect(failures((i) => { i.manualSetup += "\nInstall with npx shadcn add @skrewww/button\n"; })).toMatch(/forbidden content/);
    expect(failures((i) => { i.manualSetup += "\nimport Link from \"next/link\";\n"; })).toMatch(/next\/ import path/);
    expect(failures((i) => { i.manualSetup += "\nUses recharts for charts.\n"; })).toMatch(/recharts/);
    expect(failures((i) => { i.contracts = i.contracts.map((c) => (c.slug === "card" ? { ...c, summary: "See components/ui/Card.tsx" } : c)); })).toMatch(/components\/ui/);
  });

  it("fails on a stale or non-package npm import name", () => {
    expect(failures((i) => { i.manualSetup += "\nimport { X } from \"@skrewww/core\";\n"; })).toMatch(/"@skrewww\/core"/);
    expect(failures((i) => { i.manualSetup = i.manualSetup.replace('import "@skrewww/react/styles.css";', 'import "@skrewww/ui/styles.css";'); })).toMatch(/derived stylesheet import/);
  });

  it("keeps the manual setup file to environment setup only", () => {
    expect(failures((i) => { i.manualSetup += "\n| Prop | Type |\n|---|---|\n"; })).toMatch(/API table/);
    expect(failures((i) => { i.manualSetup += `\n${i.contracts.find((c) => c.slug === "button")!.guidance.whenToUse}\n`; })).toMatch(/duplicates a canonical button fact/);
    expect(failures((i) => { i.manualSetup += `\nCurrently ${i.package.version}\n`; })).toMatch(/hard-codes the package version/);
    expect(failures((i) => { i.manualSetup = i.manualSetup.replace(/SkrewwwRouterProvider/g, "RouterThing"); })).toMatch(/SkrewwwRouterProvider/);
  });

  it("omits related components that are not in the package instead of linking to them", () => {
    const input = realInput();
    input.contracts = input.contracts.map((c) => (c.slug === "button" ? { ...c, relatedComponents: [{ label: "Ghost — x", href: "/components/ghost" }, ...c.relatedComponents] } : c));
    const md = content(compileMakeKit(input), "guidelines/components/button.md");
    expect(md).not.toMatch(/Ghost/);
    expect(md).toContain("](./link.md)");
  });

  it("does not carry open questions (unresolved design notes) or Figma node ids from canonical prose", () => {
    expect(content(out2, "guidelines/components/card.md")).not.toMatch(/Open questions|2044:25756/);
    expect(failures((i) => { i.contracts = i.contracts.map((c) => (c.slug === "card" ? { ...c, guidance: { ...c.guidance, knownLimitation: "See Figma node 2044:25756" } } : c)); })).toMatch(/Figma node id/);
  });
});

describe("Make Kit policy statements stay tied to canonical documents", () => {
  for (const statement of [...SOURCE_PRECEDENCE, ...FIGMA_BOUNDARY, ...STATUS_RULES]) {
    it(`${statement.source} still contains "${statement.anchor}"`, () => {
      const path = join(root, statement.source);
      const isOwnDoc = statement.source.endsWith("make-kit-guidelines.md");
      if (isOwnDoc && !existsSync(path)) throw new Error("docs/architecture/make-kit-guidelines.md must exist");
      expect(readFileSync(path, "utf8").toLowerCase()).toContain(statement.anchor.toLowerCase());
    });
  }

  it("deriveModes reads only top-level mode selectors", () => {
    expect(deriveModes('[data-skrewww-shape="a"] {}\n  [data-skrewww-shape="nested"] {}\n[data-skrewww-shape="b"] {}\n[data-skrewww-shape="a"] {}', "shape")).toEqual(["a", "b"]);
  });
});

/**
 * MK-2E1 regression: the first real Make Kit run generated FormField > TextInput plus a separate,
 * assertive-on-first-render ValidationMessage, which duplicates the label and announces a static error.
 * Text Input is a COMPLETE field (it composes Form Field internally; docs/architecture/form-field.md),
 * and assertive announcement is only for errors introduced after first render. The generated guidance must
 * never imply otherwise.
 */
describe("Make Kit guidance — field composition and announcement rules (MK-2E1)", () => {
  const out = compileMakeKit(realInput());
  const composition = content(out, "guidelines/composition.md");
  const textInput = content(out, "guidelines/components/text-input.md");
  const formField = content(out, "guidelines/components/form-field.md");
  const validation = content(out, "guidelines/components/validation-message.md");
  const accessibility = content(out, "guidelines/accessibility.md");
  const everything = out.files.map((file) => file.content).join("\n");

  it("never tells the model to wrap Text Input in Form Field or to place it as Form Field children", () => {
    expect(everything).not.toMatch(/Form Field as the outer shell/i);
    expect(everything).not.toMatch(/Text Input as (the )?Form Field (child|`children`)/i);
    expect(everything).not.toMatch(/Pass Text Input as Form Field/i);
    expect(everything).not.toMatch(/Prefer Text Input's own `label` only when Form Field is not wrapping/i);
    expect(everything).not.toMatch(/Pair with FormField/i);
    expect(everything).not.toMatch(/Text Input — control composed with FormField/);
  });

  it("states that Text Input is a complete field that owns label, supporting text, required and error", () => {
    expect(textInput).toMatch(/complete field/i);
    expect(textInput).toMatch(/Do not wrap it in Form Field/);
    expect(composition).toMatch(/Render Text Input as the complete field/);
    expect(composition).toMatch(/Do not wrap it in Form Field/);
  });

  it("makes the validated-text-field composition need only Text Input", () => {
    const section = composition.slice(composition.indexOf("## Validated text field"));
    expect(section).toMatch(/Required components: \[Text Input\]\(\.\/components\/text-input\.md\) \(stable\)\./);
    expect(section).not.toMatch(/Required components:[^\n]*Form Field/);
    expect(section).not.toMatch(/Required components:[^\n]*Validation Message/);
  });

  it("scopes Form Field to advanced composition and says not to wrap complete fields", () => {
    expect(formField).toMatch(/Advanced composition/);
    expect(formField).toMatch(/do not wrap them in Form Field/i);
    expect(formField).toMatch(/Wrapping Text Input/);
    expect(formField).toMatch(/announce="off"/);
  });

  it("does not recommend a separate Validation Message beside Text Input for an error it already renders", () => {
    expect(validation).toMatch(/already render their own `error`/);
    expect(validation).toMatch(/separate Validation Message beside Text Input or Form Field/);
    expect(composition).toMatch(/Do not render a second Validation Message for the same error/);
  });

  it("restricts assertive announcement to errors introduced after first render", () => {
    expect(validation).toMatch(/already on screen at first render/);
    expect(validation).toMatch(/introduced after the page is shown/);
    expect(composition).toMatch(/Never render assertive on first paint/);
    expect(accessibility).toMatch(/never assertive on first paint/i);
  });

  it("contains no fenced example that nests Text Input in Form Field or renders a static assertive message", () => {
    const fences = everything.match(/```[\s\S]*?```/g) ?? [];
    for (const fence of fences) {
      expect(fence).not.toMatch(/<FormField[\s\S]*<TextInput/);
      expect(fence).not.toMatch(/announce="assertive"/);
    }
  });
});
