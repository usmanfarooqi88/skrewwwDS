/**
 * Read-only debug CLI for the CCV-1 expected consumer contract.
 *
 *   npm run ccv:contract -- shadcn button [--mode LOCAL_CANONICAL|PUBLIC_REGISTRY]
 *   npm run ccv:contract -- shadcn --list
 *   npm run ccv:contract -- npm @skrewww/react [--mode LOCAL_TARBALL|PUBLIC_NPM]
 *
 * Prints deterministic JSON to stdout. Writes nothing, performs no network
 * request, installs nothing and runs no consumer — it derives EXPECTATIONS from
 * the repository at the current commit. Exit 0 ok; 1 unknown subject, distribution
 * or mode; 2 a derivation or validation failure.
 */
import { deriveNpmContract, type NpmContractMode } from "../lib/ccv/derive-npm-contract";
import { deriveShadcnContract, listDistributedItemNames, type ShadcnContractMode } from "../lib/ccv/derive-shadcn-contract";
import { serializeConsumerContract } from "../lib/ccv/serialize";
import { validateConsumerContract } from "../lib/ccv/validate";
import { readGitInfo } from "../lib/audit/collect-repo-facts";

const args = process.argv.slice(2);
const modeIndex = args.indexOf("--mode");
const mode = modeIndex >= 0 ? args[modeIndex + 1] : undefined;
const positional = args.filter((arg, index) => !arg.startsWith("--") && args[index - 1] !== "--mode");
const [distribution, subject] = positional;

const usage = "usage: npm run ccv:contract -- <shadcn <item> | shadcn --list | npm @skrewww/react> [--mode <mode>]";
const fail = (message: string, code: number): never => {
  process.stderr.write(`${message}\n`);
  process.exit(code);
};

if (!distribution) fail(usage, 1);
if (distribution === "shadcn" && args.includes("--list")) {
  process.stdout.write(`${listDistributedItemNames().join("\n")}\n`);
  process.exit(0);
}
if (!subject) fail(usage, 1);

try {
  const { sha } = readGitInfo(process.cwd());
  let contract;
  if (distribution === "shadcn") {
    if (mode !== undefined && mode !== "LOCAL_CANONICAL" && mode !== "PUBLIC_REGISTRY") fail(`invalid mode "${mode}" for shadcn (LOCAL_CANONICAL | PUBLIC_REGISTRY)`, 1);
    contract = deriveShadcnContract(subject, { gitSha: sha, mode: mode as ShadcnContractMode | undefined });
    if (!contract) fail(`"${subject}" is not a distributed shadcn item (try: npm run ccv:contract -- shadcn --list)`, 1);
  } else if (distribution === "npm") {
    if (mode !== undefined && mode !== "LOCAL_TARBALL" && mode !== "PUBLIC_NPM") fail(`invalid mode "${mode}" for npm (LOCAL_TARBALL | PUBLIC_NPM)`, 1);
    contract = deriveNpmContract({ gitSha: sha, mode: mode as NpmContractMode | undefined });
    if (contract.subject !== subject) fail(`"${subject}" is not a known npm subject (this repository publishes ${contract.subject})`, 1);
  } else {
    fail(`unknown distribution "${distribution}" (shadcn | npm)`, 1);
  }
  const validation = validateConsumerContract(contract);
  if (!validation.ok) fail(`derived contract failed validation:\n  - ${validation.problems.join("\n  - ")}`, 2);
  process.stdout.write(serializeConsumerContract(contract as NonNullable<typeof contract>));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error), 2);
}
