import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { sha256OfBytes } from "@/lib/ccv/shadcn/fs-snapshot";

/**
 * CCV-3 — packed artifact vs installed package. Both sides are reduced to
 * path → SHA-256; no file body is kept. The installed side is read from the
 * consumer's `node_modules/<package>`; a nested `node_modules` (dependency state)
 * is excluded and symlinks are reported, because the subject must be a real copy.
 */

export type FileHashes = Map<string, { sha256: string; bytes: number }>;

export function hashFiles(files: Map<string, Buffer>): FileHashes {
  const out: FileHashes = new Map();
  files.forEach((data, path) => out.set(path, { sha256: sha256OfBytes(data), bytes: data.length }));
  return out;
}

export function readInstalledPackage(dir: string): { files: FileHashes; symlinks: string[] } {
  const files: FileHashes = new Map();
  const symlinks: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      const rel = relative(dir, full).split(sep).join("/");
      if (entry.isSymbolicLink() || lstatSync(full).isSymbolicLink()) symlinks.push(rel);
      else if (entry.isDirectory()) {
        if (entry.name !== "node_modules") walk(full);
      } else if (entry.isFile()) {
        const data = readFileSync(full);
        files.set(rel, { sha256: sha256OfBytes(data), bytes: data.length });
      }
    }
  };
  walk(dir);
  return { files, symlinks };
}

export type PackedVsInstalled = {
  equal: string[];
  missing: string[];
  unexpected: string[];
  differing: Array<{ path: string; packed: string; installed: string }>;
};

export function comparePackedInstalled(packed: FileHashes, installed: FileHashes): PackedVsInstalled {
  const result: PackedVsInstalled = { equal: [], missing: [], unexpected: [], differing: [] };
  for (const [path, entry] of Array.from(packed.entries()).sort(([a], [b]) => (a < b ? -1 : 1))) {
    const other = installed.get(path);
    if (!other) result.missing.push(path);
    else if (other.sha256 === entry.sha256) result.equal.push(path);
    else result.differing.push({ path, packed: entry.sha256, installed: other.sha256 });
  }
  result.unexpected = Array.from(installed.keys()).filter((path) => !packed.has(path)).sort();
  return result;
}
