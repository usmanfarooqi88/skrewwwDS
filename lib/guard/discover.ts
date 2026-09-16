import { lstatSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { toProjectRelativePath } from "@/lib/guard/paths";

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".next-playwright",
  "dist",
  "build",
  "coverage",
  ".git",
  ".turbo",
  "out",
]);

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function isSkippedDir(name: string): boolean {
  return SKIP_DIR_NAMES.has(name);
}

function isSourceFile(name: string): boolean {
  if (name.endsWith(".d.ts")) return false;
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return SOURCE_EXTENSIONS.has(name.slice(dot));
}

/**
 * Discover `.ts`/`.tsx` files under `target` (file or directory).
 * Deterministic sorted project-relative paths. Does not follow symlink loops.
 */
export function discoverSourceFiles(target: string, projectRoot: string): string[] {
  const absoluteTarget = resolve(projectRoot, target);
  const st = statSync(absoluteTarget);

  if (st.isFile()) {
    if (!isSourceFile(absoluteTarget)) {
      return [];
    }
    return [toProjectRelativePath(absoluteTarget, projectRoot)];
  }

  if (!st.isDirectory()) {
    return [];
  }

  const results: string[] = [];
  const seenRealPaths = new Set<string>();

  function walk(dir: string): void {
    let real: string;
    try {
      real = lstatSync(dir).isSymbolicLink() ? resolve(dir) : dir;
    } catch {
      return;
    }
    if (seenRealPaths.has(real)) return;
    seenRealPaths.add(real);

    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    entries.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    for (const name of entries) {
      if (isSkippedDir(name)) continue;
      const full = join(dir, name);
      let entryStat;
      try {
        entryStat = lstatSync(full);
      } catch {
        continue;
      }
      if (entryStat.isSymbolicLink()) {
        // Do not follow symlinks — avoid loops and unexpected trees.
        continue;
      }
      if (entryStat.isDirectory()) {
        walk(full);
      } else if (entryStat.isFile() && isSourceFile(name)) {
        results.push(toProjectRelativePath(full, projectRoot));
      }
    }
  }

  walk(absoluteTarget);

  // Extra sort for stability across walk order edge cases.
  results.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return Array.from(new Set(results));
}

/** True if `candidate` is inside `root` (or equal). */
export function isPathInsideRoot(candidate: string, root: string): boolean {
  const rel = relative(resolve(root), resolve(candidate));
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== "..");
}
