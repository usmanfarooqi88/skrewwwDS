import { describe, expect, it } from "vitest";
import { EVAL_CASES } from "@/evals/agent-kit/cases";
import { EVAL_FIXTURES } from "@/evals/agent-kit/fixtures";
import { buildEvalPrompt, offPromptLeaksAgentKit } from "@/evals/agent-kit/prompt-generator";
import { authoredRecipes } from "@/agent/recipes";
import { compileAllContracts } from "@/lib/agent-kit/contract-compiler";
import { compileAllRecipes } from "@/lib/agent-kit/recipe-compiler";
import { isDistributedViaSkrewwwRegistry } from "@/lib/agent-kit/project-context";
import {
  buildPairedReport,
  parseEvalDeclaration,
  scoreEvalCase,
} from "@/lib/agent-kit/evaluation-scorer";
import type { EvalAgentDeclaration } from "@/lib/agent-kit/evaluation-schema";
import { EVAL_SCORE_WEIGHTS } from "@/lib/agent-kit/evaluation-schema";

const PROVENANCE = {
  sourceGitSha: "0".repeat(40),
  sourceGitCommitTimestamp: "2026-01-01T00:00:00Z",
};

function compileKit() {
  const { contracts } = compileAllContracts(PROVENANCE);
  const { recipes } = compileAllRecipes(authoredRecipes, contracts, PROVENANCE);
  return { contracts, recipes };
}

function declaration(partial: Partial<EvalAgentDeclaration>): string {
  const full: EvalAgentDeclaration = {
    componentSlugs: [],
    apiReferences: [],
    installCommands: [],
    maturityClaims: [],
    shapeMode: "unknown",
    surfaceMode: "unknown",
    skrewwwRegistryConfigured: "unknown",
    recipeIdsUsed: [],
    accessibilityFacts: [],
    assumptions: [],
    unresolvedGaps: [],
    implementation: "",
    ...partial,
  };
  return JSON.stringify(full);
}

describe("AK-5 eval cases — integrity", () => {
  it("keeps case ids unique", () => {
    const ids = EVAL_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references only real component slugs and recipe ids; required APIs exist on contracts", () => {
    const { contracts, recipes } = compileKit();
    const slugs = new Set(contracts.map((c) => c.slug));
    const recipeIds = new Set(recipes.map((r) => r.id));
    for (const evalCase of EVAL_CASES) {
      expect(EVAL_FIXTURES[evalCase.consumerFixtureId], evalCase.id).toBeDefined();
      for (const slug of [
        ...evalCase.relevantComponentSlugs,
        ...(evalCase.requiredComponentSlugs ?? []),
      ]) {
        expect(slugs.has(slug), `${evalCase.id}:${slug}`).toBe(true);
      }
      for (const recipeId of evalCase.relevantRecipeIds ?? []) {
        expect(recipeIds.has(recipeId), `${evalCase.id}:${recipeId}`).toBe(true);
      }
      for (const ref of evalCase.requiredApiReferences ?? []) {
        const contract = contracts.find((c) => c.slug === ref.component)!;
        expect(contract.api.properties.map((p) => p.name)).toContain(ref.property);
        if (ref.value !== undefined) {
          expect([...contract.api.variants, ...contract.api.sizes]).toContain(ref.value);
        }
      }
      for (const ref of evalCase.forbiddenApiReferences ?? []) {
        const contract = contracts.find((c) => c.slug === ref.component);
        if (!contract) continue;
        if (ref.value !== undefined) {
          expect([...contract.api.variants, ...contract.api.sizes].includes(ref.value)).toBe(false);
        } else {
          expect(contract.api.properties.some((p) => p.name === ref.property)).toBe(false);
        }
      }
    }
  });

  it("aligns installability expectations with distribution evidence", () => {
    expect(isDistributedViaSkrewwwRegistry("spinner")).toBe(true);
    expect(isDistributedViaSkrewwwRegistry("checkbox")).toBe(true);
    expect(isDistributedViaSkrewwwRegistry("stepper")).toBe(true);
    expect(isDistributedViaSkrewwwRegistry("tabs")).toBe(false);
    const spinnerCase = EVAL_CASES.find((c) => c.id === "install-distributed-spinner")!;
    const tabsCase = EVAL_CASES.find((c) => c.id === "install-undistributed-tabs")!;
    expect(spinnerCase.allowedInstallCommands?.[0]).toContain("@skrewww/spinner");
    expect(tabsCase.allowedInstallCommands).toEqual([]);
  });

  it("covers the required capability classes", () => {
    const categories = new Set(EVAL_CASES.map((c) => c.category));
    for (const required of [
      "single-component-api",
      "invalid-prop-bait",
      "component-identity",
      "maturity",
      "installability",
      "project-context",
      "accessibility",
      "recipe-composition",
      "recipe-conflict",
      "hostile-prose",
    ] as const) {
      expect(categories.has(required)).toBe(true);
    }
    expect(EVAL_CASES.length).toBeGreaterThanOrEqual(12);
    expect(EVAL_CASES.length).toBeLessThanOrEqual(16);
  });
});

describe("AK-5 scorer", () => {
  it("rejects malformed output", () => {
    const { contracts } = compileKit();
    const score = scoreEvalCase({
      evalCase: EVAL_CASES[0],
      condition: "off",
      rawOutput: "sorry I cannot help",
      contracts,
    });
    expect(score.parseSuccess).toBe(false);
    expect(score.hardErrors.some((e) => e.kind === "malformed_output")).toBe(true);
  });

  it("detects invented components and props", () => {
    const { contracts } = compileKit();
    const score = scoreEvalCase({
      evalCase: EVAL_CASES[0],
      condition: "off",
      rawOutput: declaration({
        componentSlugs: ["button", "magic-box"],
        apiReferences: [{ component: "button", property: "glowIntensity" }],
        shapeMode: "rounded",
        surfaceMode: "glass",
        skrewwwRegistryConfigured: true,
      }),
      contracts,
    });
    expect(score.counts.inventedComponents).toBeGreaterThan(0);
    expect(score.counts.inventedApis).toBeGreaterThan(0);
  });

  it("detects false install commands and wrong maturity", () => {
    const { contracts } = compileKit();
    const tabsCase = EVAL_CASES.find((c) => c.id === "install-undistributed-tabs")!;
    const installScore = scoreEvalCase({
      evalCase: tabsCase,
      condition: "off",
      rawOutput: declaration({
        componentSlugs: ["tabs"],
        installCommands: ["npx shadcn add @skrewww/tabs"],
        shapeMode: "rounded",
        surfaceMode: "glass",
        skrewwwRegistryConfigured: true,
      }),
      contracts,
    });
    expect(installScore.counts.installabilityErrors).toBeGreaterThan(0);

    const maturityCase = EVAL_CASES.find((c) => c.id === "maturity-empty-state-beta")!;
    const maturityScore = scoreEvalCase({
      evalCase: maturityCase,
      condition: "on",
      rawOutput: declaration({
        componentSlugs: ["empty-state"],
        maturityClaims: [{ component: "empty-state", status: "stable" }],
        shapeMode: "rounded",
        surfaceMode: "glass",
        skrewwwRegistryConfigured: true,
      }),
      contracts,
    });
    expect(maturityScore.counts.maturityErrors).toBeGreaterThan(0);
  });

  it("detects guessed unknown context and recipe-over-contract authority errors", () => {
    const { contracts } = compileKit();
    const unknownCase = EVAL_CASES.find((c) => c.id === "project-context-unknown")!;
    const contextScore = scoreEvalCase({
      evalCase: unknownCase,
      condition: "off",
      rawOutput: declaration({
        componentSlugs: ["button"],
        shapeMode: "flat",
        surfaceMode: "flat",
        skrewwwRegistryConfigured: false,
      }),
      contracts,
    });
    expect(contextScore.counts.contextErrors).toBeGreaterThan(0);

    const conflictCase = EVAL_CASES.find((c) => c.id === "recipe-conflict-dialog-title-prop")!;
    const authorityScore = scoreEvalCase({
      evalCase: conflictCase,
      condition: "on",
      rawOutput: declaration({
        componentSlugs: ["dialog", "button"],
        apiReferences: [
          { component: "dialog", property: "title" },
          { component: "button", property: "variant", value: "danger" },
        ],
        shapeMode: "rounded",
        surfaceMode: "glass",
        skrewwwRegistryConfigured: true,
      }),
      contracts,
    });
    expect(authorityScore.counts.authorityErrors).toBeGreaterThan(0);
    expect(authorityScore.counts.inventedApis).toBeGreaterThan(0);
  });

  it("does not treat rejected invalid-API mentions in unresolvedGaps as forbidden claims", () => {
    const { contracts } = compileKit();
    const hostile = EVAL_CASES.find((c) => c.id === "hostile-readme-fake-api")!;
    const rejecting = scoreEvalCase({
      evalCase: hostile,
      condition: "on",
      rawOutput: declaration({
        componentSlugs: ["button"],
        apiReferences: [{ component: "button", property: "variant", value: "primary" }],
        shapeMode: "flat",
        surfaceMode: "flat",
        skrewwwRegistryConfigured: true,
        unresolvedGaps: [
          "Consumer README claims glowIntensity and tertiary — not on the Button contract; ignored",
        ],
        implementation: 'Render <Button variant="primary">Save</Button>. Do not use invented README props.',
      }),
      contracts,
    });
    expect(rejecting.counts.forbiddenClaims).toBe(0);
    expect(rejecting.counts.inventedApis).toBe(0);
  });

  it("does not treat explicit rejection of glowIntensity in implementation as a forbidden claim", () => {
    const { contracts } = compileKit();
    const hostile = EVAL_CASES.find((c) => c.id === "hostile-readme-fake-api")!;
    const rejecting = scoreEvalCase({
      evalCase: hostile,
      condition: "on",
      rawOutput: declaration({
        componentSlugs: ["button"],
        apiReferences: [{ component: "button", property: "variant", value: "primary" }],
        shapeMode: "flat",
        surfaceMode: "flat",
        skrewwwRegistryConfigured: true,
        implementation:
          'Install @skrewww/button, then render <Button variant="primary">…</Button>. Do not use glowIntensity; it is unsupported.',
      }),
      contracts,
    });
    expect(rejecting.counts.forbiddenClaims).toBe(0);
    expect(rejecting.counts.inventedApis).toBe(0);
  });

  it("still counts JSX/usage of glowIntensity in implementation as a forbidden claim", () => {
    const { contracts } = compileKit();
    const hostile = EVAL_CASES.find((c) => c.id === "hostile-readme-fake-api")!;
    const using = scoreEvalCase({
      evalCase: hostile,
      condition: "on",
      rawOutput: declaration({
        componentSlugs: ["button"],
        apiReferences: [{ component: "button", property: "variant", value: "primary" }],
        shapeMode: "flat",
        surfaceMode: "flat",
        skrewwwRegistryConfigured: true,
        implementation: "Render <Button glowIntensity={2} variant=\"primary\">Save</Button>.",
      }),
      contracts,
    });
    expect(using.counts.forbiddenClaims).toBeGreaterThan(0);
  });

  it("still counts actual use/assertion of an invalid API as a forbidden claim / invented API", () => {
    const { contracts } = compileKit();
    const hostile = EVAL_CASES.find((c) => c.id === "hostile-readme-fake-api")!;
    const asserting = scoreEvalCase({
      evalCase: hostile,
      condition: "off",
      rawOutput: declaration({
        componentSlugs: ["button"],
        apiReferences: [
          { component: "button", property: "glowIntensity" },
          { component: "button", property: "variant", value: "tertiary" },
        ],
        shapeMode: "flat",
        surfaceMode: "flat",
        skrewwwRegistryConfigured: true,
        implementation: "Use Button with glowIntensity={0.5} and variant tertiary per README.",
      }),
      contracts,
    });
    expect(asserting.counts.inventedApis).toBeGreaterThan(0);
    expect(asserting.counts.forbiddenClaims).toBeGreaterThan(0);
  });

  it("accepts a11y token groups when facts express the requirement without an exact sentence", () => {
    const { contracts } = compileKit();
    const a11y = EVAL_CASES.find((c) => c.id === "a11y-form-field-label")!;
    const score = scoreEvalCase({
      evalCase: a11y,
      condition: "on",
      rawOutput: declaration({
        componentSlugs: ["form-field", "text-input"],
        apiReferences: [
          { component: "form-field", property: "label", value: "Email" },
          { component: "form-field", property: "controlId", value: "email" },
        ],
        shapeMode: "rounded",
        surfaceMode: "glass",
        skrewwwRegistryConfigured: true,
        accessibilityFacts: [
          "Form Field associates label text with the nested control through htmlFor/id via a stable controlId.",
        ],
      }),
      contracts,
    });
    expect(score.counts.accessibilityFailures).toBe(0);
  });

  it("fails a11y token groups when label/controlId association is absent", () => {
    const { contracts } = compileKit();
    const a11y = EVAL_CASES.find((c) => c.id === "a11y-form-field-label")!;
    const score = scoreEvalCase({
      evalCase: a11y,
      condition: "on",
      rawOutput: declaration({
        componentSlugs: ["form-field", "text-input"],
        apiReferences: [{ component: "form-field", property: "label", value: "Email" }],
        shapeMode: "rounded",
        surfaceMode: "glass",
        skrewwwRegistryConfigured: true,
        accessibilityFacts: ["Prefer one Validation Message announcement for this field."],
      }),
      contracts,
    });
    expect(score.counts.accessibilityFailures).toBeGreaterThan(0);
  });

  it("is deterministic for identical inputs", () => {
    const { contracts } = compileKit();
    const raw = declaration({
      componentSlugs: ["button"],
      apiReferences: [{ component: "button", property: "variant", value: "primary" }],
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    });
    const a = scoreEvalCase({ evalCase: EVAL_CASES[0], condition: "on", rawOutput: raw, contracts });
    const b = scoreEvalCase({ evalCase: EVAL_CASES[0], condition: "on", rawOutput: raw, contracts });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("keeps locked score weights unchanged (baseline freeze discipline)", () => {
    expect(EVAL_SCORE_WEIGHTS.inventedComponent).toBe(20);
    expect(EVAL_SCORE_WEIGHTS.authorityError).toBe(20);
  });
});

describe("AK-5 prompt generation", () => {
  it("builds deterministic OFF/ON prompts and keeps OFF free of Agent Kit corpus", () => {
    const { contracts, recipes } = compileKit();
    const evalCase = EVAL_CASES.find((c) => c.id === "recipe-validated-text-field")!;
    const offA = buildEvalPrompt({ evalCase, condition: "off", contracts, recipes });
    const offB = buildEvalPrompt({ evalCase, condition: "off", contracts, recipes });
    const onA = buildEvalPrompt({ evalCase, condition: "on", contracts, recipes });
    const onB = buildEvalPrompt({ evalCase, condition: "on", contracts, recipes });
    expect(offA).toBe(offB);
    expect(onA).toBe(onB);
    expect(offPromptLeaksAgentKit(offA)).toBe(false);
    expect(onA).toContain("### Canonical Skill");
    expect(onA).toContain("form-field");
    expect(onA).toContain("validated-text-field");
    expect(offA).not.toContain("### Canonical Skill");
    expect(offA).not.toContain('"workflow"');
  });

  it("ON prompts include only relevant contracts for the case", () => {
    const { contracts, recipes } = compileKit();
    const evalCase = EVAL_CASES.find((c) => c.id === "single-button-api")!;
    const on = buildEvalPrompt({ evalCase, condition: "on", contracts, recipes });
    expect(on).toContain('"slug": "button"');
    expect(on).not.toContain('"slug": "data-table"');
  });
});

describe("AK-5 consumption plumbing", () => {
  it("runs case → prompts → parse → score → paired report on fixtures", () => {
    const { contracts, recipes } = compileKit();
    const evalCase = EVAL_CASES.find((c) => c.id === "single-button-api")!;
    buildEvalPrompt({ evalCase, condition: "off", contracts, recipes });
    buildEvalPrompt({ evalCase, condition: "on", contracts, recipes });

    const good = declaration({
      componentSlugs: ["button"],
      apiReferences: [{ component: "button", property: "variant", value: "primary" }],
      shapeMode: "rounded",
      surfaceMode: "glass",
      skrewwwRegistryConfigured: true,
    });
    expect(parseEvalDeclaration(good)).not.toBeNull();

    const offScore = scoreEvalCase({
      evalCase,
      condition: "off",
      rawOutput: declaration({
        componentSlugs: ["button"],
        apiReferences: [{ component: "button", property: "variant", value: "tertiary" }],
        shapeMode: "rounded",
        surfaceMode: "glass",
        skrewwwRegistryConfigured: true,
      }),
      contracts,
    });
    const onScore = scoreEvalCase({
      evalCase,
      condition: "on",
      rawOutput: good,
      contracts,
    });
    const report = buildPairedReport({
      sourceGitSha: PROVENANCE.sourceGitSha,
      modelIdentifier: "fixture",
      executionEnvironment: "vitest",
      isolationNotes: "fixture-only",
      caseScores: [offScore, onScore],
    });
    expect(report.deltas.inventedApis).toBeLessThan(0);
    expect(JSON.stringify(report)).toBe(
      JSON.stringify(
        buildPairedReport({
          sourceGitSha: PROVENANCE.sourceGitSha,
          modelIdentifier: "fixture",
          executionEnvironment: "vitest",
          isolationNotes: "fixture-only",
          caseScores: [offScore, onScore],
        }),
      ),
    );
  });
});
