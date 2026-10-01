/**
 * Release-integrity guard for @skrewww/react. Run by the package's
 * `prepublishOnly` (via `npm run prepublish:react-package`) and runnable by
 * hand. It never publishes and never touches the network.
 *
 *  1. Always rebuilds `dist` from canonical source (clean first), so a stale,
 *     missing or partial `dist` can never be published.
 *  2. Re-checks the built JS and declarations for next/recharts/@vercel/@ leaks.
 *  3. Verifies every name the generated entry exports is present in the build
 *     and that every declaration import resolves (incomplete/inconsistent dist).
 *  4. Verifies the manifest release contract (public access, explicit beta tag,
 *     engines, exports, peers, no forbidden dependencies, prepublish guard).
 *  5. Verifies the real `npm pack --dry-run` file list is only package metadata
 *     and dist.
 *
 * Deliberately NOT run here: the Vite consumer + Chromium proof
 * (`npm run smoke:react-package`) and the repo-wide gates. Those are the
 * release gate, run before publication and in CI — not on every pack/publish.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { componentRegistry } from "../lib/component-registry";
import { buildReactPackageEntry } from "../lib/react-package/pilot-entry";
import { checkBuiltFile } from "../lib/react-package/output-checks";
import {
  checkDistIntegrity,
  checkManifest,
  checkPackedFiles,
  extractExportedNames,
  isPublishBlockedByPrivate,
  type ReleaseIssue,
} from "../lib/react-package/release-checks";
import { buildReactPackage } from "./build-react-package";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgRoot = join(root, "packages", "react");
const dist = join(pkgRoot, "dist");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

async function main(): Promise<void> {
  const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"));
  const issues: ReleaseIssue[] = [];

  console.log("[1/5] Rebuild dist from canonical source (clean build)");
  await buildReactPackage();

  console.log("[2/5] Output leak checks (next, recharts, @vercel, repository aliases)");
  for (const file of walk(dist)) {
    for (const v of checkBuiltFile(relative(pkgRoot, file), readFileSync(file, "utf8"))) {
      issues.push({ area: "output", message: `${v.file}: ${v.rule} (${v.match})` });
    }
  }

  console.log("[3/5] Dist integrity (required files, expected exports, declaration imports)");
  const barrel = readFileSync(join(root, "components", "ui", "index.ts"), "utf8");
  const expected = extractExportedNames(buildReactPackageEntry(componentRegistry, barrel).source);
  issues.push(...checkDistIntegrity(dist, expected));

  console.log("[4/5] Manifest release contract");
  issues.push(...checkManifest(pkg));

  console.log("[5/5] npm pack --dry-run file list");
  const dry = JSON.parse(
    execFileSync("npm", ["pack", "--dry-run", "--json"], { cwd: pkgRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }),
  )[0] as { files: { path: string }[]; entryCount: number; size: number; unpackedSize: number };
  issues.push(...checkPackedFiles(dry.files.map((f) => f.path)));
  console.log(`  ${dry.entryCount} files, ${dry.size} B packed, ${dry.unpackedSize} B unpacked`);

  if (issues.length > 0) {
    for (const issue of issues) console.error(`  ✖ [${issue.area}] ${issue.message}`);
    console.error(`\n@skrewww/react is NOT safe to publish (${issues.length} issue(s)).`);
    process.exit(1);
  }
  console.log(`\n@skrewww/react@${pkg.version} package integrity checks passed (tag: ${pkg.publishConfig.tag}).`);
  if (isPublishBlockedByPrivate(pkg)) {
    console.log('Note: package.json has "private": true, so npm will refuse to publish until the release commit (MK-2C) removes it.');
  }
  console.log("This is not the release gate: also run the repo gates and `npm run smoke:react-package` before publishing.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
