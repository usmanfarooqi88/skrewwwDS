import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
const rootLock = lock.packages?.[""];

if (!rootLock) {
  console.error("verify-package: package-lock.json is missing the root package entry.");
  process.exit(1);
}

const errors = [];

if (rootLock.name !== pkg.name) {
  errors.push(`package name mismatch: package.json=${pkg.name}, lockfile=${rootLock.name}`);
}

if (rootLock.version !== pkg.version) {
  errors.push(`package version mismatch: package.json=${pkg.version}, lockfile=${rootLock.version}`);
}

for (const dependencyName of Object.keys(pkg.dependencies ?? {})) {
  if (!(dependencyName in (rootLock.dependencies ?? {}))) {
    errors.push(`missing root dependency in lockfile: ${dependencyName}`);
  }
}

for (const dependencyName of Object.keys(pkg.devDependencies ?? {})) {
  if (!(dependencyName in (rootLock.devDependencies ?? {}))) {
    errors.push(`missing root devDependency in lockfile: ${dependencyName}`);
  }
}

if (errors.length) {
  console.error("Package metadata verification failed:\n" + errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}

console.log(`Package metadata verified: ${pkg.name}@${pkg.version}`);
