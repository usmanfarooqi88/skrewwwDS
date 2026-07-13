import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const required = pkg.engines?.node;

if (!required) {
  console.error("verify-node: package.json engines.node is not configured.");
  process.exit(1);
}

const current = process.versions.node;
const minimum = required.replace(/^>=/, "");

function parseVersion(value) {
  return value.split(".").map((part) => Number(part));
}

function isAtLeast(currentVersion, minimumVersion) {
  const left = parseVersion(currentVersion);
  const right = parseVersion(minimumVersion);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

if (!isAtLeast(current, minimum)) {
  console.error(
    `Unsupported Node.js runtime: found ${current}, requires ${required}. Use .nvmrc and install Node ${minimum} or newer.`,
  );
  process.exit(1);
}

console.log(`Node runtime verified: ${current} (requires ${required})`);
