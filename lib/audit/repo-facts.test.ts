import { execFileSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";
import {
  classifyApiName,
  collectRepoFacts,
  readGitInfo,
  serializeRepoFacts,
  type GitInfo,
} from "@/lib/audit/collect-repo-facts";
import {
  readCssCustomPropertyDeclarations,
  readCssVarReferences,
  resolveToken,
} from "@/lib/audit/repo-css";
import { evaluateInternalGuard, filterGuardEvaluationsForSlug } from "@/lib/audit/repo-guard";
import {
  readDeclaredExports,
  readPublicBarrel,
  resolveLocalSpecifier,
  walkImplementationGraph,
  type SourceReader,
} from "@/lib/audit/repo-source";
import type { RepoFacts, RuntimeDeclaration } from "@/lib/audit/repo-facts-types";
import { compileAllContracts } from "@/lib/agent-kit/contract-compiler";
import { componentRegistry } from "@/lib/component-registry";
import type { RuleEvaluation } from "@/lib/guard/rule-types";

const root = process.cwd();
const PILOTS = ["button", "text-input", "alert", "dialog", "chart-card"] as const;

let git: GitInfo;
let evaluations: RuleEvaluation[];
const facts = {} as Record<(typeof PILOTS)[number], RepoFacts>;

function collect(slug: string, extra: Partial<Parameters<typeof collectRepoFacts>[0]> = {}) {
  return collectRepoFacts({ repoRoot: root, slug, git, guardEvaluations: evaluations, ...extra });
}

beforeAll(() => {
  git = readGitInfo(root);
  evaluations = evaluateInternalGuard(root, git.sha, git.commitTimestamp);
  for (const slug of PILOTS) {
    const result = collect(slug);
    if (!result.ok) throw new Error(`${slug}: ${result.error.message}`);
    facts[slug] = result.facts;
  }
}, 120_000);

const memoryReader = (files: Record<string, string>): SourceReader => (path) => files[path];

describe("AG-1C repo facts — identity, provenance and contract", () => {
  it("resolves a canonical pilot slug", () => {
    for (const slug of PILOTS) {
      expect(facts[slug].component.slug).toBe(slug);
      expect(facts[slug].schemaVersion).toBe("1.0.0");
    }
  });

  it("fails safely for an unknown slug and never fuzzy-matches a name", () => {
    for (const slug of ["nonexistent", "Button", "text input", ""]) {
      const result = collect(slug);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("UNKNOWN_SLUG");
    }
  });

  it("records the current git SHA, never a wall-clock time", () => {
    const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    expect(facts.button.provenance.gitSha).toBe(head);
    expect(facts.button.provenance.refMode).toBe("current-checkout");
    expect(facts.button.provenance.gitCommitTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(JSON.stringify(facts.button.provenance)).not.toContain("collectedAt");
  });

  it("refuses a ref that is not the current checkout instead of checking it out", () => {
    const result = collect("button", { gitSha: "0".repeat(40) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("REF_NOT_CHECKED_OUT");
  });

  it("matches the contract slug and provenance to the repo SHA", () => {
    for (const slug of PILOTS) {
      expect(facts[slug].contract.provenance.sourceGitSha).toBe(facts[slug].provenance.gitSha);
      expect(facts[slug].contract.provenanceMatchesRepoSha).toBe(true);
      expect(facts[slug].contract.sourceMode).toBe("compiled-in-memory");
    }
  });

  it("rejects a stale supplied contract and a contract for the wrong slug", () => {
    const stale = compileAllContracts({ sourceGitSha: "1".repeat(40), sourceGitCommitTimestamp: git.commitTimestamp }).contracts.find((c) => c.slug === "button")!;
    const staleResult = collect("button", { contract: stale });
    expect(staleResult.ok).toBe(false);
    if (!staleResult.ok) expect(staleResult.error.code).toBe("STALE_CONTRACT");

    const current = compileAllContracts({ sourceGitSha: git.sha, sourceGitCommitTimestamp: git.commitTimestamp }).contracts;
    const wrong = collect("button", { contract: current.find((c) => c.slug === "alert")! });
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.error.code).toBe("CONTRACT_MISMATCH");

    const ok = collect("button", { contract: current.find((c) => c.slug === "button")! });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.facts.contract.sourceMode).toBe("supplied");
  });

  it("keeps registry evidence and contract evidence in separate sections", () => {
    const f = facts["text-input"];
    expect(Object.keys(f)).toEqual(expect.arrayContaining(["registry", "contract"]));
    expect(f.registry.files.length).toBeGreaterThan(0);
    expect(f.contract.api.properties.length).toBeGreaterThan(0);
  });

  it("does not interpret a recorded Figma identity as parity", () => {
    for (const slug of PILOTS) {
      const text = JSON.stringify(facts[slug]);
      expect(text).not.toMatch(/"parity"|"mismatch"|"intentional-difference"|"finding"/i);
    }
    expect(facts.button.registry.figmaIdentity?.nodeId).toBeTruthy();
  });
});

describe("AG-1C repo facts — React evidence", () => {
  it("captures actual public exports from the barrel, not title-cased slugs", () => {
    expect(facts.button.react.publicExports.values).toEqual(["Button"]);
    expect(facts.button.react.publicExports.types).toEqual(expect.arrayContaining(["ButtonProps", "ButtonVariant"]));
    expect(facts["chart-card"].react.publicExports.values).toEqual(["ChartCard"]);
    expect(facts["text-input"].react.publicExports.values).toEqual(["TextInput"]);
  });

  it("represents Dialog's compound parts as public exports", () => {
    expect(facts.dialog.react.publicExports.values).toEqual([
      "Dialog",
      "DialogBody",
      "DialogClose",
      "DialogContent",
      "DialogDescription",
      "DialogFooter",
      "DialogHeader",
      "DialogTitle",
      "DialogTrigger",
    ]);
    expect(Object.keys(facts.dialog.react.publicExportsByFile)).toEqual(["components/ui/Dialog.tsx"]);
  });

  it("does not treat internal-only modules as public", () => {
    const textInput = facts["text-input"];
    expect(textInput.react.implementationFiles.map((file) => file.path)).toContain("components/ui/TextInputControl.tsx");
    expect(textInput.react.publicExports.values).not.toContain("TextInputControl");
    expect(Object.keys(textInput.react.publicExportsByFile)).not.toContain("components/ui/TextInputControl.tsx");
  });

  it("reports names a source file exports that the public barrel does not", () => {
    const files = {
      "components/ui/index.ts": 'export { Thing } from "@/components/ui/Thing";\nexport type { ThingProps } from "@/components/ui/Thing";\n',
      "components/ui/Thing.tsx": "export function Thing() { return null; }\nexport type ThingProps = {};\nexport function useThingInternals() { return 1; }\nexport type ThingInternal = {};\n",
    };
    const read = memoryReader(files);
    const barrel = readPublicBarrel(read);
    expect(barrel.get("components/ui/Thing.tsx")).toEqual({ values: ["Thing"], types: ["ThingProps"] });
    const declared = readDeclaredExports("components/ui/Thing.tsx", files["components/ui/Thing.tsx"]);
    expect(declared.values).toEqual(["Thing", "useThingInternals"]);
    expect(declared.types).toEqual(["ThingInternal", "ThingProps"]);

    const base = componentRegistry.find((entry) => entry.slug === "button")!;
    const registry = [{ ...base, files: ["components/ui/Thing.tsx"], internalDependencies: [] }];
    const result = collectRepoFacts({ repoRoot: root, slug: "button", git, guardEvaluations: [], read, registry });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.facts.react.notInPublicBarrel).toEqual({ values: ["useThingInternals"], types: ["ThingInternal"] });
      expect(result.facts.react.publicExports).toEqual({ values: ["Thing"], types: ["ThingProps"] });
    }
  });

  it("keeps documented API names separate from actual exports and never invents props from free-form names", () => {
    const free = facts.dialog.registry.documentedApiProperties.filter((prop) => prop.nameKind === "free-form").map((prop) => prop.name);
    expect(free).toEqual(expect.arrayContaining(["DialogBody children", "DialogFooter children"]));
    expect(classifyApiName("MenuItem.onSelect")).toBe("free-form");
    expect(classifyApiName("useDataTableSort(options)")).toBe("free-form");
    expect(classifyApiName("DialogBody children")).toBe("free-form");
    expect(classifyApiName("variant")).toBe("identifier");
    expect(classifyApiName("aria-label")).toBe("identifier");
    expect(classifyApiName("@@weird")).toBe("unknown-structure");
    // Documented names are copied verbatim — nothing was split or normalized into a prop.
    expect(free).toContain("DialogBody children");
    expect(facts.dialog.registry.documentedApiProperties.some((prop) => prop.name === "children")).toBe(false);
  });

  it("keeps stale registry prose as evidence instead of cleaning it up", () => {
    const entry = componentRegistry.find((candidate) => candidate.slug === "dialog")!;
    expect(facts.dialog.registry.figmaReference).toBe(entry.figmaReference);
  });
});

describe("AG-1C repo facts — import graph", () => {
  it("terminates on import cycles and visits each file once", () => {
    const read = memoryReader({
      "components/ui/A.tsx": 'import { b } from "@/components/ui/B";\nexport const a = b;',
      "components/ui/B.tsx": 'import { a } from "./A";\nexport const b = a;',
    });
    const graph = walkImplementationGraph({ files: ["components/ui/A.tsx"], internalDependencies: [], read });
    expect(graph.implementationFiles.map((file) => file.path)).toEqual(["components/ui/A.tsx", "components/ui/B.tsx"]);
    expect(graph.unresolved).toEqual([]);
  });

  it("records unresolved imports explicitly and does not silently drop them", () => {
    const read = memoryReader({ "components/ui/A.tsx": 'import "@/components/ui/Missing";\nimport x from "react";\nexport const a = 1;' });
    const graph = walkImplementationGraph({ files: ["components/ui/A.tsx"], internalDependencies: [], read });
    expect(graph.unresolved).toHaveLength(1);
    expect(graph.unresolved[0]).toMatchObject({ from: "components/ui/A.tsx", specifier: "@/components/ui/Missing" });
    const statuses = graph.directImports.map((fact) => [fact.specifier, fact.status]);
    expect(statuses).toEqual(expect.arrayContaining([["@/components/ui/Missing", "unresolved"], ["react", "external"]]));
  });

  it("never traverses the public barrel or generated, build and dependency output", () => {
    const read = memoryReader({
      "components/ui/index.ts": "export const all = 1;",
      "components/ui/A.tsx": 'import "@/components/ui";\nimport "../../public/r/x";\nexport const a = 1;',
      "public/r/x.ts": "export const x = 1;",
    });
    const graph = walkImplementationGraph({ files: ["components/ui/A.tsx"], internalDependencies: [], read });
    expect(graph.implementationFiles.map((file) => file.path)).toEqual(["components/ui/A.tsx"]);
    expect(graph.directImports.map((fact) => fact.status)).toEqual(["skipped", "skipped"]);
    expect(resolveLocalSpecifier("components/ui/A.tsx", "@/components/ui", read)).toMatchObject({ status: "skipped" });
  });

  it("classifies own, internal and reachable files and keeps the first importer", () => {
    const read = memoryReader({
      "components/ui/A.tsx": 'import "@/lib/helper";\nimport "@/components/ui/Other";\nimport s from "./a.module.css";',
      "lib/helper.ts": "export const h = 1;",
      "components/ui/Other.tsx": 'import "./other.module.css";\nexport const o = 1;',
      "components/ui/a.module.css": ".a { color: var(--x); }",
      "components/ui/other.module.css": ".o { color: var(--y); }",
    });
    const graph = walkImplementationGraph({ files: ["components/ui/A.tsx", "components/ui/a.module.css"], internalDependencies: ["lib/helper.ts"], read });
    const byPath = Object.fromEntries([...graph.implementationFiles, ...graph.cssFiles].map((file) => [file.path, file]));
    expect(byPath["components/ui/A.tsx"].origin).toBe("own");
    expect(byPath["lib/helper.ts"].origin).toBe("internal");
    expect(byPath["components/ui/Other.tsx"]).toMatchObject({ origin: "reachable", reachedFrom: "components/ui/A.tsx" });
    expect(byPath["components/ui/other.module.css"]).toMatchObject({ origin: "reachable", reachedFrom: "components/ui/Other.tsx" });
    expect(byPath["components/ui/a.module.css"].origin).toBe("own");
  });
});

describe("AG-1C repo facts — CSS and token evidence", () => {
  it("collects own CSS custom properties with their source files", () => {
    const button = facts.button;
    const used = button.css.customPropertiesUsed;
    expect(used.length).toBeGreaterThan(10);
    expect(used.every((use) => use.usedIn.every((source) => source.file.endsWith(".css")))).toBe(true);
    expect(used.some((use) => use.usedIn.some((source) => source.origin === "own"))).toBe(true);
  });

  it("collects CSS reached through internal implementation dependencies (registry cssTokens misses it)", () => {
    const alert = facts.alert;
    expect(alert.registry.files.some((file) => file.endsWith(".css"))).toBe(false);
    expect(alert.registry.cssTokens).toEqual([]);
    const surface = alert.css.files.find((file) => file.path === "components/ui/internal/feedback-surface.module.css");
    expect(surface?.origin).toBe("internal");
    expect(alert.css.customPropertiesUsed.length).toBeGreaterThan(0);
    expect(alert.css.customPropertiesUsed.every((use) => use.usedIn.every((source) => source.origin === "internal"))).toBe(true);
  });

  it("reaches CSS of composed components as `reachable`, distinct from own and internal", () => {
    const origins = new Set(facts["chart-card"].css.files.map((file) => file.origin));
    expect(origins.has("own")).toBe(true);
    expect(origins.has("reachable")).toBe(true);
  });

  it("keeps registry tokensUsed, registry cssTokens and observed CSS usage as three separate domains", () => {
    const alert = facts.alert;
    expect(alert.tokens.figmaNamedDependencies).toEqual(alert.registry.tokensUsed);
    expect(alert.tokens.declaredCssTokens).toEqual(alert.registry.cssTokens);
    expect(alert.registry.tokensUsed.length).toBeGreaterThan(0);
    expect(alert.registry.cssTokens.length).toBe(0);
    expect(alert.css.customPropertiesUsed.length).toBeGreaterThan(0);
    expect(alert.registry.tokensUsed.every((token) => !token.startsWith("--"))).toBe(true);
  });

  it("looks custom properties up in styles/tokens.css with file and line", () => {
    const declaration = facts.button.tokens.runtimeDeclarations.find((token) => token.name === "--control-height-md");
    expect(declaration?.resolution).toBe("declared");
    expect(declaration?.declarations[0]).toMatchObject({ file: "styles/tokens.css", context: ":root" });
    expect(declaration?.declarations[0].line).toBeGreaterThan(0);
    expect(facts.button.tokens.unresolved).toEqual([]);
  });

  it("extracts inline, preceding-comment and section parity labels without turning them into statuses", () => {
    const css = [
      ":root {",
      "  /* ── Section A [TEMPORARY] ── */",
      "  --a: 1px;",
      "  --b: 2px; /* explicit [VERIFIED] note */",
      "  /* [EXPERIMENTAL] reason above */",
      "  --c: var(--a);",
      "  /* ── Section B ── */",
      "  --d: 4px;",
      "}",
      '[data-mode="x"] {',
      "  --a: 9px; /* [ALIASED] */",
      "}",
    ].join("\n");
    const declarations = readCssCustomPropertyDeclarations(css);
    const by = (name: string, context?: string) => declarations.find((d) => d.name === name && (!context || d.context === context))!;
    expect(by("--a", ":root")).toMatchObject({ parityLabel: "TEMPORARY", labelSource: "section", value: "1px" });
    expect(by("--b")).toMatchObject({ parityLabel: "VERIFIED", labelSource: "inline" });
    expect(by("--c")).toMatchObject({ parityLabel: "EXPERIMENTAL", labelSource: "preceding-comment", aliasTarget: "--a" });
    expect(by("--d").parityLabel).toBeUndefined();
    expect(by("--a", '[data-mode="x"]')).toMatchObject({ parityLabel: "ALIASED", labelSource: "inline" });
    expect(declarations.every((d) => !("status" in d))).toBe(true);
  });

  it("captures parity labels from the real token source for observed properties, including section-level labels", () => {
    const labelled = facts.alert.tokens.runtimeDeclarations.flatMap((token) => token.declarations).filter((d) => d.parityLabel);
    expect(labelled.length).toBeGreaterThan(0);
    const sources = new Set(facts.button.tokens.runtimeDeclarations.flatMap((token) => token.declarations).map((d) => d.labelSource));
    expect(sources.has("section")).toBe(true);
    expect(sources.has("inline") || sources.has("preceding-comment")).toBe(true);
  });

  it("follows exact var() aliases shallowly and reports unresolved properties", () => {
    const tokens = new Map<string, RuntimeDeclaration[]>([
      ["--x", [{ file: "t.css", line: 1, context: ":root", value: "var(--y)", aliasTarget: "--y" }]],
      ["--y", [{ file: "t.css", line: 2, context: ":root", value: "12px" }]],
      ["--loop-a", [{ file: "t.css", line: 3, context: ":root", value: "var(--loop-b)", aliasTarget: "--loop-b" }]],
      ["--loop-b", [{ file: "t.css", line: 4, context: ":root", value: "var(--loop-a)", aliasTarget: "--loop-a" }]],
    ]);
    const none = new Map<string, RuntimeDeclaration[]>();
    expect(resolveToken("--x", tokens, none)).toMatchObject({ resolution: "declared", chainEnd: "literal", aliasChain: [{ name: "--x", value: "var(--y)" }, { name: "--y", value: "12px" }] });
    expect(resolveToken("--loop-a", tokens, none).chainEnd).toBe("cycle");
    expect(resolveToken("--missing", tokens, none)).toMatchObject({ resolution: "unresolved", chainEnd: "none", declarations: [] });
    expect(readCssVarReferences(".a { color: var(--b); margin: var( --a , 1px); }")).toEqual(["--a", "--b"]);
  });

  it("exposes Alert's radius chain and parity-labelled mode declarations for later comparison", () => {
    const alert = facts.alert;
    const radiusUse = alert.css.customPropertiesUsed.find((use) => use.name === "--feedback-radius");
    expect(radiusUse?.usedIn[0]).toMatchObject({ file: "components/ui/internal/feedback-surface.module.css", origin: "internal" });
    expect(alert.registry.tokensUsed).toContain("component/radius/container");

    const resolved = alert.tokens.runtimeDeclarations.find((token) => token.name === "--feedback-radius")!;
    expect(resolved.resolution).toBe("declared");
    expect(resolved.aliasChain.length).toBeGreaterThanOrEqual(2);
    expect(resolved.aliasChain.map((hop) => hop.name)).toContain("--shape-radius-container");
    expect(resolved.chainEnd).toBe("literal");
    // The radius token Alert consumes carries its acknowledged-gap label as evidence (not an audit status).
    expect(resolved.declarations[0].parityLabel).toBeTruthy();
    expect(resolved.declarations[0].file).toBe("styles/tokens.css");

    const radiusDeclarations = alert.tokens.runtimeDeclarations.filter((token) => token.name.includes("radius")).flatMap((token) => token.declarations);
    expect(radiusDeclarations.some((declaration) => declaration.file === "styles/tokens.css")).toBe(true);
    expect(radiusDeclarations.some((declaration) => declaration.parityLabel)).toBe(true);
  });
});

describe("AG-1C repo facts — Guard", () => {
  const evaluation = (partial: Record<string, unknown>) => partial as unknown as RuleEvaluation;

  it("filters evaluations to the requested slug and keeps every state", () => {
    const synthetic: RuleEvaluation[] = [
      evaluation({ status: "pass", ruleId: "token/undeclared-css-var", subject: { kind: "component", id: "button" } }),
      evaluation({ status: "pass", ruleId: "token/undeclared-css-var", subject: { kind: "component", id: "card" } }),
      evaluation({ status: "not-applicable", ruleId: "token/undeclared-css-var", reason: '"button" owns no CSS files.' }),
      evaluation({ status: "not-applicable", ruleId: "token/undeclared-css-var", reason: '"card" owns no CSS files.' }),
      evaluation({
        status: "violation",
        finding: {
          ruleId: "token/undeclared-css-var",
          severity: "error",
          subject: { kind: "token", id: "--x" },
          canonicalEvidence: 'a.css: references var(--x); "button"\'s cssTokens does not list it',
          details: 'missing for "button"',
        },
      }),
      evaluation({ status: "pass", ruleId: "distribution/hostrequirements-leak", subject: { kind: "manifest", id: "button.json" } }),
      evaluation({ status: "pass", ruleId: "distribution/hosthost-schema-consistency", subject: { kind: "contract", id: "card.json" } }),
    ];
    const filtered = filterGuardEvaluationsForSlug(synthetic, "button");
    expect(filtered.map((fact) => fact.status).sort()).toEqual(["not-applicable", "pass", "pass", "violation"]);
    expect(filtered.find((fact) => fact.status === "violation")?.attribution).toBe("evidence-text");
    expect(filtered.find((fact) => fact.subject?.id === "button.json")?.attribution).toBe("subject");
    expect(filtered.every((fact) => !JSON.stringify(fact).includes("card"))).toBe(true);
  });

  it("preserves Guard `unknown` as unknown and never converts it to a failure", () => {
    const filtered = filterGuardEvaluationsForSlug(
      [evaluation({ status: "unknown", ruleId: "token/undeclared-css-var", subject: { kind: "component", id: "button" }, reason: "could not read file" })],
      "button",
    );
    expect(filtered).toEqual([
      { ruleId: "token/undeclared-css-var", status: "unknown", subject: { kind: "component", id: "button" }, reason: "could not read file", attribution: "subject" },
    ]);
    const result = collect("button", {
      guardEvaluations: [evaluation({ status: "unknown", ruleId: "token/undeclared-css-var", subject: { kind: "component", id: "button" }, reason: "x" })],
    });
    expect(result.ok && result.facts.guard.summary).toEqual({ violation: 0, pass: 0, notApplicable: 0, unknown: 1 });
  });

  it("runs real internal rules for every pilot and records the evidence SHA", () => {
    for (const slug of PILOTS) {
      const guard = facts[slug].guard;
      expect(guard.evidenceSourceGitSha).toBe(facts[slug].provenance.gitSha);
      expect(guard.rulesEvaluated.length).toBeGreaterThan(0);
      expect(guard.evaluations.length).toBeGreaterThan(0);
      expect(guard.evaluations.every((fact) => fact.attribution === "subject" || fact.attribution === "evidence-text")).toBe(true);
    }
    expect(facts.alert.guard.evaluations.some((fact) => fact.status === "not-applicable")).toBe(true);
  });
});

describe("AG-1C repo facts — boundaries and determinism", () => {
  it("serializes byte-identically for the same slug at the same SHA", () => {
    for (const slug of PILOTS) {
      const again = collect(slug);
      expect(again.ok).toBe(true);
      if (again.ok) expect(serializeRepoFacts(again.facts)).toBe(serializeRepoFacts(facts[slug]));
    }
  });

  it("serializes with sorted keys and is JSON-round-trippable", () => {
    const text = serializeRepoFacts(facts.button);
    expect(JSON.parse(text)).toEqual(JSON.parse(JSON.stringify(facts.button)));
    expect(Object.keys(JSON.parse(text))).toEqual([...Object.keys(JSON.parse(text))].sort((a, b) => a.localeCompare(b)));
  });

  it("contains no Figma snapshot facts, comparison results or model prose", () => {
    for (const slug of PILOTS) {
      expect(Object.keys(facts[slug]).sort()).toEqual(["component", "contract", "css", "guard", "provenance", "react", "registry", "schemaVersion", "tokens"]);
      const text = JSON.stringify(facts[slug]);
      expect(text).not.toContain("agent/figma-snapshots");
      expect(text).not.toContain("capturedAt");
      expect(text).not.toMatch(/"observed"|"variableBindings"|"componentProperties"/);
    }
  });

  it("makes no repository change while collecting", () => {
    const porcelain = () => execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, encoding: "utf8" });
    const before = porcelain();
    for (const slug of PILOTS) collect(slug);
    expect(porcelain()).toBe(before);
  });
});
