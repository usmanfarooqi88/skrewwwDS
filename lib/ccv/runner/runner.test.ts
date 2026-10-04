import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildChildEnv, redactEvidence, workspacePaths } from "@/lib/ccv/runner/env";
import { CCV_TIME_LIMITS, CCV_TOOL_PINS, satisfiesNodeRange } from "@/lib/ccv/runner/pins";
import { OUTPUT_TAIL_BYTES, classifyOutcome, runCommand } from "@/lib/ccv/runner/process";
import { startLocalRegistry } from "@/lib/ccv/runner/registry-server";
import { WORKSPACE_PREFIX, cleanupWorkspace, createWorkspace, isInside } from "@/lib/ccv/runner/workspace";
import { buildDistributedRegistryItems } from "@/lib/shadcn-registry-generator";

const root = process.cwd();
const SECRET_ENV = {
  PATH: process.env.PATH ?? "/usr/bin:/bin",
  LANG: "en_US.UTF-8",
  NPM_TOKEN: "npm_secretvalue123456",
  NODE_AUTH_TOKEN: "node-auth-secret-999",
  GH_TOKEN: "ghp_secret_abcdef",
  GITHUB_TOKEN: "github-secret-xyz",
  OPENAI_API_KEY: "sk-openai-secret-1",
  ANTHROPIC_API_KEY: "sk-ant-secret-2",
  FIGMA_ACCESS_TOKEN: "figd_secret_3",
  VERCEL_TOKEN: "vercel-secret-4",
  AWS_SECRET_ACCESS_KEY: "aws-secret-5",
  HOME: "/Users/someone",
  npm_config_registry: "https://private.example/registry",
  HTTPS_PROXY: "http://proxy.local:3128",
};

describe("CCV-2 runner — pins and limits", () => {
  it("pins exact versions, never latest, and bounds every phase", () => {
    expect(CCV_TOOL_PINS.createNextApp).toMatch(/^\d+\.\d+\.\d+$/);
    expect(CCV_TOOL_PINS.shadcn).toMatch(/^\d+\.\d+\.\d+$/);
    expect(JSON.stringify(CCV_TOOL_PINS)).not.toMatch(/latest|\^|~|\*/);
    for (const value of Object.values(CCV_TIME_LIMITS)) expect(value).toBeGreaterThan(0);
    expect(CCV_TIME_LIMITS.installMs).toBeLessThanOrEqual(15 * 60_000);
    expect(CCV_TIME_LIMITS.buildMs).toBeLessThanOrEqual(15 * 60_000);
    expect(CCV_TIME_LIMITS.runMs).toBeLessThanOrEqual(30 * 60_000);
  });

  it("checks Node against the engines range", () => {
    expect(satisfiesNodeRange("v24.14.0")).toBe(true);
    expect(satisfiesNodeRange("v22.13.0")).toBe(true);
    expect(satisfiesNodeRange("v22.12.9")).toBe(false);
    expect(satisfiesNodeRange("v23.1.0")).toBe(false);
    expect(satisfiesNodeRange("v25.0.0")).toBe(false);
    expect(satisfiesNodeRange("nonsense")).toBe(false);
  });
});

describe("CCV-2 runner — environment isolation", () => {
  const paths = workspacePaths("/tmp/skrewww-ccv-abc");
  const env = buildChildEnv(SECRET_ENV, paths);

  it("forwards only allowlisted variables and never a secret", () => {
    for (const name of ["NPM_TOKEN", "NODE_AUTH_TOKEN", "GH_TOKEN", "GITHUB_TOKEN", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "FIGMA_ACCESS_TOKEN", "VERCEL_TOKEN", "AWS_SECRET_ACCESS_KEY"]) {
      expect(env[name]).toBeUndefined();
    }
    for (const value of Object.values(env)) expect(value).not.toMatch(/secret/);
    expect(env.PATH).toBe(SECRET_ENV.PATH);
    expect(env.HTTPS_PROXY).toBe(SECRET_ENV.HTTPS_PROXY);
    expect(env.npm_config_registry).toBeUndefined(); // the user's npm config does not leak in
  });

  it("redirects HOME, config, TMPDIR and the npm cache into the workspace", () => {
    expect(env.HOME).toBe("/tmp/skrewww-ccv-abc/home");
    expect(env.npm_config_cache).toBe("/tmp/skrewww-ccv-abc/npm-cache");
    expect(env.npm_config_userconfig).toBe("/tmp/skrewww-ccv-abc/home/.npmrc");
    expect(env.XDG_CONFIG_HOME).toBe("/tmp/skrewww-ccv-abc/home/.config");
    expect(env.TMPDIR).toBe("/tmp/skrewww-ccv-abc/tmp");
    for (const value of Object.values(env).filter((v) => v.startsWith("/"))) {
      if (value !== SECRET_ENV.PATH) expect(value.startsWith("/tmp/skrewww-ccv-abc")).toBe(true);
    }
  });

  it("redacts secret values, the workspace path and the local registry origin from evidence", () => {
    const text = `token npm_secretvalue123456 at /tmp/skrewww-ccv-abc/consumer from http://127.0.0.1:51234/r/button.json`;
    const out = redactEvidence(text, { parent: SECRET_ENV, workspaceRoot: "/tmp/skrewww-ccv-abc" });
    expect(out).toBe("token <redacted:NPM_TOKEN> at <workspace>/consumer from <local-registry>/r/button.json");
  });
});

describe("CCV-2 runner — bounded processes", () => {
  it("runs a command and captures its output", async () => {
    const outcome = await runCommand({ command: process.execPath, args: ["-e", "process.stdout.write('hi'); process.stderr.write('err')"], cwd: tmpdir(), env: { PATH: process.env.PATH ?? "" }, timeoutMs: 20_000, phase: "echo" });
    expect(outcome).toMatchObject({ exitCode: 0, timedOut: false, stdoutTail: "hi", stderrTail: "err", phase: "echo" });
    expect(classifyOutcome(outcome)).toBe("ok");
  });

  it("terminates a command that exceeds its timeout and classifies it as environment", async () => {
    const outcome = await runCommand({ command: process.execPath, args: ["-e", "setInterval(() => {}, 1000)"], cwd: tmpdir(), env: { PATH: process.env.PATH ?? "" }, timeoutMs: 300, phase: "hang" });
    expect(outcome.timedOut).toBe(true);
    expect(outcome.exitCode).toBeNull();
    expect(classifyOutcome(outcome)).toBe("environment");
  }, 20_000);

  it("keeps only a bounded tail of large output", async () => {
    const outcome = await runCommand({ command: process.execPath, args: ["-e", `process.stdout.write("x".repeat(${OUTPUT_TAIL_BYTES * 3}))`], cwd: tmpdir(), env: { PATH: process.env.PATH ?? "" }, timeoutMs: 20_000, phase: "big" });
    expect(outcome.stdoutTail.length).toBe(OUTPUT_TAIL_BYTES);
  });

  it("classifies a missing binary and a network failure as environment, other non-zero exits as contract", async () => {
    const missing = await runCommand({ command: "definitely-not-a-binary-ccv", args: [], cwd: tmpdir(), env: { PATH: "" }, timeoutMs: 5_000, phase: "missing" });
    expect(classifyOutcome(missing)).toBe("environment");
    expect(classifyOutcome({ phase: "add", exitCode: 1, signal: null, timedOut: false, stdoutTail: "", stderrTail: "npm ERR! code ENOTFOUND registry.npmjs.org", durationMs: 1 })).toBe("environment");
    expect(classifyOutcome({ phase: "add", exitCode: 1, signal: null, timedOut: false, stdoutTail: "", stderrTail: "Something went wrong: invalid item", durationMs: 1 })).toBe("contract");
  });
});

describe("CCV-2 runner — workspace and cleanup", () => {
  it("creates a workspace outside the repository with HOME, cache and TMPDIR inside it, and removes it", () => {
    const base = mkdtempSync(join(tmpdir(), "ccv-test-base-"));
    try {
      const workspace = createWorkspace(root, base);
      expect(isInside(root, workspace.root)).toBe(false);
      expect(workspace.root.includes(WORKSPACE_PREFIX)).toBe(true);
      for (const dir of [workspace.home, workspace.npmCache, workspace.tmp]) expect(existsSync(dir)).toBe(true);
      expect(isInside(workspace.root, workspace.consumer)).toBe(true);
      expect(cleanupWorkspace(workspace, false)).toEqual({ removed: true, kept: false });
      expect(readdirSync(base)).toEqual([]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  it("refuses a workspace inside the repository", () => {
    expect(() => createWorkspace(root, join(root, "lib"))).toThrow(/overlaps the repository/);
    expect(readdirSync(join(root, "lib")).some((name) => name.startsWith(WORKSPACE_PREFIX))).toBe(false);
  });

  it("keeps on request and reports a failed removal instead of hiding it", () => {
    const base = mkdtempSync(join(tmpdir(), "ccv-test-base-"));
    try {
      const workspace = createWorkspace(root, base);
      expect(cleanupWorkspace(workspace, true)).toEqual({ removed: false, kept: true });
      expect(cleanupWorkspace(workspace, false, () => { throw new Error("EBUSY"); })).toEqual({ removed: false, kept: false, error: "EBUSY" });
      expect(cleanupWorkspace(workspace, false)).toEqual({ removed: true, kept: false });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});

describe("CCV-2 runner — local canonical registry", () => {
  it("serves exactly the generator items on loopback and logs every request", async () => {
    const items = buildDistributedRegistryItems();
    const registry = await startLocalRegistry(items);
    try {
      expect(registry.host).toBe("127.0.0.1");
      expect(registry.origin).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
      expect(registry.template).toBe(`${registry.origin}/r/{name}.json`);
      const button = await fetch(`${registry.origin}/r/button.json`);
      expect(button.status).toBe(200);
      expect(await button.json()).toEqual(JSON.parse(JSON.stringify(items.find((item) => item.name === "button"))));
      expect((await fetch(`${registry.origin}/r/nope.json`)).status).toBe(404);
      expect((await fetch(`${registry.origin}/../../etc/passwd`)).status).toBe(404);
      expect(registry.requests().slice(0, 2)).toEqual(["/r/button.json", "/r/nope.json"]);
    } finally {
      await registry.close();
    }
  });
});
