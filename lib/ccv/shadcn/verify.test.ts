import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { deriveAllShadcnContracts } from "@/lib/ccv/derive-shadcn-contract";
import type { CommandOutcome, CommandRunner, CommandSpec } from "@/lib/ccv/runner/process";
import { WORKSPACE_PREFIX } from "@/lib/ccv/runner/workspace";
import { EXPORTS_HARNESS_PATH } from "@/lib/ccv/shadcn/exports-harness";
import { verifyShadcnLocalCanonical, type VerifyShadcnInput } from "@/lib/ccv/shadcn/verify";
import type { Fetcher, FetchOutcome } from "@/lib/ccv/public/fetcher";
import { buildExpectedRegistryPayload } from "@/lib/ccv/public/registry-provenance";
import { provenanceVerdict } from "@/lib/ccv/public/verdict";
import { serializeCcvResult } from "@/lib/ccv/serialize";
import type { CcvCheck, CcvResult, ShadcnConsumerContract } from "@/lib/ccv/types";
import { validateCcvResult } from "@/lib/ccv/validate";
import { buildDistributedRegistryItems, type ShadcnRegistryItem } from "@/lib/shadcn-registry-generator";

/**
 * CCV-2 orchestration with a FAKE installer — no network, no create-next-app, no
 * shadcn, no Next. The fake scaffolds a minimal consumer, installs by fetching
 * items from the verifier's real loopback registry (so the request log and the
 * closure are real), and lets each test inject one deliberate defect.
 */

const SHA = "0123456789abcdef0123456789abcdef01234567";
const root = process.cwd();
let items: ShadcnRegistryItem[];
let contracts: ShadcnConsumerContract[];

beforeAll(() => {
  items = buildDistributedRegistryItems();
  contracts = deriveAllShadcnContracts({ gitSha: SHA, items });
});

type FakeOptions = {
  /** Transform one installed file (default: replicate the real CLI's F1 marker drop). */
  transform?: (installPath: string, content: string) => string | null;
  extraFiles?: Record<string, string>;
  extraDeps?: Record<string, string>;
  skipDependencyFetch?: string[];
  tscStdout?: (consumer: string) => string;
  timeoutPhase?: string;
  failPhase?: { phase: string; stderr: string };
  echoSecret?: string;
  /** CCV-5: serves `https://…/r/<name>.json` to the fake installer. Without it a public template throws, so no test can touch the network. */
  publicFetcher?: Fetcher;
  /** Every `@skrewww` registry template the fake installer was configured with. */
  templateLog?: string[];
};

const ok = (spec: CommandSpec, stdout = ""): CommandOutcome => ({ phase: spec.phase, exitCode: 0, signal: null, timedOut: false, stdoutTail: stdout, stderrTail: "", durationMs: 1 });
const write = (path: string, content: string) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};
const dropMarker = (_path: string, content: string) => content.replace(/^\/\*\* @skrewww-component [a-z0-9-]+ \*\/\n/, "");

function fakeRunner(options: FakeOptions = {}, seen: CommandSpec[] = []): CommandRunner {
  const transform = options.transform ?? dropMarker;
  let consumer = "";
  return async (spec) => {
    seen.push(spec);
    if (options.timeoutPhase === spec.phase) return { phase: spec.phase, exitCode: null, signal: "SIGTERM", timedOut: true, stdoutTail: "", stderrTail: "", durationMs: spec.timeoutMs };
    if (options.failPhase?.phase === spec.phase) return { phase: spec.phase, exitCode: 1, signal: null, timedOut: false, stdoutTail: options.echoSecret ?? "", stderrTail: options.failPhase.stderr, durationMs: 1 };
    if (spec.phase === "npm-version") return ok(spec, "11.12.1\n");
    if (spec.phase === "scaffold") {
      consumer = spec.args[2];
      write(join(consumer, "package.json"), JSON.stringify({ name: "consumer", dependencies: { next: "16.3.7", react: "19.2.0", "react-dom": "19.2.0" }, devDependencies: { typescript: "^5" } }, null, 2));
      write(join(consumer, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, skipLibCheck: true, isolatedModules: true, paths: { "@/*": ["./*"] } } }));
      write(join(consumer, "app", "layout.tsx"), 'import "./globals.css";\nexport default function L({ children }) { return children; }\n');
      write(join(consumer, "app", "page.tsx"), "export default function Page() { return null; }\n");
      write(join(consumer, "app", "globals.css"), "body{}\n");
      for (const [pkg, version] of [["next", "16.3.7"], ["react", "19.2.0"], ["react-dom", "19.2.0"], ["typescript", "5.9.3"]]) write(join(consumer, "node_modules", pkg, "package.json"), JSON.stringify({ name: pkg, version }));
      return ok(spec);
    }
    if (spec.phase === "shadcn-add") {
      const template = (JSON.parse(readFileSync(join(spec.cwd, "components.json"), "utf8")) as { registries: Record<string, string> }).registries["@skrewww"];
      const requested = spec.args.filter((arg) => arg.startsWith("@skrewww/")).map((arg) => arg.slice(9));
      const seenItems = new Set<string>();
      const queue = [...requested];
      const pkg = JSON.parse(readFileSync(join(spec.cwd, "package.json"), "utf8")) as { dependencies: Record<string, string> };
      while (queue.length > 0) {
        const name = queue.shift()!;
        if (seenItems.has(name)) continue;
        seenItems.add(name);
        options.templateLog?.push(template);
        const url = template.replace("{name}", name);
        let item: ShadcnRegistryItem;
        if (url.startsWith("https://")) {
          if (!options.publicFetcher) throw new Error(`test would reach the real network: ${url}`);
          const out = await options.publicFetcher(url);
          if (out.kind === "network-error" || out.status !== 200) return { phase: spec.phase, exitCode: 1, signal: null, timedOut: false, stdoutTail: "", stderrTail: out.kind === "network-error" ? `Request to ${url} failed, reason: getaddrinfo ENOTFOUND skrewww.com` : `HTTP ${out.status}`, durationMs: 1 };
          item = JSON.parse(new TextDecoder().decode(out.bytes)) as ShadcnRegistryItem;
        } else {
          item = (await (await fetch(url)).json()) as ShadcnRegistryItem;
        }
        for (const file of item.files) {
          const path = file.target.slice(2);
          const content = transform(path, file.content);
          if (content !== null) write(join(spec.cwd, path), content);
        }
        for (const dep of item.dependencies) {
          pkg.dependencies[dep] = "^1.0.0";
          write(join(spec.cwd, "node_modules", dep, "package.json"), JSON.stringify({ name: dep, version: "1.0.0" }));
        }
        for (const dependency of item.registryDependencies) {
          const depName = dependency.replace("@skrewww/", "");
          if (!options.skipDependencyFetch?.includes(depName)) queue.push(depName);
        }
      }
      Object.assign(pkg.dependencies, options.extraDeps ?? {});
      writeFileSync(join(spec.cwd, "package.json"), JSON.stringify(pkg, null, 2));
      if (Object.keys(pkg.dependencies).length > 3) write(join(spec.cwd, "package-lock.json"), "{}");
      for (const [path, content] of Object.entries(options.extraFiles ?? {})) write(join(spec.cwd, path), content);
      return ok(spec);
    }
    if (spec.phase === "next-typegen") return ok(spec);
    if (spec.phase === "tsc") {
      const stdout = options.tscStdout?.(consumer) ?? "";
      return stdout ? { ...ok(spec, stdout), exitCode: 2 } : ok(spec);
    }
    if (spec.phase === "next-build") return ok(spec, "Compiled successfully");
    if (spec.phase === "shadcn-version") return ok(spec, "4.21.1\n");
    throw new Error(`unexpected command ${spec.phase}`);
  };
}

let base: string;
beforeEach(() => {
  base = realpathSync(mkdtempSync(join(tmpdir(), "ccv-verify-test-")));
});
afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

async function verify(subjects: string[], runner: CommandRunner, overrides: Partial<VerifyShadcnInput> = {}) {
  let clock = 1_791_000_000_000;
  return verifyShadcnLocalCanonical({
    repoRoot: root,
    gitSha: SHA,
    items,
    contracts,
    subjects,
    subjectLabel: subjects.length === 1 ? subjects[0] : "all",
    run: runner,
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
const failures = (result: CcvResult) => result.checks.filter((candidate) => candidate.status === "fail").map((candidate) => `${candidate.checkId}=${candidate.failureCode}`);
const stable = (result: CcvResult) => serializeCcvResult({ ...result, volatile: undefined });

describe("CCV-2 verifier — Button with the real CLI's F1 behavior replicated", () => {
  it("detects the marker drop from installed bytes as a FAIL with upstream attribution, everything else passes", async () => {
    const seen: CommandSpec[] = [];
    const { result, exitCode, workspaceRoot } = await verify(["button"], fakeRunner({}, seen));
    expect(validateCcvResult(result)).toEqual({ ok: true });
    expect(failures(result)).toEqual(["shadcn:button:file:components/ui/Button.tsx=UPSTREAM_TRANSFORM"]);
    const button = check(result, ":file:components/ui/Button.tsx");
    expect(button.evidence.map((entry) => entry.observed).join("\n")).toMatch(/origin marker @skrewww-component button ABSENT/);
    expect(button.evidence.map((entry) => entry.observed).join("\n")).toMatch(/shadcn@4\.21\.1/);
    expect(button.expected).toBe(contracts.find((c) => c.subject === "button")!.expectations.files.find((f) => f.installPath === "components/ui/Button.tsx")!.sha256);
    expect(check(result, ":registry-closure:resolved").status).toBe("pass");
    expect(check(result, ":file:styles/skrewww-foundation.css").status).toBe("pass");
    expect(check(result, ":exports:components/ui/Button.tsx").status).toBe("pass");
    expect(check(result, ":cleanup:workspace").status).toBe("pass");
    expect(exitCode).toBe(3);
    expect(readdirSync(base)).toEqual([]); // nothing left behind
    expect(workspaceRoot.startsWith(base)).toBe(true);
    // the exact install order and the pinned CLI
    const add = seen.find((spec) => spec.phase === "shadcn-add")!;
    expect(add.args).toEqual(["--yes", "shadcn@4.21.1", "add", "@skrewww/button", "--yes"]);
    expect(seen.find((spec) => spec.phase === "scaffold")!.args.slice(0, 2)).toEqual(["--yes", "create-next-app@16.3.7"]);
  });

  it("would pass completely only if the installer kept the exact bytes (no normalization exists to fake it)", async () => {
    const { result, exitCode } = await verify(["button"], fakeRunner({ transform: (_path, content) => content }));
    expect(failures(result)).toEqual([]);
    expect(exitCode).toBe(0);
  });

  it("is reproducible: two clean runs give identical stable sections", async () => {
    const first = await verify(["button"], fakeRunner());
    const second = await verify(["button"], fakeRunner());
    expect(stable(first.result)).toBe(stable(second.result));
    expect(stable(first.result)).not.toMatch(/ccv-verify-test-|skrewww-ccv-|127\.0\.0\.1:\d/);
  });

  it("runs every command in the isolated environment, never forwarding a secret, inside the workspace", async () => {
    const seen: CommandSpec[] = [];
    const { result } = await verify(["button"], fakeRunner({}, seen));
    for (const spec of seen) {
      expect(spec.env.NPM_TOKEN).toBeUndefined();
      expect(spec.env.HOME.startsWith(base)).toBe(true);
      expect(spec.env.npm_config_cache.startsWith(base)).toBe(true);
      expect(spec.cwd.startsWith(base)).toBe(true);
      expect(spec.timeoutMs).toBeGreaterThan(0);
      expect(spec.args.join(" ")).not.toMatch(/latest|skrewww\.com/);
    }
    expect(serializeCcvResult(result)).not.toContain("npm_supersecret_token_value");
  });
});

describe("CCV-2 verifier — deliberate defects are caught with the right code", () => {
  it("a removed expected file → FILE_MISSING", async () => {
    const { result } = await verify(["button"], fakeRunner({ transform: (path, content) => (path === "lib/cn.ts" ? null : dropMarker(path, content)) }));
    expect(check(result, ":file:lib/cn.ts")).toMatchObject({ status: "fail", failureCode: "FILE_MISSING" });
  });

  it("an extra installed file → FILE_UNEXPECTED", async () => {
    const { result } = await verify(["button"], fakeRunner({ extraFiles: { "components/ui/Surprise.tsx": "export {};\n" } }));
    expect(check(result, ":file-set:unexpected")).toMatchObject({ status: "fail", failureCode: "FILE_UNEXPECTED" });
    expect(check(result, ":file-set:unexpected").evidence[0].observed).toContain("added components/ui/Surprise.tsx");
  });

  it("an arbitrary source byte → FILE_CONTENT_MISMATCH, never mistaken for F1", async () => {
    const { result } = await verify(["button"], fakeRunner({ transform: (path, content) => (path === "lib/cn.ts" ? content.replace("filter", "filtre") : dropMarker(path, content)) }));
    expect(check(result, ":file:lib/cn.ts")).toMatchObject({ status: "fail", failureCode: "FILE_CONTENT_MISMATCH" });
    expect(check(result, ":file:components/ui/Button.tsx").failureCode).toBe("UPSTREAM_TRANSFORM");
  });

  it("marker removed AND another change in the same file → FILE_CONTENT_MISMATCH", async () => {
    const { result } = await verify(["button"], fakeRunner({ transform: (path, content) => (path === "components/ui/Button.tsx" ? dropMarker(path, content).replace("forwardRef", "forwardRefX") : content) }));
    const button = check(result, ":file:components/ui/Button.tsx");
    expect(button).toMatchObject({ status: "fail", failureCode: "FILE_CONTENT_MISMATCH" });
    expect(button.evidence.map((e) => e.observed).join(" ")).toMatch(/origin marker absent \(and other bytes differ too\)/);
  });

  it("an undeclared dependency → DEPENDENCY_MISMATCH", async () => {
    const { result } = await verify(["button"], fakeRunner({ extraDeps: { "left-pad": "^1.3.0" } }));
    expect(check(result, ":dependencies:unexpected")).toMatchObject({ status: "fail", failureCode: "DEPENDENCY_MISMATCH" });
  });

  it("a declared dependency is verified, and a missing one fails (Text Input closure)", async () => {
    const { result } = await verify(["text-input"], fakeRunner());
    expect(check(result, ":dependency-npm:@phosphor-icons/react")).toMatchObject({ status: "pass", actual: "@phosphor-icons/react@^1.0.0" });
    expect(check(result, ":file:lib/cn.ts").status).toBe("pass"); // shared target, installed once, bytes agree
    expect(check(result, ":registry-closure:resolved").status).toBe("pass");
    expect(failures(result).every((entry) => entry.endsWith("=UPSTREAM_TRANSFORM"))).toBe(true);
  });

  it("a broken internal import → IMPORT_UNRESOLVED", async () => {
    const { result } = await verify(["button"], fakeRunner({ transform: (path, content) => (path === "components/ui/Button.tsx" ? dropMarker(path, content).replace('from "@/lib/cn"', 'from "@/lib/cn-gone"') : content) }));
    expect(check(result, ":imports:components/ui/Button.tsx")).toMatchObject({ status: "fail", failureCode: "IMPORT_UNRESOLVED" });
  });

  it("a removed export → EXPORT_MISSING (mapped from the harness line)", async () => {
    const runner = fakeRunner({
      tscStdout: (consumer) => {
        const lines = readFileSync(join(consumer, EXPORTS_HARNESS_PATH), "utf8").split("\n");
        const line = lines.findIndex((text) => text.trim() === "Button as v0_Button,") + 1;
        return `${EXPORTS_HARNESS_PATH}(${line},3): error TS2305: Module '"@/components/ui/Button"' has no exported member 'Button'.\n`;
      },
    });
    const { result } = await verify(["button"], runner);
    expect(check(result, ":exports:components/ui/Button.tsx")).toMatchObject({ status: "fail", failureCode: "EXPORT_MISSING" });
    expect(check(result, ":typecheck:tsc")).toMatchObject({ status: "fail", failureCode: "TYPECHECK_FAILED" });
  });

  it("shared contributors that disagree → MANIFEST_MISMATCH (a contract problem, not an installer success)", async () => {
    const tampered = items.map((item) => (item.name === "form-field" ? { ...item, files: item.files.map((file) => (file.target === "~/lib/cn.ts" ? { ...file, content: `${file.content}// drift\n` } : file)) } : item));
    const tamperedContracts = deriveAllShadcnContracts({ gitSha: SHA, items: tampered });
    const { result } = await verify(["text-input"], fakeRunner(), { items: tampered, contracts: tamperedContracts });
    expect(check(result, ":file:lib/cn.ts")).toMatchObject({ status: "fail", failureCode: "MANIFEST_MISMATCH" });
  });

  it("an unresolved registry dependency → registry closure fails with INSTALL_FAILED", async () => {
    const { result } = await verify(["button"], fakeRunner({ skipDependencyFetch: ["foundation"] }));
    expect(check(result, ":registry-closure:resolved")).toMatchObject({ status: "fail", failureCode: "INSTALL_FAILED" });
    expect(check(result, ":file:styles/skrewww-foundation.css")).toMatchObject({ status: "fail", failureCode: "FILE_MISSING" });
  });

  it("a non-network install failure → INSTALL_FAILED, with redacted evidence", async () => {
    const { result } = await verify(["button"], fakeRunner({ failPhase: { phase: "shadcn-add", stderr: "Error: invalid registry item" }, echoSecret: "leaked npm_supersecret_token_value" }));
    expect(check(result, ":install:shadcn-add")).toMatchObject({ status: "fail", failureCode: "INSTALL_FAILED" });
    expect(serializeCcvResult(result)).not.toContain("npm_supersecret_token_value");
  });
});

describe("CCV-2 verifier — environment failures stay UNKNOWN and clean up", () => {
  it("a timed-out install → UNKNOWN with ENVIRONMENT_ERROR, exit 2, no contract FAIL, workspace removed", async () => {
    const { result, exitCode } = await verify(["button"], fakeRunner({ timeoutPhase: "shadcn-add" }));
    expect(validateCcvResult(result)).toEqual({ ok: true });
    expect(check(result, ":install:shadcn-add")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(result.summary.fail).toBe(0);
    expect(check(result, ":file:components/ui/Button.tsx")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(exitCode).toBe(2);
    expect(readdirSync(base)).toEqual([]);
  });

  it("a network failure while scaffolding is retried exactly once, then reported as environment", async () => {
    const seen: CommandSpec[] = [];
    const { result } = await verify(["button"], fakeRunner({ failPhase: { phase: "scaffold", stderr: "npm ERR! code ENOTFOUND registry.npmjs.org" } }, seen));
    expect(seen.filter((spec) => spec.phase === "scaffold")).toHaveLength(2);
    expect(check(result, ":scaffold:create-next-app")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
  });

  it("a timeout is never retried", async () => {
    const seen: CommandSpec[] = [];
    await verify(["button"], fakeRunner({ timeoutPhase: "scaffold" }, seen));
    expect(seen.filter((spec) => spec.phase === "scaffold")).toHaveLength(1);
  });

  it("a build timeout leaves the file findings intact but makes the verdict untrustworthy (exit 2)", async () => {
    const { result, exitCode } = await verify(["button"], fakeRunner({ timeoutPhase: "next-build" }));
    expect(check(result, ":build:next-build")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(check(result, ":file:components/ui/Button.tsx").failureCode).toBe("UPSTREAM_TRANSFORM");
    expect(exitCode).toBe(2);
  });

  it("a cleanup failure is reported (never hidden) and the workspace can be kept on request", async () => {
    const failed = await verify(["button"], fakeRunner(), { remove: () => { throw new Error("EBUSY: resource busy"); } });
    expect(check(failed.result, ":cleanup:workspace")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    rmSync(failed.workspaceRoot, { recursive: true, force: true });
    const kept = await verify(["button"], fakeRunner(), { keep: true });
    expect(kept.kept).toBe(true);
    expect(readdirSync(base).some((name) => name.startsWith(WORKSPACE_PREFIX))).toBe(true);
  });

  it("rejects unknown subjects before creating anything", async () => {
    await expect(verify(["no-such-item"], fakeRunner())).rejects.toThrow(/invalid subjects/);
    expect(readdirSync(base)).toEqual([]);
  });
});

describe("CCV-4 — installed CSS delivery and representative runtime (fake browser evidence)", () => {
  const keepCF = (_path: string, content: string) => content;
  type Collect = NonNullable<NonNullable<VerifyShadcnInput["runtime"]>["collect"]>;
  const fakeCollect = (tweak: { suppliedValue?: number; throws?: string; focusOutline?: string } = {}): Collect => async (options) => {
    if (tweak.throws) throw new Error(tweak.throws);
    return {
      foundation: { checked: options.rootDeclared.length, empty: [] },
      focus: { reached: true, tabPresses: 1, matchesFocusVisible: true, outlineStyle: tweak.focusOutline ?? "solid", outlineWidth: "2px", outlineColor: "rgb(108, 76, 242)", boxShadow: "none" },
      modes: ["sharp", "rounded", "pill", "squircle"].map((mode) => ({ name: `Shape ${mode}: computed behavior`, ok: true })),
      scenarios: options.scenarios.map((scenario) => ({ name: scenario.name, kind: scenario.kind, httpStatus: 200, renderedElements: 4, consoleErrors: [] })),
      supplied: options.scenarios.flatMap((scenario) => (scenario.supplied ?? []).map((prop) => ({ prop, scenario: scenario.name, elementsWithValue: tweak.suppliedValue ?? 1, sample: "40%" }))),
    };
  };
  const server = { startServer: async () => ({ ok: true as const, origin: "http://127.0.0.1:1", stop: async () => undefined }) };

  it("static: per-item CSS checks pass on the installed bytes; Foundation is wired once in app/layout.tsx before globals.css", async () => {
    const { result, workspaceRoot } = await verify(["button"], fakeRunner({ transform: keepCF }), { keep: true });
    expect(failures(result)).toEqual([]);
    for (const suffix of [":css:button/declarations", ":css:button/contract-surface", ":css:button/alias-chains", ":css:button/mode-selectors", ":css:foundation", ":css:foundation-order"]) expect(check(result, suffix).status, suffix).toBe("pass");
    const layout = readFileSync(join(workspaceRoot, "consumer", "app", "layout.tsx"), "utf8");
    expect(layout.indexOf('import "@/styles/skrewww-foundation.css";')).toBeLessThan(layout.indexOf('import "./globals.css";'));
    expect(readFileSync(join(workspaceRoot, "consumer", "app", "page.tsx"), "utf8")).not.toMatch(/skrewww-foundation/);
  });

  it("F7: Foundation is judged statically with its fallback-backed property, even though it is not a batch subject", async () => {
    const { result } = await verify(["button"], fakeRunner({ transform: keepCF }));
    expect(failures(result)).toEqual([]);
    const fallback = check(result, ":css-fallback:foundation/--color-neutral-900");
    expect(fallback.status).toBe("pass");
    expect(fallback.evidence.map((e) => e.observed).join(" ")).toMatch(/fallback-backed, as the contract records/);
    for (const suffix of [":css:foundation/declarations", ":css:foundation/contract-surface", ":css:foundation/alias-chains", ":css:foundation/mode-selectors"]) expect(check(result, suffix).status, suffix).toBe("pass");
  });

  it("mutation: --color-neutral-900 gains a use without a fallback in the installed Foundation → CSS_DECLARATION_MISSING", async () => {
    const strip = (path: string, content: string) => (path === "styles/skrewww-foundation.css" ? `${content}\n.ccv-x { color: var(--color-neutral-900); }\n` : content);
    const { result } = await verify(["button"], fakeRunner({ transform: strip }));
    expect(check(result, ":css-fallback:foundation/--color-neutral-900")).toMatchObject({ status: "fail", failureCode: "CSS_DECLARATION_MISSING" });
  });

  it("mutation: a Foundation declaration removed from the installed CSS → CSS_DECLARATION_MISSING (item and Foundation)", async () => {
    const strip = (path: string, content: string) => (path === "styles/skrewww-foundation.css" ? content.replace(/^\s*--semantic-focus-ring:[^;]*;[^\n]*\n/m, "") : content);
    const { result } = await verify(["button"], fakeRunner({ transform: strip }));
    expect(failures(result)).toEqual(expect.arrayContaining(["shadcn:button:css:button/declarations=CSS_DECLARATION_MISSING", "shadcn:button:css:foundation=CSS_DECLARATION_MISSING"]));
  });

  it("slider: script-supplied properties are runtime candidates — unknown without --runtime, never subtracted", async () => {
    const { result } = await verify(["slider"], fakeRunner({ transform: keepCF }));
    const supplied = result.checks.filter((c) => c.checkId.includes(":css-runtime-supplied:"));
    expect(supplied.map((c) => c.checkId.split(":").pop())).toEqual(contracts.find((c) => c.subject === "slider")!.expectations.css.scriptSuppliedCustomProperties.map((p) => `slider/${p}`));
    expect(supplied.every((c) => c.status === "unknown")).toBe(true);
    expect(check(result, ":css:slider/declarations").status).toBe("pass");
  });

  it("runtime: scenario routes are generated from the shared descriptors; T2 render, common checks and runtime supply pass", async () => {
    const { result, workspaceRoot } = await verify(["button", "slider"], fakeRunner({ transform: keepCF }), { keep: true, runtime: { ...server, collect: fakeCollect() } });
    expect(failures(result)).toEqual([]);
    expect(result.summary.unknown).toBe(0);
    const routes = join(workspaceRoot, "consumer", "app", "ccv-scenarios");
    expect(readdirSync(routes).sort()).toEqual(["button", "common", "slider"]);
    expect(readFileSync(join(routes, "common", "page.tsx"), "utf8")).toMatch(/import \{ Button \} from "@\/components\/ui\/Button";/);
    for (const suffix of [":runtime:server", ":runtime:foundation-active", ":runtime:focus-visible", ":runtime:common-shape-pill", ":runtime:scenario-slider", ":runtime:scenario-button"]) expect(check(result, suffix).status, suffix).toBe("pass");
    expect(result.checks.filter((c) => c.checkId.includes(":css-runtime-supplied:")).every((c) => c.status === "pass")).toBe(true);
  });

  it("runtime mutations: no element carries a supplied value / no focus outline → CSS_RUNTIME_UNRESOLVED", async () => {
    const { result } = await verify(["button", "slider"], fakeRunner({ transform: keepCF }), { runtime: { ...server, collect: fakeCollect({ suppliedValue: 0, focusOutline: "none" }) } });
    expect(check(result, ":runtime:focus-visible")).toMatchObject({ status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED" });
    expect(result.checks.filter((c) => c.checkId.includes(":css-runtime-supplied:")).every((c) => c.status === "fail" && c.failureCode === "CSS_RUNTIME_UNRESOLVED")).toBe(true);
  });

  it("a browser or server that cannot start is UNKNOWN / ENVIRONMENT_ERROR, never a pass", async () => {
    const crashed = await verify(["button"], fakeRunner({ transform: keepCF }), { runtime: { ...server, collect: fakeCollect({ throws: "browserType.launch: Executable doesn't exist" }) } });
    expect(check(crashed.result, ":runtime:scenario-button")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(check(crashed.result, ":runtime:foundation-active")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(crashed.exitCode).toBe(2);
    const noServer = await verify(["button"], fakeRunner({ transform: keepCF }), { runtime: { startServer: async () => ({ ok: false as const, reason: "next-start did not become ready" }), collect: fakeCollect() } });
    expect(check(noServer.result, ":runtime:server")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(validateCcvResult(noServer.result)).toEqual({ ok: true });
  });
});

describe("CCV-5 PUBLIC_REGISTRY verifier (injected public fetcher, fake installer; no network)", () => {
  const ORIGIN = "https://skrewww.com";
  const keepCF = (_path: string, content: string) => content;
  const expectedPayload = () => buildExpectedRegistryPayload(items);

  /** Serves the public registry; `override(stem, text)` can tamper with or hide a file. */
  const publicFetcher = (override: (stem: string, text: string) => FetchOutcome | undefined = () => undefined, calls: string[] = []): Fetcher => async (url) => {
    calls.push(url);
    if (url === "https://ui.shadcn.com/r/registries.json") return { kind: "response", status: 200, bytes: new TextEncoder().encode(JSON.stringify([{ name: "@skrewww", url: `${ORIGIN}/r/{name}.json` }])), finalUrl: url };
    const stem = url.replace(`${ORIGIN}/r/`, "").replace(/\.json$/, "");
    const text = expectedPayload().files.get(stem);
    if (text === undefined) return { kind: "response", status: 404, bytes: new Uint8Array(), finalUrl: url };
    const replaced = override(stem, text);
    if (replaced) return replaced.kind === "response" ? { ...replaced, finalUrl: url } : replaced;
    return { kind: "response", status: 200, bytes: new TextEncoder().encode(text), finalUrl: url };
  };
  const unreachable: Fetcher = async () => ({ kind: "network-error", message: "ENOTFOUND skrewww.com" });
  const asPublic = (fetcher: Fetcher, extra: Partial<NonNullable<VerifyShadcnInput["public"]>> = {}): Partial<VerifyShadcnInput> => ({ public: { origin: ORIGIN, fetcher, checkDirectory: false, ...extra } });
  const state = (result: CcvResult) => provenanceVerdict(result).state;

  it("PASS: byte-identical public payload, installed from the live URL; expected identity is HEAD's generator output (no local server)", async () => {
    const templates: string[] = [];
    const { result, exitCode, workspaceRoot } = await verify(["button"], fakeRunner({ transform: keepCF, publicFetcher: publicFetcher(), templateLog: templates }), { ...asPublic(publicFetcher()), keep: true });
    expect(validateCcvResult(result)).toEqual({ ok: true });
    expect(failures(result)).toEqual([]);
    expect(result.mode).toBe("PUBLIC_REGISTRY");
    expect(exitCode).toBe(0);
    expect(state(result)).toBe("PASS");
    // the consumer was configured with the PUBLIC template, never a loopback server
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every((template) => template === `${ORIGIN}/r/{name}.json`)).toBe(true);
    expect(readFileSync(join(workspaceRoot, "consumer", "components.json"), "utf8")).not.toMatch(/127\.0\.0\.1/);
    expect(result.checks.some((c) => c.checkId.endsWith(":registry:local-canonical"))).toBe(false);
    expect(check(result, ":registry-closure:resolved").status).toBe("not-applicable");
    expect(check(result, ":registry-public:index").status).toBe("pass");
    expect(check(result, ":registry-public:payload-identity").status).toBe("pass");
    expect(result.source.integrity).toBe(check(result, ":registry-public:payload-identity").expected); // observed identity == expected identity
  }, 60_000);

  it("the known installer transform (F1) keeps its UPSTREAM_TRANSFORM classification while provenance PASSES", async () => {
    const { result, exitCode } = await verify(["button"], fakeRunner({ publicFetcher: publicFetcher() }), asPublic(publicFetcher()));
    expect(failures(result)).toEqual(["shadcn:button:file:components/ui/Button.tsx=UPSTREAM_TRANSFORM"]);
    expect(state(result)).toBe("PASS");
    expect(exitCode).toBe(3);
  }, 60_000);

  it("FAIL: a tampered public item → provenance FAIL on that item and on the payload; the installed bytes disagree with the expected bytes too", async () => {
    const tamper = (stem: string, text: string): FetchOutcome | undefined => (stem === "button" ? { kind: "response", status: 200, bytes: new TextEncoder().encode(text.replace("Button", "Buttoon")), finalUrl: "" } : undefined);
    const { result, exitCode } = await verify(["button"], fakeRunner({ transform: keepCF, publicFetcher: publicFetcher(tamper) }), asPublic(publicFetcher(tamper)));
    expect(failures(result)).toEqual(expect.arrayContaining(["shadcn:button:registry-public:item/button=PROVENANCE_MISMATCH", "shadcn:button:registry-public:payload-identity=PROVENANCE_MISMATCH"]));
    expect(state(result)).toBe("FAIL");
    expect(exitCode).toBe(3);
  }, 60_000);

  it("UNKNOWN (ENVIRONMENT_ERROR): the public registry is unreachable — provenance and install are unknown, never a pass or a contract failure (exit 2)", async () => {
    const { result, exitCode } = await verify(["button"], fakeRunner({ publicFetcher: unreachable }), asPublic(unreachable));
    expect(check(result, ":registry-public:index")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(check(result, ":registry-public:payload-identity")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(check(result, ":install:shadcn-add")).toMatchObject({ status: "unknown", failureCode: "ENVIRONMENT_ERROR" });
    expect(result.summary.fail).toBe(0);
    expect(state(result)).toBe("UNKNOWN");
    expect(exitCode).toBe(2);
  }, 60_000);

  it("UNKNOWN (PROVENANCE_MISSING): the expected identity is not established (uncommitted generator inputs) — a successful install is NOT provenance", async () => {
    const problems = ["uncommitted: M lib/component-registry.ts"];
    const { result, exitCode } = await verify(["button"], fakeRunner({ transform: keepCF, publicFetcher: publicFetcher() }), asPublic(publicFetcher(), { identityProblems: problems }));
    expect(check(result, ":install:shadcn-add").status).toBe("pass");
    expect(check(result, ":registry-public:payload-identity")).toMatchObject({ status: "unknown", failureCode: "PROVENANCE_MISSING" });
    expect(failures(result)).toEqual([]);
    expect(state(result)).toBe("UNKNOWN");
    expect(exitCode).toBe(2);
  }, 60_000);

  it("checks shadcn's official directory when asked (default): a different @skrewww url is a failure of the public surface", async () => {
    const good = await verify(["button"], fakeRunner({ transform: keepCF, publicFetcher: publicFetcher() }), asPublic(publicFetcher(), { checkDirectory: true }));
    expect(check(good.result, ":registry-public:directory").status).toBe("pass");
    const wrong: Fetcher = async (url) => (url === "https://ui.shadcn.com/r/registries.json" ? { kind: "response", status: 200, bytes: new TextEncoder().encode(JSON.stringify([{ name: "@skrewww", url: "https://old.example/r/{name}.json" }])), finalUrl: url } : publicFetcher()(url));
    const bad = await verify(["button"], fakeRunner({ transform: keepCF, publicFetcher: publicFetcher() }), asPublic(wrong, { checkDirectory: true }));
    expect(check(bad.result, ":registry-public:directory")).toMatchObject({ status: "fail", failureCode: "INSTALL_FAILED" });
    expect(state(bad.result)).toBe("PASS"); // the directory is a surface check, not provenance
  }, 60_000);

  it("is deterministic: two public verifications of the same payload have identical stable sections", async () => {
    const first = await verify(["button"], fakeRunner({ publicFetcher: publicFetcher() }), asPublic(publicFetcher()));
    const second = await verify(["button"], fakeRunner({ publicFetcher: publicFetcher() }), asPublic(publicFetcher()));
    expect(stable(first.result)).toBe(stable(second.result));
    expect(stable(first.result)).not.toMatch(/ccv-verify-test-|skrewww-ccv-|127\.0\.0\.1:\d/);
  }, 120_000);

  it("a LOCAL_CANONICAL run still never touches the public registry or reports provenance", async () => {
    const calls: string[] = [];
    const { result } = await verify(["button"], fakeRunner({ transform: keepCF }));
    expect(result.mode).toBe("LOCAL_CANONICAL");
    expect(state(result)).toBe("NOT_EVALUATED");
    expect(calls).toEqual([]);
    expect(result.checks.some((c) => c.checkId.includes(":registry-public:"))).toBe(false);
  }, 60_000);
});
