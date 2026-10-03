/**
 * Developer/debug CLI for the AG-1C repo facts collector. Prints normalized
 * RepoFacts JSON for one canonical component slug to stdout.
 *
 *   npm run audit:repo-facts -- button
 *
 * Read-only: writes no files, never checks out a ref, makes no Figma or
 * network call. Exit 0 on success, 1 for an unknown slug or missing argument,
 * 2 for any other collection failure. The final `audit/<slug>.<sha>.json`
 * writer belongs to the later Audit Agent pipeline, not here.
 */
import { collectRepoFacts, serializeRepoFacts } from "../lib/audit/collect-repo-facts";

const slug = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
if (!slug) {
  process.stderr.write("usage: npm run audit:repo-facts -- <component-slug>\n");
  process.exit(1);
}

const result = collectRepoFacts({ repoRoot: process.cwd(), slug });
if (!result.ok) {
  process.stderr.write(`${result.error.code}: ${result.error.message}\n`);
  process.exit(result.error.code === "UNKNOWN_SLUG" ? 1 : 2);
}
process.stdout.write(serializeRepoFacts(result.facts));
