import {
  classifyInternalImportProvenance,
  isKnownInternalHelperPath,
  resolveImportedFileBaseName,
  resolveInternalComponentSlug,
} from "@/lib/guard/provenance";
import { extractSkrewwwComponentMarker } from "@/lib/guard/provenance-marker";
import { resolveImportToFile } from "@/lib/guard/resolve-import";
import type { ExtractedSourceFacts, JsxElementFact } from "@/lib/guard/types";
import type { RuleEvaluation } from "@/lib/guard/rule-types";

/**
 * Provenance strategy for `component/nonexistent-slug`:
 *
 * - `internal-paths` (Skrewww repo): import path under `@/components/ui`
 *   establishes a claim (existing G-1 behavior).
 * - `origin-marker` (external consumers): only a resolved file carrying
 *   an `@skrewww-component <slug>` origin marker establishes a claim. Path/name
 *   alone never does — protects local Button components.
 */
export type ComponentProvenanceMode = "internal-paths" | "origin-marker";

export type EvaluateComponentNonexistentSlugOptions = {
  provenanceMode?: ComponentProvenanceMode;
  /** Required for origin-marker mode — project root for import resolution. */
  projectRoot?: string;
  /**
   * Canonical slug set for existence checks in origin-marker mode.
   * When omitted, existence falls back to internal registry resolution
   * (internal-paths mode only).
   */
  knownSlugs?: ReadonlySet<string>;
};

/**
 * `component/nonexistent-slug` — docs/architecture/guard-readiness-audit
 * .md §3.1. A violation requires a Skrewww identity CLAIM to actually be
 * established — never mere name similarity.
 */
export function evaluateComponentNonexistentSlug(
  facts: ExtractedSourceFacts,
  options: EvaluateComponentNonexistentSlugOptions = {},
): RuleEvaluation[] {
  if (!facts.ok) return [];

  const mode = options.provenanceMode ?? "internal-paths";
  return facts.jsxElements.map((element): RuleEvaluation =>
    mode === "origin-marker"
      ? evaluateElementOriginMarker(facts.path, element, options)
      : evaluateElementInternalPaths(facts.path, element),
  );
}

function evaluateElementInternalPaths(path: string, element: JsxElementFact): RuleEvaluation {
  const ruleId = "component/nonexistent-slug" as const;

  if (element.resolution.kind !== "imported") {
    return {
      status: "not-applicable",
      ruleId,
      reason: `JSX tag resolution is "${element.resolution.kind}" — no import binds this tag, so no Skrewww identity claim exists to check.`,
    };
  }

  const provenance = classifyInternalImportProvenance(element.resolution.import.moduleSpecifier);
  if (provenance.kind === "unknown") {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Import module specifier "${element.resolution.import.moduleSpecifier}" is not a known Skrewww path — no Skrewww identity claim established, regardless of the imported name.`,
    };
  }

  const slug = resolveInternalComponentSlug(element.resolution.import);
  const claimedName = element.resolution.import.importedName;

  if (slug) {
    return { status: "pass", ruleId, subject: { kind: "component", id: slug } };
  }

  const candidateFileBaseName = resolveImportedFileBaseName(element.resolution.import) ?? claimedName;
  const candidatePath = `components/ui/${candidateFileBaseName}.tsx`;
  if (isKnownInternalHelperPath(candidatePath)) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `"${candidatePath}" is a real, canonically-acknowledged internal helper (bundled as another component's internalDependencies) — never an independently public component, so this is not an invented-component claim.`,
    };
  }

  return {
    status: "violation",
    finding: {
      ruleId,
      severity: "error",
      subject: { kind: "component", id: claimedName },
      location: { path, range: element.range },
      canonicalEvidence: `lib/component-registry.ts: no entry has an owned file matching "${element.resolution.import.moduleSpecifier}" for the name "${claimedName}"`,
      details: `Claimed a Skrewww component "${claimedName}" via "${element.resolution.import.moduleSpecifier}", but no such component exists in the canonical registry.`,
    },
  };
}

function evaluateElementOriginMarker(
  path: string,
  element: JsxElementFact,
  options: EvaluateComponentNonexistentSlugOptions,
): RuleEvaluation {
  const ruleId = "component/nonexistent-slug" as const;

  if (element.resolution.kind !== "imported") {
    return {
      status: "not-applicable",
      ruleId,
      reason: `JSX tag resolution is "${element.resolution.kind}" — no import binds this tag, so no Skrewww origin claim exists.`,
    };
  }

  const projectRoot = options.projectRoot ?? process.cwd();
  const resolved = resolveImportToFile(
    path,
    element.resolution.import.moduleSpecifier,
    projectRoot,
  );

  if (!resolved) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Could not resolve import "${element.resolution.import.moduleSpecifier}" to a local file — unknown provenance; no Skrewww origin claim.`,
    };
  }

  const markerSlug = extractSkrewwwComponentMarker(resolved.content);
  if (!markerSlug) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Resolved file has no @skrewww-component origin marker — unknown provenance (local/user-owned source), regardless of import path or tag name.`,
    };
  }

  const known = options.knownSlugs;
  if (!known) {
    return {
      status: "unknown",
      ruleId,
      subject: { kind: "component", id: markerSlug },
      reason: "Origin marker found but no packaged fact set was provided for existence checks.",
    };
  }

  if (known.has(markerSlug)) {
    return { status: "pass", ruleId, subject: { kind: "component", id: markerSlug } };
  }

  return {
    status: "violation",
    finding: {
      ruleId,
      severity: "error",
      subject: { kind: "component", id: markerSlug },
      location: { path, range: element.range },
      canonicalEvidence: `packaged consumer facts: no component with slug "${markerSlug}"`,
      details: `Origin marker claims Skrewww component slug "${markerSlug}", but that slug is not present in the packaged Skrewww consumer facts.`,
    },
  };
}
