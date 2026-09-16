import type { GeneratedManifest } from "@/lib/guard/generated-artifacts";
import type { RuleEvaluation } from "@/lib/guard/rule-types";

/**
 * `distribution/hostrequirements-leak` — docs/architecture/
 * guard-readiness-audit.md §3.6. **Internal repository only** — checks
 * real generated shadcn manifests (`public/r/*.json`, excluding the
 * `registry.json` discovery index, a different shape), never a
 * consumer's own project.
 *
 * `hostRequirements` is legitimate, canonical, internal-only metadata on
 * `ComponentRegistryEntry` (`lib/component-registry.ts`) — that is NOT
 * a violation on its own. The violation is specifically the string
 * "hostRequirements" appearing in the PUBLIC, GENERATED manifest output,
 * mirroring the exact pattern `lib/shadcn-registry-generator.test.ts`
 * already uses repeatedly (`expect(JSON.stringify(manifest)).not
 * .toMatch(/hostRequirements/)`), generalized here to every generated
 * manifest rather than one hardcoded example at a time.
 */
export function evaluateDistributionHostrequirementsLeak(manifests: GeneratedManifest[]): RuleEvaluation[] {
  const ruleId = "distribution/hostrequirements-leak" as const;

  return manifests.map((manifest): RuleEvaluation => {
    const serialized = JSON.stringify(manifest.json);
    if (!serialized.includes("hostRequirements")) {
      return { status: "pass", ruleId, subject: { kind: "manifest", id: manifest.fileName } };
    }

    return {
      status: "violation",
      finding: {
        ruleId,
        severity: "error",
        subject: { kind: "manifest", id: manifest.fileName },
        canonicalEvidence: `public/r/${manifest.fileName}: serialized manifest contains the string "hostRequirements"`,
        details: `Generated manifest "${manifest.fileName}" leaks hostRequirements — canonical/internal-only metadata must never appear in public distributed output.`,
      },
    };
  });
}
