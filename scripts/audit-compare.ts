/**
 * Developer/debug CLI for the AG-1D comparator. Prints the deterministic
 * AuditComparison JSON for one canonical slug to stdout.
 *
 *   npm run audit:compare -- alert
 *
 * Read-only: no file writes (no `audit/` output), no Figma, no network, no
 * model. FAIL findings are a valid audit result and exit 0. Exit 1 for a
 * missing argument or unknown slug, 2 for any other invalid input.
 */
import { serializeAuditComparison } from "../lib/audit/compare-audit-evidence";
import { loadAndCompare } from "../lib/audit/load-audit-inputs";

const slug = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
if (!slug) {
  process.stderr.write("usage: npm run audit:compare -- <component-slug>\n");
  process.exit(1);
}
const result = loadAndCompare(process.cwd(), slug);
if (!result.ok) {
  process.stderr.write(`${result.error.code}: ${result.error.message}\n`);
  for (const problem of result.error.problems ?? []) process.stderr.write(`  - ${problem}\n`);
  process.exit(result.error.code === "UNKNOWN_SLUG" ? 1 : 2);
}
process.stdout.write(serializeAuditComparison(result.comparison));
