/**
 * Regression guards for the built `@skrewww/react` package output. Pure string
 * checks, reused by the package build and the consumer smoke test, so the
 * package fails fast if a framework, docs-app or repository-alias dependency
 * sneaks back into what would be published.
 */

export type OutputViolation = { file: string; rule: string; match: string };

type Rule = { rule: string; pattern: RegExp; appliesTo: "code" | "all" };

// Only patterns that indicate a REAL runtime/declaration dependency — import
// specifiers — never loose words that could appear in prose or identifiers.
const RULES: Rule[] = [
  { rule: "next import", pattern: /(?:from|import)\s*\(?\s*["']next(?:\/[^"']*)?["']/, appliesTo: "code" },
  { rule: "repository alias (@/components)", pattern: /["']@\/components\//, appliesTo: "code" },
  { rule: "repository alias (@/lib)", pattern: /["']@\/lib\//, appliesTo: "code" },
  { rule: "repository alias (@/styles)", pattern: /["']@\/styles\//, appliesTo: "code" },
  { rule: "recharts import", pattern: /(?:from|import)\s*\(?\s*["']recharts(?:\/[^"']*)?["']/, appliesTo: "code" },
  { rule: "@vercel import", pattern: /(?:from|import)\s*\(?\s*["']@vercel\//, appliesTo: "code" },
  { rule: "server-only import", pattern: /(?:from|import)\s*\(?\s*["']server-only["']/, appliesTo: "code" },
  { rule: "@next import", pattern: /(?:from|import)\s*\(?\s*["']@next\//, appliesTo: "code" },
];

export function checkBuiltFile(file: string, content: string): OutputViolation[] {
  const isCode = /\.(?:js|mjs|cjs|d\.ts|ts)$/.test(file);
  const violations: OutputViolation[] = [];
  for (const { rule, pattern, appliesTo } of RULES) {
    if (appliesTo === "code" && !isCode) continue;
    const match = pattern.exec(content);
    if (match) violations.push({ file, rule, match: match[0] });
  }
  return violations;
}
