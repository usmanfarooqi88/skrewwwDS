import { describe, expect, it } from "vitest";
import { evaluateRegistryClosure } from "@/lib/ccv/shadcn/closure";
import { ACCEPTED_INSTALLER_TRANSFORMS, INSTALLER_TRANSFORMS, classifyInstalledFile, evaluateFileSet } from "@/lib/ccv/shadcn/compare-files";
import { dependencyDelta, evaluateDependencies, readDirectDependencies } from "@/lib/ccv/shadcn/dependencies";
import { buildBatchExpectation, deriveBatchSubjects } from "@/lib/ccv/shadcn/expected";
import { generateExportsHarness, moduleSpecifierFor } from "@/lib/ccv/shadcn/exports-harness";
import { diffSnapshots, sha256OfBytes } from "@/lib/ccv/shadcn/fs-snapshot";
import { evaluateImportClosure, packageNameOf } from "@/lib/ccv/shadcn/imports";
import { compareStableResults, evidence, exitCodeFor, humanSummary, listEvidence } from "@/lib/ccv/shadcn/result";
import { classifyDiagnostics, parseTscOutput } from "@/lib/ccv/shadcn/tsc-diagnostics";
import { deriveAllShadcnContracts } from "@/lib/ccv/derive-shadcn-contract";
import { buildDistributedRegistryItems } from "@/lib/shadcn-registry-generator";
import type { CcvResult } from "@/lib/ccv/types";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const MARKED = '/** @skrewww-component button */\n"use client";\n\nexport function Button() {\n  return null;\n}\n';
const expectedFor = (content: string, marker?: string) => ({ sha256: [sha256OfBytes(content)], originMarker: marker });

describe("CCV-2 file classification — exact bytes, proven transforms only", () => {
  it("matches only identical bytes", () => {
    expect(classifyInstalledFile({ expected: expectedFor(MARKED, "button"), actual: Buffer.from(MARKED), expectedContent: MARKED })).toMatchObject({ kind: "match" });
  });

  it("reports a missing file", () => {
    expect(classifyInstalledFile({ expected: expectedFor(MARKED, "button"), actual: undefined })).toEqual({ kind: "missing" });
  });

  it("F1: expected marker present, installed marker absent, nothing else changed → proven upstream transform (a FAIL, never a match)", () => {
    const installed = MARKED.replace("/** @skrewww-component button */\n", "");
    const verdict = classifyInstalledFile({ expected: expectedFor(MARKED, "button"), actual: Buffer.from(installed), expectedContent: MARKED });
    expect(verdict).toMatchObject({ kind: "upstream-transform", transform: "origin-marker-line-removed", markerExpected: true, markerPresent: false });
    expect(verdict.kind).not.toBe("match");
  });

  it("the expected hash and the installed bytes are never altered by classification", () => {
    const expected = expectedFor(MARKED, "button");
    const before = JSON.stringify(expected);
    const bytes = Buffer.from(MARKED.slice(34));
    const copy = Buffer.from(bytes);
    classifyInstalledFile({ expected, actual: bytes, expectedContent: MARKED });
    expect(JSON.stringify(expected)).toBe(before);
    expect(bytes.equals(copy)).toBe(true);
  });

  it("a marker drop PLUS another change is a content mismatch, not reduced to 'only the marker'", () => {
    const installed = MARKED.replace("/** @skrewww-component button */\n", "").replace("return null", "return 1");
    const verdict = classifyInstalledFile({ expected: expectedFor(MARKED, "button"), actual: Buffer.from(installed), expectedContent: MARKED });
    expect(verdict).toMatchObject({ kind: "content-mismatch", markerExpected: true, markerPresent: false });
  });

  it("an unrelated change (marker intact) is never mistaken for F1", () => {
    const verdict = classifyInstalledFile({ expected: expectedFor(MARKED, "button"), actual: Buffer.from(MARKED.replace("null", "undefined")), expectedContent: MARKED });
    expect(verdict).toMatchObject({ kind: "content-mismatch", markerPresent: true, firstDifference: { line: 5 } });
  });

  it("without the expected content no transform can be proven, so the result is a content mismatch", () => {
    const installed = MARKED.replace("/** @skrewww-component button */\n", "");
    expect(classifyInstalledFile({ expected: expectedFor(MARKED, "button"), actual: Buffer.from(installed) })).toMatchObject({ kind: "content-mismatch" });
  });

  it("refuses expected content that does not hash to the contract value", () => {
    expect(() => classifyInstalledFile({ expected: expectedFor(MARKED, "button"), actual: Buffer.from("x"), expectedContent: `${MARKED} ` })).toThrow(/does not match the contract hash/);
  });

  it("contributors that disagree are a manifest problem, whatever was installed", () => {
    expect(classifyInstalledFile({ expected: { sha256: ["a".repeat(64), "b".repeat(64)] }, actual: Buffer.from("x") })).toMatchObject({ kind: "contributors-disagree" });
  });

  it("a leading docblock removal on an unmarked file is a proven upstream transform too (still a FAIL)", () => {
    const content = "/**\n * Docs.\n */\n\nexport const x = 1;\n";
    expect(classifyInstalledFile({ expected: expectedFor(content), actual: Buffer.from("export const x = 1;\n"), expectedContent: content })).toMatchObject({ kind: "upstream-transform", transform: "leading-block-comments-removed", markerExpected: false });
  });

  it("no transformation is accepted as harmless", () => {
    expect(ACCEPTED_INSTALLER_TRANSFORMS).toEqual([]);
    expect(INSTALLER_TRANSFORMS.map((transform) => transform.id)).toEqual(["origin-marker-line-removed", "leading-block-comments-removed"]);
  });
});

describe("CCV-2 filesystem, dependency and closure evaluation", () => {
  it("diffs snapshots and isolates unexpected changes", () => {
    const before = new Map([["package.json", "1"], ["app/page.tsx", "1"], ["components.json", "1"]]);
    const after = new Map([["package.json", "2"], ["app/page.tsx", "1"], ["components.json", "2"], ["components/ui/Button.tsx", "x"], ["stray.txt", "y"], ["package-lock.json", "z"]]);
    const diff = diffSnapshots(before, after);
    expect(diff).toEqual({ added: ["components/ui/Button.tsx", "package-lock.json", "stray.txt"], removed: [], modified: ["components.json", "package.json"] });
    const set = evaluateFileSet(diff, new Set(["components/ui/Button.tsx"]), { dependenciesExpected: false, before: new Set(before.keys()) });
    expect(set.unexpectedAdded).toEqual(["package-lock.json", "stray.txt"]);
    expect(set.unexpectedModified).toEqual(["components.json", "package.json"]);
    const withDeps = evaluateFileSet(diff, new Set(["components/ui/Button.tsx"]), { dependenciesExpected: true, before: new Set(before.keys()) });
    expect(withDeps.unexpectedAdded).toEqual(["stray.txt"]);
    expect(withDeps.unexpectedModified).toEqual(["components.json"]);
  });

  it("computes the dependency delta and judges it against the declared set only", () => {
    const before = readDirectDependencies(JSON.stringify({ dependencies: { next: "16.3.7", react: "19.2.0" }, devDependencies: { typescript: "^5" } }));
    const after = readDirectDependencies(JSON.stringify({ dependencies: { next: "16.3.7", react: "19.2.0", "@phosphor-icons/react": "^2.1.10", "left-pad": "1" }, devDependencies: { typescript: "^5.9" } }));
    const delta = dependencyDelta(before, after);
    expect(delta.added).toEqual({ "@phosphor-icons/react": "^2.1.10", "left-pad": "1" });
    expect(delta.changed).toEqual([{ name: "typescript", before: "^5", after: "^5.9" }]);
    const verdict = evaluateDependencies(delta, ["@phosphor-icons/react", "recharts"]);
    expect(verdict.present).toEqual([{ name: "@phosphor-icons/react", spec: "^2.1.10" }]);
    expect(verdict.missing).toEqual(["recharts"]);
    expect(verdict.unexpected).toEqual([{ name: "left-pad", spec: "1" }]);
  });

  it("reads the resolved registry closure from the request log", () => {
    const verdict = evaluateRegistryClosure(["/r/button.json", "/r/foundation.json", "/r/button.json", "/r/card.json", "/r/ghost.json", "/favicon.ico"], ["button", "foundation", "text-input"], ["button", "card", "foundation", "text-input"]);
    expect(verdict).toEqual({ requested: ["button", "card", "foundation", "ghost"], missing: ["text-input"], extra: ["card"], unknown: ["/favicon.ico", "ghost"] });
  });

  it("assembles the batch expectation from contracts only, with shared targets and the closure", () => {
    const items = buildDistributedRegistryItems();
    const contracts = deriveAllShadcnContracts({ gitSha: SHA, items });
    const subjects = deriveBatchSubjects(items);
    expect(subjects).toEqual(items.filter((item) => item.type === "registry:ui").map((item) => item.name));
    expect(subjects).not.toContain("foundation");
    const all = buildBatchExpectation(subjects, contracts);
    expect(all.closureItems).toEqual(items.map((item) => item.name).sort()); // the full distribution, Foundation through the closure
    const cn = all.files.find((file) => file.installPath === "lib/cn.ts")!;
    expect(cn.items.length).toBeGreaterThan(2);
    expect(cn.sha256).toHaveLength(1);
    expect(new Set(all.files.map((file) => file.installPath)).size).toBe(all.files.length);
    const button = buildBatchExpectation(["button"], contracts);
    expect(button.closureItems).toEqual(["button", "foundation"]);
    expect(button.files.find((file) => file.installPath === "components/ui/Button.tsx")?.originMarker).toBe("button");
    expect(button.exports.map((entry) => entry.installPath)).toEqual(["components/ui/Button.tsx"]);
    expect(() => buildBatchExpectation(["no-such"], contracts)).toThrow(/no contract/);
  });
});

describe("CCV-2 import closure", () => {
  const files = [
    { installPath: "components/ui/A.tsx", content: 'import { cn } from "@/lib/cn";\nimport { B } from "./B";\nimport * as React from "react";\nimport styles from "./a.module.css";\nimport { Leaf } from "@phosphor-icons/react/dist/ssr";\n', declaredPackages: ["@phosphor-icons/react", "react"] },
    { installPath: "components/ui/B.tsx", content: 'import { x } from "@/lib/utils";\nimport { y } from "./Missing";\nimport z from "lodash";\nimport { q } from "next/link";\n', declaredPackages: ["next", "react"] },
  ];
  const exists = new Set(["components/ui/A.tsx", "components/ui/B.tsx", "lib/cn.ts", "components/ui/a.module.css", "lib/utils.ts"]);
  const verdicts = evaluateImportClosure({
    files,
    transported: new Set(["components/ui/A.tsx", "components/ui/B.tsx", "lib/cn.ts", "components/ui/a.module.css"]),
    exists: (path) => exists.has(path),
    packageInstalled: (name) => name !== "next",
  });

  it("resolves aliases, relative paths, CSS modules and declared installed packages", () => {
    expect(verdicts[0]).toEqual({ installPath: "components/ui/A.tsx", resolvedLocal: 3, resolvedPackages: ["@phosphor-icons/react", "react"], problems: [] });
  });

  it("names every unresolved, outside-the-set, undeclared or uninstalled import", () => {
    expect(verdicts[1].problems.map((problem) => `${problem.specifier}:${problem.problem}`)).toEqual([
      "@/lib/utils:outside-transported-set",
      "./Missing:unresolved-local",
      "lodash:undeclared-package",
      "next/link:package-not-installed",
    ]);
    expect(packageNameOf("@scope/pkg/deep/path")).toBe("@scope/pkg");
    expect(packageNameOf("pkg/sub")).toBe("pkg");
  });
});

describe("CCV-2 export harness and diagnostics", () => {
  const harness = generateExportsHarness([
    { installPath: "components/ui/Dialog.tsx", values: ["Dialog", "DialogBody"], types: ["DialogProps"] },
    { installPath: "components/ui/Button.tsx", values: ["Button"], types: [] },
  ]);

  it("imports values and types from the installed source path through the consumer alias, one name per line", () => {
    expect(moduleSpecifierFor("components/ui/Dialog.tsx")).toBe("@/components/ui/Dialog");
    expect(harness.source).toContain('} from "@/components/ui/Dialog";');
    expect(harness.source).toContain("import type {\n  DialogProps as t0_DialogProps,");
    expect(harness.source).toContain("    v0_DialogBody,");
    expect(harness.source).not.toMatch(/from "@\/components\/ui"\s*;|index/);
    const mapped = Array.from(harness.lines.values()).map((line) => `${line.kind}:${line.name}`);
    expect(mapped).toEqual(expect.arrayContaining(["value:Dialog", "value:DialogBody", "type:DialogProps", "value:Button"]));
  });

  it("maps tsc diagnostics to missing exports, unresolved imports and other failures", () => {
    const dialogBodyLine = Array.from(harness.lines.entries()).find(([, line]) => line.name === "DialogBody")![0];
    const output = [
      `ccv/exports-harness.tsx(${dialogBodyLine},3): error TS2305: Module '"@/components/ui/Dialog"' has no exported member 'DialogBody'.`,
      "components/ui/Dialog.tsx(4,22): error TS2307: Cannot find module '@/lib/gone' or its corresponding type declarations.",
      "app/layout.tsx(1,1): error TS2322: Type 'x' is not assignable to type 'y'.",
      "some unrelated line",
    ].join("\n");
    const parsed = parseTscOutput(output);
    expect(parsed).toHaveLength(3);
    const classified = classifyDiagnostics(parsed, harness, new Set(["components/ui/Dialog.tsx"]));
    expect(classified.missingExports.map((line) => line.name)).toEqual(["DialogBody"]);
    expect(classified.unresolvedImports.map((diagnostic) => diagnostic.file)).toEqual(["components/ui/Dialog.tsx"]);
    expect(classified.other.map((diagnostic) => diagnostic.code)).toEqual(["TS2322"]);
  });
});

describe("CCV-2 result helpers", () => {
  const base = (checks: CcvResult["checks"]): CcvResult => ({
    schemaVersion: "1.0.0", distribution: "shadcn-registry", mode: "LOCAL_CANONICAL", subject: "all", environment: {}, source: { expectedGitSha: SHA }, checks,
    summary: { pass: checks.filter((c) => c.status === "pass").length, fail: checks.filter((c) => c.status === "fail").length, unknown: checks.filter((c) => c.status === "unknown").length, notApplicable: 0 },
  });
  const pass = { checkId: "shadcn:all:file:a.ts", status: "pass" as const, claim: "c", authority: "generator" as const, evidence: [] };
  const fail = { ...pass, checkId: "shadcn:all:file:b.ts", status: "fail" as const, failureCode: "UPSTREAM_TRANSFORM" as const };
  const env = { ...pass, checkId: "shadcn:all:build:next-build", status: "unknown" as const, failureCode: "ENVIRONMENT_ERROR" as const };

  it("exit codes: 0 clean, 3 contract findings, 2 environment", () => {
    expect(exitCodeFor(base([pass]))).toBe(0);
    expect(exitCodeFor(base([pass, fail]))).toBe(3);
    expect(exitCodeFor(base([pass, fail, env]))).toBe(2);
  });

  it("the human summary separates verifier completion from the contract verdict, with no score", () => {
    const lines = humanSummary(base([pass, fail]));
    expect(lines[0]).toBe("CCV verifier: completed");
    expect(lines[1]).toBe("Contract result: FAIL");
    expect(lines.join("\n")).toMatch(/upstream \(installer\) transforms: 1/);
    expect(lines.join("\n")).not.toMatch(/score|rank|%/i);
    expect(humanSummary(base([env]))[0]).toMatch(/INCOMPLETE/);
  });

  it("keeps evidence bounded", () => {
    expect(evidence("file", "x", "y".repeat(1000)).observed.length).toBe(400);
    const list = listEvidence("file", "paths", Array.from({ length: 500 }, (_, i) => `components/ui/File${i}.tsx`));
    expect(list.every((entry) => entry.observed.length <= 400)).toBe(true);
    expect(list.length).toBeLessThanOrEqual(41);
  });

  it("compares stable sections only: volatile timing is ignored, any check or environment change is reported", () => {
    const a = { ...base([pass, fail]), volatile: { startedAt: "2026-10-04T21:00:00Z", durationMs: 1 } };
    const b = { ...base([pass, fail]), volatile: { startedAt: "2026-10-05T09:00:00Z", durationMs: 999 } };
    expect(compareStableResults(a, b)).toEqual({ identical: true, differingChecks: [], onlyInFirst: [], onlyInSecond: [], otherDifferences: [] });
    const changed = base([{ ...pass, actual: "other-hash" }, fail]);
    expect(compareStableResults(a, changed)).toMatchObject({ identical: false, differingChecks: ["shadcn:all:file:a.ts"] });
    expect(compareStableResults(a, base([pass]))).toMatchObject({ identical: false, onlyInFirst: ["shadcn:all:file:b.ts"] });
    expect(compareStableResults(a, { ...base([pass, fail]), environment: { tools: { shadcn: "4.22.0" } } })).toMatchObject({ identical: false, otherDifferences: ["environment"] });
    expect(compareStableResults(a, base([fail, pass]))).toMatchObject({ identical: false, otherDifferences: ["check order"] });
    const otherCommit = { ...base([pass, fail]), source: { expectedGitSha: "f".repeat(40) } };
    expect(compareStableResults(a, otherCommit)).toMatchObject({ identical: false, otherDifferences: ["source"] });
    expect(compareStableResults(a, otherCommit, { acrossCommits: true }).identical).toBe(true);
    expect(compareStableResults(a, { ...otherCommit, checks: [{ ...pass, actual: "x" }, fail] }, { acrossCommits: true })).toMatchObject({ identical: false, differingChecks: ["shadcn:all:file:a.ts"] });
  });
});

