import type { ComponentAgentContract } from "@/lib/agent-kit/contract-schema";
import { isDistributedViaSkrewwwRegistry } from "@/lib/agent-kit/project-context";
import {
  CANONICAL_EVAL_SUITE_VERSION,
  EVAL_SCORE_WEIGHTS,
  EVAL_SCORER_VERSION,
} from "@/lib/agent-kit/evaluation-schema";
import type {
  AuthoredEvalCase,
  EvalAgentDeclaration,
  EvalCaseScore,
  EvalCondition,
  EvalConditionSummary,
  EvalHardError,
  EvalPairedReport,
} from "@/lib/agent-kit/evaluation-schema";

export class EvaluationScorerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationScorerError";
  }
}

function emptyCounts(): EvalCaseScore["counts"] {
  return {
    inventedComponents: 0,
    inventedApis: 0,
    installabilityErrors: 0,
    maturityErrors: 0,
    contextErrors: 0,
    authorityErrors: 0,
    accessibilityFailures: 0,
    forbiddenClaims: 0,
    missingRequiredComponents: 0,
  };
}

function applyPenalty(score: number, amount: number): number {
  return Math.max(0, score - amount);
}

/**
 * Parse the model output into a declaration.
 * Accepts either a bare JSON object or a fenced ```json block.
 */
export function parseEvalDeclaration(raw: string): EvalAgentDeclaration | null {
  const trimmed = raw.trim();
  let jsonText = trimmed;
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    jsonText = fence[1].trim();
  } else {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      jsonText = trimmed.slice(start, end + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<EvalAgentDeclaration>;
    if (!Array.isArray(parsed.componentSlugs)) return null;
    if (!Array.isArray(parsed.apiReferences)) return null;
    if (!Array.isArray(parsed.installCommands)) return null;
    if (!Array.isArray(parsed.maturityClaims)) return null;
    if (parsed.shapeMode === undefined || parsed.surfaceMode === undefined) return null;
    if (parsed.skrewwwRegistryConfigured === undefined) return null;
    return {
      componentSlugs: parsed.componentSlugs.map(String),
      apiReferences: parsed.apiReferences.map((ref) => ({
        component: String(ref.component),
        property: String(ref.property),
        ...(ref.value !== undefined ? { value: String(ref.value) } : {}),
      })),
      installCommands: parsed.installCommands.map(String),
      maturityClaims: parsed.maturityClaims.map((claim) => ({
        component: String(claim.component),
        status: String(claim.status),
      })),
      shapeMode: parsed.shapeMode as EvalAgentDeclaration["shapeMode"],
      surfaceMode: parsed.surfaceMode as EvalAgentDeclaration["surfaceMode"],
      skrewwwRegistryConfigured: parsed.skrewwwRegistryConfigured as
        | boolean
        | "unknown",
      recipeIdsUsed: Array.isArray(parsed.recipeIdsUsed)
        ? parsed.recipeIdsUsed.map(String)
        : [],
      accessibilityFacts: Array.isArray(parsed.accessibilityFacts)
        ? parsed.accessibilityFacts.map(String)
        : [],
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.map(String) : [],
      unresolvedGaps: Array.isArray(parsed.unresolvedGaps)
        ? parsed.unresolvedGaps.map(String)
        : [],
      implementation: typeof parsed.implementation === "string" ? parsed.implementation : "",
    };
  } catch {
    return null;
  }
}

function contractMap(contracts: readonly ComponentAgentContract[]): Map<string, ComponentAgentContract> {
  return new Map(contracts.map((c) => [c.slug, c]));
}

function normalizeFact(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Pure deterministic scorer: same case + contracts + declaration → same score.
 */
export function scoreEvalCase(options: {
  evalCase: AuthoredEvalCase;
  condition: EvalCondition;
  rawOutput: string;
  contracts: readonly ComponentAgentContract[];
}): EvalCaseScore {
  const { evalCase, condition, rawOutput, contracts } = options;
  const bySlug = contractMap(contracts);
  const hardErrors: EvalHardError[] = [];
  const counts = emptyCounts();
  let aggregateScore: number = EVAL_SCORE_WEIGHTS.startingScore;

  const declaration = parseEvalDeclaration(rawOutput);
  if (!declaration) {
    hardErrors.push({ kind: "malformed_output", detail: "Could not parse EvalAgentDeclaration JSON" });
    counts.inventedComponents = 0;
    return {
      caseId: evalCase.id,
      condition,
      parseSuccess: false,
      aggregateScore: applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.malformedOutput),
      hardErrors,
      counts,
    };
  }

  // Invented components
  for (const slug of declaration.componentSlugs) {
    const normalized = slug.trim().toLowerCase();
    if (!bySlug.has(normalized)) {
      hardErrors.push({
        kind: "invented_component",
        detail: `Claimed nonexistent component slug "${slug}"`,
      });
      counts.inventedComponents += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.inventedComponent);
    }
  }
  for (const forbidden of evalCase.forbiddenComponentSlugs ?? []) {
    if (declaration.componentSlugs.some((s) => s.toLowerCase() === forbidden.toLowerCase())) {
      hardErrors.push({
        kind: "invented_component",
        detail: `Claimed forbidden/non-canonical component "${forbidden}"`,
      });
      counts.inventedComponents += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.inventedComponent);
    }
  }

  // Missing required components
  for (const required of evalCase.requiredComponentSlugs ?? []) {
    if (!declaration.componentSlugs.map((s) => s.toLowerCase()).includes(required.toLowerCase())) {
      hardErrors.push({
        kind: "missing_required_component",
        detail: `Missing required component "${required}"`,
      });
      counts.missingRequiredComponents += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.missingRequiredComponent);
    }
  }

  // Invented / forbidden APIs
  for (const ref of declaration.apiReferences) {
    const contract = bySlug.get(ref.component);
    if (!contract) {
      hardErrors.push({
        kind: "invented_api",
        detail: `API reference on unknown component "${ref.component}.${ref.property}"`,
      });
      counts.inventedApis += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.inventedApi);
      continue;
    }
    const propNames = contract.api.properties.map((p) => p.name);
    if (!propNames.includes(ref.property)) {
      hardErrors.push({
        kind: "invented_api",
        detail: `Invented property "${ref.component}.${ref.property}"`,
      });
      counts.inventedApis += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.inventedApi);
      if (evalCase.enforceContractOverRecipe) {
        hardErrors.push({
          kind: "authority_error",
          detail: `Used non-contractual API "${ref.component}.${ref.property}" despite contract-over-recipe rule`,
        });
        counts.authorityErrors += 1;
        aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.authorityError);
      }
      continue;
    }
    if (ref.value !== undefined) {
      const allowed = new Set([...contract.api.variants, ...contract.api.sizes]);
      // Enumerated visual fields only — free-form string props (title, label, …)
      // may carry values without being variant/size tokens.
      const enumerates =
        ref.property === "variant" ||
        ref.property === "size" ||
        ref.property === "type" ||
        ref.property === "shape";
      if (enumerates && !allowed.has(ref.value)) {
        hardErrors.push({
          kind: "invented_api",
          detail: `Invented value "${ref.value}" for "${ref.component}.${ref.property}"`,
        });
        counts.inventedApis += 1;
        aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.inventedApi);
      }
    }
  }

  for (const forbidden of evalCase.forbiddenApiReferences ?? []) {
    const hit = declaration.apiReferences.some((ref) => {
      if (ref.component !== forbidden.component || ref.property !== forbidden.property) return false;
      if (forbidden.value === undefined) return true;
      return ref.value === forbidden.value;
    });
    if (hit) {
      hardErrors.push({
        kind: "invented_api",
        detail: `Used forbidden API ${forbidden.component}.${forbidden.property}` +
          (forbidden.value ? `=${forbidden.value}` : ""),
      });
      counts.inventedApis += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.inventedApi);
      if (evalCase.enforceContractOverRecipe) {
        hardErrors.push({
          kind: "authority_error",
          detail: `Forbidden API used under recipe-conflict case`,
        });
        counts.authorityErrors += 1;
        aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.authorityError);
      }
    }
  }

  // Installability — only score @skrewww shadcn add commands
  const installPattern = /^npx\s+shadcn(?:@[\w.-]+)?\s+add\s+@skrewww\/([a-z0-9-]+)\s*$/i;
  for (const command of declaration.installCommands) {
    const match = command.trim().match(installPattern);
    if (!match) continue;
    const slug = match[1];
    const distributed = isDistributedViaSkrewwwRegistry(slug);
    const normalized = `npx shadcn add @skrewww/${slug}`;

    if (!evalCase.forbidInventedInstallCommands) continue;

    if (!distributed) {
      hardErrors.push({
        kind: "installability_error",
        detail: `Invented install command for non-distributed "${slug}": "${command}"`,
      });
      counts.installabilityErrors += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.installabilityError);
      continue;
    }

    if (evalCase.allowedInstallCommands) {
      const allowedNormalized = evalCase.allowedInstallCommands.map((c) =>
        c.replace(/\s+/g, " ").trim().replace(/shadcn@[\w.-]+/g, "shadcn"),
      );
      if (allowedNormalized.length === 0) {
        hardErrors.push({
          kind: "installability_error",
          detail: `Install command not allowed for this case: "${command}"`,
        });
        counts.installabilityErrors += 1;
        aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.installabilityError);
      } else if (!allowedNormalized.includes(normalized)) {
        hardErrors.push({
          kind: "installability_error",
          detail: `Install command not in allowed set: "${command}"`,
        });
        counts.installabilityErrors += 1;
        aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.installabilityError);
      }
    }
  }

  // Maturity
  for (const expected of evalCase.expectedMaturityClaims ?? []) {
    const claim = declaration.maturityClaims.find(
      (c) => c.component.toLowerCase() === expected.component.toLowerCase(),
    );
    if (!claim) {
      hardErrors.push({
        kind: "maturity_error",
        detail: `Missing maturity claim for "${expected.component}" (expected ${expected.status})`,
      });
      counts.maturityErrors += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.maturityError);
    } else if (claim.status.toLowerCase() !== expected.status) {
      hardErrors.push({
        kind: "maturity_error",
        detail: `Wrong maturity for "${expected.component}": got ${claim.status}, expected ${expected.status}`,
      });
      counts.maturityErrors += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.maturityError);
    }
  }
  for (const claim of declaration.maturityClaims) {
    const contract = bySlug.get(claim.component);
    if (!contract) continue;
    if (claim.status.toLowerCase() !== contract.status) {
      hardErrors.push({
        kind: "maturity_error",
        detail: `Maturity claim "${claim.component}:${claim.status}" disagrees with contract (${contract.status})`,
      });
      counts.maturityErrors += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.maturityError);
    }
  }

  // Project context
  const ctx = evalCase.projectContext;
  if (ctx) {
    if (ctx.shapeMode !== undefined && declaration.shapeMode !== ctx.shapeMode) {
      hardErrors.push({
        kind: "context_error",
        detail: `shapeMode declared "${declaration.shapeMode}", expected "${ctx.shapeMode}"`,
      });
      counts.contextErrors += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.contextError);
    }
    if (ctx.surfaceMode !== undefined && declaration.surfaceMode !== ctx.surfaceMode) {
      hardErrors.push({
        kind: "context_error",
        detail: `surfaceMode declared "${declaration.surfaceMode}", expected "${ctx.surfaceMode}"`,
      });
      counts.contextErrors += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.contextError);
    }
    if (
      ctx.skrewwwRegistryConfigured !== undefined &&
      declaration.skrewwwRegistryConfigured !== ctx.skrewwwRegistryConfigured
    ) {
      hardErrors.push({
        kind: "context_error",
        detail: `skrewwwRegistryConfigured declared ${JSON.stringify(declaration.skrewwwRegistryConfigured)}, expected ${JSON.stringify(ctx.skrewwwRegistryConfigured)}`,
      });
      counts.contextErrors += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.contextError);
    }
  }

  // Accessibility facts (normalized substring containment)
  for (const required of evalCase.requiredAccessibilityFacts ?? []) {
    const needle = normalizeFact(required);
    const found = declaration.accessibilityFacts.some((fact) => normalizeFact(fact).includes(needle) || needle.includes(normalizeFact(fact)));
    if (!found) {
      hardErrors.push({
        kind: "accessibility_failure",
        detail: `Missing accessibility fact: "${required}"`,
      });
      counts.accessibilityFailures += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.accessibilityFailure);
    }
  }

  // Forbidden claims — only count usages/assertions, not rejection notes.
  // Mentions inside unresolvedGaps/assumptions (e.g. "README invented glowIntensity;
  // ignored") must NOT count as claiming the invalid API is real.
  const usageBlob = JSON.stringify({
    componentSlugs: declaration.componentSlugs,
    apiReferences: declaration.apiReferences,
    installCommands: declaration.installCommands,
    maturityClaims: declaration.maturityClaims,
    recipeIdsUsed: declaration.recipeIdsUsed,
    implementation: declaration.implementation,
  });
  for (const claim of evalCase.forbiddenClaims ?? []) {
    if (usageBlob.toLowerCase().includes(claim.toLowerCase())) {
      hardErrors.push({
        kind: "forbidden_claim",
        detail: `Forbidden claim present in usage/assertion fields: "${claim}"`,
      });
      counts.forbiddenClaims += 1;
      aggregateScore = applyPenalty(aggregateScore, EVAL_SCORE_WEIGHTS.forbiddenClaim);
    }
  }

  return {
    caseId: evalCase.id,
    condition,
    parseSuccess: true,
    aggregateScore,
    hardErrors,
    counts,
  };
}

export function summarizeCondition(
  condition: EvalCondition,
  scores: readonly EvalCaseScore[],
): EvalConditionSummary {
  const filtered = scores.filter((s) => s.condition === condition);
  const sum = (pick: (s: EvalCaseScore) => number) => filtered.reduce((acc, s) => acc + pick(s), 0);
  const totalHardErrors = filtered.reduce((acc, s) => acc + s.hardErrors.length, 0);
  const meanAggregateScore =
    filtered.length === 0
      ? 0
      : filtered.reduce((acc, s) => acc + s.aggregateScore, 0) / filtered.length;

  return {
    condition,
    totalCases: filtered.length,
    parseSuccessCount: filtered.filter((s) => s.parseSuccess).length,
    inventedComponents: sum((s) => s.counts.inventedComponents),
    inventedApis: sum((s) => s.counts.inventedApis),
    installabilityErrors: sum((s) => s.counts.installabilityErrors),
    maturityErrors: sum((s) => s.counts.maturityErrors),
    contextErrors: sum((s) => s.counts.contextErrors),
    authorityErrors: sum((s) => s.counts.authorityErrors),
    accessibilityFailures: sum((s) => s.counts.accessibilityFailures),
    forbiddenClaims: sum((s) => s.counts.forbiddenClaims),
    missingRequiredComponents: sum((s) => s.counts.missingRequiredComponents),
    totalHardErrors,
    meanAggregateScore: Number(meanAggregateScore.toFixed(2)),
  };
}

export function evaluateReleaseGate(off: EvalConditionSummary, on: EvalConditionSummary): {
  passed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (on.inventedComponents !== 0) reasons.push(`ON inventedComponents=${on.inventedComponents} (need 0)`);
  if (on.inventedApis !== 0) reasons.push(`ON inventedApis=${on.inventedApis} (need 0)`);
  if (on.installabilityErrors !== 0) reasons.push(`ON installabilityErrors=${on.installabilityErrors} (need 0)`);
  if (on.maturityErrors !== 0) reasons.push(`ON maturityErrors=${on.maturityErrors} (need 0)`);
  if (on.authorityErrors !== 0) reasons.push(`ON authorityErrors=${on.authorityErrors} (need 0)`);
  if (on.accessibilityFailures > off.accessibilityFailures) {
    reasons.push(
      `ON accessibilityFailures=${on.accessibilityFailures} worse than OFF=${off.accessibilityFailures}`,
    );
  }
  if (on.totalHardErrors >= off.totalHardErrors) {
    reasons.push(
      `ON totalHardErrors=${on.totalHardErrors} did not improve over OFF=${off.totalHardErrors}`,
    );
  }
  return { passed: reasons.length === 0, reasons };
}

export function buildPairedReport(options: {
  sourceGitSha: string;
  modelIdentifier: string;
  executionEnvironment: string;
  isolationNotes: string;
  caseScores: EvalCaseScore[];
}): EvalPairedReport {
  const off = summarizeCondition("off", options.caseScores);
  const on = summarizeCondition("on", options.caseScores);
  const releaseGate = evaluateReleaseGate(off, on);

  const deltas: Record<string, number> = {
    inventedComponents: on.inventedComponents - off.inventedComponents,
    inventedApis: on.inventedApis - off.inventedApis,
    installabilityErrors: on.installabilityErrors - off.installabilityErrors,
    maturityErrors: on.maturityErrors - off.maturityErrors,
    contextErrors: on.contextErrors - off.contextErrors,
    authorityErrors: on.authorityErrors - off.authorityErrors,
    accessibilityFailures: on.accessibilityFailures - off.accessibilityFailures,
    forbiddenClaims: on.forbiddenClaims - off.forbiddenClaims,
    missingRequiredComponents: on.missingRequiredComponents - off.missingRequiredComponents,
    totalHardErrors: on.totalHardErrors - off.totalHardErrors,
    meanAggregateScore: Number((on.meanAggregateScore - off.meanAggregateScore).toFixed(2)),
  };

  return {
    schemaVersion: "1.0.0",
    scorerVersion: EVAL_SCORER_VERSION,
    suiteVersion: CANONICAL_EVAL_SUITE_VERSION,
    sourceGitSha: options.sourceGitSha,
    modelIdentifier: options.modelIdentifier,
    executionEnvironment: options.executionEnvironment,
    isolationNotes: options.isolationNotes,
    off,
    on,
    deltas,
    caseScores: [...options.caseScores].sort((a, b) => {
      const byCase = a.caseId.localeCompare(b.caseId);
      if (byCase !== 0) return byCase;
      return a.condition.localeCompare(b.condition);
    }),
    releaseGate,
  };
}
