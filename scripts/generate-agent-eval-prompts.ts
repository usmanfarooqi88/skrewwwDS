/**
 * Writes deterministic OFF/ON prompt bundles under evals/agent-kit/generated/.
 * Gitignored — regenerate via `npm run generate:agent-eval-prompts`.
 */
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { authoredRecipes } from "../agent/recipes";
import { EVAL_CASES } from "../evals/agent-kit/cases";
import { buildEvalPrompt } from "../evals/agent-kit/prompt-generator";
import { compileAllContracts } from "../lib/agent-kit/contract-compiler";
import { compileAllRecipes } from "../lib/agent-kit/recipe-compiler";
import { systemAgentContract } from "../lib/agent-kit/system-contract";

const OUT_ROOT = join(process.cwd(), "evals", "agent-kit", "generated");

function getSourceGitSha(): string {
  return execSync("git rev-parse HEAD").toString().trim();
}

function getSourceGitCommitTimestamp(): string {
  return execSync("git log -1 --format=%cI").toString().trim();
}

rmSync(OUT_ROOT, { recursive: true, force: true });
mkdirSync(OUT_ROOT, { recursive: true });

const options = {
  sourceGitSha: getSourceGitSha(),
  sourceGitCommitTimestamp: getSourceGitCommitTimestamp(),
};

const { contracts } = compileAllContracts(options);
const { recipes } = compileAllRecipes(authoredRecipes, contracts, options);
const systemContractJson = JSON.stringify(systemAgentContract, null, 2);

for (const evalCase of EVAL_CASES) {
  const caseDir = join(OUT_ROOT, evalCase.id);
  mkdirSync(caseDir, { recursive: true });
  for (const condition of ["off", "on"] as const) {
    const prompt = buildEvalPrompt({
      evalCase,
      condition,
      contracts,
      recipes,
      systemContractJson: condition === "on" ? systemContractJson : undefined,
    });
    writeFileSync(join(caseDir, `${condition}.md`), prompt);
  }
}

writeFileSync(
  join(OUT_ROOT, "manifest.json"),
  `${JSON.stringify(
    {
      sourceGitSha: options.sourceGitSha,
      sourceGitCommitTimestamp: options.sourceGitCommitTimestamp,
      caseIds: EVAL_CASES.map((c) => c.id),
    },
    null,
    2,
  )}\n`,
);

console.log(`Generated ${EVAL_CASES.length * 2} eval prompts under ${OUT_ROOT}`);
