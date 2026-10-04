import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, relative } from "node:path";
import { workspacePaths, type WorkspacePaths } from "@/lib/ccv/runner/env";

/**
 * CCV-2 — the run workspace: one fresh directory under the OS temp dir, never
 * inside the repository, holding the consumer, HOME, the npm cache and TMPDIR.
 * It is the ONLY path the runner creates, so cleanup is one removal.
 */

export const WORKSPACE_PREFIX = "skrewww-ccv-";

export type Workspace = WorkspacePaths & { consumer: string };

export function isInside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export function createWorkspace(repoRoot: string, base: string = tmpdir()): Workspace {
  const root = realpathSync(mkdtempSync(`${realpathSync(base)}/${WORKSPACE_PREFIX}`));
  const repo = realpathSync(repoRoot);
  if (isInside(repo, root) || isInside(root, repo)) {
    rmSync(root, { recursive: true, force: true });
    throw new Error(`refusing a CCV workspace that overlaps the repository (${root})`);
  }
  const paths = workspacePaths(root);
  for (const dir of [paths.home, paths.npmCache, paths.tmp]) mkdirSync(dir, { recursive: true });
  writeFileSync(`${paths.home}/.npmrc`, "", "utf8");
  return { ...paths, consumer: `${root}/consumer` };
}

export type CleanupOutcome = { removed: boolean; kept: boolean; error?: string };

export type Remover = (path: string) => void;

const defaultRemover: Remover = (path) => rmSync(path, { recursive: true, force: true, maxRetries: 3 });

export function cleanupWorkspace(workspace: Pick<Workspace, "root">, keep: boolean, remove: Remover = defaultRemover): CleanupOutcome {
  if (keep) return { removed: false, kept: true };
  try {
    remove(workspace.root);
    if (existsSync(workspace.root)) return { removed: false, kept: false, error: "workspace still exists after removal" };
    return { removed: true, kept: false };
  } catch (error) {
    return { removed: false, kept: false, error: error instanceof Error ? error.message : String(error) };
  }
}
