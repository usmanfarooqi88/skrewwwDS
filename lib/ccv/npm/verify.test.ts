import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { generateKeyPairSync, sign } from "node:crypto";
import { gzipSync } from "node:zlib";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { deriveNpmContract } from "@/lib/ccv/derive-npm-contract";
import { syntheticCssFor } from "@/lib/ccv/css/synthetic";
import type { Fetcher, FetchOutcome } from "@/lib/ccv/public/fetcher";
import { sha1Hex, sri512 } from "@/lib/ccv/public/npm-provenance";
import { provenanceVerdict } from "@/lib/ccv/public/verdict";
import type { ReleaseIdentity } from "@/lib/ccv/public/release-identity";
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
    ["dist/index.js", `${e.exports.values.map((name) => `const ${name} = "${name}";`).join("\n")}\n${syntheticCssFor(e.css).script}\nexport { ${e.exports.values.join(", ")} };\n`],
    ["dist/index.d.ts", `${e.exports.values.map((name) => `export declare const ${name}: unknown;`).join("\n")}\n${e.exports.types.map((name) => `export type ${name} = unknown;`).join("\n")}\n`],
    ["dist/styles.css", syntheticCssFor(e.css).css],
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
  /** CCV-5 public-mode knobs */
  publicLock?: { resolved?: string; integrity?: string; link?: boolean };
  configRegistry?: string;
  rebuildDiffers?: boolean;
};

const ok = (spec: CommandSpec, stdout = ""): CommandOutcome => ({ phase: spec.phase, exitCode: 0, signal: null, timedOut: false, stdoutTail: stdout, stderrTail: "", durationMs: 1 });
const write = (path: string, content: string | Buffer) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

const PUBLIC_TARBALL_URL = (version: string) => `https://registry.npmjs.org/@skrewww/react/-/react-${version}.tgz`;

function fakeRunner(options: FakeOptions = {}, seen: CommandSpec[] = []): CommandRunner {
  let lastTarball = "";
  return async (spec) => {
    seen.push(spec);
    if (options.timeoutPhase === spec.phase) return { phase: spec.phase, exitCode: null, signal: "SIGTERM", timedOut: true, stdoutTail: "", stderrTail: "", durationMs: spec.timeoutMs };
    if (spec.phase === "npm-version") return ok(spec, "11.12.1\n");
    if (spec.phase === "npm-pack") {
      const destination = spec.args[spec.args.indexOf("--pack-destination") + 1];
      const files = packageFiles(options.mutatePackage);
      const filename = "skrewww-react-0.1.0-beta.2.tgz";
      write(join(destination, filename), tgz(files));
      lastTarball = join(destination, filename);
      return ok(spec, JSON.stringify([{ name: contract.subject, version: contract.expectations.package.version, filename, integrity: sri512(readFileSync(lastTarball)), files: Array.from(files.keys()).map((path) => ({ path })) }]));
    }
    if (spec.phase === "npm-install" || spec.phase === "npm-install-ignore-scripts") {
      const ignoreScripts = spec.args.includes("--ignore-scripts");
      const pkg = JSON.parse(readFileSync(join(spec.cwd, "package.json"), "utf8"));
      const dependencySpec = String(pkg.dependencies[contract.subject]);
      const tarball = dependencySpec.startsWith("file:") ? dependencySpec.replace(/^file:/, "") : lastTarball; // PUBLIC_NPM installs by registry spec: the fake "registry" serves the tarball its `npm pack` fetched
      const installedDir = join(spec.cwd, "node_modules", ...contract.subject.split("/"));
      for (const [path, data] of Array.from(readTarGz(readFileSync(tarball)).files)) write(join(installedDir, path.replace(/^package\//, "")), data);
      const installedManifest = JSON.parse(readFileSync(join(installedDir, "package.json"), "utf8"));
      for (const name of Object.keys(installedManifest.dependencies ?? {})) write(join(spec.cwd, "node_modules", ...name.split("/"), "package.json"), JSON.stringify({ name, version: "2.1.10" }));
      for (const name of ["react", "react-dom", "vite", "typescript"]) write(join(spec.cwd, "node_modules", name, "package.json"), JSON.stringify({ name, version: pkg.dependencies[name] ?? pkg.devDependencies[name] }));
      write(join(spec.cwd, "package-lock.json"), JSON.stringify({ packages: { "": {}, [`node_modules/${contract.subject}`]: dependencySpec.startsWith("file:") ? {} : { resolved: options.publicLock?.resolved ?? PUBLIC_TARBALL_URL(dependencySpec), integrity: options.publicLock?.integrity ?? sri512(readFileSync(tarball)), ...(options.publicLock?.link ? { link: true } : {}) }, ...Object.fromEntries(Object.keys(installedManifest.dependencies ?? {}).map((name) => [`node_modules/${name}`, {}])) } }));
      options.afterInstall?.(installedDir, spec.cwd, ignoreScripts);
      return ok(spec);
    }
    if (spec.phase === "npm-config-registry") return ok(spec, `${options.configRegistry ?? "https://registry.npmjs.org/"}\n`);
    if (spec.phase === "rebuild-clone") {
      mkdirSync(spec.args[spec.args.length - 1], { recursive: true });
      return ok(spec);
    }
    if (spec.phase === "rebuild-checkout" || spec.phase === "rebuild-build") return ok(spec);
    if (spec.phase === "rebuild-pack") {
      const destination = spec.args[spec.args.indexOf("--pack-destination") + 1];
      write(join(destination, "skrewww-react-0.1.0-beta.2.tgz"), tgz(packageFiles(options.rebuildDiffers ? (files) => files.set("dist/index.js", `${files.get("dist/index.js")}\n// tampered`) : undefined)));
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
      const own = existsSync(join(spec.cwd, "src", "consumer.css")) ? readFileSync(join(spec.cwd, "src", "consumer.css"), "utf8") : "";
      write(join(spec.cwd, "dist", "assets", "index.css"), `${css}${own}`.replace(/\s+/g, ""));
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

describe("CCV-4 npm — static stylesheet delivery and representative runtime (fake browser evidence)", () => {
  const focus = { reached: true, tabPresses: 1, matchesFocusVisible: true, outlineStyle: "solid", outlineWidth: "2px", outlineColor: "rgb(1, 2, 3)", boxShadow: "none" };
  const server = { startServer: async () => ({ ok: true as const, origin: "http://127.0.0.1:1", stop: async () => undefined }) };
  const commonChecks = (async (options: { rootDeclared: readonly string[] }) => ({ foundation: { checked: options.rootDeclared.length, empty: [] }, focus })) as never;

  it("static CSS checks run on the INSTALLED stylesheet; the package stylesheet precedes consumer CSS in the bundle", async () => {
    const { result } = await verify();
    for (const suffix of [":css:declarations", ":css:contract-surface", ":css:alias-chains", ":css:mode-selectors", ":css:consumer-order", ":css-fallback:--color-neutral-900"]) expect(check(result, suffix).status, suffix).toBe("pass");
    expect(result.checks.some((c) => c.checkId.includes(":runtime:"))).toBe(false);
  });

  it("mutation: a declaration missing from the installed stylesheet → CSS_DECLARATION_MISSING", async () => {
    const e = contract.expectations;
    const used = e.css.usedCustomProperties.find((name) => e.css.declaredCustomProperties.includes(name) && !e.css.fallbackBackedUses.includes(name))!;
    const { result } = await verify({ mutatePackage: (files) => files.set("dist/styles.css", files.get("dist/styles.css")!.replace(`  ${used}: 1px;\n`, "")) });
    expect(failures(result)).toEqual(expect.arrayContaining(["css:declarations=CSS_DECLARATION_MISSING"]));
  });

  it("runtime: recorded smoke assertions become checks with the same names; Foundation and focus judged", async () => {
    const browserChecks = async (_origin: string, assert: (name: string, ok: boolean, detail?: string) => void) => {
      assert("Shape pill: computed behavior", true, "radius=9999px");
      assert("Dialog: Escape closes it and focus returns to the trigger", true);
    };
    const { result, exitCode } = await verify({}, { runtime: { ...server, browserChecks, commonChecks } });
    expect(failures(result)).toEqual([]);
    expect(exitCode).toBe(0);
    for (const suffix of [":runtime:server", ":runtime:foundation-active", ":runtime:focus-visible", ":runtime:smoke-shape-pill", ":runtime:react-package-scenario"]) expect(check(result, suffix).status, suffix).toBe("pass");
  });

  it("runtime mutation: a failed Surface assertion → CSS_RUNTIME_UNRESOLVED and the scenario fails", async () => {
    const browserChecks = async (_origin: string, assert: (name: string, ok: boolean, detail?: string) => void) => assert("Surface glass: computed behavior", false, "backdrop=none");
    const { result } = await verify({}, { runtime: { ...server, browserChecks, commonChecks } });
    expect(failures(result)).toEqual(["runtime:smoke-surface-glass=CSS_RUNTIME_UNRESOLVED", "runtime:react-package-scenario=INTERACTION_FAILED"]);
  });

  it("a browser that cannot launch is UNKNOWN / ENVIRONMENT_ERROR; a failed build leaves runtime unknown without an environment code", async () => {
    const browserChecks = async () => {
      throw new Error("browserType.launch: Executable doesn't exist");
    };
    const crashed = await verify({}, { runtime: { ...server, browserChecks, commonChecks } });
    expect(check(crashed.result, ":runtime:react-package-scenario")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(crashed.exitCode).toBe(2);
    const noBuild = await verify({ viteFails: true }, { runtime: { ...server, browserChecks, commonChecks } });
    const runtimeChecks = noBuild.result.checks.filter((c) => c.checkId.includes(":runtime:"));
    expect(runtimeChecks.length).toBe(4);
    expect(runtimeChecks.every((c) => c.status === "unknown" && c.failureCode === undefined)).toBe(true);
  });
});

describe("CCV-5 PUBLIC_NPM verifier (injected registry, fake npm; no network, no build)", () => {
  const TAG_COMMIT = "6ea9e0d0a5c0980f88153e998ff5667acc3aab93";
  const keypair = generateKeyPairSync("ec", { namedCurve: "P-256" });

  const publicBundle = (over: { gitHead?: string | null; integrity?: string; signed?: boolean; distTags?: Record<string, string>; unavailable?: boolean; noKeys?: boolean } = {}) => {
    const version = contract.expectations.package.version;
    const tarballBytes = tgz(packageFiles());
    const integrity = over.integrity ?? sri512(tarballBytes);
    const sig = sign("sha256", Buffer.from(`${contract.subject}@${version}:${integrity}`), keypair.privateKey).toString("base64");
    const packument = {
      versions: { [version]: { version, ...(over.gitHead === null ? {} : { gitHead: over.gitHead ?? TAG_COMMIT }), dist: { integrity, shasum: sha1Hex(tarballBytes), tarball: PUBLIC_TARBALL_URL(version), signatures: over.signed === false ? [] : [{ keyid: "SHA256:test-key", sig }] } } },
      "dist-tags": over.distTags ?? { beta: version, latest: "0.1.0-beta.1" },
    };
    const keys = { keys: [{ keyid: "SHA256:test-key", key: keypair.publicKey.export({ type: "spki", format: "der" }).toString("base64") }] };
    const fetched: string[] = [];
    const fetcher: Fetcher = async (url) => {
      fetched.push(url);
      if (over.unavailable) return { kind: "network-error", message: "ENOTFOUND registry.npmjs.org" } satisfies FetchOutcome;
      const body = url.endsWith("/-/npm/v1/keys") ? (over.noKeys ? undefined : keys) : url.endsWith("/@skrewww%2freact") ? packument : undefined;
      if (!body) return { kind: "response", status: over.noKeys && url.endsWith("/keys") ? 503 : 404, bytes: new Uint8Array(), finalUrl: url };
      return { kind: "response", status: 200, bytes: new TextEncoder().encode(JSON.stringify(body)), finalUrl: url } satisfies FetchOutcome;
    };
    return { version, fetcher, fetched, integrity };
  };
  const release = (over: Partial<ReleaseIdentity> = {}): ReleaseIdentity => ({ packageName: contract.subject, version: contract.expectations.package.version, tag: `react-v${contract.expectations.package.version}`, tagCommit: TAG_COMMIT, tagObjectType: "tag", tagCarriesSignature: true, expectedDistTag: "beta", changedSinceTag: [], metadataChangedSinceTag: [], ...over });
  const publicVerify = (bundleOver: Parameters<typeof publicBundle>[0] = {}, options: FakeOptions = {}, releaseOver: Partial<ReleaseIdentity> = {}, seen: CommandSpec[] = []) => {
    const bundle = publicBundle(bundleOver);
    let buildCalls = 0;
    const promise = verify(options, { buildPackage: async () => { buildCalls += 1; }, public: { version: bundle.version, registryOrigin: "https://registry.npmjs.org", release: release(releaseOver), fetcher: bundle.fetcher } }, seen);
    return { promise, bundle, buildCalls: () => buildCalls };
  };
  const state = (result: CcvResult) => provenanceVerdict(result).state;

  it("PASS: public tarball == registry listing == rebuild at the release commit; gitHead == tag; signature verifies; consumed from the registry", async () => {
    const seen: CommandSpec[] = [];
    const run = publicVerify({}, {}, {}, seen);
    const { result, exitCode } = await run.promise;
    expect(validateCcvResult(result)).toEqual({ ok: true });
    expect(failures(result)).toEqual([]);
    expect(result.summary.unknown).toBe(0);
    expect(exitCode).toBe(0);
    expect(result.mode).toBe("PUBLIC_NPM");
    expect(state(result)).toBe("PASS");
    expect(result.checks.filter((c) => c.checkId.includes(":provenance:")).map((c) => c.checkId.split(":").pop())).toEqual(expect.arrayContaining(["expected-release", "registry-version", "git-head", "dist-tags", "signatures", "source-identity", "integrity", "rebuild", "consumed-public-artifact"]));
    // expected identity = the release tag commit; observed = the registry gitHead; integrity = the registry's
    expect(result.source).toMatchObject({ expectedGitSha: TAG_COMMIT, observedGitSha: TAG_COMMIT, packageVersion: run.bundle.version, integrity: run.bundle.integrity });
    expect(check(result, ":artifact:build").status).toBe("not-applicable");
  }, 60_000);

  it("never builds or packs the working tree, and installs the exact registry spec, not a file: tarball", async () => {
    const seen: CommandSpec[] = [];
    const run = publicVerify({}, {}, {}, seen);
    await run.promise;
    expect(run.buildCalls()).toBe(0);
    const pack = seen.find((spec) => spec.phase === "npm-pack")!;
    expect(pack.args).toContain(`${contract.subject}@${run.bundle.version}`);
    expect(pack.cwd).not.toBe(base); // not the repository package directory
    const installs = seen.filter((spec) => spec.phase === "npm-install" || spec.phase === "npm-install-ignore-scripts");
    expect(installs).toHaveLength(2);
    expect(run.bundle.fetched.some((url) => url.includes("%2freact"))).toBe(true);
  }, 60_000);

  it("FAIL: the registry's gitHead is not the release tag's commit", async () => {
    const { result, exitCode } = await publicVerify({ gitHead: "b".repeat(40) }).promise;
    expect(failures(result)).toEqual(["provenance:git-head=PROVENANCE_MISMATCH"]);
    expect(state(result)).toBe("FAIL");
    expect(exitCode).toBe(3);
  }, 60_000);

  it("UNKNOWN: the registry exposes no gitHead — installs and runs fine, provenance is NOT a pass (exit 2)", async () => {
    const { result, exitCode } = await publicVerify({ gitHead: null }).promise;
    expect(failures(result)).toEqual([]);
    expect(check(result, ":provenance:git-head")).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
    expect(check(result, ":install:tarball").status).toBe("pass");
    expect(state(result)).toBe("UNKNOWN");
    expect(exitCode).toBe(2);
  }, 60_000);

  it("UNKNOWN: the release tag is not in the checkout — no expected identity, no provenance pass, no rebuild", async () => {
    const { result, exitCode } = await publicVerify({}, {}, { tagCommit: undefined }).promise;
    for (const key of ["expected-release", "git-head", "source-identity", "rebuild"]) expect(check(result, `:provenance:${key}`)).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
    expect(state(result)).toBe("UNKNOWN");
    expect(exitCode).toBe(2);
  }, 60_000);

  it("UNKNOWN (ENVIRONMENT_ERROR): the public registry is unreachable — classified explicitly, never a pass", async () => {
    const { result, exitCode } = await publicVerify({ unavailable: true }).promise;
    expect(check(result, ":provenance:registry-version")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(check(result, ":provenance:consumed-public-artifact").status).not.toBe("pass");
    expect(state(result)).toBe("UNKNOWN");
    expect(exitCode).toBe(2);
  }, 60_000);

  it("FAIL: the public tarball is not what the registry lists (integrity), and a rebuild at the release commit does not reproduce it", async () => {
    const integrity = await publicVerify({ integrity: sri512(new Uint8Array([9])) }).promise;
    expect(failures(integrity.result)).toEqual(expect.arrayContaining(["provenance:integrity=PROVENANCE_MISMATCH"]));
    const rebuild = await publicVerify({}, { rebuildDiffers: true }).promise;
    expect(failures(rebuild.result)).toEqual(["provenance:rebuild=PROVENANCE_MISMATCH"]);
    expect(check(rebuild.result, ":provenance:rebuild").evidence.map((entry) => entry.observed).join(" ")).toMatch(/dist\/index\.js/);
  }, 120_000);

  it.each([
    ["a lockfile that resolved to a local file", { publicLock: { resolved: "file:../pack/skrewww-react-0.1.0-beta.2.tgz" } }],
    ["an npm link", { publicLock: { link: true } }],
    ["a non-public registry configuration", { configRegistry: "http://127.0.0.1:4873/" }],
  ])("accidental local artifact usage is caught: %s → consumed-public-artifact FAIL", async (_label, options) => {
    const { result, exitCode } = await publicVerify({}, options as FakeOptions).promise;
    expect(check(result, ":provenance:consumed-public-artifact")).toMatchObject({ status: "fail", failureCode: "PROVENANCE_MISMATCH" });
    expect(state(result)).toBe("FAIL");
    expect(exitCode).toBe(3);
  }, 60_000);

  it("FAIL: the prerelease was promoted to latest", async () => {
    const version = contract.expectations.package.version;
    const { result } = await publicVerify({ distTags: { beta: version, latest: version } }).promise;
    expect(failures(result)).toEqual(["provenance:dist-tags=PROVENANCE_MISMATCH"]);
  }, 60_000);

  it("is deterministic: two public verifications of the same artifact have identical stable sections", async () => {
    const first = await publicVerify().promise;
    const second = await publicVerify().promise;
    expect(compareStableResults(first.result, second.result).identical).toBe(true);
  }, 120_000);
});
