/**
 * Extracts every distinct `var(--custom-property-name)` reference from a
 * CSS text. Shared by `lib/component-registry.test.ts`'s cssTokens-
 * accuracy test and `lib/guard/rules/token-undeclared-css-var.ts` (Guard
 * G-1) — one deterministic helper, not two divergent scanners, per
 * docs/architecture/guard-readiness-audit.md §15's "avoid duplicating
 * logic" finding. Extracted out of the test file specifically so the
 * Guard rule can reuse it directly rather than re-implementing the same
 * regex — see docs/architecture/guard-foundation.md's G-1 section.
 */
export function extractCssVarRefs(css: string): string[] {
  const matches = css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g);
  return Array.from(new Set(Array.from(matches, (m) => m[1])));
}
