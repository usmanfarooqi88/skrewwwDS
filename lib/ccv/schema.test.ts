import { beforeAll, describe, expect, it } from "vitest";
import { CCV_FAILURES, CCV_FAILURE_CODES, failureAttribution } from "@/lib/ccv/failure-codes";
import { CCV_ID_PATTERN, listExpectationIds } from "@/lib/ccv/ids";
import { deriveAllShadcnContracts, deriveShadcnContract } from "@/lib/ccv/derive-shadcn-contract";
import { deriveNpmContract } from "@/lib/ccv/derive-npm-contract";
import { serializeCcvResult, serializeConsumerContract, stableStringify } from "@/lib/ccv/serialize";
import {
  CCV_CONTRACT_SCHEMA_VERSION,
  CCV_MODES,
  CCV_RESULT_SCHEMA_VERSION,
  type CcvCheck,
  type CcvResult,
  type ConsumerContract,
  type NpmConsumerContract,
  type ShadcnConsumerContract,
} from "@/lib/ccv/types";
import { summarizeChecks, validateCcvResult, validateConsumerContract } from "@/lib/ccv/validate";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const HASH = "a".repeat(64);
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let button: ShadcnConsumerContract;
let npm: NpmConsumerContract;
beforeAll(() => {
  button = deriveShadcnContract("button", { gitSha: SHA }) as ShadcnConsumerContract;
  npm = deriveNpmContract({ gitSha: SHA });
});

const problemsOf = (value: unknown, validate: (v: unknown) => ReturnType<typeof validateConsumerContract>): string => {
  const result = validate(value);
  return result.ok ? "" : result.problems.join("\n");
};
const contractProblems = (value: unknown) => problemsOf(value, validateConsumerContract);
const resultProblems = (value: unknown) => problemsOf(value, validateCcvResult);

function makeResult(checks: CcvCheck[]): CcvResult {
  return {
    schemaVersion: CCV_RESULT_SCHEMA_VERSION,
    distribution: "shadcn-registry",
    mode: "LOCAL_CANONICAL",
    subject: "button",
    environment: { node: "24.14.0", platform: "darwin", packageManager: "npm", tools: { shadcn: "4.16.2" } },
    source: { expectedGitSha: SHA },
    checks,
    summary: summarizeChecks(checks),
  };
}

const passCheck: CcvCheck = {
  checkId: "shadcn:button:file:components/ui/lib-cn.ts",
  status: "pass",
  claim: "installed file equals the expected bytes",
  expected: HASH,
  actual: HASH,
  authority: "generator",
  evidence: [{ kind: "hash", ref: "components/ui/Button.tsx", observed: HASH, sha256: HASH }],
};
const failCheck: CcvCheck = {
  checkId: "shadcn:button:file:components/ui/Button.tsx",
  status: "fail",
  failureCode: "UPSTREAM_TRANSFORM",
  claim: "installed file equals the expected bytes",
  expected: "first line is the origin marker",
  actual: 'first line is "use client";',
  authority: "generator",
  evidence: [{ kind: "file", ref: "components/ui/Button.tsx", observed: 'line 1: "use client";' }],
};

describe("CCV-1 failure taxonomy", () => {
  it("is a closed, deterministic set that keeps environment, upstream and Skrewww causes apart", () => {
    expect(CCV_FAILURE_CODES).toEqual([
      "ENVIRONMENT_ERROR", "INSTALL_FAILED", "MANIFEST_MISMATCH", "FILE_MISSING", "FILE_UNEXPECTED", "FILE_CONTENT_MISMATCH", "UPSTREAM_TRANSFORM",
      "EXPORT_MISSING", "EXPORT_UNEXPECTED", "DEEP_IMPORT_EXPOSED", "IMPORT_UNRESOLVED", "TYPECHECK_FAILED", "BUILD_FAILED",
      "DEPENDENCY_MISMATCH", "PEER_DEPENDENCY_MISMATCH", "CSS_DECLARATION_MISSING", "CSS_RUNTIME_UNRESOLVED",
      "LIFECYCLE_SCRIPT_UNEXPECTED", "POSTINSTALL_SIDE_EFFECT", "PROVENANCE_MISSING", "PROVENANCE_MISMATCH", "COMPATIBILITY_BREAK", "INTERACTION_FAILED",
    ]);
    expect(failureAttribution("ENVIRONMENT_ERROR")).toBe("environment");
    expect(failureAttribution("UPSTREAM_TRANSFORM")).toBe("upstream");
    expect(failureAttribution("FILE_CONTENT_MISMATCH")).toBe("skrewww");
    expect(CCV_FAILURE_CODES.filter((code) => failureAttribution(code) !== "skrewww")).toEqual(["ENVIRONMENT_ERROR", "UPSTREAM_TRANSFORM"]);
    for (const code of CCV_FAILURE_CODES) expect(CCV_FAILURES[code].meaning.length).toBeGreaterThan(20);
    expect(JSON.stringify(CCV_FAILURES)).not.toMatch(/\bscore\b|\bgrade\b|\bquality\b/i);
  });
});

describe("CCV-1 contract validation", () => {
  it("accepts every derived contract", () => {
    for (const contract of deriveAllShadcnContracts({ gitSha: SHA })) expect(validateConsumerContract(contract)).toEqual({ ok: true });
    expect(validateConsumerContract(npm)).toEqual({ ok: true });
  });

  it("rejects an unsupported schema version, an unknown distribution, an invalid mode and a mode that cannot verify the distribution", () => {
    expect(contractProblems({ ...clone(button), schemaVersion: "9.9.9" })).toMatch(/schemaVersion: unsupported/);
    expect(contractProblems({ ...clone(button), distribution: "pip" })).toMatch(/distribution: unknown/);
    expect(contractProblems({ ...clone(button), mode: "LATEST" })).toMatch(/mode: invalid/);
    expect(contractProblems({ ...clone(button), mode: "PUBLIC_NPM" })).toMatch(/cannot verify shadcn-registry/);
    expect(contractProblems({ ...clone(npm), mode: "LOCAL_CANONICAL" })).toMatch(/cannot verify npm-package/);
    for (const mode of CCV_MODES) expect(typeof mode).toBe("string");
  });

  it("rejects an empty subject, a malformed SHA and a missing npm package version", () => {
    expect(contractProblems({ ...clone(button), subject: " " })).toMatch(/subject/);
    expect(contractProblems({ ...clone(button), source: { gitSha: "abc" } })).toMatch(/source\.gitSha/);
    const noVersion = clone(npm) as unknown as { source: Record<string, unknown> };
    delete noVersion.source.packageVersion;
    expect(contractProblems(noVersion)).toMatch(/packageVersion: required/);
  });

  it("rejects duplicate file targets, malformed hashes and an install path that disagrees with the target", () => {
    const duplicate = clone(button);
    duplicate.expectations.files.push(clone(duplicate.expectations.files[0]));
    expect(contractProblems(duplicate)).toMatch(/duplicate file target/);
    const badHash = clone(button);
    badHash.expectations.files[0].sha256 = "xyz";
    expect(contractProblems(badHash)).toMatch(/malformed SHA-256/);
    const mismatch = clone(button);
    mismatch.expectations.files[0].installPath = "elsewhere.ts";
    expect(contractProblems(mismatch)).toMatch(/does not match the target/);
  });

  it("rejects duplicate exports and a name that is both a value and a type", () => {
    const duplicate = clone(npm);
    duplicate.expectations.exports.values.push(duplicate.expectations.exports.values[0]);
    expect(contractProblems(duplicate)).toMatch(/duplicate entry/);
    const both = clone(npm);
    both.expectations.exports.types.push(both.expectations.exports.values[0]);
    expect(contractProblems(both)).toMatch(/both a value and a type/);
    const publicAndDenied = clone(npm);
    publicAndDenied.expectations.exports.denied.push(publicAndDenied.expectations.package.publicSpecifiers[0]);
    expect(contractProblems(publicAndDenied)).toMatch(/both public and denied/);
  });

  it("rejects unknown fields, unknown authorities and CSS facts that contradict themselves", () => {
    expect(contractProblems({ ...clone(button), verdict: "pass" })).toMatch(/verdict: unknown field/);
    const authority = clone(button);
    (authority.expectations.authorities as Record<string, string>).files = "vibes";
    expect(contractProblems(authority)).toMatch(/must be a known authority/);
    const css = clone(button);
    css.expectations.css.unresolvedWithoutFallback = ["--a"];
    css.expectations.css.fallbackBackedUses = ["--a"];
    expect(contractProblems(css)).toMatch(/both unresolved and fallback-backed/);
    const declared = clone(button);
    declared.expectations.css.declaredCustomProperties = ["--a"];
    declared.expectations.css.unresolvedWithoutFallback = ["--a"];
    expect(contractProblems(declared)).toMatch(/is declared/);
  });

  it("contains expectations only: no result, status or pass/fail", () => {
    const keys = new Set<string>();
    const walk = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") for (const [key, entry] of Object.entries(value)) (keys.add(key), walk(entry));
    };
    walk(button);
    walk(npm);
    for (const forbidden of ["status", "pass", "fail", "failureCode", "result", "verdict", "score"]) expect(keys.has(forbidden)).toBe(false);
  });
});

describe("CCV-1 result and evidence validation", () => {
  it("accepts a well-formed result with every status, authority and evidence", () => {
    const unknown: CcvCheck = {
      checkId: "shadcn:button:build:next",
      status: "unknown",
      failureCode: "ENVIRONMENT_ERROR",
      claim: "next build succeeds",
      authority: "ccv-scenario",
      evidence: [{ kind: "command", ref: "npm run build", observed: "registry unreachable (ETIMEDOUT)" }],
    };
    const notApplicable: CcvCheck = { checkId: "shadcn:button:export:Nothing", status: "not-applicable", claim: "n/a", authority: "public-barrel", evidence: [] };
    const result = makeResult([passCheck, failCheck, unknown, notApplicable]);
    expect(validateCcvResult(result)).toEqual({ ok: true });
    expect(result.summary).toEqual({ pass: 1, fail: 1, unknown: 1, notApplicable: 1 });
  });

  it("enforces the failure-code rules", () => {
    expect(resultProblems(makeResult([{ ...failCheck, failureCode: undefined }]))).toMatch(/a fail requires a failure code/);
    expect(resultProblems(makeResult([{ ...passCheck, failureCode: "FILE_MISSING" }]))).toMatch(/a pass cannot carry a failure code/);
    expect(resultProblems(makeResult([{ ...passCheck, failureCode: "UPSTREAM_TRANSFORM" }]))).toMatch(/cannot carry a failure code/); // F1 can never be a pass
    expect(resultProblems(makeResult([{ ...failCheck, failureCode: "ENVIRONMENT_ERROR" }]))).toMatch(/not a contract failure/);
    expect(resultProblems(makeResult([{ ...failCheck, failureCode: "NOT_A_CODE" as never }]))).toMatch(/unknown failure code/);
    expect(resultProblems(makeResult([{ ...passCheck, status: "unknown", failureCode: "FILE_MISSING" }]))).toMatch(/only carry ENVIRONMENT_ERROR/);
    expect(validateCcvResult(makeResult([failCheck]))).toEqual({ ok: true }); // an upstream transform is a recordable, observable finding
  });

  it("requires an authority on every check and evidence on every fail", () => {
    expect(resultProblems(makeResult([{ ...passCheck, authority: undefined as never }]))).toMatch(/authority is required/);
    expect(resultProblems(makeResult([{ ...passCheck, authority: "my-own-opinion" as never }]))).toMatch(/authority is required/);
    expect(resultProblems(makeResult([{ ...failCheck, evidence: [] }]))).toMatch(/must carry evidence/);
  });

  it("rejects malformed evidence: oversized, unknown kind, unknown keys, bad hash, no reference", () => {
    const withEvidence = (evidence: unknown) => resultProblems(makeResult([{ ...passCheck, evidence: [evidence as never] }]));
    expect(withEvidence({ kind: "file", ref: "x", observed: "x".repeat(401) })).toMatch(/exceeds 400 characters/);
    expect(withEvidence({ kind: "log", ref: "x", observed: "x" })).toMatch(/unknown evidence kind/);
    expect(withEvidence({ kind: "file", ref: "x", observed: "x", stdout: "dump" })).toMatch(/stdout: unknown field/);
    expect(withEvidence({ kind: "hash", ref: "x", observed: "x", sha256: "nope" })).toMatch(/malformed SHA-256/);
    expect(withEvidence({ kind: "file", ref: "", observed: "x" })).toMatch(/non-empty reference/);
    expect(withEvidence("just a string")).toMatch(/must be an object/);
  });

  it("rejects duplicate or malformed check ids and a summary that does not match the checks", () => {
    expect(resultProblems(makeResult([passCheck, passCheck]))).toMatch(/duplicate check id/);
    expect(resultProblems(makeResult([{ ...passCheck, checkId: "button-file-1" }]))).toMatch(/stable id/);
    expect(resultProblems(makeResult([{ ...passCheck, checkId: "npm:@skrewww/react:export:Button" }]))).toMatch(/must start with "shadcn:"/);
    const wrongSummary = makeResult([passCheck]);
    wrongSummary.summary.pass = 2;
    expect(resultProblems(wrongSummary)).toMatch(/summary\.pass: is 2 but the checks contain 1/);
  });

  it("rejects top-level malformation: version, distribution, mode, subject, SHA, integrity", () => {
    const base = makeResult([passCheck]);
    expect(resultProblems({ ...base, schemaVersion: "0.0.1" })).toMatch(/unsupported/);
    expect(resultProblems({ ...base, distribution: "docker" })).toMatch(/unknown distribution/);
    expect(resultProblems({ ...base, mode: "PUBLIC_NPM" })).toMatch(/cannot verify/);
    expect(resultProblems({ ...base, subject: "" })).toMatch(/subject/);
    expect(resultProblems({ ...base, source: { expectedGitSha: "short" } })).toMatch(/expectedGitSha/);
    expect(resultProblems({ ...base, source: { expectedGitSha: SHA, integrity: "md5-abc" } })).toMatch(/integrity/);
    expect(resultProblems({ ...base, extra: true })).toMatch(/extra: unknown field/);
    expect(resultProblems("nope")).toMatch(/must be an object/);
  });
});

describe("CCV-1 stable ids and deterministic serialization", () => {
  it("builds ids from the thing identified: stable, unique, well-formed, never indexed", () => {
    const ids = listExpectationIds(button);
    expect(ids).toEqual(listExpectationIds(deriveShadcnContract("button", { gitSha: SHA }) as ConsumerContract));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort());
    expect(ids).toContain("shadcn:button:file:components/ui/Button.tsx");
    for (const id of ids) expect(id).toMatch(CCV_ID_PATTERN);
    const npmIds = listExpectationIds(npm);
    expect(npmIds).toContain("npm:@skrewww/react:export:DialogBody");
    expect(npmIds).toContain("npm:@skrewww/react:css:--semantic-action-primary");
    expect(npmIds).toContain("npm:@skrewww/react:denied:@skrewww/react/dist/index.js");
    for (const id of npmIds) expect(id).toMatch(CCV_ID_PATTERN);
    expect(new Set(npmIds).size).toBe(npmIds.length);
  });

  it("serializes a contract byte-identically and with sorted keys", () => {
    expect(serializeConsumerContract(button)).toBe(serializeConsumerContract(clone(button)));
    const parsed = JSON.parse(serializeConsumerContract(button)) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual([...Object.keys(parsed)].sort());
    expect(serializeConsumerContract(button).endsWith("\n")).toBe(true);
    expect(CCV_CONTRACT_SCHEMA_VERSION).toBe("1.0.0");
    expect(serializeConsumerContract(button)).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // no timestamp in a contract
  });

  it("serializes a result byte-identically regardless of key order, keeps check order, and isolates volatile data", () => {
    const result = makeResult([passCheck, failCheck]);
    const shuffled = { summary: result.summary, checks: result.checks, source: result.source, environment: result.environment, subject: result.subject, mode: result.mode, distribution: result.distribution, schemaVersion: result.schemaVersion } as CcvResult;
    expect(serializeCcvResult(shuffled)).toBe(serializeCcvResult(result));
    expect((JSON.parse(serializeCcvResult(result)) as CcvResult).checks.map((check) => check.status)).toEqual(["pass", "fail"]);
    const timed = { ...result, volatile: { startedAt: "2026-10-04T00:00:00Z", durationMs: 12 } };
    expect(validateCcvResult(timed)).toEqual({ ok: true });
    expect(serializeCcvResult(result)).not.toMatch(/startedAt/);
    expect(stableStringify({ b: 1, a: undefined, c: [{ z: 1, y: 2 }] })).toBe('{\n  "b": 1,\n  "c": [\n    {\n      "y": 2,\n      "z": 1\n    }\n  ]\n}\n');
  });
});
