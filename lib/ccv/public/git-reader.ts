import { spawnSync } from "node:child_process";
import type { GitReader } from "@/lib/ccv/public/release-identity";

/** Real git for the CLIs: read-only commands only (rev-parse, status, cat-file, diff). Undefined on a non-zero exit. */
export function execGitReader(cwd: string): GitReader {
  return (args) => {
    const result = spawnSync("git", args, { cwd, encoding: "utf8", timeout: 60_000 });
    return result.status === 0 ? result.stdout.trim() : undefined;
  };
}
