import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function parseVersion(value) {
  return String(value)
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

export function compareVersions(leftVersion, rightVersion) {
  const left = parseVersion(leftVersion);
  const right = parseVersion(rightVersion);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

function satisfiesComparator(currentVersion, token) {
  const match = token.match(/^(>=|>|<=|<|=)?(.+)$/);
  if (!match) return false;
  const operator = match[1] || "=";
  const compared = compareVersions(currentVersion, match[2]);
  switch (operator) {
    case ">=":
      return compared >= 0;
    case ">":
      return compared > 0;
    case "<=":
      return compared <= 0;
    case "<":
      return compared < 0;
    default:
      return compared === 0;
  }
}

export function satisfiesEngineRange(currentVersion, range) {
  if (typeof range !== "string" || !range.trim()) return false;

  return range.split("||").some((clause) => {
    const tokens = clause.trim().split(/\s+/).filter(Boolean);
    return tokens.length > 0 && tokens.every((token) => satisfiesComparator(currentVersion, token));
  });
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const required = pkg.engines?.node;

  if (!required) {
    console.error("verify-node: package.json engines.node is not configured.");
    process.exit(1);
  }

  const current = process.versions.node;

  if (!satisfiesEngineRange(current, required)) {
    console.error(
      `Unsupported Node.js runtime: found ${current}, requires ${required}. Use .nvmrc / .node-version and a Node version inside that range.`,
    );
    process.exit(1);
  }

  console.log(`Node runtime verified: ${current} (requires ${required})`);
}

const invokedDirectly =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (invokedDirectly) {
  main();
}
