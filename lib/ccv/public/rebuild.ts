import { existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { hashFiles } from "@/lib/ccv/npm/package-files";
import { packageRelative, readTarGz } from "@/lib/ccv/npm/tarball";
import { sri512, type RebuildOutcome } from "@/lib/ccv/public/npm-provenance";
import { classifyOutcome, describeOutcome, type CommandOutcome, type CommandSpec } from "@/lib/ccv/runner/process";

/**
 * CCV-5 — rebuild the package at the release commit in a scratch clone and pack it
 * with the real `npm pack`. The clone is a checkout of the expected commit; the
 * working tree is never built, so uncommitted changes cannot leak into the
 * comparison. node_modules is the repository's own (the lockfile is unchanged since
 * the release, which the source-identity check reports). Output is the same shape the
 * verifier reads a public tarball into, so equality is a single integrity compare.
 */

export type StepFn = (spec: Omit<CommandSpec, "env" | "timeoutMs"> & { limitMs: number }) => Promise<CommandOutcome>;

export async function rebuildAtCommit(input: { repoRoot: string; commit: string; workDir: string; step: StepFn; limits: { cloneMs: number; buildMs: number } }): Promise<RebuildOutcome> {
  const fail = (phase: string, outcome: CommandOutcome): RebuildOutcome => ({ ok: false, reason: `${phase}: ${describeOutcome(outcome)}`.slice(0, 300), environment: classifyOutcome(outcome) === "environment" });
  const clone = join(input.workDir, "rebuild");
  const clonePhase = await input.step({ phase: "rebuild-clone", command: "git", args: ["clone", "--quiet", input.repoRoot, clone], cwd: input.workDir, limitMs: input.limits.cloneMs });
  if (classifyOutcome(clonePhase) !== "ok") return fail("git clone", clonePhase);
  const checkout = await input.step({ phase: "rebuild-checkout", command: "git", args: ["checkout", "--quiet", "--detach", input.commit], cwd: clone, limitMs: input.limits.cloneMs });
  if (classifyOutcome(checkout) !== "ok") return fail(`git checkout ${input.commit}`, checkout);
  const modules = join(input.repoRoot, "node_modules");
  if (!existsSync(modules)) return { ok: false, reason: "the repository has no node_modules to build with", environment: true };
  symlinkSync(modules, join(clone, "node_modules"));
  const build = await input.step({ phase: "rebuild-build", command: "npm", args: ["run", "build:react-package"], cwd: clone, limitMs: input.limits.buildMs });
  if (classifyOutcome(build) !== "ok") return fail("npm run build:react-package", build);
  const out = join(input.workDir, "rebuild-pack");
  mkdirSync(out, { recursive: true });
  const pack = await input.step({ phase: "rebuild-pack", command: "npm", args: ["pack", "--pack-destination", out, "--json"], cwd: join(clone, "packages", "react"), limitMs: input.limits.cloneMs });
  if (classifyOutcome(pack) !== "ok") return fail("npm pack", pack);
  const tarball = readdirSync(out).find((name) => name.endsWith(".tgz"));
  if (!tarball) return { ok: false, reason: "npm pack produced no tarball", environment: false };
  const bytes = readFileSync(join(out, tarball));
  const { files } = packageRelative(readTarGz(bytes).files);
  return { ok: true, integrity: sri512(bytes), files: new Map(Array.from(hashFiles(files), ([path, hash]) => [path, hash.sha256] as const)) };
}
