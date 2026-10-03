import type { AuditCategory, AuditComparison, AuditEvidenceSourceType, AuditFinding, AuditReasonCode, AuditStatus } from "@/lib/audit/audit-types";

/**
 * AG-1F — golden calibration cases for the five Audit Agent pilots.
 *
 * These are TEST / CALIBRATION EXPECTATIONS, not product metadata: they are not
 * canonical, not part of any public Agent contract, not Figma authority and not
 * a substitute for source evidence. A golden case never decides a status — the
 * comparator does, from evidence — it only states what a correct audit of the
 * real pilot must surface (or must never claim).
 *
 * Expectations are SEMANTIC: a finding identified by its claim key, the statuses
 * and reason codes that are acceptable, and the evidence it must cite. They
 * never assert counts ("exactly N passes"), which would be brittle and say
 * nothing about correctness.
 */

export type GoldenFindingExpectation = {
  /** Short label used in failure messages. */
  id: string;
  claimKey: string;
  category?: AuditCategory;
  /** Statuses that are correct for this finding. A single entry means "exactly this status". */
  allowedStatuses: readonly AuditStatus[];
  reasonCodes?: readonly AuditReasonCode[];
  /** Each substring must appear in the `sourceRef` or `observed` text of at least one cited evidence entry. */
  evidenceMustInclude?: readonly string[];
  /** Evidence source types the finding must cite. */
  evidenceSourceTypes?: readonly AuditEvidenceSourceType[];
  why: string;
};

export type GoldenForbiddenFinding = {
  id: string;
  /** Regular expression source matched against the claim key. */
  claimKeyPattern?: string;
  categories?: readonly AuditCategory[];
  statuses?: readonly AuditStatus[];
  /** Regular expression source (case-insensitive) matched against claim + expected + actual. */
  textPattern?: string;
  why: string;
};

export type GoldenAuditExpectation = {
  slug: string;
  required: readonly GoldenFindingExpectation[];
  forbidden: readonly GoldenForbiddenFinding[];
  /** Categories that must have at least one finding (the check still executed). */
  requiredCategories?: readonly AuditCategory[];
};

const identityPass = (slug: string): GoldenFindingExpectation[] => [
  { id: `${slug}-identity-node`, claimKey: "figma-node", category: "identity", allowedStatuses: ["pass"], evidenceSourceTypes: ["figma", "registry"], why: "the structured identity names the node the snapshot observed" },
  { id: `${slug}-identity-node-type`, claimKey: "figma-node-type", category: "identity", allowedStatuses: ["pass"], why: "the snapshot's node type equals the registry identity's" },
];

const darkModeNotApplicable: GoldenFindingExpectation = {
  id: "dark-mode-not-applicable",
  claimKey: "dark-mode",
  category: "states",
  allowedStatuses: ["not-applicable"],
  reasonCodes: ["not-applicable-recorded"],
  evidenceMustInclude: ["Dark"],
  why: "Figma exposes Light/Dark; React has no Dark theme by recorded architecture, so the dimension does not exist — it is not a mismatch",
};

const NO_API_FAIL: GoldenForbiddenFinding = {
  id: "no-nonexistent-prop-fail",
  categories: ["api"],
  statuses: ["fail"],
  why: "the comparator never judges a prop nonexistent (TypeScript is the authority); undocumented is unknown, never fail",
};

export const GOLDEN_AUDIT_EXPECTATIONS: Record<string, GoldenAuditExpectation> = {
  button: {
    slug: "button",
    required: [
      ...identityPass("button"),
      { id: "button-style-options", claimKey: "figma-options-style", category: "api", allowedStatuses: ["pass"], reasonCodes: ["equal"], why: "Figma Style options map explicitly to the registry variants" },
      { id: "button-size-options", claimKey: "figma-options-size", category: "api", allowedStatuses: ["pass"], reasonCodes: ["equal"], why: "Figma Size options map explicitly to the registry sizes" },
      {
        id: "button-state-is-css",
        claimKey: "figma-property-state",
        category: "states",
        allowedStatuses: ["unknown"],
        reasonCodes: ["requires-rendering"],
        why: "State is a CSS pseudo-state; comparing it needs rendering, so it stays unknown and requires no `state` prop",
      },
      { id: "button-label-children", claimKey: "mapped-property-label", category: "figma-structure", allowedStatuses: ["pass"], why: "Label maps to children; the Figma property exists as mapped" },
      darkModeNotApplicable,
    ],
    forbidden: [
      NO_API_FAIL,
      { id: "button-no-state-prop", claimKeyPattern: "^figma-property-state$", categories: ["api"], why: "State must never be treated as a React prop" },
      { id: "button-no-label-prop-fail", claimKeyPattern: "label", statuses: ["fail"], why: "a missing `label` prop is not a defect — Label is children" },
    ],
    requiredCategories: ["guard", "tokens"],
  },

  "text-input": {
    slug: "text-input",
    required: [
      ...identityPass("text-input"),
      { id: "text-input-size", claimKey: "figma-options-size", category: "api", allowedStatuses: ["pass"], why: "Size options compare through the explicit map" },
      {
        id: "text-input-state-css",
        claimKey: "figma-property-state",
        category: "states",
        allowedStatuses: ["unknown"],
        reasonCodes: ["requires-rendering"],
        why: "State is CSS / accessibility state (Error is [aria-invalid]); not comparable without rendering",
      },
      {
        id: "text-input-value-unknown",
        claimKey: "figma-property-value",
        category: "api",
        allowedStatuses: ["unknown"],
        reasonCodes: ["mapping-unknown"],
        why: "Value could mean value / defaultValue / placeholder; the audit map records that it is not determinable",
      },
      darkModeNotApplicable,
    ],
    forbidden: [
      NO_API_FAIL,
      { id: "text-input-no-formfield-expectation", textPattern: "form-?field", statuses: ["fail"], why: "no FormField wrapper is expected of TextInput" },
    ],
    requiredCategories: ["guard", "tokens"],
  },

  alert: {
    slug: "alert",
    required: [
      ...identityPass("alert"),
      { id: "alert-type-options", claimKey: "figma-options-type", category: "api", allowedStatuses: ["pass"], why: "Figma Type options map explicitly to the registry types" },
      {
        id: "alert-radius-token-role",
        claimKey: "role-surface-corner-radius-token",
        category: "tokens",
        allowedStatuses: ["fail"],
        reasonCodes: ["different"],
        evidenceMustInclude: ["component/radius/feedback", "component/radius/container"],
        evidenceSourceTypes: ["figma", "registry", "audit-map"],
        why: "the live master binds the feedback radius on the corners, while registry tokensUsed names the container radius for the same role: tokensUsed is stale",
      },
      {
        id: "alert-tokensused-stale-container",
        claimKey: "figma-binding-component-radius-container",
        category: "tokens",
        allowedStatuses: ["fail"],
        reasonCodes: ["not-observed"],
        evidenceMustInclude: ["component/radius/container", "closure complete"],
        evidenceSourceTypes: ["figma", "registry"],
        why: "with the complete alias closure, the registry's container radius is absent from the master's whole dependency graph",
      },
      {
        id: "alert-radius-pill-drift",
        claimKey: "role-surface-corner-radius-value-pill",
        category: "tokens",
        allowedStatuses: ["fail"],
        reasonCodes: ["different"],
        evidenceMustInclude: ["9999", "16px", "TEMPORARY"],
        evidenceSourceTypes: ["figma", "css", "audit-map"],
        why: "Figma's Pill feedback radius resolves to 9999 while the CSS chain resolves --feedback-radius to 16px under pill; the TEMPORARY label is evidence, not intent",
      },
      { id: "alert-radius-rounded-equal", claimKey: "role-surface-corner-radius-value-rounded", category: "tokens", allowedStatuses: ["pass"], why: "Rounded: both sides resolve to 12" },
      { id: "alert-radius-sharp-equal", claimKey: "role-surface-corner-radius-value-sharp", category: "tokens", allowedStatuses: ["pass"], why: "Sharp: both sides resolve to 0" },
      { id: "alert-radius-squircle-equal", claimKey: "role-surface-corner-radius-value-squircle", category: "tokens", allowedStatuses: ["pass"], why: "Squircle: both sides resolve to 16" },
      {
        id: "alert-radius-brand-shape-unmapped",
        claimKey: "role-surface-corner-radius-unmapped-modes",
        category: "tokens",
        allowedStatuses: ["unknown"],
        reasonCodes: ["unmapped"],
        evidenceMustInclude: ["Brand Shape"],
        why: "Figma's Brand Shape mode has no mapped CSS selector, so nothing is claimed about it",
      },
      {
        id: "alert-css-parity-remains-unknown",
        claimKey: "css-implementation-parity",
        category: "tokens",
        allowedStatuses: ["unknown"],
        reasonCodes: ["no-figma-css-map"],
        evidenceMustInclude: ["TEMPORARY"],
        why: "outside the one explicit token role there is no Figma↔CSS map; TEMPORARY labels stay evidence",
      },
      darkModeNotApplicable,
    ],
    forbidden: [
      NO_API_FAIL,
      { id: "alert-no-intentional-difference", statuses: ["intentional-difference"], why: "no structured record marks any Alert difference intentional; TEMPORARY is not such a record" },
    ],
    requiredCategories: ["guard", "tokens"],
  },

  dialog: {
    slug: "dialog",
    required: [
      ...identityPass("dialog"),
      {
        id: "dialog-component-identity",
        claimKey: "figma-node-type",
        category: "identity",
        allowedStatuses: ["pass"],
        evidenceMustInclude: ["COMPONENT"],
        why: "Dialog's canonical master is a COMPONENT, not a COMPONENT_SET",
      },
      { id: "dialog-title-compound", claimKey: "figma-property-title", category: "api", allowedStatuses: ["pass"], evidenceMustInclude: ["DialogTitle"], why: "Title is the public compound export DialogTitle" },
      { id: "dialog-body-compound", claimKey: "figma-property-body", category: "api", allowedStatuses: ["pass"], evidenceMustInclude: ["DialogBody"], why: "Body is the public compound export DialogBody" },
      {
        id: "dialog-free-form-names-unknown",
        claimKey: "documented-free-form-names",
        category: "api",
        allowedStatuses: ["unknown"],
        reasonCodes: ["free-form-api-name"],
        evidenceMustInclude: ["DialogBody children"],
        why: "free-form documented names are never turned into props",
      },
      {
        id: "dialog-stale-figma-reference",
        claimKey: "figma-reference-negative-master-claim",
        category: "documentation",
        allowedStatuses: ["fail"],
        reasonCodes: ["documentation-contradicts-identity"],
        evidenceMustInclude: ["No canonical Dialog COMPONENT_SET/master", "master"],
        evidenceSourceTypes: ["registry", "figma"],
        why: "figmaReference states there is no canonical master; the structured identity (role master, COMPONENT) contradicts it",
      },
      { id: "dialog-prose-still-evidence", claimKey: "figma-reference-prose", category: "documentation", allowedStatuses: ["unknown"], reasonCodes: ["prose-only"], why: "the remaining prose is recorded, not machine-compared" },
      darkModeNotApplicable,
    ],
    forbidden: [
      NO_API_FAIL,
      { id: "dialog-no-compound-fail", claimKeyPattern: "children|dialog-?(title|body|footer)|compound", statuses: ["fail"], why: "compound architecture is not a defect" },
      { id: "dialog-no-flat-prop-for-free-form", claimKeyPattern: "^figma-property-children|^mapped-property-children", why: "free-form names never become props" },
    ],
    requiredCategories: ["guard", "tokens"],
  },

  "chart-card": {
    slug: "chart-card",
    required: [
      ...identityPass("chart-card"),
      {
        id: "chart-card-no-properties",
        claimKey: "component-properties",
        category: "figma-structure",
        allowedStatuses: ["not-applicable"],
        reasonCodes: ["not-applicable-observed"],
        why: "the master exposes no component properties; that is not a defect",
      },
      darkModeNotApplicable,
    ],
    forbidden: [
      NO_API_FAIL,
      { id: "chart-card-no-invented-properties", claimKeyPattern: "^(figma-property-|mapped-property-|figma-options-)", why: "no property findings may be invented for a property-less master" },
      { id: "chart-card-no-structure-fail", categories: ["figma-structure"], statuses: ["fail"], why: "an empty property set is safe" },
    ],
    requiredCategories: ["guard", "tokens"],
  },
};

// ── cross-pilot invariants ─────────────────────────────────────────────────

/** Reason codes that mean "the comparator could not decide": never pass or fail. */
export const UNDECIDED_REASON_CODES: ReadonlySet<AuditReasonCode> = new Set<AuditReasonCode>([
  "unmapped",
  "mapping-unknown",
  "alias-target-only",
  "not-observed-alias-chain-truncated",
  "missing-repo-side",
  "missing-figma-side",
  "undocumented-representation",
  "requires-rendering",
  "prose-only",
  "no-figma-css-map",
  "free-form-api-name",
  "registry-subset-allowed",
  "unresolved-value",
  "guard-unknown",
  "not-applicable-record-contradicted",
]);

export type GoldenInvariant = { id: string; description: string; check: (comparison: AuditComparison) => string[] };

const evidenceText = (finding: AuditFinding) => finding.evidence.map((entry) => `${entry.sourceRef} ${entry.observed}`).join("\n");

export const GOLDEN_INVARIANTS: readonly GoldenInvariant[] = [
  {
    id: "unknown-never-collapses",
    description: "a finding whose reason means 'could not decide' is never a pass or a fail",
    check: (c) => c.findings.filter((f) => UNDECIDED_REASON_CODES.has(f.reasonCode) && (f.status === "pass" || f.status === "fail")).map((f) => `${f.findingId}: ${f.reasonCode} is ${f.status}`),
  },
  {
    id: "dark-mode-never-fails",
    description: "Figma's Dark mode is never a mismatch against React",
    check: (c) => c.findings.filter((f) => /dark/i.test(f.claimKey) && f.status !== "not-applicable" && f.status !== "unknown").map((f) => `${f.findingId} is ${f.status}`),
  },
  {
    id: "temporary-is-not-intent",
    description: "a [TEMPORARY]/[EXPERIMENTAL] label never yields intentional-difference without a structured docs record",
    check: (c) =>
      c.findings
        .filter((f) => f.status === "intentional-difference" && !f.evidence.some((e) => e.sourceType === "docs"))
        .map((f) => `${f.findingId} is intentional-difference without a docs record`),
  },
  {
    id: "no-intentional-difference-without-record",
    description: "no pilot has a recorded intentional difference, so none may appear",
    check: (c) => c.findings.filter((f) => f.status === "intentional-difference").map((f) => `${f.findingId} is intentional-difference`),
  },
  {
    id: "every-decision-cites-both-sides",
    description: "every pass and fail cites at least two pieces of evidence",
    check: (c) => c.findings.filter((f) => (f.status === "pass" || f.status === "fail") && f.evidence.length < 2).map((f) => `${f.findingId} cites ${f.evidence.length} evidence`),
  },
  {
    id: "every-finding-cites-evidence",
    description: "no finding is evidence-free",
    check: (c) => c.findings.filter((f) => f.evidence.length === 0).map((f) => `${f.findingId} has no evidence`),
  },
  {
    id: "labels-do-not-decide",
    description: "a finding that cites a parity-labelled CSS declaration decides by comparing values (role findings), never by the label",
    check: (c) =>
      c.findings
        .filter((f) => (f.status === "pass" || f.status === "fail") && /\[(TEMPORARY|EXPERIMENTAL|VERIFIED|ALIASED)/.test(evidenceText(f)) && !f.claimKey.startsWith("role-"))
        .map((f) => `${f.findingId} decided with a parity label outside an explicit role`),
  },
];

// ── evaluation ────────────────────────────────────────────────────────────

function evidenceViolations(finding: AuditFinding, expectation: GoldenFindingExpectation): string[] {
  const violations: string[] = [];
  const text = evidenceText(finding);
  for (const needle of expectation.evidenceMustInclude ?? []) {
    if (!text.includes(needle)) violations.push(`${expectation.id}: evidence does not include "${needle}"`);
  }
  for (const type of expectation.evidenceSourceTypes ?? []) {
    if (!finding.evidence.some((entry) => entry.sourceType === type)) violations.push(`${expectation.id}: evidence does not cite a ${type} source`);
  }
  return violations;
}

/** Violations of one pilot's golden expectation by a comparison. Empty means the audit behaves as calibrated. */
export function evaluateGoldenExpectation(comparison: AuditComparison, expectation: GoldenAuditExpectation): string[] {
  const violations: string[] = [];
  if (comparison.component.slug !== expectation.slug) violations.push(`comparison is for ${comparison.component.slug}, expectation for ${expectation.slug}`);
  for (const required of expectation.required) {
    const matches = comparison.findings.filter((f) => f.claimKey === required.claimKey && (!required.category || f.category === required.category));
    if (matches.length === 0) {
      violations.push(`${required.id}: no finding with claimKey "${required.claimKey}"`);
      continue;
    }
    for (const finding of matches) {
      if (!required.allowedStatuses.includes(finding.status)) {
        violations.push(`${required.id}: status ${finding.status} is not one of ${required.allowedStatuses.join("|")}`);
      }
      if (required.reasonCodes && !required.reasonCodes.includes(finding.reasonCode)) {
        violations.push(`${required.id}: reasonCode ${finding.reasonCode} is not one of ${required.reasonCodes.join("|")}`);
      }
      violations.push(...evidenceViolations(finding, required));
    }
  }
  for (const forbidden of expectation.forbidden) {
    const claimKey = forbidden.claimKeyPattern ? new RegExp(forbidden.claimKeyPattern, "i") : null;
    const text = forbidden.textPattern ? new RegExp(forbidden.textPattern, "i") : null;
    for (const finding of comparison.findings) {
      if (claimKey && !claimKey.test(finding.claimKey)) continue;
      if (forbidden.categories && !forbidden.categories.includes(finding.category)) continue;
      if (forbidden.statuses && !forbidden.statuses.includes(finding.status)) continue;
      if (text && !text.test(`${finding.claim} ${finding.expected ?? ""} ${finding.actual ?? ""}`)) continue;
      violations.push(`${forbidden.id}: forbidden finding ${finding.findingId} (${finding.status})`);
    }
  }
  for (const category of expectation.requiredCategories ?? []) {
    if (!comparison.findings.some((f) => f.category === category)) violations.push(`no ${category} finding was produced`);
  }
  return violations;
}

export function evaluateGoldenInvariants(comparison: AuditComparison): string[] {
  return GOLDEN_INVARIANTS.flatMap((invariant) => invariant.check(comparison).map((message) => `${invariant.id}: ${message}`));
}
