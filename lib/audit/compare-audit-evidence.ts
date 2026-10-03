import { INTENTIONAL_DIFFERENCE_RECORDS, NOT_APPLICABLE_RECORDS } from "@/lib/audit/audit-records";
import {
  AUDIT_COMPARISON_SCHEMA_VERSION,
  type AuditComparison,
  type AuditFinding,
  type AuditSummary,
  type CompareAuditResult,
  type IntentionalDifferenceRecord,
  type NotApplicableRecord,
  type PilotPropertyMap,
} from "@/lib/audit/audit-types";
import { COMPARISON_RULES, type RuleContext } from "@/lib/audit/compare-rules";
import { validatePropertyMap } from "@/lib/audit/pilot-property-maps";
import { REPO_FACTS_SCHEMA_VERSION, type RepoFacts } from "@/lib/audit/repo-facts-types";
import type { FigmaIdentity } from "@/lib/figma-identity";
import { FIGMA_SNAPSHOT_SCHEMA_VERSION, type FigmaSnapshot } from "@/lib/figma-snapshot/schema";
import { validateFigmaSnapshot } from "@/lib/figma-snapshot/validate";

/**
 * AG-1D — pure, deterministic comparator.
 *
 *   RepoFacts (AG-1C) + FigmaSnapshot (AG-1B) + explicit pilot property map
 *     → input validation (slug, schema versions, identity, contract provenance)
 *     → small comparison rules (compare-rules.ts)
 *     → AuditFinding[] + five-status summary
 *
 * Writes nothing, reads no file, calls no Figma, no network and no model, and
 * keeps no global state: everything it uses is passed in. Parity is an output
 * of this function, never stored metadata.
 */

export type CompareAuditEvidenceInput = {
  slug: string;
  repoFacts: RepoFacts;
  /** `null` when no snapshot exists for the component. */
  figmaSnapshot: FigmaSnapshot | null;
  /** `null` when no explicit map exists: every Figma property is then `unknown` (unmapped). */
  propertyMap: PilotPropertyMap | null;
  /** Defaults to the shipped (empty) record set. */
  intentionalDifferences?: readonly IntentionalDifferenceRecord[];
  /** Defaults to the shipped records. */
  notApplicable?: readonly NotApplicableRecord[];
};

export function summarizeFindings(findings: readonly AuditFinding[]): AuditSummary {
  const summary: AuditSummary = { pass: 0, fail: 0, unknown: 0, notApplicable: 0, intentionalDifference: 0 };
  for (const finding of findings) {
    if (finding.status === "pass") summary.pass += 1;
    else if (finding.status === "fail") summary.fail += 1;
    else if (finding.status === "unknown") summary.unknown += 1;
    else if (finding.status === "not-applicable") summary.notApplicable += 1;
    else summary.intentionalDifference += 1;
  }
  return summary;
}

export function findDuplicateFindingIds(findings: readonly AuditFinding[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const finding of findings) {
    if (seen.has(finding.findingId)) duplicates.add(finding.findingId);
    seen.add(finding.findingId);
  }
  return Array.from(duplicates).sort();
}

export function compareAuditEvidence(input: CompareAuditEvidenceInput): CompareAuditResult {
  const { slug, repoFacts, figmaSnapshot, propertyMap } = input;

  if (repoFacts.component.slug !== slug) {
    return { ok: false, error: { code: "SLUG_MISMATCH", message: `RepoFacts are for "${repoFacts.component.slug}", not "${slug}"` } };
  }
  if (repoFacts.schemaVersion !== REPO_FACTS_SCHEMA_VERSION) {
    return { ok: false, error: { code: "UNSUPPORTED_SCHEMA", message: `RepoFacts schema ${repoFacts.schemaVersion} is not ${REPO_FACTS_SCHEMA_VERSION}` } };
  }
  const identity = repoFacts.registry.figmaIdentity;
  if (!identity || !figmaSnapshot) {
    return {
      ok: false,
      error: {
        code: "FIGMA_EVIDENCE_UNAVAILABLE",
        message: !identity ? `"${slug}" has no recorded Figma identity; nothing to compare` : `no Figma snapshot is available for "${slug}"`,
      },
    };
  }
  if (figmaSnapshot.schemaVersion !== FIGMA_SNAPSHOT_SCHEMA_VERSION) {
    return { ok: false, error: { code: "UNSUPPORTED_SCHEMA", message: `snapshot schema ${figmaSnapshot.schemaVersion} is not ${FIGMA_SNAPSHOT_SCHEMA_VERSION}` } };
  }

  // Identity first: never compare unrelated entities.
  const identityProblems: string[] = [];
  for (const field of ["fileKey", "nodeId", "nodeType", "role"] as const) {
    if (figmaSnapshot.identity[field] !== identity[field]) {
      identityProblems.push(`identity.${field} "${figmaSnapshot.identity[field]}" is not the registry "${identity[field]}"`);
    }
  }
  if (figmaSnapshot.observed.node.id !== identity.nodeId) identityProblems.push(`observed node ${figmaSnapshot.observed.node.id} is not ${identity.nodeId}`);
  if (figmaSnapshot.observed.node.type !== identity.nodeType) identityProblems.push(`observed type ${figmaSnapshot.observed.node.type} is not ${identity.nodeType}`);
  if (identityProblems.length > 0) {
    return {
      ok: false,
      error: { code: "FIGMA_IDENTITY_MISMATCH", message: `the snapshot does not describe "${slug}"'s recorded Figma identity`, problems: identityProblems },
    };
  }
  // Identity fields were just proven equal to the snapshot's typed identity.
  const snapshotProblems = validateFigmaSnapshot(figmaSnapshot, identity as FigmaIdentity);
  if (snapshotProblems.length > 0) {
    return { ok: false, error: { code: "SNAPSHOT_INVALID", message: `the snapshot for "${slug}" is not valid evidence`, problems: snapshotProblems } };
  }

  if (!repoFacts.contract.provenanceMatchesRepoSha || repoFacts.contract.provenance.sourceGitSha !== repoFacts.provenance.gitSha) {
    return {
      ok: false,
      error: {
        code: "CONTRACT_PROVENANCE_INVALID",
        message: `contract compiled at ${repoFacts.contract.provenance.sourceGitSha} is not current for ${repoFacts.provenance.gitSha}`,
      },
    };
  }

  if (propertyMap) {
    const mapProblems = validatePropertyMap(propertyMap, slug);
    if (mapProblems.length > 0) {
      return { ok: false, error: { code: "PROPERTY_MAP_INVALID", message: `the property map for "${slug}" is invalid`, problems: mapProblems } };
    }
  }

  const ctx: RuleContext = {
    slug,
    facts: repoFacts,
    snapshot: figmaSnapshot,
    map: propertyMap,
    intentionalDifferences: (input.intentionalDifferences ?? INTENTIONAL_DIFFERENCE_RECORDS).filter((record) => record.componentSlug === slug),
    notApplicable: input.notApplicable ?? NOT_APPLICABLE_RECORDS,
  };

  const findings = COMPARISON_RULES.flatMap((rule) => rule(ctx));
  const duplicates = findDuplicateFindingIds(findings);
  if (duplicates.length > 0) {
    return { ok: false, error: { code: "DUPLICATE_FINDING_ID", message: "comparison produced duplicate finding ids", problems: duplicates } };
  }
  findings.sort((a, b) => a.findingId.localeCompare(b.findingId));

  const comparison: AuditComparison = {
    schemaVersion: AUDIT_COMPARISON_SCHEMA_VERSION,
    component: { slug, name: repoFacts.component.name },
    provenance: {
      repoGitSha: repoFacts.provenance.gitSha,
      repoGitCommitTimestamp: repoFacts.provenance.gitCommitTimestamp,
      repoWorkingTreeDirty: repoFacts.provenance.workingTreeDirty,
      repoFactsSchemaVersion: repoFacts.schemaVersion,
      figmaFileKey: figmaSnapshot.identity.fileKey,
      figmaNodeId: figmaSnapshot.identity.nodeId,
      figmaNodeType: figmaSnapshot.identity.nodeType,
      figmaCapturedAt: figmaSnapshot.capturedAt,
      figmaSnapshotSchemaVersion: figmaSnapshot.schemaVersion,
      propertyMapVersion: propertyMap?.version ?? null,
    },
    summary: summarizeFindings(findings),
    findings,
  };
  return { ok: true, comparison };
}

/** Recursively sorts object keys; same inputs → byte-identical JSON. */
export function serializeAuditComparison(comparison: AuditComparison): string {
  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([, entry]) => entry !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, entry]) => [key, normalize(entry)]),
      );
    }
    return value;
  };
  return `${JSON.stringify(normalize(comparison), null, 2)}\n`;
}
