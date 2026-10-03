/**
 * AG-1D — deterministic audit evidence schema (docs/architecture/agent-readiness.md §9, §23).
 *
 * An `AuditComparison` is the OUTPUT of comparing one component's `RepoFacts`
 * (AG-1C) with its committed Figma snapshot (AG-1B). Parity lives here, as an
 * audit result — never in the registry, the contracts or the snapshots.
 *
 * Five statuses, locked:
 * - `pass`                   — both sides observed, deterministically comparable, equal.
 * - `fail`                   — both sides observed, comparable, unequal, no recorded intentional difference.
 * - `unknown`                — a side is missing, unmapped, unresolved, free-form or only inferable.
 *                               Never counted as pass or fail.
 * - `not-applicable`         — the dimension does not exist on one side by design, per a recorded source.
 * - `intentional-difference` — unequal, and an exact structured record says the difference is intended.
 *
 * No natural-language fixes (AG-1E) and no model output appear here.
 */

export const AUDIT_COMPARISON_SCHEMA_VERSION = "1.0.0";

export const AUDIT_STATUSES = ["pass", "fail", "unknown", "not-applicable", "intentional-difference"] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export type AuditCategory =
  | "identity"
  | "api"
  | "tokens"
  | "states"
  | "figma-structure"
  | "react"
  | "accessibility"
  | "documentation"
  | "guard";

export type AuditEvidenceSourceType = "figma" | "registry" | "contract" | "css" | "tsx" | "content" | "guard" | "docs" | "audit-map";

export type AuditEvidence = {
  sourceType: AuditEvidenceSourceType;
  /** Stable reference, e.g. `figma:<fileKey>/<nodeId>/componentProperties/Style`, `registry:alert/tokensUsed`, `css:styles/tokens.css:284`. */
  sourceRef: string;
  /** Concise verbatim fact. Never a paraphrased inference. */
  observed: string;
  /** Repo git SHA or Figma snapshot `capturedAt`, whichever produced the fact. */
  capturedAt?: string;
};

/** Mechanical reason for the status. Deterministic; not prose. */
export type AuditReasonCode =
  | "equal"
  | "different"
  | "bound-directly"
  | "bound-within-instance"
  | "alias-target-only"
  | "not-observed-alias-chain-truncated"
  | "not-observed"
  | "missing-repo-side"
  | "missing-figma-side"
  | "unmapped"
  | "mapping-unknown"
  | "undocumented-representation"
  | "requires-rendering"
  | "prose-only"
  | "no-figma-css-map"
  | "free-form-api-name"
  | "registry-subset-allowed"
  | "unresolved-value"
  | "documentation-contradicts-identity"
  | "not-applicable-recorded"
  | "not-applicable-observed"
  | "not-applicable-record-contradicted"
  | "recorded-intentional-difference"
  | "guard-pass"
  | "guard-violation"
  | "guard-unknown"
  | "guard-not-applicable";

export type AuditFinding = {
  /** `${slug}:${category}:${claimKey}` — stable, no index, no time. */
  findingId: string;
  componentSlug: string;
  category: AuditCategory;
  claimKey: string;
  claim: string;
  status: AuditStatus;
  reasonCode: AuditReasonCode;
  expected?: string;
  actual?: string;
  evidence: AuditEvidence[];
  basis: "deterministic" | "inferred";
  confidence: "high" | "medium" | "low";
  severity: "blocker" | "major" | "minor" | "info";
  requiresHumanDecision: boolean;
};

export type AuditSummary = {
  pass: number;
  fail: number;
  unknown: number;
  notApplicable: number;
  intentionalDifference: number;
};

export type AuditComparison = {
  schemaVersion: string;
  component: { slug: string; name: string };
  provenance: {
    repoGitSha: string;
    repoGitCommitTimestamp: string;
    repoWorkingTreeDirty: boolean;
    repoFactsSchemaVersion: string;
    figmaFileKey: string;
    figmaNodeId: string;
    figmaNodeType: string;
    figmaCapturedAt: string;
    figmaSnapshotSchemaVersion: string;
    propertyMapVersion: string | null;
    tokenRoleMapVersion: string | null;
  };
  summary: AuditSummary;
  findings: AuditFinding[];
};

// ── Explicit audit interpretation metadata ──────────────────────────────────

/** Explicit mapping of a Figma option label to a registry option value. Nothing is case-folded implicitly. */
export type OptionMap = Record<string, string>;

export type FigmaPropertyMapping =
  | {
      figmaProperty: string;
      kind: "react-prop";
      reactProperty: string;
      /** When set, the Figma VARIANT options are compared with this registry option set through `optionMap`. */
      registryOptionSet?: "supportedVariants" | "supportedSizes";
      optionMap?: OptionMap;
      rationale: string;
    }
  | { figmaProperty: string; kind: "children"; rationale: string }
  | { figmaProperty: string; kind: "presence"; reactProperty: string; rationale: string }
  | { figmaProperty: string; kind: "css-state"; states: string; rationale: string }
  | { figmaProperty: string; kind: "compound-child"; exportName: string; rationale: string }
  | { figmaProperty: string; kind: "unsupported"; sourceRef: string; rationale: string }
  | { figmaProperty: string; kind: "unknown"; rationale: string };

export type FigmaPropertyMappingKind = FigmaPropertyMapping["kind"];

/**
 * Pilot-only, human-verified audit metadata. NOT canonical product metadata,
 * never compiled into Agent contracts, and never itself a parity claim.
 */
export type PilotPropertyMap = {
  version: string;
  componentSlug: string;
  /** What the mapping was verified against: the snapshot capture and the React source files read. */
  verifiedAgainst: { figmaCapturedAt: string; sources: string[] };
  mappings: FigmaPropertyMapping[];
};

/**
 * One token role: the same design responsibility seen from three sources —
 * where Figma binds its token, which registry `tokensUsed` entry implements it,
 * and which CSS custom property the component's stylesheet reads. The mapping
 * only says WHICH properties correspond; it never says whether they agree.
 */
export type TokenRoleMapping = {
  /** Used in finding ids: `role-<claimKey>-token`, `role-<claimKey>-value-<mode>`. */
  claimKey: string;
  description: string;
  figma: {
    /** Layer path from the analysed root ("" is the root itself). */
    path: string;
    /** Bound properties that carry the role, e.g. the four corner radii. */
    properties: string[];
  };
  registry: {
    /** Registry `tokensUsed` entries (Figma-name domain) that implement the role. */
    tokens: string[];
  };
  css: {
    /** The custom property the component CSS reads for this role. */
    customProperty: string;
    /** Attribute that selects the mode in CSS, e.g. `data-skrewww-shape`. */
    modeAttribute: string;
    /** Explicit Figma mode name → attribute value. A Figma mode absent here is left unmapped (unknown). */
    modes: Array<{ figmaMode: string; attributeValue: string }>;
    /** What the static resolution assumes about where the attribute is applied. */
    cascadeAssumption: string;
  };
  rationale: string;
  /** Source files / lines read when the mapping was verified. */
  sources: string[];
};

/** Pilot-only, human-verified audit metadata. Not canonical product metadata; never prescribes a status. */
export type PilotTokenRoleMap = {
  version: string;
  componentSlug: string;
  verifiedAgainst: { figmaCapturedAt: string; sources: string[] };
  roles: TokenRoleMapping[];
};

/** The only input that can turn a deterministic difference into `intentional-difference`. */
export type IntentionalDifferenceRecord = {
  componentSlug: string;
  claimKey: string;
  sourceRef: string;
  statement: string;
};

/** A recorded architecture source saying a dimension does not exist on one side by design. */
export type NotApplicableRecord = {
  /** Applies to every component when "*". */
  componentSlug: string | "*";
  claimKey: string;
  sourceRef: string;
  statement: string;
};

export type CompareAuditErrorCode =
  | "SLUG_MISMATCH"
  | "UNSUPPORTED_SCHEMA"
  | "FIGMA_EVIDENCE_UNAVAILABLE"
  | "FIGMA_IDENTITY_MISMATCH"
  | "SNAPSHOT_INVALID"
  | "CONTRACT_PROVENANCE_INVALID"
  | "PROPERTY_MAP_INVALID"
  | "DUPLICATE_FINDING_ID";

export type CompareAuditResult =
  | { ok: true; comparison: AuditComparison }
  | { ok: false; error: { code: CompareAuditErrorCode; message: string; problems?: string[] } };
