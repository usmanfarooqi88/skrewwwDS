import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { deriveNpmContract } from "@/lib/ccv/derive-npm-contract";
import { SURFACE_HARNESS_PATH } from "@/lib/ccv/npm/consumer";
import { readTarGz } from "@/lib/ccv/npm/tarball";
import { verifyNpmLocalTarball, type VerifyNpmInput } from "@/lib/ccv/npm/verify";
import { runCommand, type CommandOutcome, type CommandRunner, type CommandSpec } from "@/lib/ccv/runner/process";
import { compareStableResults } from "@/lib/ccv/runner/result";
import { serializeCcvResult } from "@/lib/ccv/serialize";
import type { CcvCheck, CcvResult, NpmConsumerContract } from "@/lib/ccv/types";
import { validateCcvResult } from "@/lib/ccv/validate";

/**
 * CCV-3 orchestration with a FAKE npm (pack / install), fake tsc and fake vite —
 * no network, no real package build. The fake package is generated from the real
 * CCV-1 contract; the plain-Node probe runs for real against the fake installed
 * package, so export equality and exports-map denial are judged by Node itself.
 */

const SHA = "0123456789abcdef0123456789abcdef01234567";
const root = process.cwd();
let contract: NpmConsumerContract;
beforeAll(() => {
  contract = deriveNpmContract({ gitSha: SHA });
});

type PackageFiles = Map<string, string>;

function packageFiles(mutate?: (files: PackageFiles, manifest: Record<string, any>) => void): PackageFiles {
  const e = contract.expectations;
  const manifest: Record<string, any> = {
    name: e.package.name, version: e.package.version, type: e.package.type, engines: { node: e.package.engines }, exports: JSON.parse(JSON.stringify(e.package.exportsMap)),
    sideEffects: e.package.sideEffects, files: ["dist", "README.md", "LICENSE"], dependencies: { ...e.dependencies.ranges.npm }, peerDependencies: { ...e.dependencies.ranges.peers },
    scripts: { prepublishOnly: "node ../../scripts/check-react-publish-tag.mjs" },
  };
  const files: PackageFiles = new Map([
    ["README.md", "# readme\n"],
    ["LICENSE", "MIT\n"],
    ["dist/index.js", `${e.exports.values.map((name) => `const ${name} = "${name}";`).join("\n")}\nexport { ${e.exports.values.join(", ")} };\n`],
    ["dist/index.d.ts", `${e.exports.values.map((name) => `export declare const ${name}: unknown;`).join("\n")}\n${e.exports.types.map((name) => `export type ${name} = unknown;`).join("\n")}\n`],
    ["dist/styles.css", `:root { ${e.css.declaredCustomProperties.slice(0, 3).map((name) => `${name}: 1px;`).join(" ")} }\n`],
  ]);
  mutate?.(files, manifest);
  files.set("package.json", `${JSON.stringify(manifest, null, 2)}\n`);
  return files;
}

function tgz(files: PackageFiles): Buffer {
  const blocks: Buffer[] = [];
  for (const [path, content] of Array.from(files)) {
    const data = Buffer.from(content);
    const header = Buffer.alloc(512);
    header.write(`package/${path}`, 0, "utf8");
    header.write(data.length.toString(8).padStart(11, "0"), 124, "ascii");
    header.write("0", 156, "ascii");
    header.write("ustar", 257, "ascii");
    blocks.push(header, data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

type FakeOptions = {
  mutatePackage?: (files: PackageFiles, manifest: Record<string, any>) => void;
  /** Change installed files after extraction (normal install only unless `alsoIgnoreScripts`). */
  afterInstall?: (installedDir: string, consumer: string, ignoreScripts: boolean) => void;
  tscStdout?: (consumer: string) => string;
  viteFails?: boolean;
  timeoutPhase?: string;
  buildThrows?: boolean;
};

const ok = (spec: CommandSpec, stdout = ""): CommandOutcome => ({ phase: spec.phase, exitCode: 0, signal: null, timedOut: false, stdoutTail: stdout, stderrTail: "", durationMs: 1 });
const write = (path: string, content: string | Buffer) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

function fakeRunner(options: FakeOptions = {}, seen: CommandSpec[] = []): CommandRunner {
  return async (spec) => {
    seen.push(spec);
    if (options.timeoutPhase === spec.phase) return { phase: spec.phase, exitCode: null, signal: "SIGTERM", timedOut: true, stdoutTail: "", stderrTail: "", durationMs: spec.timeoutMs };
    if (spec.phase === "npm-version") return ok(spec, "11.12.1\n");
    if (spec.phase === "npm-pack") {
      const destination = spec.args[spec.args.indexOf("--pack-destination") + 1];
      const files = packageFiles(options.mutatePackage);
      const filename = "skrewww-react-0.1.0-beta.2.tgz";
      write(join(destination, filename), tgz(files));
      return ok(spec, JSON.stringify([{ name: contract.subject, version: contract.expectations.package.version, filename, integrity: "sha512-ZmFrZQ==", files: Array.from(files.keys()).map((path) => ({ path })) }]));
    }
    if (spec.phase === "npm-install" || spec.phase === "npm-install-ignore-scripts") {
      const ignoreScripts = spec.args.includes("--ignore-scripts");
      const pkg = JSON.parse(readFileSync(join(spec.cwd, "package.json"), "utf8"));
      const tarball = String(pkg.dependencies[contract.subject]).replace(/^file:/, "");
      const installedDir = join(spec.cwd, "node_modules", ...contract.subject.split("/"));
      for (const [path, data] of Array.from(readTarGz(readFileSync(tarball)).files)) write(join(installedDir, path.replace(/^package\//, "")), data);
      const installedManifest = JSON.parse(readFileSync(join(installedDir, "package.json"), "utf8"));
      for (const name of Object.keys(installedManifest.dependencies ?? {})) write(join(spec.cwd, "node_modules", ...name.split("/"), "package.json"), JSON.stringify({ name, version: "2.1.10" }));
      for (const name of ["react", "react-dom", "vite", "typescript"]) write(join(spec.cwd, "node_modules", name, "package.json"), JSON.stringify({ name, version: pkg.dependencies[name] ?? pkg.devDependencies[name] }));
      write(join(spec.cwd, "package-lock.json"), JSON.stringify({ packages: { "": {}, [`node_modules/${contract.subject}`]: {}, ...Object.fromEntries(Object.keys(installedManifest.dependencies ?? {}).map((name) => [`node_modules/${name}`, {}])) } }));
      options.afterInstall?.(installedDir, spec.cwd, ignoreScripts);
      return ok(spec);
    }
    if (spec.phase === "node-probe" || spec.phase === "node-probe-ignore-scripts") return runCommand({ ...spec, command: process.execPath });
    if (spec.phase === "tsc" || spec.phase === "tsc-ignore-scripts") {
      const stdout = options.tscStdout?.(spec.cwd) ?? "";
      return stdout ? { ...ok(spec, stdout), exitCode: 2 } : ok(spec);
    }
    if (spec.phase === "vite-build" || spec.phase === "vite-build-ignore-scripts") {
      if (options.viteFails) return { ...ok(spec), exitCode: 1, stderrTail: "[vite]: Rollup failed to resolve import" };
      const css = readFileSync(join(spec.cwd, "node_modules", ...contract.subject.split("/"), "dist", "styles.css"), "utf8");
      write(join(spec.cwd, "dist", "assets", "index.css"), css.replace(/\s+/g, ""));
      return ok(spec);
    }
    throw new Error(`unexpected command ${spec.phase}`);
  };
}

let base: string;
beforeEach(() => {
  base = realpathSync(mkdtempSync(join(tmpdir(), "ccv-npm-test-")));
});
afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

async function verify(options: FakeOptions = {}, overrides: Partial<VerifyNpmInput> = {}, seen: CommandSpec[] = []) {
  let clock = 1_791_000_000_000;
  return verifyNpmLocalTarball({
    repoRoot: root,
    gitSha: SHA,
    contract,
    packageDir: base,
    buildPackage: async () => {
      if (options.buildThrows) throw new Error("tsc: declaration emit failed");
    },
    run: fakeRunner(options, seen),
    parentEnv: { PATH: process.env.PATH, NPM_TOKEN: "npm_supersecret_token_value" },
    workspaceBase: base,
    now: () => (clock += 1000),
    nodeVersion: "v24.14.0",
    platform: "test-x64",
    ...overrides,
  });
}

const check = (result: CcvResult, suffix: string): CcvCheck => {
  const found = result.checks.find((candidate) => candidate.checkId.endsWith(suffix));
  if (!found) throw new Error(`no check ${suffix}`);
  return found;
};
const failures = (result: CcvResult) => result.checks.filter((candidate) => candidate.status === "fail").map((candidate) => `${candidate.checkId.replace("npm:@skrewww/react:", "")}=${candidate.failureCode}`);
const harnessLine = (consumer: string, kind: "type" | "value", name: string) => {
  const lines = readFileSync(join(consumer, SURFACE_HARNESS_PATH), "utf8").split("\n");
  const typeStart = lines.indexOf("import type {");
  const valueStart = lines.indexOf("import {");
  const from = kind === "type" ? typeStart : valueStart;
  return lines.findIndex((line, index) => index > from && line.trim() === `${name},`) + 1;
};

describe("CCV-3 verifier — a clean candidate", () => {
  it("passes every check, validates, cleans up and runs with an isolated environment", async () => {
    const seen: CommandSpec[] = [];
    const { result, exitCode } = await verify({}, {}, seen);
    expect(validateCcvResult(result)).toEqual({ ok: true });
    expect(failures(result)).toEqual([]);
    expect(result.summary.unknown).toBe(0);
    expect(exitCode).toBe(0);
    expect(result.distribution).toBe("npm-package");
    expect(result.mode).toBe("LOCAL_TARBALL");
    expect(result.source).toMatchObject({ expectedGitSha: SHA, packageVersion: contract.expectations.package.version });
    // one check per contract export and type, no hand list
    expect(result.checks.filter((c) => c.checkId.includes(":export:") && !c.checkId.endsWith(":unexpected")).length).toBe(contract.expectations.exports.values.length);
    expect(result.checks.filter((c) => c.checkId.includes(":type:")).length).toBe(contract.expectations.exports.types.length);
    expect(check(result, ":specifier:@skrewww/react/dist/index.js").evidence[0].observed).toMatch(/ERR_PACKAGE_PATH_NOT_EXPORTED/);
    expect(readdirSync(base)).toEqual([]);
    for (const spec of seen) {
      expect(spec.env.NPM_TOKEN).toBeUndefined();
      expect(spec.env.HOME.startsWith(base)).toBe(true);
      expect(spec.args.join(" ")).not.toMatch(/latest|publish|--from-registry/);
    }
    const install = seen.find((spec) => spec.phase === "npm-install")!;
    expect(install.cwd.startsWith(base)).toBe(true);
    expect(seen.find((spec) => spec.phase === "npm-install-ignore-scripts")!.args).toContain("--ignore-scripts");
    const pack = seen.find((spec) => spec.phase === "npm-pack")!;
    expect(pack.args[pack.args.indexOf("--pack-destination") + 1].startsWith(base)).toBe(true);
    expect(serializeCcvResult(result)).not.toContain("npm_supersecret_token_value");
  });

  it("is reproducible: two runs give identical stable sections", async () => {
    const first = await verify();
    const second = await verify();
    expect(compareStableResults(first.result, second.result).identical).toBe(true);
    expect(serializeCcvResult({ ...first.result, volatile: undefined })).not.toMatch(/ccv-npm-test-|skrewww-ccv-/);
  });
});

describe("CCV-3 verifier — every mutation is caught with the right code", () => {
  const cases: Array<[string, FakeOptions, string[]]> = [
    ["missing runtime export", { mutatePackage: (files) => files.set("dist/index.js", files.get("dist/index.js")!.replace(/export \{ (\w+), /, "export { ")) }, ["EXPORT_MISSING"]],
    ["extra runtime export", { mutatePackage: (files) => files.set("dist/index.js", `${files.get("dist/index.js")}export const Extra = 1;\n`) }, ["export:unexpected=EXPORT_UNEXPECTED"]],
    ["exposed deep import", { mutatePackage: (_files, manifest) => (manifest.exports["./dist/*"] = "./dist/*") }, ["specifier:@skrewww/react/dist/index.js=DEEP_IMPORT_EXPOSED", "manifest:exports=MANIFEST_MISMATCH"]],
    ["removed packed file", { mutatePackage: (files) => files.delete("README.md") }, ["artifact:pack-rules=FILE_MISSING"]],
    ["unexpected packed file", { mutatePackage: (files) => files.set("src/secret.ts", "export {};\n") }, ["artifact:pack-rules=FILE_UNEXPECTED"]],
    ["installed file differs from the packed file", { afterInstall: (dir, _c, ignore) => !ignore && writeFileSync(join(dir, "README.md"), "# changed\n") }, ["file:README.md=FILE_CONTENT_MISMATCH"]],
    ["unexpected direct dependency", { mutatePackage: (_f, manifest) => (manifest.dependencies["left-pad"] = "^1.3.0") }, ["dependency:unexpected=DEPENDENCY_MISMATCH"]],
    ["wrong peer range", { mutatePackage: (_f, manifest) => (manifest.peerDependencies.react = ">=16.0.0") }, ["peer:react=PEER_DEPENDENCY_MISMATCH"]],
    ["added consumer-run postinstall", { mutatePackage: (_f, manifest) => (manifest.scripts.postinstall = "node setup.js") }, ["lifecycle:consumer-run=LIFECYCLE_SCRIPT_UNEXPECTED"]],
    ["leaked @/ declaration import", { mutatePackage: (files) => files.set("dist/index.d.ts", `import type { X } from "@/lib/cn";\n${files.get("dist/index.d.ts")}`) }, ["declarations:leaks=IMPORT_UNRESOLVED"]],
    ["leaked Next dependency", { mutatePackage: (_f, manifest) => (manifest.dependencies.next = "16.3.7") }, ["dependency:forbidden=DEPENDENCY_MISMATCH"]],
    ["typecheck failure", { tscStdout: () => "src/main.tsx(3,1): error TS2322: Type 'string' is not assignable to type 'number'.\n" }, ["typecheck:consumer=TYPECHECK_FAILED"]],
    ["build failure", { viteFails: true }, ["build:vite=BUILD_FAILED"]],
    ["unexpected install side effect", { afterInstall: (_d, consumer, ignore) => !ignore && writeFileSync(join(consumer, "postinstall-was-here.txt"), "x") }, ["postinstall:side-effects=POSTINSTALL_SIDE_EFFECT"]],
  ];
  it.each(cases)("%s", async (_name, options, expected) => {
    const { result, exitCode } = await verify(options);
    expect(validateCcvResult(result)).toEqual({ ok: true });
    const found = failures(result);
    for (const entry of expected) {
      if (entry.includes("=")) expect(found).toContain(entry);
      else expect(found.some((failure) => failure.endsWith(`=${entry}`))).toBe(true);
    }
    expect(exitCode).toBe(3);
  });

  it("a missing type export is caught from the consumer's strict typecheck", async () => {
    const name = contract.expectations.exports.types[0];
    const { result } = await verify({ tscStdout: (consumer) => `${SURFACE_HARNESS_PATH}(${harnessLine(consumer, "type", name)},3): error TS2305: Module '"@skrewww/react"' has no exported member '${name}'.\n` });
    expect(check(result, `:type:${name}`)).toMatchObject({ status: "fail", failureCode: "EXPORT_MISSING" });
    expect(check(result, ":typecheck:consumer").failureCode).toBe("TYPECHECK_FAILED");
  });

  it("a package that only works when install scripts run is caught by the --ignore-scripts consumer", async () => {
    const { result } = await verify({
      mutatePackage: (files, manifest) => {
        manifest.scripts.postinstall = "node generate-runtime.js";
        files.set("dist/index.js", `import "./runtime.js";\n${files.get("dist/index.js")}`);
      },
      // the normal install "runs" postinstall, which generates dist/runtime.js; --ignore-scripts does not
      afterInstall: (dir, _consumer, ignore) => !ignore && writeFileSync(join(dir, "dist", "runtime.js"), "export {};\n"),
    });
    expect(check(result, ":esm:root-import").status).toBe("pass");
    expect(check(result, ":lifecycle:ignore-scripts-import")).toMatchObject({ status: "fail", failureCode: "LIFECYCLE_SCRIPT_UNEXPECTED" });
    expect(check(result, ":lifecycle:consumer-run").failureCode).toBe("LIFECYCLE_SCRIPT_UNEXPECTED");
  });

  it("a candidate that cannot be built fails the build check and stops", async () => {
    const { result, exitCode } = await verify({ buildThrows: true });
    expect(check(result, ":artifact:build")).toMatchObject({ status: "fail", failureCode: "BUILD_FAILED" });
    expect(check(result, ":install:tarball").status).toBe("unknown");
    expect(exitCode).toBe(3);
  });
});

describe("CCV-3 verifier — environment failures stay UNKNOWN", () => {
  it("an install timeout → UNKNOWN with ENVIRONMENT_ERROR everywhere downstream, exit 2, workspace removed", async () => {
    const { result, exitCode } = await verify({ timeoutPhase: "npm-install" });
    expect(validateCcvResult(result)).toEqual({ ok: true });
    expect(check(result, ":install:tarball")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(result.summary.fail).toBe(0);
    expect(check(result, ":export:unexpected")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(exitCode).toBe(2);
    expect(readdirSync(base)).toEqual([]);
  });

  it("a typecheck timeout leaves runtime facts intact and makes the verdict untrustworthy", async () => {
    const { result, exitCode } = await verify({ timeoutPhase: "tsc" });
    expect(check(result, ":typecheck:consumer")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(check(result, ":esm:root-import").status).toBe("pass");
    expect(exitCode).toBe(2);
  });

  it("a cleanup failure is reported, never hidden; --keep keeps the workspace", async () => {
    const failed = await verify({}, { remove: () => { throw new Error("EBUSY"); } });
    expect(check(failed.result, ":cleanup:workspace")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    rmSync(failed.workspaceRoot, { recursive: true, force: true });
    const kept = await verify({}, { keep: true });
    expect(kept.kept).toBe(true);
    expect(existsSync(kept.workspaceRoot)).toBe(true);
  });
});
