import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { shadcnId } from "@/lib/ccv/ids";
import { buildChildEnv, redactEvidence, type ParentEnv } from "@/lib/ccv/runner/env";
import { CCV_TIME_LIMITS, CCV_TOOL_PINS, satisfiesNodeRange, type CcvTimeLimits, type CcvToolPins } from "@/lib/ccv/runner/pins";
import { classifyOutcome, describeOutcome, type CommandOutcome, type CommandRunner, type CommandSpec } from "@/lib/ccv/runner/process";
import { startLocalRegistry, type LocalRegistry } from "@/lib/ccv/runner/registry-server";
import { cleanupWorkspace, createWorkspace, type Remover, type Workspace } from "@/lib/ccv/runner/workspace";
import { evaluateRegistryClosure } from "@/lib/ccv/shadcn/closure";
import { classifyInstalledFile, evaluateFileSet } from "@/lib/ccv/shadcn/compare-files";
import { dependencyDelta, evaluateDependencies, readDirectDependencies } from "@/lib/ccv/shadcn/dependencies";
import { buildBatchExpectation, type BatchExpectation } from "@/lib/ccv/shadcn/expected";
import { CONSUMER_PAGE_PATH, generateConsumerPage, generateExportsHarness } from "@/lib/ccv/shadcn/exports-harness";
import { diffSnapshots, snapshotTree } from "@/lib/ccv/shadcn/fs-snapshot";
import { evaluateImportClosure } from "@/lib/ccv/shadcn/imports";
import { assembleResult, evidence, exitCodeFor, listEvidence, truncate } from "@/lib/ccv/shadcn/result";
import { classifyDiagnostics, parseTscOutput } from "@/lib/ccv/shadcn/tsc-diagnostics";
import type { CcvAuthority, CcvCheck, CcvResult, ShadcnConsumerContract } from "@/lib/ccv/types";
import type { ShadcnRegistryItem } from "@/lib/shadcn-registry-generator";

/**
 * CCV-2 — orchestration of one LOCAL_CANONICAL shadcn verification run.
 *
 *   CCV-1 contracts → workspace (outside the repo, isolated env)
 *     → loopback registry serving the generator items
 *     → pinned create-next-app (Tailwind-free) + hand-written components.json
 *     → pinned `shadcn add` of the subjects into ONE consumer
 *     → file set / per-file bytes / dependencies / registry closure / imports
 *     → export harness → tsc → next build → cleanup → validated CcvResult
 *
 * Thin by design: every judgement lives in a pure module next to this file. The
 * command runner, workspace base and remover are injectable so the whole flow is
 * exercised in tests with a fake installer and no network.
 */

export type InstallStrategy = "single" | "sequential";

export type VerifyShadcnInput = {
  repoRoot: string;
  gitSha: string;
  items: readonly ShadcnRegistryItem[];
  contracts: readonly ShadcnConsumerContract[];
  subjects: readonly string[];
  /** The result subject and check-id segment: an item name, or "all" for the full distribution. */
  subjectLabel: string;
  run: CommandRunner;
  parentEnv: ParentEnv;
  keep?: boolean;
  installStrategy?: InstallStrategy;
  pins?: CcvToolPins;
  limits?: CcvTimeLimits;
  workspaceBase?: string;
  remove?: Remover;
  now?: () => number;
  log?: (line: string) => void;
  nodeVersion?: string;
  platform?: string;
};

export type VerifyShadcnOutput = { result: CcvResult; exitCode: 0 | 2 | 3; workspaceRoot: string; kept: boolean; installOrder: string[] };

const SCAFFOLD_FLAGS = ["--typescript", "--eslint", "--app", "--no-tailwind", "--no-src-dir", "--import-alias", "@/*", "--use-npm", "--disable-git", "--yes"] as const;

function componentsJson(template: string): string {
  return `${JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema.json",
      style: "new-york",
      rsc: true,
      tsx: true,
      tailwind: { config: "", css: "app/globals.css", baseColor: "neutral", cssVariables: true },
      aliases: { components: "@/components", utils: "@/lib/utils", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks" },
      registries: { "@skrewww": template },
    },
    null,
    2,
  )}\n`;
}

const readText = (path: string): string | undefined => (existsSync(path) ? readFileSync(path, "utf8") : undefined);
const installedVersion = (consumer: string, pkg: string): string | undefined => {
  const text = readText(join(consumer, "node_modules", pkg, "package.json"));
  return text ? (JSON.parse(text) as { version?: string }).version : undefined;
};

export async function verifyShadcnLocalCanonical(input: VerifyShadcnInput): Promise<VerifyShadcnOutput> {
  const pins = input.pins ?? CCV_TOOL_PINS;
  const limits = input.limits ?? CCV_TIME_LIMITS;
  const now = input.now ?? Date.now;
  const log = input.log ?? (() => undefined);
  const started = now();
  const deadline = started + limits.runMs;
  const strategy = input.installStrategy ?? "single";
  const id = (category: string, key: string) => shadcnId(input.subjectLabel, category, key);
  const checks: CcvCheck[] = [];
  const add = (check: CcvCheck) => checks.push(check);

  const distributed = input.items.map((item) => item.name);
  const unknownSubjects = input.subjects.filter((subject) => !distributed.includes(subject));
  if (unknownSubjects.length > 0 || input.subjects.length === 0) throw new Error(`invalid subjects: ${unknownSubjects.join(", ") || "(none)"}`);
  const expectation: BatchExpectation = buildBatchExpectation(input.subjects, input.contracts);
  const expectedPaths = new Set(expectation.files.map((file) => file.installPath));
  const contentByPath = new Map<string, string>();
  for (const item of input.items.filter((candidate) => expectation.closureItems.includes(candidate.name))) {
    for (const file of item.files) contentByPath.set(file.target.replace(/^~\//, ""), file.content);
  }

  const workspace: Workspace = createWorkspace(input.repoRoot, input.workspaceBase);
  const env = buildChildEnv(input.parentEnv, workspace);
  const forwarded = Object.keys(env).filter((name) => input.parentEnv[name] === env[name] && !name.startsWith("npm_config_"));
  let registry: LocalRegistry | undefined;
  let installOrder: string[] = [];
  const redact = (text: string) => redactEvidence(text, { parent: input.parentEnv, workspaceRoot: workspace.root, registryOrigin: registry?.origin });
  const tail = (outcome: CommandOutcome, lines = 12) => truncate(redact(`${outcome.stderrTail}\n${outcome.stdoutTail}`).trim().split(/\r?\n/).slice(-lines).join(" ⏎ "));

  const step = async (spec: Omit<CommandSpec, "env" | "timeoutMs"> & { limitMs: number }): Promise<CommandOutcome> => {
    const remaining = deadline - now();
    if (remaining <= 0) return { phase: spec.phase, exitCode: null, signal: null, timedOut: true, stdoutTail: "", stderrTail: "run budget exhausted", durationMs: 0 };
    log(`  … ${spec.phase}`);
    return input.run({ command: spec.command, args: spec.args, cwd: spec.cwd, phase: spec.phase, env, timeoutMs: Math.min(spec.limitMs, remaining) });
  };

  /** Marks every remaining area as not evaluated. */
  const notEvaluated = (reason: string, environment: boolean) => {
    const status = "unknown" as const;
    const failureCode = environment ? ("ENVIRONMENT_ERROR" as const) : undefined;
    const ev = [evidence("command", "phase", reason)];
    const pending: Array<[string, string, string, CcvAuthority]> = [
      ...expectation.files.map((file): [string, string, string, CcvAuthority] => [id("file", file.installPath), `installed ${file.installPath} equals the expected bytes`, "", "generator"]),
      [id("file-set", "unexpected"), "the install writes nothing outside the expected install paths", "", "generator"],
      ...expectation.npm.map((name): [string, string, string, CcvAuthority] => [id("dependency-npm", name), `declared npm dependency ${name} is installed`, "", "canonical-registry"]),
      [id("dependencies", "unexpected"), "the install adds no undeclared direct dependency", "", "canonical-registry"],
      [id("registry-closure", "resolved"), "the installer resolves exactly the derived registry-dependency closure", "", "generator"],
      [id("typecheck", "tsc"), "the consumer type-checks with the installed result", "", "ccv-scenario"],
      [id("build", "next-build"), "the consumer production build succeeds", "", "ccv-scenario"],
    ];
    for (const [checkId, claim, , authority] of pending) {
      if (checks.some((check) => check.checkId === checkId)) continue;
      add({ checkId, status, ...(failureCode ? { failureCode } : {}), claim, authority, evidence: ev });
    }
  };

  const environmentTools: Record<string, string> = { "create-next-app": pins.createNextApp, shadcn: pins.shadcn };
  let npmVersion: string | undefined;
  let cleanupNote: { removed: boolean; kept: boolean; error?: string } = { removed: false, kept: false };

  try {
    // ── workspace and tools ──────────────────────────────────────────────
    const secretForwarded = forwarded.filter((name) => /TOKEN|SECRET|KEY|PASSWORD|AUTH|CREDENTIAL/i.test(name));
    add({
      checkId: id("workspace", "isolation"),
      status: secretForwarded.length === 0 ? "pass" : "unknown",
      ...(secretForwarded.length === 0 ? {} : { failureCode: "ENVIRONMENT_ERROR" as const }),
      claim: "the consumer runs in an isolated workspace outside the repository with HOME and the npm cache redirected and no secrets forwarded",
      authority: "ccv-scenario",
      evidence: [
        evidence("command", "workspace", "a fresh directory under the OS temp dir; outside the repository; removed after the run unless --keep"),
        evidence("command", "environment", `allowlist only; HOME, XDG config, TMPDIR, npm cache and npm user config point inside the workspace; forwarded from the parent: ${forwarded.sort().join(", ") || "(none)"}`),
      ],
    });

    const nodeVersion = input.nodeVersion ?? process.version;
    const npmOutcome = await step({ phase: "npm-version", command: "npm", args: ["--version"], cwd: workspace.root, limitMs: limits.probeMs });
    npmVersion = classifyOutcome(npmOutcome) === "ok" ? npmOutcome.stdoutTail.trim() : undefined;
    const nodeOk = satisfiesNodeRange(nodeVersion, pins.nodeRange);
    add({
      checkId: id("tools", "pins"),
      status: nodeOk && npmVersion ? "pass" : "unknown",
      ...(nodeOk && npmVersion ? {} : { failureCode: "ENVIRONMENT_ERROR" as const }),
      claim: "the run uses the exact pinned consumer tools and a supported Node",
      authority: "ccv-scenario",
      evidence: [
        evidence("tool", "node", `${nodeVersion} (required ${pins.nodeRange})`),
        evidence("tool", "npm", npmVersion ?? describeOutcome(npmOutcome)),
        evidence("tool", "create-next-app", `${pins.createNextApp} (exact pin)`),
        evidence("tool", "shadcn", `${pins.shadcn} (exact pin)`),
      ],
    });
    if (!nodeOk || !npmVersion) {
      notEvaluated("unsupported or unavailable tooling", true);
      return finish();
    }

    // ── local canonical registry ─────────────────────────────────────────
    registry = await startLocalRegistry(input.items);
    add({
      checkId: id("registry", "local-canonical"),
      status: "pass",
      claim: "the registry payload is the canonical generator output served on loopback",
      authority: "generator",
      evidence: [evidence("registry-payload", "host", `${registry.host} (ephemeral port); ${input.items.length} items from buildDistributedRegistryItems(); nothing written to public/r; no production registry contacted`)],
    });

    // ── scaffold ─────────────────────────────────────────────────────────
    const scaffold = async () => step({ phase: "scaffold", command: "npx", args: ["--yes", `create-next-app@${pins.createNextApp}`, workspace.consumer, ...SCAFFOLD_FLAGS], cwd: workspace.root, limitMs: limits.scaffoldMs });
    let scaffoldOutcome = await scaffold();
    if (classifyOutcome(scaffoldOutcome) === "environment" && !scaffoldOutcome.timedOut) {
      log("  scaffold hit a network/environment failure — one retry");
      rmSync(workspace.consumer, { recursive: true, force: true });
      scaffoldOutcome = await scaffold();
    }
    const scaffoldOk = classifyOutcome(scaffoldOutcome) === "ok" && existsSync(join(workspace.consumer, "package.json"));
    add({
      checkId: id("scaffold", "create-next-app"),
      status: scaffoldOk ? "pass" : "unknown",
      ...(scaffoldOk ? {} : { failureCode: "ENVIRONMENT_ERROR" as const }),
      claim: "a clean Next.js App Router consumer is scaffolded with the pinned create-next-app",
      authority: "ccv-scenario",
      evidence: [evidence("command", "create-next-app", `create-next-app@${pins.createNextApp} ${SCAFFOLD_FLAGS.join(" ")}`), ...(scaffoldOk ? [] : [evidence("command", "scaffold", `${describeOutcome(scaffoldOutcome)} — ${tail(scaffoldOutcome)}`)])],
    });
    if (!scaffoldOk) {
      notEvaluated("the consumer could not be scaffolded", true);
      return finish();
    }

    const packageBefore = readFileSync(join(workspace.consumer, "package.json"), "utf8");
    writeFileSync(join(workspace.consumer, "components.json"), componentsJson(registry.template), "utf8");
    const before = snapshotTree(workspace.consumer);
    const tailwind = /"tailwind/i.test(packageBefore) || ["tailwind.config.js", "tailwind.config.ts", "postcss.config.mjs", "postcss.config.js"].some((file) => existsSync(join(workspace.consumer, file)));
    const preExisting = Array.from(expectedPaths).filter((path) => before.has(path)).sort();
    const markerInScaffold = Array.from(before.keys()).filter((path) => /\.(tsx?|css)$/.test(path) && /@skrewww-component/.test(readFileSync(join(workspace.consumer, path), "utf8")));
    const clean = !tailwind && preExisting.length === 0 && markerInScaffold.length === 0;
    add({
      checkId: id("scaffold", "clean"),
      status: clean ? "pass" : "unknown",
      ...(clean ? {} : { failureCode: "ENVIRONMENT_ERROR" as const }),
      claim: "before the install the consumer is Tailwind-free and contains no Skrewww file or expected install path",
      authority: "ccv-scenario",
      evidence: [
        evidence("file", "tailwind", tailwind ? "Tailwind detected" : "no tailwind dependency or config"),
        evidence("file", "pre-existing", preExisting.length ? preExisting.join(", ") : "no expected install path exists before the install"),
        evidence("file", "components.json", "hand-written (shadcn init requires Tailwind); @skrewww registry → local loopback registry"),
      ],
    });
    if (!clean) {
      notEvaluated("the scaffold was not a clean consumer", true);
      return finish();
    }

    // ── install ──────────────────────────────────────────────────────────
    const groups = strategy === "single" ? [input.subjects] : input.subjects.map((subject) => [subject]);
    installOrder = [...input.subjects];
    let installClass: "ok" | "environment" | "contract" = "ok";
    let installFailure: CommandOutcome | undefined;
    for (const group of groups) {
      const outcome = await step({ phase: "shadcn-add", command: "npx", args: ["--yes", `shadcn@${pins.shadcn}`, "add", ...group.map((name) => `@skrewww/${name}`), "--yes"], cwd: workspace.consumer, limitMs: limits.installMs });
      const outcomeClass = classifyOutcome(outcome);
      if (outcomeClass !== "ok") {
        installClass = outcomeClass;
        installFailure = outcome;
        break;
      }
    }
    add({
      checkId: id("install", "shadcn-add"),
      status: installClass === "ok" ? "pass" : installClass === "environment" ? "unknown" : "fail",
      ...(installClass === "ok" ? {} : { failureCode: installClass === "environment" ? ("ENVIRONMENT_ERROR" as const) : ("INSTALL_FAILED" as const) }),
      claim: "the pinned shadcn CLI installs every subject from the local canonical registry",
      authority: "generator",
      evidence: [
        evidence("command", "shadcn add", `shadcn@${pins.shadcn} add --yes · ${strategy === "single" ? "one invocation" : "one invocation per subject"} · ${input.subjects.length} subject(s) in generator order`),
        ...listEvidence("command", "install-order", input.subjects.map((name) => `@skrewww/${name}`)),
        ...(installFailure ? [evidence("command", "shadcn-add", `${describeOutcome(installFailure)} — ${tail(installFailure)}`)] : []),
      ],
    });
    if (installClass === "environment") {
      notEvaluated("the install hit an environment/network failure", true);
      return finish();
    }

    // ── installed filesystem ─────────────────────────────────────────────
    const after = snapshotTree(workspace.consumer);
    const diff = diffSnapshots(before, after);
    const read = (path: string): Buffer | undefined => (after.has(path) ? readFileSync(join(workspace.consumer, path)) : undefined);
    for (const file of expectation.files) {
      const verdict = classifyInstalledFile({ expected: file, actual: read(file.installPath), expectedContent: file.sha256.length === 1 ? contentByPath.get(file.installPath) : undefined });
      const base = {
        checkId: id("file", file.installPath),
        claim: `installed ${file.installPath} equals the expected bytes (${file.items.join(", ")})`,
        authority: "generator" as const,
        expected: file.sha256.join(" | "),
      };
      const expectedEvidence = evidence("hash", `expected:${file.installPath}`, `${file.kinds.join("/")} file of ${file.items.join(", ")}${file.originMarker ? `; origin marker @skrewww-component ${file.originMarker} expected` : ""}`, file.sha256.length === 1 ? file.sha256[0] : undefined);
      switch (verdict.kind) {
        case "match":
          add({ ...base, status: "pass", actual: verdict.actualSha, evidence: [evidence("hash", `installed:${file.installPath}`, `${verdict.bytes} bytes`, verdict.actualSha)] });
          break;
        case "missing":
          add({ ...base, status: "fail", failureCode: "FILE_MISSING", actual: "(absent)", evidence: [expectedEvidence, evidence("file", file.installPath, "not present after the install")] });
          break;
        case "contributors-disagree":
          add({ ...base, status: "fail", failureCode: "MANIFEST_MISMATCH", actual: verdict.actualSha ?? "(absent)", evidence: [evidence("hash", `expected:${file.installPath}`, `contributing manifests embed ${file.sha256.length} different contents: ${file.items.join(", ")}`)] });
          break;
        case "upstream-transform":
          add({
            ...base,
            status: "fail",
            failureCode: "UPSTREAM_TRANSFORM",
            actual: verdict.actualSha,
            evidence: [
              expectedEvidence,
              evidence("hash", `installed:${file.installPath}`, `${verdict.bytes} bytes; proven transformation: ${verdict.transform}`, verdict.actualSha),
              evidence("tool", "shadcn", `transformation performed by shadcn@${pins.shadcn}`),
              ...(verdict.markerExpected ? [evidence("file", `marker:${file.installPath}`, verdict.markerPresent ? "origin marker present" : `origin marker @skrewww-component ${file.originMarker} ABSENT — Guard's public provenance contract reads this marker`)] : []),
            ],
          });
          break;
        case "content-mismatch":
          add({
            ...base,
            status: "fail",
            failureCode: "FILE_CONTENT_MISMATCH",
            actual: verdict.actualSha,
            evidence: [
              expectedEvidence,
              evidence("hash", `installed:${file.installPath}`, `${verdict.bytes} bytes; no known installer transformation explains the difference`, verdict.actualSha),
              evidence("file", `first-difference:${file.installPath}`, `line ${verdict.firstDifference.line}: expected ${JSON.stringify(verdict.firstDifference.expected)} · installed ${JSON.stringify(verdict.firstDifference.actual)}`),
              ...(verdict.markerExpected ? [evidence("file", `marker:${file.installPath}`, verdict.markerPresent ? "origin marker present" : "origin marker absent (and other bytes differ too)")] : []),
            ],
          });
          break;
      }
    }

    const packageAfter = readFileSync(join(workspace.consumer, "package.json"), "utf8");
    const delta = dependencyDelta(readDirectDependencies(packageBefore), readDirectDependencies(packageAfter));
    const fileSet = evaluateFileSet(diff, expectedPaths, { dependenciesExpected: expectation.npm.length > 0, before: new Set(before.keys()) });
    const unexpectedFiles = [...fileSet.unexpectedAdded.map((path) => `added ${path}`), ...fileSet.removed.map((path) => `removed ${path}`), ...fileSet.unexpectedModified.map((path) => `modified ${path}`)];
    add({
      checkId: id("file-set", "unexpected"),
      status: unexpectedFiles.length === 0 ? "pass" : "fail",
      ...(unexpectedFiles.length === 0 ? {} : { failureCode: "FILE_UNEXPECTED" as const }),
      claim: "the install writes nothing outside the expected install paths (package manifests only when dependencies are declared)",
      authority: "generator",
      evidence: unexpectedFiles.length === 0
        ? [evidence("file", "file-set", `${diff.added.length} added, ${diff.modified.length} modified, 0 removed; every change explained (${expectedPaths.size} expected install paths)`)]
        : listEvidence("file", "unexpected", unexpectedFiles),
    });

    // ── dependencies ─────────────────────────────────────────────────────
    const dependencies = evaluateDependencies(delta, expectation.npm);
    for (const name of expectation.npm) {
      const present = dependencies.present.find((entry) => entry.name === name);
      add({
        checkId: id("dependency-npm", name),
        status: present ? "pass" : "fail",
        ...(present ? {} : { failureCode: "DEPENDENCY_MISMATCH" as const }),
        claim: `declared npm dependency ${name} is added to the consumer`,
        authority: "canonical-registry",
        expected: name,
        actual: present ? `${name}@${present.spec}` : "(not added)",
        evidence: [evidence("package-metadata", "package.json", present ? `added as ${present.spec} (the manifest declares the name only; the installer chose the range)` : "missing from the dependency delta")],
      });
    }
    const unexpectedDeps = [...dependencies.unexpected.map((entry) => `added ${entry.name}@${entry.spec}`), ...dependencies.removed.map((name) => `removed ${name}`), ...dependencies.changed.map((entry) => `changed ${entry.name} ${entry.before} → ${entry.after}`)];
    add({
      checkId: id("dependencies", "unexpected"),
      status: unexpectedDeps.length === 0 ? "pass" : "fail",
      ...(unexpectedDeps.length === 0 ? {} : { failureCode: "DEPENDENCY_MISMATCH" as const }),
      claim: "the install adds, removes or changes no direct dependency beyond the declared npm dependencies (host requirements are never installed)",
      authority: "canonical-registry",
      evidence: unexpectedDeps.length === 0
        ? [evidence("package-metadata", "package.json", `delta: ${Object.keys(delta.added).sort().join(", ") || "(none)"}; host requirements not installed by the add: ${expectation.hostRequirements.join(", ") || "(none)"}`)]
        : listEvidence("package-metadata", "unexpected", unexpectedDeps),
    });

    // ── registry closure ─────────────────────────────────────────────────
    const closure = evaluateRegistryClosure(registry.requests(), expectation.closureItems, distributed);
    const foundationItems = Array.from(new Set(expectation.files.filter((file) => file.kinds.includes("foundation")).flatMap((file) => file.items))).sort();
    const closureOk = closure.missing.length === 0 && closure.extra.length === 0 && closure.unknown.length === 0;
    add({
      checkId: id("registry-closure", "resolved"),
      status: closureOk ? "pass" : "fail",
      ...(closureOk ? {} : { failureCode: closure.missing.length > 0 ? ("INSTALL_FAILED" as const) : ("MANIFEST_MISMATCH" as const) }),
      claim: "the installer resolves exactly the derived registry-dependency closure",
      authority: "generator",
      expected: `${expectation.closureItems.length} items`,
      actual: `${closure.requested.length} items requested`,
      evidence: [
        evidence("registry-payload", "closure", `expected ${expectation.closureItems.length} item(s); requested ${closure.requested.length}; missing ${closure.missing.join(", ") || "none"}; extra ${closure.extra.join(", ") || "none"}; unknown ${closure.unknown.join(", ") || "none"}`),
        ...foundationItems.map((name) => evidence("registry-payload", name, closure.requested.includes(name) ? `${name} resolved through registryDependencies (never requested directly)` : `${name} NOT resolved`)),
      ],
    });

    // ── import closure ───────────────────────────────────────────────────
    const transported = new Set(expectation.files.filter((file) => after.has(file.installPath)).map((file) => file.installPath));
    const importVerdicts = evaluateImportClosure({
      files: expectation.files.filter((file) => after.has(file.installPath)).map((file) => ({ installPath: file.installPath, content: readFileSync(join(workspace.consumer, file.installPath), "utf8"), declaredPackages: file.declaredPackages })),
      transported,
      exists: (path) => existsSync(join(workspace.consumer, path)),
      packageInstalled: (name) => existsSync(join(workspace.consumer, "node_modules", name, "package.json")),
    });
    for (const verdict of importVerdicts) {
      const undeclared = verdict.problems.filter((problem) => problem.problem === "undeclared-package");
      const ok = verdict.problems.length === 0;
      add({
        checkId: id("imports", verdict.installPath),
        status: ok ? "pass" : "fail",
        ...(ok ? {} : { failureCode: undeclared.length === verdict.problems.length ? ("DEPENDENCY_MISMATCH" as const) : ("IMPORT_UNRESOLVED" as const) }),
        claim: `every import in installed ${verdict.installPath} resolves within the installed result or to a declared, installed package`,
        authority: "generator",
        evidence: ok
          ? [evidence("source", verdict.installPath, `${verdict.resolvedLocal} local import(s) resolved to transported files; packages: ${verdict.resolvedPackages.join(", ") || "(none)"}`)]
          : verdict.problems.map((problem) => evidence("source", `${verdict.installPath} → ${problem.specifier}`, `${problem.problem}: ${problem.detail}`)),
      });
    }

    // ── exports, typecheck and build ─────────────────────────────────────
    const exportEntries = expectation.exports.filter((entry) => after.has(entry.installPath));
    const harness = generateExportsHarness(exportEntries);
    mkdirSync(join(workspace.consumer, "ccv"), { recursive: true });
    writeFileSync(join(workspace.consumer, harness.path), harness.source, "utf8");
    const foundationPath = expectation.files.find((file) => file.kinds.includes("foundation"))?.installPath;
    writeFileSync(join(workspace.consumer, CONSUMER_PAGE_PATH), generateConsumerPage(foundationPath), "utf8");

    const bin = (name: string) => join(workspace.consumer, "node_modules", ".bin", name);
    const typegen = await step({ phase: "next-typegen", command: bin("next"), args: ["typegen"], cwd: workspace.consumer, limitMs: limits.typegenMs });
    const tsconfig = readText(join(workspace.consumer, "tsconfig.json"));
    const compilerOptions = tsconfig ? ((JSON.parse(tsconfig) as { compilerOptions?: Record<string, unknown> }).compilerOptions ?? {}) : {};
    const tsc = await step({ phase: "tsc", command: bin("tsc"), args: ["--noEmit", "--pretty", "false", "-p", "tsconfig.json"], cwd: workspace.consumer, limitMs: limits.typecheckMs });
    const tscClass = classifyOutcome(tsc);
    const diagnostics = classifyDiagnostics(parseTscOutput(redact(tsc.stdoutTail)), harness, transported);

    for (const entry of exportEntries) {
      const missing = diagnostics.missingExports.filter((line) => line.installPath === entry.installPath);
      const environmentBlocked = tscClass === "environment";
      add({
        checkId: id("exports", entry.installPath),
        status: environmentBlocked ? "unknown" : missing.length === 0 ? "pass" : "fail",
        ...(environmentBlocked ? { failureCode: "ENVIRONMENT_ERROR" as const } : missing.length === 0 ? {} : { failureCode: "EXPORT_MISSING" as const }),
        claim: `every export attributed to ${entry.sourcePath} is importable from installed ${entry.installPath}`,
        authority: "public-barrel",
        expected: `${entry.values.length} value(s), ${entry.types.length} type(s)`,
        evidence: environmentBlocked
          ? [evidence("command", "tsc", describeOutcome(tsc))]
          : missing.length === 0
            ? [evidence("export", entry.installPath, `values: ${entry.values.join(", ") || "(none)"}; types: ${entry.types.join(", ") || "(none)"}`)]
            : missing.map((line) => evidence("export", `${entry.installPath}#${line.name}`, `${line.kind} ${line.name}: ${line.code} ${line.message}`)),
      });
    }

    const tscOk = tscClass === "ok";
    add({
      checkId: id("typecheck", "tsc"),
      status: tscClass === "environment" ? "unknown" : tscOk ? "pass" : "fail",
      ...(tscOk ? {} : { failureCode: tscClass === "environment" ? ("ENVIRONMENT_ERROR" as const) : diagnostics.other.length === 0 && diagnostics.missingExports.length === 0 && diagnostics.unresolvedImports.length > 0 ? ("IMPORT_UNRESOLVED" as const) : ("TYPECHECK_FAILED" as const) }),
      claim: "the consumer type-checks with the installed result and the export harness",
      authority: "ccv-scenario",
      evidence: [
        evidence("command", "tsc", `tsc --noEmit -p tsconfig.json; strict=${String(compilerOptions.strict)}, skipLibCheck=${String(compilerOptions.skipLibCheck)}, noEmit, isolatedModules=${String(compilerOptions.isolatedModules)}; next typegen ${classifyOutcome(typegen) === "ok" ? "ok" : describeOutcome(typegen)}`),
        ...(tscOk ? [] : [
          evidence("command", "tsc-result", `${describeOutcome(tsc)}; ${diagnostics.missingExports.length} missing-export, ${diagnostics.unresolvedImports.length} unresolved-import, ${diagnostics.other.length} other diagnostic(s)`),
          ...[...diagnostics.unresolvedImports, ...diagnostics.other].slice(0, 20).map((diagnostic) => evidence("source", `${diagnostic.file}:${diagnostic.line}`, `${diagnostic.code} ${diagnostic.message}`)),
        ]),
      ],
    });

    const build = await step({ phase: "next-build", command: bin("next"), args: ["build"], cwd: workspace.consumer, limitMs: limits.buildMs });
    const buildClass = classifyOutcome(build);
    add({
      checkId: id("build", "next-build"),
      status: buildClass === "ok" ? "pass" : buildClass === "environment" ? "unknown" : "fail",
      ...(buildClass === "ok" ? {} : { failureCode: buildClass === "environment" ? ("ENVIRONMENT_ERROR" as const) : ("BUILD_FAILED" as const) }),
      claim: "the consumer production build succeeds with every installed module imported (additional proof; not a substitute for the checks above)",
      authority: "ccv-scenario",
      evidence: [evidence("command", "next build", buildClass === "ok" ? `succeeded; ${CONSUMER_PAGE_PATH} imports the Foundation stylesheet and the export harness` : `${describeOutcome(build)} — ${tail(build, 20)}`)],
    });

    for (const pkg of ["next", "react", "react-dom", "typescript"]) {
      const version = installedVersion(workspace.consumer, pkg);
      if (version) environmentTools[pkg] = version;
    }
    const shadcnVersion = await step({ phase: "shadcn-version", command: "npx", args: ["--yes", `shadcn@${pins.shadcn}`, "--version"], cwd: workspace.consumer, limitMs: limits.probeMs });
    if (classifyOutcome(shadcnVersion) === "ok") environmentTools.shadcn = shadcnVersion.stdoutTail.trim().split(/\s+/).pop() ?? pins.shadcn;
  } catch (error) {
    notEvaluated(`verifier error: ${error instanceof Error ? error.message : String(error)}`, true);
  }
  return finish();

  async function finish(): Promise<VerifyShadcnOutput> {
    if (registry) await registry.close();
    cleanupNote = cleanupWorkspace(workspace, Boolean(input.keep), input.remove);
    add({
      checkId: id("cleanup", "workspace"),
      status: cleanupNote.error ? "unknown" : "pass",
      ...(cleanupNote.error ? { failureCode: "ENVIRONMENT_ERROR" as const } : {}),
      claim: "the run removes its workspace (consumer, HOME, npm cache, TMPDIR) unless --keep",
      authority: "ccv-scenario",
      evidence: [evidence("command", "cleanup", cleanupNote.kept ? "kept on request (--keep)" : cleanupNote.removed ? "workspace removed" : `removal failed: ${redact(cleanupNote.error ?? "")}`)],
    });
    const result = assembleResult({
      subject: input.subjectLabel,
      gitSha: input.gitSha,
      environment: { node: input.nodeVersion ?? process.version, platform: input.platform ?? `${process.platform}-${process.arch}`, ...(npmVersion ? { packageManager: `npm@${npmVersion}` } : {}), tools: environmentTools },
      checks,
      volatile: { startedAt: new Date(started).toISOString(), durationMs: now() - started },
    });
    return { result, exitCode: exitCodeFor(result), workspaceRoot: workspace.root, kept: cleanupNote.kept, installOrder };
  }
}

