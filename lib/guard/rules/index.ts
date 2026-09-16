import type { RuleCatalogEntry } from "@/lib/guard/rule-types";

export { evaluateComponentNonexistentSlug } from "@/lib/guard/rules/component-nonexistent-slug";
export { evaluateMaturityFalseStableClaim } from "@/lib/guard/rules/maturity-false-stable-claim";
export { evaluateDistributionFalseInstallableClaim } from "@/lib/guard/rules/distribution-false-installable-claim";
export { evaluateTokenUndeclaredCssVar } from "@/lib/guard/rules/token-undeclared-css-var";
export { evaluateDistributionHostrequirementsLeak } from "@/lib/guard/rules/distribution-hostrequirements-leak";
export { evaluateDistributionHosthostSchemaConsistency } from "@/lib/guard/rules/distribution-hosthost-schema-consistency";

/**
 * Deterministic catalog of every implemented G-1 rule — id/severity/
 * domain metadata only, matching the task's own explicit instruction:
 * "Do not add: marketing descriptions, configuration defaults,
 * suppression config, CLI formatter strings." `api/nonexistent-prop` is
 * deliberately absent — see `rules/api-nonexistent-prop.ts` for why it's
 * BLOCKED, not implemented, in G-1.
 */
export const GUARD_RULE_CATALOG: readonly RuleCatalogEntry[] = [
  { id: "component/nonexistent-slug", severity: "error", domain: "public" },
  { id: "maturity/false-stable-claim", severity: "error", domain: "public" },
  { id: "distribution/false-installable-claim", severity: "error", domain: "public" },
  { id: "token/undeclared-css-var", severity: "error", domain: "internal" },
  { id: "distribution/hostrequirements-leak", severity: "error", domain: "internal" },
  { id: "distribution/hosthost-schema-consistency", severity: "error", domain: "internal" },
] as const;
