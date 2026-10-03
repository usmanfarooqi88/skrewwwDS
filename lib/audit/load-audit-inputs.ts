import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { collectRepoFacts } from "@/lib/audit/collect-repo-facts";
import { compareAuditEvidence } from "@/lib/audit/compare-audit-evidence";
import type { CompareAuditResult } from "@/lib/audit/audit-types";
import { PILOT_PROPERTY_MAPS } from "@/lib/audit/pilot-property-maps";
import { PILOT_TOKEN_ROLE_MAPS } from "@/lib/audit/pilot-token-role-maps";
import type { CollectRepoFactsErrorCode } from "@/lib/audit/repo-facts-types";
import type { FigmaSnapshot } from "@/lib/figma-snapshot/schema";

/**
 * Read-only loading for the debug CLI — kept outside the pure comparator.
 * Collects RepoFacts from the current checkout, reads the committed AG-1B
 * snapshot at `agent/figma-snapshots/<fileKey>/<slug>.json` (named by the
 * registry identity, never guessed from the component name) and the explicit
 * pilot map, then runs the comparator. Writes nothing.
 */

export function snapshotPathFor(repoRoot: string, fileKey: string, slug: string): string {
  return join(repoRoot, "agent", "figma-snapshots", fileKey, `${slug}.json`);
}

export type LoadAndCompareResult =
  | CompareAuditResult
  | { ok: false; error: { code: CollectRepoFactsErrorCode; message: string; problems?: string[] } };

export function loadAndCompare(repoRoot: string, slug: string): LoadAndCompareResult {
  const collected = collectRepoFacts({ repoRoot, slug });
  if (!collected.ok) return collected;
  const identity = collected.facts.registry.figmaIdentity;
  let snapshot: FigmaSnapshot | null = null;
  if (identity) {
    const path = snapshotPathFor(repoRoot, identity.fileKey, slug);
    if (existsSync(path)) snapshot = JSON.parse(readFileSync(path, "utf8")) as FigmaSnapshot;
  }
  return compareAuditEvidence({ slug, repoFacts: collected.facts, figmaSnapshot: snapshot, propertyMap: PILOT_PROPERTY_MAPS[slug] ?? null,
    tokenRoleMap: PILOT_TOKEN_ROLE_MAPS[slug] ?? null,
  });
}
