/**
 * Release-gate check: after the build, the tracked tree must be unchanged and
 * no generated output may be tracked. Unlike CI's `git status --porcelain`
 * check it ignores untracked files, so it is usable from a developer checkout.
 */
import { execFileSync } from "node:child_process";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
const problems = [];

const changed = git("diff", "--name-only", "HEAD").trim();
if (changed) problems.push(`tracked files differ from HEAD:\n${changed}`);

const trackedGenerated = git("ls-files", "public/r", "public/agent", "packages/react/dist", "packages/react/.build", "packages/react/*.tgz").trim();
if (trackedGenerated) problems.push(`generated output is tracked:\n${trackedGenerated}`);

if (problems.length > 0) {
  console.error(`verify-clean-tracked-state failed:\n${problems.join("\n")}`);
  process.exit(1);
}
console.log("Tracked tree is clean and no generated output is tracked.");
