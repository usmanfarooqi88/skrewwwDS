import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { npmId } from "@/lib/ccv/ids";
import {
  CONSUMER_TSCONFIG,
  CCV_VITE_CONSUMER_PINS,
  INDEX_HTML,
  PROBE_PATH,
  VITE_CONFIG,
  compareRuntimeExports,
  consumerPackageJson,
  generateProbe,
  generateSurfaceHarness,
  judgeSpecifier,
  mainTsx,
  parseProbeOutput,
  type ProbeOutput,
  type VitePins,
} from "@/lib/ccv/npm/consumer";
import { classifyScripts, walkDependencyTree, type ManifestReader } from "@/lib/ccv/npm/lifecycle";
import { compareDependencies, compareIdentity, satisfiesRange, type InstalledManifest } from "@/lib/ccv/npm/manifest";
import { comparePackedInstalled, hashFiles, readInstalledPackage } from "@/lib/ccv/npm/package-files";
import { packageRelative, readTarGz } from "@/lib/ccv/npm/tarball";
import { buildChildEnv, redactEvidence, type ParentEnv } from "@/lib/ccv/runner/env";
import { CCV_TIME_LIMITS, CCV_TOOL_PINS, satisfiesNodeRange, type CcvTimeLimits } from "@/lib/ccv/runner/pins";
import { classifyOutcome, describeOutcome, type CommandOutcome, type CommandRunner, type CommandSpec } from "@/lib/ccv/runner/process";
import { assembleResult, evidence, exitCodeFor, listEvidence, truncate } from "@/lib/ccv/runner/result";
import { cleanupWorkspace, createWorkspace, type Remover } from "@/lib/ccv/runner/workspace";
import { diffSnapshots, sha256OfBytes, snapshotTree } from "@/lib/ccv/shadcn/fs-snapshot";
import { classifyDiagnostics, parseTscOutput } from "@/lib/ccv/shadcn/tsc-diagnostics";
import type { CcvFailureCode } from "@/lib/ccv/failure-codes";
import type { CcvAuthority, CcvCheck, CcvResult, NpmConsumerContract } from "@/lib/ccv/types";
import { checkBuiltFile } from "@/lib/react-package/output-checks";
import { FORBIDDEN_DEPENDENCIES, FORBIDDEN_DEPENDENCY_PREFIXES, checkDistIntegrity, checkPackedFiles, forbiddenDependencyNames } from "@/lib/react-package/release-checks";

/**
 * CCV-3 — orchestration of one LOCAL_TARBALL verification of the npm package.
 *
 *   CCV-1 npm contract → workspace (outside the repo, isolated env)
 *     → package built from canonical source (the existing build) → real `npm pack` into the workspace
 *     → tarball read and checked against the canonical pack rules
 *     → fresh Vite + React + TypeScript consumer (exact pins) → real `npm install` of the tarball
 *     → installed files vs packed files · installed manifest vs contract · dependencies / peers
 *     → lifecycle audit (package and its runtime dependency tree) · postinstall side effects
 *     → plain Node ESM probe (runtime export equality, public and denied specifiers)
 *     → installed declarations · strict tsc over a surface harness · vite build
 *     → second consumer installed with --ignore-scripts → cleanup → validated CcvResult
 *
 * Thin: judgements live in the pure modules next to this file; the command
 * runner, the package build, the workspace base and the remover are injectable.
 */

export type VerifyNpmInput = {
  repoRoot: string;
  gitSha: string;
  contract: NpmConsumerContract;
  /** Repository directory of the package (`packages/react`). */
  packageDir: string;
  /** Builds the candidate from canonical source (the CLI passes the existing `buildReactPackage`). */
  buildPackage: () => Promise<void>;
  run: CommandRunner;
  parentEnv: ParentEnv;
  keep?: boolean;
  nodeRange?: string;
  vitePins?: VitePins;
  limits?: CcvTimeLimits;
  workspaceBase?: string;
  remove?: Remover;
  now?: () => number;
  log?: (line: string) => void;
  nodeVersion?: string;
  platform?: string;
};

export type VerifyNpmOutput = { result: CcvResult; exitCode: 0 | 2 | 3; workspaceRoot: string; kept: boolean };

type Planned = { id: string; claim: string; authority: CcvAuthority };

const readJson = <T,>(path: string): T | undefined => (existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : undefined);

export async function verifyNpmLocalTarball(input: VerifyNpmInput): Promise<VerifyNpmOutput> {
  const now = input.now ?? Date.now;
  const log = input.log ?? (() => undefined);
  const limits = input.limits ?? CCV_TIME_LIMITS;
  const vitePins = input.vitePins ?? CCV_VITE_CONSUMER_PINS;
  const started = now();
  const deadline = started + limits.runMs;
  const contract = input.contract;
  const e = contract.expectations;
  const pkg = contract.subject;
  const id = (category: string, key: string) => npmId(pkg, category, key);
  const checks: CcvCheck[] = [];
  const add = (check: CcvCheck) => checks.push(check);

  // Every check this run intends to produce, so a check that cannot run becomes `unknown`, never silently absent.
  const planned: Planned[] = [
    { id: id("artifact", "build"), claim: "the candidate is built from canonical source with the existing package build", authority: "package-build-entry" },
    { id: id("artifact", "tarball"), claim: "a real npm tarball is produced in the isolated workspace", authority: "package-manifest" },
    { id: id("artifact", "pack-rules"), claim: "the tarball holds every required file and nothing the canonical pack rules forbid", authority: "package-manifest" },
    { id: id("install", "tarball"), claim: "the tarball installs into a fresh consumer as a real copy", authority: "package-manifest" },
    { id: id("file-set", "installed"), claim: "the installed package holds exactly the packed files", authority: "package-manifest" },
    ...["name", "version", "type", "engines", "exports", "side-effects"].map((field) => ({ id: id("manifest", field), claim: `the installed manifest's ${field} equals the contract`, authority: "package-manifest" as const })),
    ...Object.keys(e.dependencies.ranges.npm).map((name) => ({ id: id("dependency", name), claim: `dependency ${name} is declared with the contract range`, authority: "package-manifest" as const })),
    ...Object.keys(e.dependencies.ranges.peers).map((name) => ({ id: id("peer", name), claim: `peer ${name} is declared with the contract range`, authority: "package-manifest" as const })),
    ...Object.keys(e.dependencies.ranges.peers).map((name) => ({ id: id("peer-satisfied", name), claim: `the consumer satisfies peer ${name}`, authority: "package-manifest" as const })),
    ...Object.keys(e.dependencies.ranges.optional).map((name) => ({ id: id("optional", name), claim: `optional dependency ${name} is declared with the contract range`, authority: "package-manifest" as const })),
    { id: id("dependency", "unexpected"), claim: "the installed manifest declares no dependency, peer or optional dependency beyond the contract", authority: "package-manifest" },
    { id: id("dependency", "forbidden"), claim: "the package does not depend on a forbidden package (next, recharts, server-only, @next/*, @vercel/*)", authority: "package-manifest" },
    { id: id("lifecycle", "consumer-run"), claim: "the installed package declares no lifecycle script a consumer install would run", authority: "package-manifest" },
    { id: id("lifecycle", "dependency-tree"), claim: "the package's runtime dependency tree declares no install-time script", authority: "package-manifest" },
    { id: id("postinstall", "side-effects"), claim: "installing the package writes nothing to the consumer outside node_modules and the lockfile", authority: "ccv-scenario" },
    { id: id("esm", "root-import"), claim: "plain Node ESM imports the installed package root without Next, a repository alias or a forbidden package", authority: "package-manifest" },
    ...e.exports.values.map((name) => ({ id: id("export", name), claim: `runtime export ${name} is exported by the installed package root`, authority: "package-build-entry" as const })),
    { id: id("export", "unexpected"), claim: "the installed package root exports no runtime name beyond the contract", authority: "package-build-entry" },
    ...e.exports.types.map((name) => ({ id: id("type", name), claim: `type export ${name} is importable from the installed package root`, authority: "package-build-entry" as const })),
    ...e.package.publicSpecifiers.map((specifier) => ({ id: id("specifier", specifier), claim: `public specifier ${specifier} resolves inside the installed package`, authority: "package-manifest" as const })),
    ...e.exports.denied.map((specifier) => ({ id: id("specifier", specifier), claim: `deep import ${specifier} is refused by the exports map`, authority: "package-manifest" as const })),
    { id: id("declarations", "integrity"), claim: "the installed declarations export the contract surface and every relative declaration import resolves", authority: "package-build-entry" },
    { id: id("declarations", "leaks"), claim: "the installed JS and declarations contain no repository alias, Next, Recharts, server-only or @vercel import", authority: "package-build-entry" },
    { id: id("typecheck", "consumer"), claim: "the consumer type-checks strictly (skipLibCheck off) against the installed package", authority: "ccv-scenario" },
    { id: id("build", "vite"), claim: "the consumer production build succeeds", authority: "ccv-scenario" },
    { id: id("stylesheet", "bundled"), claim: `the public stylesheet ${e.css.stylesheetSpecifier} reaches the consumer bundle`, authority: "delivered-css" },
    { id: id("lifecycle", "ignore-scripts-install"), claim: "the tarball installs with --ignore-scripts", authority: "ccv-scenario" },
    { id: id("lifecycle", "ignore-scripts-import"), claim: "without install scripts, the package root imports with the contract runtime exports", authority: "ccv-scenario" },
    { id: id("lifecycle", "ignore-scripts-typecheck"), claim: "without install scripts, the consumer type-checks", authority: "ccv-scenario" },
    { id: id("lifecycle", "ignore-scripts-build"), claim: "without install scripts, the consumer production build succeeds", authority: "ccv-scenario" },
  ];
  let pendingReason: { text: string; environment: boolean } = { text: "not reached", environment: true };

  const workspace = createWorkspace(input.repoRoot, input.workspaceBase);
  const env = buildChildEnv(input.parentEnv, workspace);
  const forwarded = Object.keys(env).filter((name) => input.parentEnv[name] === env[name] && !name.startsWith("npm_config_"));
  const redact = (text: string) => redactEvidence(text, { parent: input.parentEnv, workspaceRoot: workspace.root });
  const tail = (outcome: CommandOutcome, lines = 12) => truncate(redact(`${outcome.stderrTail}\n${outcome.stdoutTail}`).trim().split(/\r?\n/).slice(-lines).join(" ⏎ "));
  const step = async (spec: Omit<CommandSpec, "env" | "timeoutMs"> & { limitMs: number }): Promise<CommandOutcome> => {
    const remaining = deadline - now();
    if (remaining <= 0) return { phase: spec.phase, exitCode: null, signal: null, timedOut: true, stdoutTail: "", stderrTail: "run budget exhausted", durationMs: 0 };
    log(`  … ${spec.phase}`);
    return input.run({ command: spec.command, args: spec.args, cwd: spec.cwd, phase: spec.phase, env, timeoutMs: Math.min(spec.limitMs, remaining) });
  };
  const environmentTools: Record<string, string> = {};
  let npmVersion: string | undefined;
  let integrity: string | undefined;
  const stop = (text: string, environment: boolean) => {
    pendingReason = { text, environment };
  };

  const consumer = join(workspace.root, "consumer");
  const consumerIgnore = join(workspace.root, "consumer-ignore-scripts");
  const packDir = join(workspace.root, "pack");

  const writeConsumer = (dir: string, tarball: string, harnessSource: string, probeSource: string) => {
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, "package.json"), consumerPackageJson(pkg, tarball, vitePins));
    writeFileSync(join(dir, "tsconfig.json"), CONSUMER_TSCONFIG);
    writeFileSync(join(dir, "vite.config.ts"), VITE_CONFIG);
    writeFileSync(join(dir, "index.html"), INDEX_HTML);
    writeFileSync(join(dir, "src", "main.tsx"), mainTsx(e.css.stylesheetSpecifier));
    writeFileSync(join(dir, "src", "ccv-surface.ts"), harnessSource);
    writeFileSync(join(dir, PROBE_PATH), probeSource);
  };
  const runProbe = async (dir: string, phase: string): Promise<{ outcome: CommandOutcome; probe?: ProbeOutput }> => {
    const outcome = await step({ phase, command: "node", args: [PROBE_PATH], cwd: dir, limitMs: limits.probeMs });
    return { outcome, probe: classifyOutcome(outcome) === "ok" ? parseProbeOutput(outcome.stdoutTail) : undefined };
  };
  const bin = (dir: string, name: string) => join(dir, "node_modules", ".bin", name);

  try {
    // ── workspace and tools ──────────────────────────────────────────────
    add({
      checkId: id("workspace", "isolation"),
      status: "pass",
      claim: "the consumers run in an isolated workspace outside the repository with HOME and the npm cache redirected and no secrets forwarded",
      authority: "ccv-scenario",
      evidence: [
        evidence("command", "workspace", "a fresh directory under the OS temp dir holding both consumers, the tarball, HOME, TMPDIR and the npm cache; outside the repository; removed after the run unless --keep"),
        evidence("command", "environment", `allowlist only; forwarded from the parent: ${forwarded.sort().join(", ") || "(none)"}`),
      ],
    });
    const nodeVersion = input.nodeVersion ?? process.version;
    const npmOutcome = await step({ phase: "npm-version", command: "npm", args: ["--version"], cwd: workspace.root, limitMs: limits.probeMs });
    npmVersion = classifyOutcome(npmOutcome) === "ok" ? npmOutcome.stdoutTail.trim() : undefined;
    const nodeRange = input.nodeRange ?? CCV_TOOL_PINS.nodeRange;
    const nodeOk = satisfiesNodeRange(nodeVersion, nodeRange);
    add({
      checkId: id("tools", "pins"),
      status: nodeOk && npmVersion ? "pass" : "unknown",
      ...(nodeOk && npmVersion ? {} : { failureCode: "ENVIRONMENT_ERROR" as const }),
      claim: "the run uses a supported Node and the exact pinned consumer tools",
      authority: "ccv-scenario",
      evidence: [
        evidence("tool", "node", `${nodeVersion} (required ${nodeRange})`),
        evidence("tool", "npm", npmVersion ?? describeOutcome(npmOutcome)),
        evidence("tool", "consumer-pins", Object.entries(vitePins).map(([name, version]) => `${name}@${version}`).join(", ")),
      ],
    });
    if (!nodeOk || !npmVersion) {
      stop("unsupported or unavailable tooling", true);
      return finish();
    }

    // ── candidate build and real tarball ─────────────────────────────────
    try {
      await input.buildPackage();
      add({ checkId: id("artifact", "build"), status: "pass", claim: planned[0].claim, authority: "package-build-entry", evidence: [evidence("command", "build", `buildReactPackage() at ${input.gitSha}; version ${e.package.version} (unchanged)`)] });
    } catch (error) {
      add({ checkId: id("artifact", "build"), status: "fail", failureCode: "BUILD_FAILED", claim: planned[0].claim, authority: "package-build-entry", evidence: [evidence("command", "build", redact(error instanceof Error ? error.message : String(error)))] });
      stop("the candidate could not be built", false);
      return finish();
    }
    mkdirSync(packDir, { recursive: true });
    const pack = await step({ phase: "npm-pack", command: "npm", args: ["pack", "--pack-destination", packDir, "--json"], cwd: input.packageDir, limitMs: limits.probeMs });
    const packClass = classifyOutcome(pack);
    let packed: { filename: string; files: Array<{ path: string }>; integrity?: string; name?: string; version?: string } | undefined;
    try {
      packed = packClass === "ok" ? (JSON.parse(pack.stdoutTail) as Array<NonNullable<typeof packed>>)[0] : undefined;
    } catch {
      packed = undefined;
    }
    const tarballPath = packed ? join(packDir, packed.filename) : undefined;
    if (!packed || !tarballPath || !existsSync(tarballPath)) {
      const environment = packClass === "environment";
      add({ checkId: id("artifact", "tarball"), status: environment ? "unknown" : "fail", failureCode: environment ? "ENVIRONMENT_ERROR" : "INSTALL_FAILED", claim: planned[1].claim, authority: "package-manifest", evidence: [evidence("command", "npm pack", `${describeOutcome(pack)} — ${tail(pack)}`)] });
      stop("no tarball", environment);
      return finish();
    }
    integrity = packed.integrity;
    const archive = readFileSync(tarballPath);
    const tar = readTarGz(archive);
    const { files: packedFiles, outside } = packageRelative(tar.files);
    const packedPaths = Array.from(packedFiles.keys()).sort();
    const npmListed = packed.files.map((file) => file.path).sort();
    const tarballProblems = [
      ...tar.nonRegular.map((entry) => `non-regular entry ${entry.path} (type ${entry.type})`),
      ...outside.map((path) => `entry outside package/: ${path}`),
      ...(JSON.stringify(npmListed) === JSON.stringify(packedPaths) ? [] : ["npm pack --json lists different files than the archive holds"]),
    ];
    add({
      checkId: id("artifact", "tarball"),
      status: tarballProblems.length === 0 ? "pass" : "fail",
      ...(tarballProblems.length === 0 ? {} : { failureCode: "FILE_UNEXPECTED" as const }),
      claim: planned[1].claim,
      authority: "package-manifest",
      expected: `${pkg}@${e.package.version}`,
      actual: `${packed.name ?? "?"}@${packed.version ?? "?"}`,
      evidence: [
        evidence("package-metadata", packed.filename, `${packedPaths.length} files, ${archive.length} bytes; npm integrity ${packed.integrity ?? "(none)"}`, sha256OfBytes(archive)),
        ...tarballProblems.map((problem) => evidence("file", "tarball", problem)),
      ],
    });
    const packIssues = checkPackedFiles(packedPaths);
    add({
      checkId: id("artifact", "pack-rules"),
      status: packIssues.length === 0 ? "pass" : "fail",
      ...(packIssues.length === 0 ? {} : { failureCode: packIssues.some((issue) => issue.message.startsWith("required file missing")) ? ("FILE_MISSING" as const) : ("FILE_UNEXPECTED" as const) }),
      claim: planned[2].claim,
      authority: "package-manifest",
      evidence: packIssues.length === 0 ? [evidence("file", "pack-rules", `required: ${e.package.files.required.join(", ")}; allowed: ${[...e.package.files.allowedExact, ...e.package.files.allowedPrefixes.map((prefix) => `${prefix}*`)].join(", ")}`)] : packIssues.map((issue) => evidence("file", issue.area, issue.message)),
    });
    const packedHashes = hashFiles(packedFiles);

    // ── consumer + real install ──────────────────────────────────────────
    const harness = generateSurfaceHarness(pkg, e.exports.values, e.exports.types);
    const specifiers = [...e.package.publicSpecifiers, ...e.exports.denied];
    const probeSource = generateProbe(pkg, specifiers);
    writeConsumer(consumer, tarballPath, harness.source, probeSource);
    const before = snapshotTree(consumer);
    const install = await step({ phase: "npm-install", command: "npm", args: ["install", "--no-audit", "--no-fund"], cwd: consumer, limitMs: limits.installMs });
    const installClass = classifyOutcome(install);
    const installedDir = join(consumer, "node_modules", ...pkg.split("/"));
    const isLink = existsSync(installedDir) && lstatSync(installedDir).isSymbolicLink();
    if (installClass !== "ok" || !existsSync(installedDir) || isLink) {
      const environment = installClass === "environment";
      add({
        checkId: id("install", "tarball"),
        status: environment ? "unknown" : "fail",
        failureCode: environment ? "ENVIRONMENT_ERROR" : "INSTALL_FAILED",
        claim: planned[3].claim,
        authority: "package-manifest",
        evidence: [evidence("command", "npm install", isLink ? "installed as a symbolic link, not a copy" : `${describeOutcome(install)} — ${tail(install)}`)],
      });
      stop("the tarball did not install", environment);
      return finish();
    }
    add({ checkId: id("install", "tarball"), status: "pass", claim: planned[3].claim, authority: "package-manifest", evidence: [evidence("command", "npm install", `npm install --no-audit --no-fund of file:${packed.filename}; installed as a real copy in node_modules/${pkg}`)] });

    for (const name of ["vite", "@vitejs/plugin-react", "typescript", "react", "react-dom", "@types/react", "@types/react-dom"]) {
      const version = readJson<{ version?: string }>(join(consumer, "node_modules", ...name.split("/"), "package.json"))?.version;
      if (version) environmentTools[name] = version;
    }

    // ── side effects, installed files, manifest ──────────────────────────
    const after = snapshotTree(consumer);
    const diff = diffSnapshots(before, after);
    const sideEffects = [...diff.added.filter((path) => path !== "package-lock.json").map((path) => `added ${path}`), ...diff.modified.map((path) => `modified ${path}`), ...diff.removed.map((path) => `removed ${path}`)];
    add({
      checkId: id("postinstall", "side-effects"),
      status: sideEffects.length === 0 ? "pass" : "fail",
      ...(sideEffects.length === 0 ? {} : { failureCode: "POSTINSTALL_SIDE_EFFECT" as const }),
      claim: "installing the package writes nothing to the consumer outside node_modules and the lockfile",
      authority: "ccv-scenario",
      evidence: sideEffects.length === 0 ? [evidence("file", "consumer", `only package-lock.json added outside node_modules (${diff.added.length} added, ${diff.modified.length} modified, ${diff.removed.length} removed)`)] : listEvidence("file", "side-effects", sideEffects),
    });

    const installed = readInstalledPackage(installedDir);
    const fileComparison = comparePackedInstalled(packedHashes, installed.files);
    for (const path of Array.from(packedHashes.keys()).sort()) {
      const packedEntry = packedHashes.get(path)!;
      const installedEntry = installed.files.get(path);
      const differing = fileComparison.differing.find((entry) => entry.path === path);
      add({
        checkId: id("file", path),
        status: installedEntry && !differing ? "pass" : "fail",
        ...(installedEntry ? (differing ? { failureCode: "FILE_CONTENT_MISMATCH" as const } : {}) : { failureCode: "FILE_MISSING" as const }),
        claim: `installed ${path} equals the packed file`,
        authority: "package-manifest",
        expected: packedEntry.sha256,
        actual: installedEntry?.sha256 ?? "(absent)",
        evidence: [evidence("hash", `installed:${path}`, installedEntry ? `${installedEntry.bytes} bytes${differing ? "; differs from the packed bytes and no known npm transformation explains it" : ""}` : "not present after the install", installedEntry?.sha256)],
      });
    }
    const unexpectedInstalled = [...fileComparison.unexpected.map((path) => `unexpected file ${path}`), ...installed.symlinks.map((path) => `symbolic link ${path}`)];
    add({
      checkId: id("file-set", "installed"),
      status: unexpectedInstalled.length === 0 ? "pass" : "fail",
      ...(unexpectedInstalled.length === 0 ? {} : { failureCode: "FILE_UNEXPECTED" as const }),
      claim: planned[4].claim,
      authority: "package-manifest",
      evidence: unexpectedInstalled.length === 0 ? [evidence("file", "file-set", `${installed.files.size} installed files = ${packedHashes.size} packed files`)] : listEvidence("file", "unexpected", unexpectedInstalled),
    });

    const manifest = readJson<InstalledManifest>(join(installedDir, "package.json")) ?? {};
    for (const field of compareIdentity(manifest, e.package)) {
      add({
        checkId: id("manifest", field.field),
        status: field.ok ? "pass" : "fail",
        ...(field.ok ? {} : { failureCode: "MANIFEST_MISMATCH" as const }),
        claim: `the installed manifest's ${field.field} equals the contract`,
        authority: "package-manifest",
        expected: truncate(field.expected),
        actual: truncate(field.actual),
        evidence: [evidence("package-metadata", `node_modules/${pkg}/package.json#${field.field}`, field.actual)],
      });
    }
    const dependencyComparisons = compareDependencies(manifest, e.dependencies);
    const unexpectedDeps: string[] = [];
    for (const comparison of dependencyComparisons) {
      if (comparison.expected === undefined) {
        unexpectedDeps.push(`${comparison.kind} ${comparison.name}@${comparison.actual}`);
        continue;
      }
      add({
        checkId: id(comparison.kind, comparison.name),
        status: comparison.ok ? "pass" : "fail",
        ...(comparison.ok ? {} : { failureCode: comparison.kind === "peer" ? ("PEER_DEPENDENCY_MISMATCH" as const) : ("DEPENDENCY_MISMATCH" as const) }),
        claim: `${comparison.kind} ${comparison.name} is declared with the contract range`,
        authority: "package-manifest",
        expected: comparison.expected,
        actual: comparison.actual ?? "(absent)",
        evidence: [evidence("package-metadata", `node_modules/${pkg}/package.json`, `${comparison.kind} ${comparison.name}: ${comparison.actual ?? "(absent)"}`)],
      });
    }
    add({
      checkId: id("dependency", "unexpected"),
      status: unexpectedDeps.length === 0 ? "pass" : "fail",
      ...(unexpectedDeps.length === 0 ? {} : { failureCode: "DEPENDENCY_MISMATCH" as const }),
      claim: "the installed manifest declares no dependency, peer or optional dependency beyond the contract",
      authority: "package-manifest",
      evidence: unexpectedDeps.length === 0 ? [evidence("package-metadata", "dependencies", `dependencies: ${e.dependencies.npm.join(", ") || "(none)"}; peers: ${e.dependencies.peers.join(", ") || "(none)"}; optional: ${e.dependencies.optional.join(", ") || "(none)"}`)] : listEvidence("package-metadata", "unexpected", unexpectedDeps),
    });
    const forbidden = forbiddenDependencyNames(manifest);
    add({
      checkId: id("dependency", "forbidden"),
      status: forbidden.length === 0 ? "pass" : "fail",
      ...(forbidden.length === 0 ? {} : { failureCode: "DEPENDENCY_MISMATCH" as const }),
      claim: "the package does not depend on a forbidden package (next, recharts, server-only, @next/*, @vercel/*)",
      authority: "package-manifest",
      evidence: [evidence("package-metadata", "forbidden", forbidden.length === 0 ? `none of ${[...FORBIDDEN_DEPENDENCIES, ...FORBIDDEN_DEPENDENCY_PREFIXES.map((prefix) => `${prefix}*`)].join(", ")} (release-checks rule)` : `forbidden: ${forbidden.join(", ")}`)],
    });
    for (const [name, range] of Object.entries(e.dependencies.ranges.peers)) {
      const version = readJson<{ version?: string }>(join(consumer, "node_modules", ...name.split("/"), "package.json"))?.version;
      const satisfied = version ? satisfiesRange(version, range) : false;
      add({
        checkId: id("peer-satisfied", name),
        status: satisfied === true ? "pass" : satisfied === undefined ? "unknown" : "fail",
        ...(satisfied === false ? { failureCode: "PEER_DEPENDENCY_MISMATCH" as const } : {}),
        claim: `the consumer satisfies peer ${name}`,
        authority: "package-manifest",
        expected: range,
        actual: version ?? "(not installed)",
        evidence: [evidence("package-metadata", `node_modules/${name}/package.json`, version ? `${name}@${version} ${satisfied === undefined ? "— range form not judged" : satisfied ? "satisfies" : "does not satisfy"} ${range}` : "not installed in the consumer")],
      });
    }

    // ── lifecycle ────────────────────────────────────────────────────────
    const scripts = classifyScripts(manifest.scripts, { hasBindingGyp: installed.files.has("binding.gyp") });
    const packedScripts = classifyScripts(JSON.parse(packedFiles.get("package.json")?.toString("utf8") ?? "{}").scripts);
    const consumerRun = Array.from(new Set([...scripts.consumerRun, ...packedScripts.consumerRun])).filter((name) => !e.package.lifecycleScripts.allowedConsumerRun.includes(name));
    add({
      checkId: id("lifecycle", "consumer-run"),
      status: consumerRun.length === 0 ? "pass" : "fail",
      ...(consumerRun.length === 0 ? {} : { failureCode: "LIFECYCLE_SCRIPT_UNEXPECTED" as const }),
      claim: "the installed package declares no lifecycle script a consumer install would run",
      authority: "package-manifest",
      expected: `allowed consumer-run: ${e.package.lifecycleScripts.allowedConsumerRun.join(", ") || "(none)"}`,
      actual: consumerRun.join(", ") || "(none)",
      evidence: [
        evidence("package-metadata", "scripts", `consumer-run: ${consumerRun.join(", ") || "(none)"}; publisher-only (never run by a consumer install): ${scripts.publisherOnly.join(", ") || "(none)"}; binding.gyp: ${installed.files.has("binding.gyp") ? "present" : "absent"}`),
        ...consumerRun.map((name) => evidence("package-metadata", `scripts.${name}`, manifest.scripts?.[name] ?? "implicit node-gyp rebuild (binding.gyp)")),
      ],
    });
    const readManifest: ManifestReader = (dir) => {
      const json = readJson<{ version?: string; dependencies?: Record<string, string>; optionalDependencies?: Record<string, string>; scripts?: Record<string, string> }>(join(dir, "package.json"));
      return json ? { ...json, hasBindingGyp: existsSync(join(dir, "binding.gyp")) } : undefined;
    };
    const tree = walkDependencyTree(consumer, pkg, readManifest);
    const installTime = tree.nodes.filter((node) => node.consumerRun.some((name) => name !== "prepare"));
    const treeOk = installTime.length === 0 && tree.unresolved.length === 0;
    add({
      checkId: id("lifecycle", "dependency-tree"),
      status: treeOk ? "pass" : "fail",
      ...(treeOk ? {} : { failureCode: installTime.length > 0 ? ("LIFECYCLE_SCRIPT_UNEXPECTED" as const) : ("IMPORT_UNRESOLVED" as const) }),
      claim: "the package's runtime dependency tree declares no install-time script (preinstall, install, postinstall or an implicit node-gyp build)",
      authority: "package-manifest",
      evidence: [
        evidence("package-metadata", "dependency-tree", `${tree.nodes.length} runtime dependenc${tree.nodes.length === 1 ? "y" : "ies"}: ${tree.nodes.map((node) => `${node.name}@${node.version}${node.consumerRun.length ? ` [${node.consumerRun.join(", ")}]` : ""}`).join(", ") || "(none)"}; prepare is not run for registry installs and is informational`),
        ...(tree.unresolved.length ? [evidence("package-metadata", "unresolved", `not installed: ${tree.unresolved.join(", ")}`)] : []),
      ],
    });

    // ── plain Node ESM probe ─────────────────────────────────────────────
    const { outcome: probeOutcome, probe } = await runProbe(consumer, "node-probe");
    if (!probe) {
      const environment = classifyOutcome(probeOutcome) === "environment";
      add({ checkId: id("esm", "root-import"), status: environment ? "unknown" : "fail", failureCode: environment ? "ENVIRONMENT_ERROR" : "IMPORT_UNRESOLVED", claim: planned.find((entry) => entry.id === id("esm", "root-import"))!.claim, authority: "package-manifest", evidence: [evidence("command", "node probe", `${describeOutcome(probeOutcome)} — ${tail(probeOutcome)}`)] });
      stop("the Node probe did not run", environment);
      return finish();
    }
    const consumerHas = (name: string) => existsSync(join(consumer, "node_modules", ...name.split("/"), "package.json"));
    const lock = readJson<{ packages?: Record<string, unknown> }>(join(consumer, "package-lock.json"));
    const lockNames = Object.keys(lock?.packages ?? {}).map((key) => key.replace(/^.*node_modules\//, ""));
    const forbiddenPresent = lockNames.filter((name) => FORBIDDEN_DEPENDENCIES.includes(name) || name.startsWith("@next/") || FORBIDDEN_DEPENDENCY_PREFIXES.some((prefix) => name.startsWith(prefix))).concat(["next", "recharts"].filter(consumerHas));
    const forbiddenUnique = Array.from(new Set(forbiddenPresent)).sort();
    const rootOk = probe.root.ok && forbiddenUnique.length === 0;
    add({
      checkId: id("esm", "root-import"),
      status: rootOk ? "pass" : "fail",
      ...(rootOk ? {} : { failureCode: probe.root.ok ? ("DEPENDENCY_MISMATCH" as const) : ("IMPORT_UNRESOLVED" as const) }),
      claim: "plain Node ESM imports the installed package root without Next, a repository alias or a forbidden package",
      authority: "package-manifest",
      evidence: [
        evidence("command", `node ${PROBE_PATH}`, probe.root.ok ? `import("${pkg}") succeeded in plain Node (no bundler, no path mapping); ${probe.root.keys.length} runtime export(s)` : `import failed: ${probe.root.code ?? "no code"} ${redact(probe.root.message)}`),
        evidence("package-metadata", "package-lock.json", forbiddenUnique.length === 0 ? "the consumer installed no next, recharts, server-only, @next/* or @vercel/* package" : `forbidden packages present: ${forbiddenUnique.join(", ")}`),
      ],
    });
    const runtimeKeys = probe.root.ok ? probe.root.keys : [];
    const runtimeDiff = compareRuntimeExports(runtimeKeys, e.exports.values);

    for (const specifier of e.package.publicSpecifiers) {
      const verdict = judgeSpecifier("public", probe.resolutions[specifier]);
      add({ checkId: id("specifier", specifier), status: verdict.status, ...(verdict.failureCode ? { failureCode: verdict.failureCode } : {}), claim: `public specifier ${specifier} resolves inside the installed package`, authority: "package-manifest", evidence: [evidence("command", `import.meta.resolve(${specifier})`, verdict.detail)] });
    }
    for (const specifier of e.exports.denied) {
      const verdict = judgeSpecifier("denied", probe.resolutions[specifier]);
      add({ checkId: id("specifier", specifier), status: verdict.status, ...(verdict.failureCode ? { failureCode: verdict.failureCode } : {}), claim: `deep import ${specifier} is refused by the exports map`, authority: "package-manifest", evidence: [evidence("command", `import.meta.resolve(${specifier})`, verdict.detail)] });
    }

    // ── installed declarations ───────────────────────────────────────────
    const distDir = join(installedDir, "dist");
    const integrityIssues = checkDistIntegrity(distDir, { values: e.exports.values, types: e.exports.types });
    add({
      checkId: id("declarations", "integrity"),
      status: integrityIssues.length === 0 ? "pass" : "fail",
      ...(integrityIssues.length === 0 ? {} : { failureCode: integrityIssues.some((issue) => /unresolved declaration import/.test(issue.message)) ? ("IMPORT_UNRESOLVED" as const) : integrityIssues.some((issue) => /missing or empty/.test(issue.message)) ? ("FILE_MISSING" as const) : ("EXPORT_MISSING" as const) }),
      claim: "the installed declarations export the contract surface and every relative declaration import resolves",
      authority: "package-build-entry",
      evidence: integrityIssues.length === 0 ? [evidence("source", `node_modules/${pkg}/dist`, "index.js, index.d.ts and styles.css present; every contract export in JS and declarations; every relative declaration import resolves (release-checks rule on the INSTALLED files)")] : integrityIssues.slice(0, 20).map((issue) => evidence("source", issue.area, issue.message)),
    });
    const distFiles: string[] = [];
    const walkDist = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walkDist(full);
        else distFiles.push(full);
      }
    };
    if (existsSync(distDir)) walkDist(distDir);
    const leaks = distFiles.flatMap((file) => checkBuiltFile(file.slice(installedDir.length + 1), readFileSync(file, "utf8")));
    add({
      checkId: id("declarations", "leaks"),
      status: leaks.length === 0 ? "pass" : "fail",
      ...(leaks.length === 0 ? {} : { failureCode: leaks.every((leak) => leak.rule.startsWith("repository alias")) ? ("IMPORT_UNRESOLVED" as const) : ("DEPENDENCY_MISMATCH" as const) }),
      claim: "the installed JS and declarations contain no repository alias, Next, Recharts, server-only or @vercel import",
      authority: "package-build-entry",
      evidence: leaks.length === 0 ? [evidence("source", `node_modules/${pkg}/dist`, `${distFiles.length} installed files checked with the output-checks rules`)] : leaks.slice(0, 20).map((leak) => evidence("source", leak.file, `${leak.rule}: ${leak.match}`)),
    });

    // ── strict typecheck over the surface harness, then the build ────────
    const tsc = await step({ phase: "tsc", command: bin(consumer, "tsc"), args: ["--noEmit", "--pretty", "false", "-p", "tsconfig.json"], cwd: consumer, limitMs: limits.typecheckMs });
    const tscClass = classifyOutcome(tsc);
    const installedDeclarations = new Set(Array.from(installed.files.keys()).map((path) => `node_modules/${pkg}/${path}`));
    const diagnostics = classifyDiagnostics(parseTscOutput(redact(tsc.stdoutTail)), harness, installedDeclarations);
    const harnessErrors = (name: string, kind: "value" | "type") => diagnostics.missingExports.filter((line) => line.name === name && line.kind === kind);

    for (const name of e.exports.values) {
      const missingAtRuntime = runtimeDiff.missing.includes(name) || !probe.root.ok;
      const typeErrors = harnessErrors(name, "value");
      const ok = !missingAtRuntime && typeErrors.length === 0 && tscClass !== "environment";
      add({
        checkId: id("export", name),
        status: ok ? "pass" : tscClass === "environment" && !missingAtRuntime ? "unknown" : "fail",
        ...(ok ? {} : tscClass === "environment" && !missingAtRuntime ? { failureCode: "ENVIRONMENT_ERROR" as const } : { failureCode: "EXPORT_MISSING" as const }),
        claim: `runtime export ${name} is exported by the installed package root`,
        authority: "package-build-entry",
        evidence: [
          evidence("export", `runtime:${name}`, missingAtRuntime ? "absent from the plain-Node import of the package root" : "present in the plain-Node import of the package root"),
          ...typeErrors.map((line) => evidence("export", `types:${name}`, `${line.code} ${line.message}`)),
        ],
      });
    }
    add({
      checkId: id("export", "unexpected"),
      status: runtimeDiff.unexpected.length === 0 ? "pass" : "fail",
      ...(runtimeDiff.unexpected.length === 0 ? {} : { failureCode: "EXPORT_UNEXPECTED" as const }),
      claim: "the installed package root exports no runtime name beyond the contract",
      authority: "package-build-entry",
      expected: `${e.exports.values.length} runtime export(s)`,
      actual: `${runtimeKeys.length} runtime export(s)`,
      evidence: runtimeDiff.unexpected.length === 0 ? [evidence("export", "runtime", "installed runtime export names equal the contract set exactly")] : listEvidence("export", "unexpected", runtimeDiff.unexpected),
    });
    for (const name of e.exports.types) {
      const errors = harnessErrors(name, "type");
      add({
        checkId: id("type", name),
        status: tscClass === "environment" ? "unknown" : errors.length === 0 ? "pass" : "fail",
        ...(tscClass === "environment" ? { failureCode: "ENVIRONMENT_ERROR" as const } : errors.length === 0 ? {} : { failureCode: "EXPORT_MISSING" as const }),
        claim: `type export ${name} is importable from the installed package root`,
        authority: "package-build-entry",
        evidence: errors.length === 0 ? [evidence("export", `types:${name}`, tscClass === "environment" ? describeOutcome(tsc) : `import type { ${name} } from "${pkg}" compiles in the consumer`)] : errors.map((line) => evidence("export", `types:${name}`, `${line.code} ${line.message}`)),
      });
    }
    const tscOk = tscClass === "ok";
    add({
      checkId: id("typecheck", "consumer"),
      status: tscClass === "environment" ? "unknown" : tscOk ? "pass" : "fail",
      ...(tscOk ? {} : { failureCode: tscClass === "environment" ? ("ENVIRONMENT_ERROR" as const) : diagnostics.other.length === 0 && diagnostics.missingExports.length === 0 && diagnostics.unresolvedImports.length > 0 ? ("IMPORT_UNRESOLVED" as const) : ("TYPECHECK_FAILED" as const) }),
      claim: "the consumer type-checks strictly (skipLibCheck off) against the installed package",
      authority: "ccv-scenario",
      evidence: [
        evidence("command", "tsc", "tsc --noEmit -p tsconfig.json; strict, skipLibCheck=false, moduleResolution=bundler, no path mapping; the surface harness imports every contract value and type from the package root"),
        ...(tscOk ? [] : [evidence("command", "tsc-result", `${describeOutcome(tsc)}; ${diagnostics.missingExports.length} missing-export, ${diagnostics.unresolvedImports.length} unresolved-import, ${diagnostics.other.length} other`), ...[...diagnostics.unresolvedImports, ...diagnostics.other].slice(0, 20).map((d) => evidence("source", `${d.file}:${d.line}`, `${d.code} ${d.message}`))]),
      ],
    });
    const build = await step({ phase: "vite-build", command: bin(consumer, "vite"), args: ["build"], cwd: consumer, limitMs: limits.buildMs });
    const buildClass = classifyOutcome(build);
    add({
      checkId: id("build", "vite"),
      status: buildClass === "ok" ? "pass" : buildClass === "environment" ? "unknown" : "fail",
      ...(buildClass === "ok" ? {} : { failureCode: buildClass === "environment" ? ("ENVIRONMENT_ERROR" as const) : ("BUILD_FAILED" as const) }),
      claim: "the consumer production build succeeds",
      authority: "ccv-scenario",
      evidence: [evidence("command", "vite build", buildClass === "ok" ? "succeeded (additional proof; not a substitute for the export, specifier, lifecycle and file checks)" : `${describeOutcome(build)} — ${tail(build, 20)}`)],
    });
    const assetsDir = join(consumer, "dist", "assets");
    const bundledCss = buildClass === "ok" && existsSync(assetsDir) ? readdirSync(assetsDir).filter((name) => name.endsWith(".css")).map((name) => readFileSync(join(assetsDir, name), "utf8")).join("\n") : "";
    const delivered = e.css.declaredCustomProperties.filter((name) => bundledCss.includes(`${name}:`));
    add({
      checkId: id("stylesheet", "bundled"),
      status: buildClass !== "ok" ? "unknown" : delivered.length > 0 ? "pass" : "fail",
      ...(buildClass === "environment" ? { failureCode: "ENVIRONMENT_ERROR" as const } : buildClass === "ok" && delivered.length === 0 ? { failureCode: "FILE_MISSING" as const } : {}),
      claim: `the public stylesheet ${e.css.stylesheetSpecifier} reaches the consumer bundle`,
      authority: "delivered-css",
      evidence: [evidence("css", "dist/assets/*.css", buildClass !== "ok" ? "build did not complete" : `${delivered.length} of ${e.css.declaredCustomProperties.length} contract custom-property declarations found in the bundled CSS (delivery only; token correctness is CCV-4)`)],
    });

    // ── --ignore-scripts consumer ────────────────────────────────────────
    writeConsumer(consumerIgnore, tarballPath, harness.source, probeSource);
    const ignoreInstall = await step({ phase: "npm-install-ignore-scripts", command: "npm", args: ["install", "--ignore-scripts", "--no-audit", "--no-fund"], cwd: consumerIgnore, limitMs: limits.installMs });
    const ignoreClass = classifyOutcome(ignoreInstall);
    add({
      checkId: id("lifecycle", "ignore-scripts-install"),
      status: ignoreClass === "ok" ? "pass" : ignoreClass === "environment" ? "unknown" : "fail",
      ...(ignoreClass === "ok" ? {} : { failureCode: ignoreClass === "environment" ? ("ENVIRONMENT_ERROR" as const) : ("INSTALL_FAILED" as const) }),
      claim: "the tarball installs with --ignore-scripts",
      authority: "ccv-scenario",
      evidence: [evidence("command", "npm install --ignore-scripts", ignoreClass === "ok" ? "succeeded in a second, separate consumer" : `${describeOutcome(ignoreInstall)} — ${tail(ignoreInstall)}`)],
    });
    if (ignoreClass !== "ok") {
      stop("the --ignore-scripts install did not complete", ignoreClass === "environment");
      return finish();
    }
    // A failure that appears ONLY without install scripts is attributed to Skrewww only when its runtime tree declares install-time scripts; otherwise it is consumer tooling.
    const scriptsInSkrewwwTree = consumerRun.length > 0 || installTime.length > 0;
    const ignoreJudge = (normalOk: boolean, ignoreOk: boolean, environment: boolean, failure: CcvFailureCode): Pick<CcvCheck, "status" | "failureCode"> => {
      if (environment) return { status: "unknown", failureCode: "ENVIRONMENT_ERROR" };
      if (ignoreOk) return { status: "pass" };
      if (!normalOk) return { status: "fail", failureCode: failure };
      return scriptsInSkrewwwTree ? { status: "fail", failureCode: "LIFECYCLE_SCRIPT_UNEXPECTED" } : { status: "unknown" };
    };
    const { outcome: ignoreProbeOutcome, probe: ignoreProbe } = await runProbe(consumerIgnore, "node-probe-ignore-scripts");
    const ignoreKeysOk = Boolean(ignoreProbe?.root.ok && JSON.stringify(ignoreProbe.root.keys) === JSON.stringify([...e.exports.values].sort()));
    add({
      checkId: id("lifecycle", "ignore-scripts-import"),
      ...ignoreJudge(rootOk && runtimeDiff.missing.length === 0 && runtimeDiff.unexpected.length === 0, ignoreKeysOk, !ignoreProbe && classifyOutcome(ignoreProbeOutcome) === "environment", "IMPORT_UNRESOLVED"),
      claim: "without install scripts, the package root imports with the contract runtime exports",
      authority: "ccv-scenario",
      evidence: [evidence("command", `node ${PROBE_PATH}`, ignoreKeysOk ? "plain Node import returns exactly the contract runtime exports" : ignoreProbe ? `root import ${ignoreProbe.root.ok ? `returned ${ignoreProbe.root.keys.length} names` : `failed: ${ignoreProbe.root.code ?? ""}`}` : describeOutcome(ignoreProbeOutcome))],
    });
    const ignoreTsc = await step({ phase: "tsc-ignore-scripts", command: bin(consumerIgnore, "tsc"), args: ["--noEmit", "--pretty", "false", "-p", "tsconfig.json"], cwd: consumerIgnore, limitMs: limits.typecheckMs });
    add({
      checkId: id("lifecycle", "ignore-scripts-typecheck"),
      ...ignoreJudge(tscOk, classifyOutcome(ignoreTsc) === "ok", classifyOutcome(ignoreTsc) === "environment", "TYPECHECK_FAILED"),
      claim: "without install scripts, the consumer type-checks",
      authority: "ccv-scenario",
      evidence: [evidence("command", "tsc", classifyOutcome(ignoreTsc) === "ok" ? "passes" : `${describeOutcome(ignoreTsc)} — ${tail(ignoreTsc)}`)],
    });
    const ignoreBuild = await step({ phase: "vite-build-ignore-scripts", command: bin(consumerIgnore, "vite"), args: ["build"], cwd: consumerIgnore, limitMs: limits.buildMs });
    add({
      checkId: id("lifecycle", "ignore-scripts-build"),
      ...ignoreJudge(buildClass === "ok", classifyOutcome(ignoreBuild) === "ok", classifyOutcome(ignoreBuild) === "environment", "BUILD_FAILED"),
      claim: "without install scripts, the consumer production build succeeds",
      authority: "ccv-scenario",
      evidence: [evidence("command", "vite build", classifyOutcome(ignoreBuild) === "ok" ? "passes" : `${describeOutcome(ignoreBuild)} — ${tail(ignoreBuild)} (fails only without install scripts while the Skrewww runtime tree declares ${scriptsInSkrewwwTree ? "install-time scripts" : "none, so the cause is consumer tooling"})`)],
    });
  } catch (error) {
    stop(`verifier error: ${error instanceof Error ? error.message : String(error)}`, true);
  }
  return finish();

  function finish(): VerifyNpmOutput {
    for (const entry of planned) {
      if (checks.some((check) => check.checkId === entry.id)) continue;
      add({
        checkId: entry.id,
        status: "unknown",
        ...(pendingReason.environment ? { failureCode: "ENVIRONMENT_ERROR" as const } : {}),
        claim: entry.claim,
        authority: entry.authority,
        evidence: [evidence("command", "not-evaluated", redact(pendingReason.text))],
      });
    }
    const cleanup = cleanupWorkspace(workspace, Boolean(input.keep), input.remove);
    add({
      checkId: id("cleanup", "workspace"),
      status: cleanup.error ? "unknown" : "pass",
      ...(cleanup.error ? { failureCode: "ENVIRONMENT_ERROR" as const } : {}),
      claim: "the run removes its workspace (consumers, tarball, HOME, npm cache, TMPDIR) unless --keep",
      authority: "ccv-scenario",
      evidence: [evidence("command", "cleanup", cleanup.kept ? "kept on request (--keep)" : cleanup.removed ? "workspace removed" : `removal failed: ${redact(cleanup.error ?? "")}`)],
    });
    const result = assembleResult({
      distribution: "npm-package",
      mode: "LOCAL_TARBALL",
      subject: pkg,
      gitSha: input.gitSha,
      packageVersion: e.package.version,
      integrity,
      environment: { node: input.nodeVersion ?? process.version, platform: input.platform ?? `${process.platform}-${process.arch}`, ...(npmVersion ? { packageManager: `npm@${npmVersion}` } : {}), tools: environmentTools },
      checks,
      volatile: { startedAt: new Date(started).toISOString(), durationMs: now() - started },
    });
    return { result, exitCode: exitCodeFor(result), workspaceRoot: workspace.root, kept: cleanup.kept };
  }
}
