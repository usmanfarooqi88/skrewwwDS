/**
 * Writes Agent Kit generated output to public/agent/:
 * - component contracts + index + system (AK-1)
 * - recipes + feature kits (AK-4)
 *
 * Compilation is pure (lib/agent-kit/*-compiler.ts). This script only
 * resolves deterministic git provenance and writes files.
 *
 * public/agent/ is gitignored. Run via `npm run generate:agent-context`.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { authoredFeatureKits, authoredRecipes } from "../agent/recipes";
import { compileAllContracts } from "../lib/agent-kit/contract-compiler";
import {
  compileAllFeatureKits,
  compileAllRecipes,
} from "../lib/agent-kit/recipe-compiler";
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
const RECIPES_DIR = join(OUT_DIR, "recipes");
const FEATURE_KITS_DIR = join(OUT_DIR, "feature-kits");

mkdirSync(CONTRACTS_DIR, { recursive: true });
mkdirSync(RECIPES_DIR, { recursive: true });
mkdirSync(FEATURE_KITS_DIR, { recursive: true });

const options = {
  sourceGitSha: getSourceGitSha(),
  sourceGitCommitTimestamp: getSourceGitCommitTimestamp(),
};

const { contracts, index } = compileAllContracts(options);
const { recipes, index: recipeIndex } = compileAllRecipes(authoredRecipes, contracts, options);
const { featureKits, index: featureKitIndex } = compileAllFeatureKits(
  authoredFeatureKits,
  recipes.map((recipe) => recipe.id),
  options,
);

writeJson(join(OUT_DIR, "index.json"), index);
writeJson(join(OUT_DIR, "system.json"), systemAgentContract);

for (const contract of contracts) {
  writeJson(join(CONTRACTS_DIR, `${contract.slug}.json`), contract);
}

writeJson(join(RECIPES_DIR, "index.json"), recipeIndex);
for (const recipe of recipes) {
  writeJson(join(RECIPES_DIR, `${recipe.id}.json`), recipe);
}

writeJson(join(FEATURE_KITS_DIR, "index.json"), featureKitIndex);
for (const kit of featureKits) {
  writeJson(join(FEATURE_KITS_DIR, `${kit.id}.json`), kit);
}

console.log(`Generated Agent Kit context (source ${options.sourceGitSha.slice(0, 7)}):`);
console.log(` - ${join(OUT_DIR, "index.json")}`);
console.log(` - ${join(OUT_DIR, "system.json")}`);
console.log(` - ${CONTRACTS_DIR}/*.json (${contracts.length} contracts)`);
console.log(` - ${RECIPES_DIR}/*.json (${recipes.length} recipes + index)`);
console.log(` - ${FEATURE_KITS_DIR}/*.json (${featureKits.length} feature kits + index)`);
