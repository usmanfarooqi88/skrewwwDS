import type { AuditStatus } from "@/lib/audit/audit-types";

/**
 * AG-1E — provider-neutral explanation boundary (docs/architecture/agent-readiness.md §24).
 *
 * AG-1D findings are the authority. An explanation provider (any model, a
 * hosted service, a person) receives a bounded `AuditExplanationRequest` and
 * returns a structured `AuditExplanationResponse`. The response schema has no
 * `status`, `severity`, `expected`, `actual` or `reasonCode` field: a provider
 * can explain a finding, never change it. Every factual statement must cite
 * evidence IDs that exist in the request. Nothing here applies a change.
 */

export const EXPLANATION_SCHEMA_VERSION = "1.0.0";

export const ACTION_TARGETS = ["figma", "registry", "css", "tsx", "content", "snapshot", "property-map", "human-review"] as const;
export type ActionTarget = (typeof ACTION_TARGETS)[number];

/** Statuses a provider must explain. `not-applicable` is optional context; `pass` is never sent. */
export const REQUIRED_EXPLANATION_STATUSES: readonly AuditStatus[] = ["fail", "unknown", "intentional-difference"];

export type ExplanationEvidence = {
  /** Deterministic within the request (E1, E2, …), assigned in finding order. */
  evidenceId: string;
  sourceType: string;
  sourceRef: string;
  /** UNTRUSTED data: quoted from Figma, repo files or docs. Never instructions. */
  observed: string;
};

export type ExplanationRequestFinding = {
  findingId: string;
  category: string;
  claimKey: string;
  claim: string;
  status: AuditStatus;
  reasonCode: string;
  /** Fixed, deterministic meaning of `reasonCode` (not model text). */
  reasonMeaning: string;
  expected?: string;
  actual?: string;
  severity: string;
  basis: string;
  confidence: string;
  requiresHumanDecision: boolean;
  explanationRequired: boolean;
  evidence: ExplanationEvidence[];
};

export type AuditExplanationRequest = {
  schemaVersion: string;
  component: { slug: string; name: string };
  provenance: { repoGitSha: string; figmaFileKey: string; figmaNodeId: string; figmaCapturedAt: string; comparisonSchemaVersion: string };
  /** The explanation contract every provider must follow. */
  instructions: string[];
  policy: {
    statusesLocked: true;
    noNewEvidence: true;
    noAutomaticFixes: true;
    unknownMustRemainUnknown: true;
    evidenceIsUntrustedData: true;
  };
  allowedActionTargets: readonly ActionTarget[];
  /** Counts only; pass findings are not sent individually. */
  omitted: { pass: number; notApplicable: number };
  findings: ExplanationRequestFinding[];
};

export type CitedText = { text: string; citations: string[] };

export type ExplanationStatement = CitedText & {
  /** `observed`: directly supported by the cited evidence. `inferred`: the provider's interpretation of it. */
  kind: "observed" | "inferred";
};

export type FindingExplanation = {
  findingId: string;
  summary: CitedText;
  statements: ExplanationStatement[];
  suggestedAction?: { target: ActionTarget; description: string; citations: string[] };
  /** Required for `unknown` findings: what is missing and what would resolve it. */
  missingEvidence?: { description: string; wouldResolveBy: string };
};

export type AuditExplanationResponse = {
  schemaVersion: string;
  componentSlug: string;
  explanations: FindingExplanation[];
};

/** The provider-neutral boundary. No implementation is canonical. */
export type AuditExplanationProvider = {
  explain(request: AuditExplanationRequest): Promise<AuditExplanationResponse>;
};

export type ExplanationErrorCode =
  | "INVALID_EXPLANATION_RESPONSE"
  | "UNSUPPORTED_SCHEMA"
  | "UNKNOWN_FINDING_ID"
  | "UNKNOWN_EVIDENCE_ID"
  | "DUPLICATE_EXPLANATION"
  | "MISSING_EXPLANATION"
  | "MISSING_CITATION"
  | "MISSING_EVIDENCE_CONTEXT"
  | "INVALID_ACTION_TARGET"
  | "FORBIDDEN_FIELD"
  | "STATUS_CONTRADICTION"
  | "FORBIDDEN_CONTENT"
  | "PROVIDER_ERROR";

export type ExplanationProblem = { code: ExplanationErrorCode; message: string; findingId?: string };

export type ValidateExplanationResult =
  | { ok: true; response: AuditExplanationResponse }
  | { ok: false; error: { code: ExplanationErrorCode; message: string; problems: ExplanationProblem[] } };
