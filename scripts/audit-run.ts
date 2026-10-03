/**
 * AG-1 Audit Agent runner (AG-1F). Composes the read-only pipeline and writes
 * the two documented artifacts — nothing else:
 *
 *   slug → RepoFacts → committed Figma snapshot → AuditComparison
 *        → (optional, externally produced) explanation response, validated
 *        → audit/<slug>.<sha>.json + audit/<slug>.<sha>.md
 *
 *   npm run audit:run -- alert
 *   npm run audit:run -- alert --response response.json     validated; rejected responses write nothing
 *   npm run audit:run -- alert --response -                 response from stdin
 *   npm run audit:run -- alert --out-dir /tmp/audit-out     any directory outside the repo, or audit/…
 *   npm run audit:run -- alert --overwrite                  replace existing artifacts with different content
 *   npm run audit:run -- alert --include-not-applicable
 *
 * It never calls a model, a network service or Figma, never edits source or
 * the registry, and writes no file other than the two artifacts. `audit/` is
 * gitignored. Exit 0 ok; 1 usage / unknown slug; 2 invalid inputs or a
 * rejected response; 3 would overwrite without --overwrite.
 */
import { readFileSync } from "node:fs";
import { buildAuditArtifacts } from "../lib/audit/audit-artifacts";
import { loadAndCompare } from "../lib/audit/load-audit-inputs";
import { writeAuditArtifacts } from "../lib/audit/write-audit-artifacts";

const VALUE_FLAGS = new Set(["--response", "--out-dir"]);
const args = process.argv.slice(2);
const slug = args.find((arg, index) => !arg.startsWith("-") && !VALUE_FLAGS.has(args[index - 1]));
const valueOf = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const responsePath = valueOf("--response");
const outDir = valueOf("--out-dir");
for (const flag of Array.from(VALUE_FLAGS)) {
  if (args.includes(flag) && !valueOf(flag)) {
    process.stderr.write(`${flag} needs a value\n`);
    process.exit(1);
  }
}
if (!slug) {
  process.stderr.write("usage: npm run audit:run -- <component-slug> [--response <file|->] [--out-dir <dir>] [--overwrite] [--include-not-applicable]\n");
  process.exit(1);
}

const repoRoot = process.cwd();
const compared = loadAndCompare(repoRoot, slug);
if (!compared.ok) {
  process.stderr.write(`${compared.error.code}: ${compared.error.message}\n`);
  for (const problem of compared.error.problems ?? []) process.stderr.write(`  - ${problem}\n`);
  process.exit(compared.error.code === "UNKNOWN_SLUG" ? 1 : 2);
}

let response: unknown = null;
if (responsePath) {
  try {
    response = JSON.parse(readFileSync(responsePath === "-" ? 0 : responsePath, "utf8"));
  } catch (error) {
    process.stderr.write(`INVALID_EXPLANATION_RESPONSE: could not read JSON (${error instanceof Error ? error.message : String(error)})\n`);
    process.exit(2);
  }
}

const built = buildAuditArtifacts({ comparison: compared.comparison, response, includeNotApplicable: args.includes("--include-not-applicable") });
if (!built.ok) {
  process.stderr.write(`${built.error.code}: ${built.error.message}\n`);
  for (const problem of built.error.problems ?? []) process.stderr.write(`  - ${problem.code}${problem.findingId ? ` [${problem.findingId}]` : ""}: ${problem.message}\n`);
  process.exit(2);
}

const written = writeAuditArtifacts({ repoRoot, outDir, artifacts: built.artifacts, overwrite: args.includes("--overwrite") });
if (!written.ok) {
  process.stderr.write(`${written.error.code}: ${written.error.message}\n`);
  for (const path of written.error.paths ?? []) process.stderr.write(`  - ${path}\n`);
  process.exit(written.error.code === "WOULD_OVERWRITE" ? 3 : 2);
}

const { summary } = compared.comparison;
process.stdout.write(
  [
    ...written.files.map((file) => `${file.status.padEnd(11)} ${file.path}`),
    `${slug} @ ${compared.comparison.provenance.repoGitSha}: pass ${summary.pass} · fail ${summary.fail} · unknown ${summary.unknown} · not-applicable ${summary.notApplicable} · intentional-difference ${summary.intentionalDifference}`,
    responsePath ? "explanations: validated external response" : "explanations: none supplied (deterministic-only report)",
    "No source, registry or Figma file was changed.",
    "",
  ].join("\n"),
);
