import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { deriveNpmContract } from "@/lib/ccv/derive-npm-contract";
import { deriveAllShadcnContracts, deriveShadcnContract } from "@/lib/ccv/derive-shadcn-contract";
import { sha256Hex } from "@/lib/ccv/serialize";
import type { CcvCheck, CcvResult, ShadcnConsumerContract } from "@/lib/ccv/types";
import { summarizeChecks, validateCcvResult } from "@/lib/ccv/validate";
import { CCV_FAILURES } from "@/lib/ccv/failure-codes";
import { extractSkrewwwComponentMarker } from "@/lib/guard/provenance-marker";
import { buildDistributedRegistryItems } from "@/lib/shadcn-registry-generator";

// Any attempt to spawn a process or open a network connection from the derivation fails the test.
const refuse = (what: string) => () => {
  throw new Error(`CCV-1 must stay offline: ${what} was called`);
};
vi.mock("node:child_process", () => ({
  spawn: refuse("spawn"), spawnSync: refuse("spawnSync"), exec: refuse("exec"), execFile: refuse("execFile"),
  execFileSync: refuse("execFileSync"), execSync: refuse("execSync"), fork: refuse("fork"),
}));
vi.mock("node:http", () => ({ request: refuse("http.request"), get: refuse("http.get"), createServer: refuse("http.createServer") }));
vi.mock("node:https", () => ({ request: refuse("https.request"), get: refuse("https.get") }));

const SHA = "0123456789abcdef0123456789abcdef01234567";
const root = process.cwd();

beforeAll(() => {
  vi.stubGlobal("fetch", refuse("fetch"));
});
afterAll(() => {
  vi.unstubAllGlobals();
});

const ccvSources = (): Array<{ file: string; text: string }> =>
  [...readdirSync(join(root, "lib", "ccv")).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts")).map((name) => join("lib", "ccv", name)), "scripts/ccv-contract.ts"].map((file) => ({
    file,
    text: readFileSync(join(root, file), "utf8"),
  }));

describe("CCV-1 runs offline and stays inside its boundary", () => {
  it("derives every contract with fetch, child_process and http(s) unavailable", () => {
    expect(deriveAllShadcnContracts({ gitSha: SHA }).length).toBe(buildDistributedRegistryItems().length);
    expect(deriveNpmContract({ gitSha: SHA }).subject).toBe("@skrewww/react");
  });

  it("contains no network, process, installer, browser, model or Figma code", () => {
    const forbidden = /\bfetch\s*\(|node:https?|node:net\b|node:dgram|child_process|\bspawn|\bexecFile|\bexecSync|\bexec\s*\(|playwright|chromium|puppeteer|create-next-app|shadcn@|npm\s+(install|i|ci|pack|publish)\b|\bnpx\b|openai|@anthropic|figma/i;
    for (const { file, text } of ccvSources()) {
      // scripts/ccv-contract.ts may name the CLI it IS; strip comments for the scan
      const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      expect(code, file).not.toMatch(forbidden);
    }
  });

  it("imports only repository derivation helpers and node:crypto/path/url", () => {
    const allowed = [
      "@/lib/ccv/", "@/lib/audit/repo-source", "@/lib/audit/repo-css", "@/lib/shadcn-registry-generator", "@/lib/component-registry",
      "@/lib/react-package/", "@/lib/guard/provenance-marker", "node:crypto", "node:path", "node:url",
    ];
    for (const { file, text } of ccvSources().filter((source) => source.file.startsWith("lib/"))) {
      const code = text.replace(/\/\*[\s\S]*?\*\//g, "");
      for (const match of Array.from(code.matchAll(/^(?:import|export)\s[^;]*?from\s+"([^"]+)"/gm))) {
        expect(allowed.some((prefix) => match[1].startsWith(prefix)), `${file} imports ${match[1]}`).toBe(true);
      }
    }
    // CCV does not reach into Guard rules, the Audit Agent's comparison/explanation layers, or Figma code
    for (const { file, text } of ccvSources()) {
      expect(text, file).not.toMatch(/@\/lib\/guard\/(?!provenance-marker)|@\/lib\/audit\/(?!repo-source|repo-css)|figma/i);
    }
  });

  it("has no second slug allowlist: no registry slug appears as a literal in a CCV source", () => {
    const slugs = buildDistributedRegistryItems().map((item) => item.name).filter((name) => name !== "foundation");
    expect(slugs.length).toBeGreaterThan(40);
    for (const { file, text } of ccvSources()) {
      for (const slug of slugs) {
        expect(text, `${file} names "${slug}"`).not.toMatch(new RegExp(`["'\`]${slug}["'\`]`));
      }
    }
  });

  it("fails safely for an unknown subject", () => {
    for (const subject of ["nope", "", "Button", "@skrewww/button", "__proto__", "constructor"]) {
      expect(deriveShadcnContract(subject, { gitSha: SHA })).toBeUndefined();
    }
  });
});

describe("CCV-1 keeps the origin-marker finding (F1) visible", () => {
  const items = buildDistributedRegistryItems();
  const button = items.find((item) => item.name === "button")!;
  const buttonFile = button.files.find((file) => file.target === "~/components/ui/Button.tsx")!;

  it("the expected canonical Button bytes contain the origin marker, and the contract hashes those bytes", () => {
    expect(buttonFile.content.startsWith("/** @skrewww-component button */\n")).toBe(true);
    expect(extractSkrewwwComponentMarker(buttonFile.content)).toBe("button");
    const expected = (deriveShadcnContract("button", { gitSha: SHA }) as ShadcnConsumerContract).expectations.files.find((file) => file.installPath === "components/ui/Button.tsx")!;
    expect(expected.sha256).toBe(sha256Hex(buttonFile.content));
    expect(expected.originMarker).toBe("button");
    // the version a CLI that drops the marker would install hashes differently, so the loss is detectable
    const withoutMarker = buttonFile.content.replace(/^\/\*\*[^\n]*\*\/\n/, "");
    expect(withoutMarker).not.toBe(buttonFile.content);
    expect(sha256Hex(withoutMarker)).not.toBe(expected.sha256);
  });

  it("no item's expected bytes are normalized: every hash is of the exact generator content, markers included", () => {
    for (const contract of deriveAllShadcnContracts({ gitSha: SHA })) {
      const item = items.find((candidate) => candidate.name === contract.subject)!;
      for (const file of item.files) {
        const expected = contract.expectations.files.find((candidate) => candidate.target === file.target)!;
        expect(expected.sha256).toBe(sha256Hex(file.content));
        expect(expected.originMarker).toBe(extractSkrewwwComponentMarker(file.content));
      }
    }
  });

  it("the contract carries no transform, allowlist, normalization or tolerance concept", () => {
    const names = new Set<string>();
    const walk = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") for (const [key, entry] of Object.entries(value)) (names.add(key), walk(entry));
    };
    walk(deriveAllShadcnContracts({ gitSha: SHA }));
    walk(deriveNpmContract({ gitSha: SHA }));
    for (const key of Array.from(names)) expect(key).not.toMatch(/transform|allowlist|allow-list|normaliz|toleran|ignore|excus|accept/i);
    for (const { file, text } of ccvSources().filter((source) => source.file.startsWith("lib/"))) {
      expect(text, file).not.toMatch(/stripLeading|dropLeading|knownTransform|tolerat/i);
    }
  });

  it("an upstream transformation is a recordable fail, never a pass", () => {
    expect(CCV_FAILURES.UPSTREAM_TRANSFORM.attribution).toBe("upstream");
    const check: CcvCheck = {
      checkId: "shadcn:button:file:components/ui/Button.tsx",
      status: "fail",
      failureCode: "UPSTREAM_TRANSFORM",
      claim: "installed bytes equal the expected canonical bytes",
      authority: "generator",
      evidence: [{ kind: "file", ref: "components/ui/Button.tsx", observed: "first line is not the origin marker" }],
    };
    const result = (status: CcvCheck["status"]): CcvResult => {
      const checks = [{ ...check, status, ...(status === "fail" ? {} : { failureCode: undefined }) }] as CcvCheck[];
      return { schemaVersion: "1.0.0", distribution: "shadcn-registry", mode: "LOCAL_CANONICAL", subject: "button", environment: {}, source: { expectedGitSha: SHA }, checks, summary: summarizeChecks(checks) };
    };
    expect(validateCcvResult(result("fail"))).toEqual({ ok: true });
    // there is no way to express the same finding as accepted: a pass cannot carry the code
    expect(validateCcvResult({ ...result("pass"), checks: [{ ...check, status: "pass" }], summary: { pass: 1, fail: 0, unknown: 0, notApplicable: 0 } })).toMatchObject({ ok: false });
  });
});
