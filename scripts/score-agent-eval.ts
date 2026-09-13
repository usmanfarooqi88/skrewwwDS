/**
 * Scores a completed OFF/ON run directory into report.json + SUMMARY.md.
 *
 * Expected layout:
 *   evals/agent-kit/runs/<run-id>/
 *     metadata.json
 *     off/<case-id>.json   (raw model output string or { "raw": "..." })
 *     on/<case-id>.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EVAL_CASES } from "../evals/agent-kit/cases";
import { authoredRecipes } from "../agent/recipes";
import { compileAllContracts } from "../lib/agent-kit/contract-compiler";
import { compileAllRecipes } from "../lib/agent-kit/recipe-compiler";
import { buildPairedReport, scoreEvalCase } from "../lib/agent-kit/evaluation-scorer";
import type { EvalCaseScore, EvalCondition } from "../lib/agent-kit/evaluation-schema";

const runId = process.argv[2];
if (!runId) {
  console.error("Usage: tsx scripts/score-agent-eval.ts <run-id>");
  process.exit(1);
}

const runDir = join(process.cwd(), "evals", "agent-kit", "runs", runId);
const metadata = JSON.parse(readFileSync(join(runDir, "metadata.json"), "utf8")) as {
  sourceGitSha: string;
  modelIdentifier: string;
  executionEnvironment: string;
  isolationNotes: string;
  sourceGitCommitTimestamp?: string;
};

const options = {
  sourceGitSha: metadata.sourceGitSha,
  sourceGitCommitTimestamp: metadata.sourceGitCommitTimestamp ?? "1970-01-01T00:00:00Z",
};

const { contracts } = compileAllContracts(options);
compileAllRecipes(authoredRecipes, contracts, options);

function readRaw(condition: EvalCondition, caseId: string): string {
  const path = join(runDir, condition, `${caseId}.json`);
  const text = readFileSync(path, "utf8");
  try {
    const parsed = JSON.parse(text) as { raw?: string } | string;
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed.raw === "string") return parsed.raw;
    return text;
  } catch {
    return text;
  }
}

const caseScores: EvalCaseScore[] = [];
for (const evalCase of EVAL_CASES) {
  for (const condition of ["off", "on"] as const) {
    const rawOutput = readRaw(condition, evalCase.id);
    caseScores.push(
      scoreEvalCase({
        evalCase,
        condition,
        rawOutput,
        contracts,
      }),
    );
  }
}

const report = buildPairedReport({
  sourceGitSha: metadata.sourceGitSha,
  modelIdentifier: metadata.modelIdentifier,
  executionEnvironment: metadata.executionEnvironment,
  isolationNotes: metadata.isolationNotes,
  caseScores,
});

writeFileSync(join(runDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

const summary = [
  `# AK-5 evaluation summary — ${runId}`,
  "",
  `- Source SHA: \`${report.sourceGitSha}\``,
  `- Model: ${report.modelIdentifier}`,
  `- Environment: ${report.executionEnvironment}`,
  `- Isolation: ${report.isolationNotes}`,
  `- Release gate: **${report.releaseGate.passed ? "PASSED" : "FAILED"}**`,
  ...(report.releaseGate.reasons.length
    ? report.releaseGate.reasons.map((r) => `  - ${r}`)
    : ["  - all hard gates satisfied"]),
  "",
  "## OFF",
  "",
  "```json",
  JSON.stringify(report.off, null, 2),
  "```",
  "",
  "## ON",
  "",
  "```json",
  JSON.stringify(report.on, null, 2),
  "```",
  "",
  "## Deltas (ON − OFF)",
  "",
  "```json",
  JSON.stringify(report.deltas, null, 2),
  "```",
  "",
  "## Per-case hard errors",
  "",
  ...report.caseScores
    .filter((s) => s.hardErrors.length > 0)
    .map(
      (s) =>
        `- **${s.condition.toUpperCase()} / ${s.caseId}**: ${s.hardErrors.map((e) => `${e.kind}: ${e.detail}`).join("; ")}`,
    ),
  "",
].join("\n");

writeFileSync(join(runDir, "SUMMARY.md"), summary);
console.log(`Wrote ${join(runDir, "report.json")} and SUMMARY.md`);
console.log(`Release gate: ${report.releaseGate.passed ? "PASSED" : "FAILED"}`);
