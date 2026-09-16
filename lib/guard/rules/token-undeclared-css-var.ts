import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { componentRegistry, type ComponentRegistryEntry } from "@/lib/component-registry";
import { extractCssVarRefs } from "@/lib/css-custom-properties";
import type { RuleEvaluation } from "@/lib/guard/rule-types";

/**
 * `token/undeclared-css-var` — docs/architecture/guard-readiness-audit
 * .md §3.7. **Internal repository only** — this rule reads
 * `lib/component-registry.ts`'s canonical `cssTokens` field (NOT the
 * broader `tokensUsed` field, which serves a different purpose per
 * `docs/architecture/agent-kit.md`'s R1 token-precedence rule; the real
 * cssTokens-accuracy check in `lib/component-registry.test.ts` has
 * always validated against `entry.cssTokens` specifically — this rule
 * matches that exactly) and each component's own owned CSS files, both
 * of which only exist inside this repository. It is not, and cannot be,
 * consumer-project validation — a consumer only receives the rendered
 * `.css` output, never the registry entry to check it against (see
 * docs/architecture/guard-readiness-audit.md §8's own finding on this).
 *
 * Reuses `extractCssVarRefs` (extracted from `lib/component-registry
 * .test.ts` into `lib/css-custom-properties.ts` specifically so this
 * rule and that test share one deterministic scanner — see
 * docs/architecture/guard-readiness-audit.md §15's "avoid duplicating
 * logic" finding) rather than re-implementing the regex.
 *
 * **Only the under-declaration direction is checked** — a `var(--x)`
 * reference in a component's own CSS that is absent from `cssTokens`.
 * Over-declaration (`cssTokens` listing a token the CSS doesn't
 * reference) is deliberately NOT flagged: PH-0 and the readiness audit
 * both found this direction unsafe, since some entries (Avatar,
 * Calendar Day, Pagination, Data Table) intentionally declare a
 * Figma-verified-narrower set than raw CSS usage would suggest — see
 * `docs/architecture/agent-kit.md`'s R1 rule.
 */
export type CssFileReader = (absolutePath: string) => string | undefined;

const defaultReadCssFile: CssFileReader = (absolutePath) =>
  existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : undefined;

/**
 * `registry` and `readCssFile` are injectable purely for testability
 * (proving the violation path against a synthetic entry without editing
 * the real canonical registry) — both default to the real repo's own
 * canonical data and real filesystem, so ordinary callers get exactly
 * the same behavior as before this parameterization.
 */
export function evaluateTokenUndeclaredCssVar(
  root: string = process.cwd(),
  registry: readonly ComponentRegistryEntry[] = componentRegistry,
  readCssFile: CssFileReader = defaultReadCssFile,
): RuleEvaluation[] {
  const ruleId = "token/undeclared-css-var" as const;
  const evaluations: RuleEvaluation[] = [];

  for (const entry of registry) {
    const cssFiles = (entry.files ?? []).filter((relPath) => relPath.endsWith(".css"));
    if (cssFiles.length === 0) {
      evaluations.push({ status: "not-applicable", ruleId, reason: `"${entry.slug}" owns no CSS files.` });
      continue;
    }

    const found = new Set<string>();
    for (const relPath of cssFiles) {
      const content = readCssFile(join(root, relPath));
      if (content === undefined) continue; // a missing file is a different concern, not this rule's
      for (const token of extractCssVarRefs(content)) {
        found.add(token);
      }
    }

    const declared = new Set(entry.cssTokens ?? []);
    const missing = Array.from(found)
      .filter((token) => !declared.has(token))
      .sort();

    if (missing.length === 0) {
      evaluations.push({ status: "pass", ruleId, subject: { kind: "component", id: entry.slug } });
      continue;
    }

    for (const token of missing) {
      evaluations.push({
        status: "violation",
        finding: {
          ruleId,
          severity: "error",
          subject: { kind: "token", id: token },
          canonicalEvidence: `${cssFiles.join(", ")}: references var(${token}); "${entry.slug}"'s cssTokens does not list it`,
          details: `"${entry.slug}"'s own CSS references ${token}, which is missing from its canonical cssTokens declaration.`,
        },
      });
    }
  }

  return evaluations;
}
