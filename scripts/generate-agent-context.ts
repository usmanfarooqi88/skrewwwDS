/**
 * Writes Agent Kit's generated, local-only output to public/agent/.
 *
 * All compilation logic lives in lib/agent-kit/contract-compiler.ts (pure,
 * unit-tested). This script only resolves deterministic provenance (the
 * current commit SHA and its commit timestamp — never wall-clock generation
 * time) and writes files.
 *
 * public/agent/ is gitignored and not publicly routed in AK-1 — see
 * docs/architecture/agent-kit.md. Run via `npm run generate:agent-context`.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compileAllContracts } from "../lib/agent-kit/contract-compiler";
import { systemAgentContract } from "../lib/agent-kit/system-contract";

function getSourceGitSha(): string {
  return execSync("git rev-parse HEAD").toString().trim();
}

function getSourceGitCommitTimestamp(): string {
  // %cI = committer date, strict ISO 8601 — deterministic per SHA, distinct
  // from `git log`'s default human-readable format and from wall-clock
  // `new Date()` at generation time.
  return execSync("git log -1 --format=%cI").toString().trim();
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

const OUT_DIR = join(process.cwd(), "public", "agent");
const CONTRACTS_DIR = join(OUT_DIR, "contracts");

mkdirSync(CONTRACTS_DIR, { recursive: true });

const options = {
  sourceGitSha: getSourceGitSha(),
  sourceGitCommitTimestamp: getSourceGitCommitTimestamp(),
};

const { contracts, index } = compileAllContracts(options);

writeJson(join(OUT_DIR, "index.json"), index);
writeJson(join(OUT_DIR, "system.json"), systemAgentContract);

for (const contract of contracts) {
  writeJson(join(CONTRACTS_DIR, `${contract.slug}.json`), contract);
}

console.log(`Generated Agent Kit context (source ${options.sourceGitSha.slice(0, 7)}):`);
console.log(` - ${join(OUT_DIR, "index.json")}`);
console.log(` - ${join(OUT_DIR, "system.json")}`);
console.log(` - ${CONTRACTS_DIR}/*.json (${contracts.length} contracts)`);
