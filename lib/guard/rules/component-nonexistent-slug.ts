import {
  classifyInternalImportProvenance,
  isKnownInternalHelperPath,
  resolveImportedFileBaseName,
  resolveInternalComponentSlug,
} from "@/lib/guard/provenance";
import type { ExtractedSourceFacts, JsxElementFact } from "@/lib/guard/types";
import type { RuleEvaluation } from "@/lib/guard/rule-types";

/**
 * `component/nonexistent-slug` — docs/architecture/guard-readiness-audit
 * .md §3.1. A violation requires a Skrewww identity CLAIM to actually be
 * established (an import whose module specifier is a known Skrewww
 * path), never mere name similarity. Every other JSX element —
 * intrinsic, local-or-unresolved, member-expression, or imported from a
 * non-Skrewww path — is `not-applicable`, never a finding, regardless of
 * how "Skrewww-like" its tag name looks (this is exactly what protects
 * `RequestForm`/`ReferencePageHeader`/any user component — see
 * provenance.ts's own module doc).
 */
export function evaluateComponentNonexistentSlug(facts: ExtractedSourceFacts): RuleEvaluation[] {
  if (!facts.ok) return [];

  return facts.jsxElements.map((element): RuleEvaluation => evaluateElement(facts.path, element));
}

function evaluateElement(path: string, element: JsxElementFact): RuleEvaluation {
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

  // A genuine Skrewww-path claim is now established.
  const slug = resolveInternalComponentSlug(element.resolution.import);
  const claimedName = element.resolution.import.importedName;

  if (slug) {
    return { status: "pass", ruleId, subject: { kind: "component", id: slug } };
  }

  // Before concluding "invented": is this a real, acknowledged internal
  // helper (Category C — bundled as another component's private
  // dependency, never independently public) rather than a genuinely
  // nonexistent file (Category E)? A real example: `components/ui/
  // icons.tsx` (Button's own internal dependency) has no public slug of
  // its own, but importing `PlusIcon`/`LoadingSpinner` from it is
  // legitimate, real, existing usage — not an invented-component claim.
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
