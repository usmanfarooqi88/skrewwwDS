import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import type { AuditArtifacts } from "@/lib/audit/audit-artifacts";

/**
 * AG-1F — the ONLY write path of the Audit Agent, and it writes exactly two
 * files: `<slug>.<sha>.json` and `<slug>.<sha>.md`, in one output directory.
 * It never touches source, registry, generated outputs, snapshots or Figma.
 *
 * - Output directory: `<repo>/audit` (default, gitignored) or any path outside
 *   the repository. Anywhere else inside the repo is refused, so the runner
 *   cannot be pointed at tracked source.
 * - Overwrite policy: an existing file with identical content is `unchanged`;
 *   an existing file with different content is refused unless `overwrite` is
 *   true. Both files are checked before either is written.
 * - Atomicity: each file is written to a temporary name in the same directory
 *   and renamed into place; a failed write leaves no partial artifact. The two
 *   renames are not one transaction, so a crash between them can leave the
 *   `.json` new and the `.md` old — rerun to converge (the output is deterministic).
 */

export const DEFAULT_AUDIT_OUT_DIR = "audit";

export type OutDirResult = { ok: true; dir: string } | { ok: false; message: string };

export function resolveAuditOutDir(repoRoot: string, outDir: string = DEFAULT_AUDIT_OUT_DIR): OutDirResult {
  const root = resolve(repoRoot);
  const dir = resolve(root, outDir);
  const rel = relative(root, dir);
  const inside = rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
  if (!inside) return { ok: true, dir };
  const auditRoot = resolve(root, DEFAULT_AUDIT_OUT_DIR);
  const relToAudit = relative(auditRoot, dir);
  if (relToAudit === "" || (!relToAudit.startsWith("..") && !isAbsolute(relToAudit))) return { ok: true, dir };
  return {
    ok: false,
    message: `refusing to write inside the repository outside ${DEFAULT_AUDIT_OUT_DIR}/ (got "${outDir}"); use ${DEFAULT_AUDIT_OUT_DIR}/… or a directory outside the repo`,
  };
}

export type WriteStatus = "written" | "unchanged" | "overwritten";

export type WriteAuditArtifactsResult =
  | { ok: true; files: Array<{ path: string; status: WriteStatus }> }
  | { ok: false; error: { code: "OUT_DIR_REFUSED" | "WOULD_OVERWRITE" | "WRITE_FAILED"; message: string; paths?: string[] } };

export function writeAuditArtifacts(options: { repoRoot: string; outDir?: string; artifacts: AuditArtifacts; overwrite?: boolean }): WriteAuditArtifactsResult {
  const resolved = resolveAuditOutDir(options.repoRoot, options.outDir);
  if (!resolved.ok) return { ok: false, error: { code: "OUT_DIR_REFUSED", message: resolved.message } };
  const { artifacts } = options;
  const targets = [
    { path: join(resolved.dir, artifacts.jsonName), content: artifacts.json },
    { path: join(resolved.dir, artifacts.markdownName), content: artifacts.markdown },
  ];

  const statuses = new Map<string, WriteStatus>();
  const conflicts: string[] = [];
  for (const target of targets) {
    if (!existsSync(target.path)) {
      statuses.set(target.path, "written");
    } else if (readFileSync(target.path, "utf8") === target.content) {
      statuses.set(target.path, "unchanged");
    } else if (options.overwrite) {
      statuses.set(target.path, "overwritten");
    } else {
      conflicts.push(target.path);
    }
  }
  if (conflicts.length > 0) {
    return { ok: false, error: { code: "WOULD_OVERWRITE", message: "an artifact with different content already exists; pass --overwrite to replace it", paths: conflicts } };
  }

  const temporaries: string[] = [];
  try {
    mkdirSync(resolved.dir, { recursive: true });
    const pending = targets.filter((target) => statuses.get(target.path) !== "unchanged");
    for (const target of pending) {
      const temporary = `${target.path}.tmp-${process.pid}`;
      temporaries.push(temporary);
      writeFileSync(temporary, target.content, { flag: "wx" });
    }
    pending.forEach((target, index) => renameSync(temporaries[index], target.path));
  } catch (error) {
    for (const temporary of temporaries) rmSync(temporary, { force: true });
    return { ok: false, error: { code: "WRITE_FAILED", message: error instanceof Error ? error.message : String(error) } };
  }
  return { ok: true, files: targets.map((target) => ({ path: target.path, status: statuses.get(target.path)! })) };
}
