/**
 * Developer CLI for the AG-1E explanation layer. Provider-neutral: it never
 * calls a model. Read-only: it writes nothing (no `audit/` output).
 *
 *   npm run audit:explain -- alert --request          print the explanation request JSON
 *   npm run audit:explain -- alert --response r.json  validate a structured response, print the Markdown report
 *   npm run audit:explain -- alert --response -       same, reading the response from stdin
 *   npm run audit:explain -- alert                    deterministic-only Markdown report (no prose)
 *
 * Exit 0 on success, 1 for usage errors or an unknown slug, 2 for invalid
 * inputs or a rejected response (problems are printed to stderr).
 */
import { readFileSync } from "node:fs";
import { buildExplanationRequest, serializeExplanationRequest } from "../lib/audit/build-explanation-request";
import { renderValidated } from "../lib/audit/explain-audit";
import { loadAndCompare } from "../lib/audit/load-audit-inputs";
import { renderAuditReport } from "../lib/audit/render-audit-report";

const args = process.argv.slice(2);
const slug = args.find((arg, index) => !arg.startsWith("-") && args[index - 1] !== "--response");
const responseIndex = args.indexOf("--response");
const responsePath = responseIndex >= 0 ? args[responseIndex + 1] : undefined;
if (!slug || (responseIndex >= 0 && !responsePath)) {
  process.stderr.write("usage: npm run audit:explain -- <component-slug> [--request | --response <file|->] [--include-not-applicable]\n");
  process.exit(1);
}

const compared = loadAndCompare(process.cwd(), slug);
if (!compared.ok) {
  process.stderr.write(`${compared.error.code}: ${compared.error.message}\n`);
  process.exit(compared.error.code === "UNKNOWN_SLUG" ? 1 : 2);
}
const request = buildExplanationRequest(compared.comparison, { includeNotApplicable: args.includes("--include-not-applicable") });

if (args.includes("--request")) {
  process.stdout.write(serializeExplanationRequest(request));
  process.exit(0);
}
if (!responsePath) {
  process.stdout.write(renderAuditReport({ comparison: compared.comparison, request, explanations: null }));
  process.exit(0);
}

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(responsePath === "-" ? 0 : responsePath, "utf8"));
} catch (error) {
  process.stderr.write(`INVALID_EXPLANATION_RESPONSE: could not read JSON (${error instanceof Error ? error.message : String(error)})\n`);
  process.exit(2);
}
const result = renderValidated(compared.comparison, request, raw);
if (!result.ok) {
  process.stderr.write(`${result.error.code}: ${result.error.message}\n`);
  for (const problem of result.error.problems) process.stderr.write(`  - ${problem.code}${problem.findingId ? ` [${problem.findingId}]` : ""}: ${problem.message}\n`);
  process.exit(2);
}
process.stdout.write(result.markdown);
