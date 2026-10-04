import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * CCV-2 — consumer filesystem snapshots (path → SHA-256) and their diff.
 * Dependency/build/VCS directories are excluded; everything else a consumer
 * owns is in scope, so any write outside the expected targets is visible.
 */

export const SNAPSHOT_EXCLUDED_DIRS: readonly string[] = ["node_modules", ".git", ".next"];

export type Snapshot = Map<string, string>;

export const sha256OfBytes = (bytes: Buffer | string): string => createHash("sha256").update(bytes).digest("hex");

export function snapshotTree(root: string, excluded: readonly string[] = SNAPSHOT_EXCLUDED_DIRS): Snapshot {
  const snapshot: Snapshot = new Map();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (excluded.includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) snapshot.set(relative(root, full).split(sep).join("/"), sha256OfBytes(readFileSync(full)));
    }
  };
  walk(root);
  return snapshot;
}

export type SnapshotDiff = { added: string[]; removed: string[]; modified: string[] };

export function diffSnapshots(before: Snapshot, after: Snapshot): SnapshotDiff {
  const added: string[] = [];
  const modified: string[] = [];
  after.forEach((hash, path) => {
    if (!before.has(path)) added.push(path);
    else if (before.get(path) !== hash) modified.push(path);
  });
  const removed = Array.from(before.keys()).filter((path) => !after.has(path));
  const byPath = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  return { added: added.sort(byPath), removed: removed.sort(byPath), modified: modified.sort(byPath) };
}
