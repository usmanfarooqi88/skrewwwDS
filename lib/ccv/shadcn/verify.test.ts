import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { deriveAllShadcnContracts } from "@/lib/ccv/derive-shadcn-contract";
import type { CommandOutcome, CommandRunner, CommandSpec } from "@/lib/ccv/runner/process";
import { WORKSPACE_PREFIX } from "@/lib/ccv/runner/workspace";
import { EXPORTS_HARNESS_PATH } from "@/lib/ccv/shadcn/exports-harness";
import { verifyShadcnLocalCanonical, type VerifyShadcnInput } from "@/lib/ccv/shadcn/verify";
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
        const item = (await (await fetch(template.replace("{name}", name))).json()) as ShadcnRegistryItem;
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
