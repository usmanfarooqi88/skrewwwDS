/**
 * AK-5 evaluation types — provider-neutral.
 * Scoring weights are locked here before any baseline OFF/ON run.
 * Do not retune weights after seeing ON results to make ON look better.
 */

export const CANONICAL_EVAL_SUITE_VERSION = "1.0.0";
export const EVAL_SCORER_VERSION = "1.0.0";

export type EvalCondition = "off" | "on";

export type EvalCaseCategory =
  | "single-component-api"
  | "invalid-prop-bait"
  | "component-identity"
  | "maturity"
  | "installability"
  | "project-context"
  | "accessibility"
  | "recipe-composition"
  | "recipe-conflict"
  | "hostile-prose";

/**
 * Locked point deductions for the aggregate convenience score.
 * Critical error *counts* are always reported separately and gate release.
 */
export const EVAL_SCORE_WEIGHTS = {
  startingScore: 100,
  malformedOutput: 25,
  inventedComponent: 20,
  inventedApi: 20,
  installabilityError: 15,
  maturityError: 15,
  contextError: 15,
  authorityError: 20,
  accessibilityFailure: 10,
  missingRequiredComponent: 10,
  forbiddenClaim: 15,
} as const;

export type EvalApiExpectation = {
  component: string;
  property: string;
  value?: string;
};

export type EvalProjectContextExpectation = {
  shapeMode?: string | "unknown";
  surfaceMode?: string | "unknown";
  skrewwwRegistryConfigured?: boolean | "unknown";
};

/**
 * Canonical authored eval case. Expected facts must be checkable against
 * current contracts / distribution / fixtures — never invented for the suite.
 */
export type AuthoredEvalCase = {
  id: string;
  title: string;
  category: EvalCaseCategory;
  userTask: string;
  /** Logical fixture id resolved by the prompt generator. */
  consumerFixtureId: string;
  relevantComponentSlugs: string[];
  relevantRecipeIds?: string[];
  /** Components the agent must include among declared slugs. */
  requiredComponentSlugs?: string[];
  /** Props/values that must appear when the agent claims that component API. */
  requiredApiReferences?: EvalApiExpectation[];
  /** Props that must never appear in the declaration. */
  forbiddenApiReferences?: EvalApiExpectation[];
  /** Component names/slugs that must never be claimed as Skrewww components. */
  forbiddenComponentSlugs?: string[];
  /** Exact maturity claims required when the agent mentions the component. */
  expectedMaturityClaims?: Array<{ component: string; status: "stable" | "beta" }>;
  /** Install commands that are allowed if the agent proposes installation. */
  allowedInstallCommands?: string[];
  /** If true, any `npx shadcn add @skrewww/...` for non-distributed slugs is an error. */
  forbidInventedInstallCommands?: boolean;
  /** ProjectContext expectations for this fixture. */
  projectContext?: EvalProjectContextExpectation;
  /** Deterministic accessibility declarations the agent must include (legacy exact/phrase match). */
  requiredAccessibilityFacts?: string[];
  /**
   * Structured accessibility requirements: each token group must appear
   * (normalized, case-insensitive) inside at least one accessibilityFacts
   * string. Prefer this over free-text sentence matching.
   */
  requiredAccessibilityFactTokens?: readonly (readonly string[])[];
  /** Free-text claims that must not appear as asserted/used APIs. */
  forbiddenClaims?: string[];
  /**
   * When true, using a Recipe to justify an API that the component contract
   * does not expose is an authority error.
   */
  enforceContractOverRecipe?: boolean;
};

/**
 * Machine-readable final declaration — observable decisions only.
 * Never request chain-of-thought / private reasoning.
 */
export type EvalAgentDeclaration = {
  componentSlugs: string[];
  apiReferences: Array<{
    component: string;
    property: string;
    value?: string;
  }>;
  installCommands: string[];
  maturityClaims: Array<{
    component: string;
    status: string;
  }>;
  shapeMode: string | "unknown";
  surfaceMode: string | "unknown";
  skrewwwRegistryConfigured: boolean | "unknown";
  recipeIdsUsed: string[];
  accessibilityFacts: string[];
  assumptions: string[];
  unresolvedGaps: string[];
  implementation: string;
};

export type EvalHardErrorKind =
  | "malformed_output"
  | "invented_component"
  | "invented_api"
  | "installability_error"
  | "maturity_error"
  | "context_error"
  | "authority_error"
  | "accessibility_failure"
  | "missing_required_component"
  | "forbidden_claim";

export type EvalHardError = {
  kind: EvalHardErrorKind;
  detail: string;
};

export type EvalCaseScore = {
  caseId: string;
  condition: EvalCondition;
  parseSuccess: boolean;
  aggregateScore: number;
  hardErrors: EvalHardError[];
  counts: {
    inventedComponents: number;
    inventedApis: number;
    installabilityErrors: number;
    maturityErrors: number;
    contextErrors: number;
    authorityErrors: number;
    accessibilityFailures: number;
    forbiddenClaims: number;
    missingRequiredComponents: number;
  };
};

export type EvalConditionSummary = {
  condition: EvalCondition;
  totalCases: number;
  parseSuccessCount: number;
  inventedComponents: number;
  inventedApis: number;
  installabilityErrors: number;
  maturityErrors: number;
  contextErrors: number;
  authorityErrors: number;
  accessibilityFailures: number;
  forbiddenClaims: number;
  missingRequiredComponents: number;
  totalHardErrors: number;
  meanAggregateScore: number;
};

export type EvalPairedReport = {
  schemaVersion: string;
  scorerVersion: string;
  suiteVersion: string;
  sourceGitSha: string;
  modelIdentifier: string;
  executionEnvironment: string;
  isolationNotes: string;
  off: EvalConditionSummary;
  on: EvalConditionSummary;
  deltas: Record<string, number>;
  caseScores: EvalCaseScore[];
  releaseGate: {
    passed: boolean;
    reasons: string[];
  };
};
