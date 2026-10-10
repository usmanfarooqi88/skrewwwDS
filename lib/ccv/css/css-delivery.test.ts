import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAliasChains, rootDeclaredCustomProperties } from "@/lib/ccv/css/alias-chains";
import { runtimeSuppliedCheck, staticCssChecks } from "@/lib/ccv/css/checks";
import { deriveCoverage, scenarioCapabilities } from "@/lib/ccv/css/coverage-tiers";
import { stylesheetOrder, wireFoundationImport } from "@/lib/ccv/css/foundation";
import { verifyStaticCss, type ExpectedCss } from "@/lib/ccv/css/static-delivery";
import { syntheticCssFor } from "@/lib/ccv/css/synthetic";
import { deriveAllShadcnContracts } from "@/lib/ccv/derive-shadcn-contract";
import { deriveNpmContract } from "@/lib/ccv/derive-npm-contract";
import { COMPONENT_DESCRIPTORS } from "@/lib/consumer-scenarios/shadcn-component-scenarios";

const SHA = "0".repeat(40);
const npm = deriveNpmContract({ gitSha: SHA });
const expected: ExpectedCss = npm.expectations.css;
const id = (category: string, key: string) => `npm:test:${category}:${key}`;
const judge = (css: string, script = "", want: ExpectedCss = expected) => {
  const verdict = verifyStaticCss({ cssTexts: [css], scriptSources: [script], expected: want });
  const checks = staticCssChecks({ id, label: "test", verdict, expected: want, aliases: resolveAliasChains([css]) });
  return { verdict, checks, failed: checks.filter((c) => c.status === "fail").map((c) => `${c.checkId.replace("npm:test:", "")}=${c.failureCode}`) };
};
const clean = syntheticCssFor(expected);

describe("CCV-4 static CSS delivery — judged against the CCV-1 contract", () => {
  it("a delivered surface equal to the contract passes every static check", () => {
    expect(judge(clean.css, clean.script).failed).toEqual([]);
  });

  it("F7: --color-neutral-900 is recorded fallback-backed and stays a pass, never a declaration failure", () => {
    expect(expected.fallbackBackedUses).toContain("--color-neutral-900");
    const { checks, verdict } = judge(clean.css, clean.script);
    expect(verdict.missingDeclarations).not.toContain("--color-neutral-900");
    expect(checks.find((c) => c.checkId.endsWith("css-fallback:--color-neutral-900"))?.status).toBe("pass");
  });

  it("mutation: a removed declaration is CSS_DECLARATION_MISSING", () => {
    const used = expected.usedCustomProperties.find((name) => expected.declaredCustomProperties.includes(name) && !expected.fallbackBackedUses.includes(name))!;
    const { failed, verdict } = judge(clean.css.replace(`  ${used}: 1px;\n`, ""), clean.script);
    expect(verdict.missingDeclarations).toContain(used);
    expect(failed).toEqual(expect.arrayContaining(["css:declarations=CSS_DECLARATION_MISSING", "css:contract-surface=CSS_DECLARATION_MISSING"]));
  });

  it("mutation: dropping the literal fallback of a fallback-backed use fails that fallback check", () => {
    const { failed } = judge(clean.css.replace("var(--color-neutral-900, 0px)", "var(--color-neutral-900)"), clean.script);
    expect(failed).toEqual(expect.arrayContaining(["css-fallback:--color-neutral-900=CSS_DECLARATION_MISSING", "css:declarations=CSS_DECLARATION_MISSING"]));
  });

  it("mutation: a removed contract mode selector fails css:mode-selectors", () => {
    const selector = expected.modeSelectors[0];
    const mutated = clean.css.split(`${selector} {`).join(".ccv-removed {");
    expect(judge(mutated, clean.script).failed).toContain("css:mode-selectors=CSS_DECLARATION_MISSING");
  });

  it("mutation: an extra unresolved use (renamed token) is reported, not silently accepted", () => {
    const { failed, verdict } = judge(`${clean.css}.x { color: var(--ccv-renamed-token); }\n`, clean.script);
    expect(verdict.missingDeclarations).toEqual(["--ccv-renamed-token"]);
    expect(failed).toContain("css:declarations=CSS_DECLARATION_MISSING");
  });

  const sliderLike: ExpectedCss = { declaredCustomProperties: [], usedCustomProperties: ["--slider-fill-percent"], unresolvedWithoutFallback: ["--slider-fill-percent"], fallbackBackedUses: [], modeSelectors: [], scriptSuppliedCustomProperties: ["--slider-fill-percent"] };
  const sliderCss = ".fill { width: var(--slider-fill-percent); }\n";

  it("script-supplied: assigned by installed source → a runtime candidate, never subtracted; unknown without runtime proof", () => {
    const { verdict, failed } = judge(sliderCss, 'style={{ "--slider-fill-percent": pct }}', sliderLike);
    expect(verdict.runtimeSupplyCandidates).toEqual(["--slider-fill-percent"]);
    expect(verdict.missingDeclarations).toEqual([]);
    expect(failed).toEqual([]);
    const check = runtimeSuppliedCheck(id, "slider", "--slider-fill-percent", undefined, "runtime not requested");
    expect(check).toMatchObject({ status: "unknown", checkId: "npm:test:css-runtime-supplied:--slider-fill-percent" });
    expect(check.failureCode).toBeUndefined();
  });

  it("mutation: the runtime assignment removed from installed source → CSS_DECLARATION_MISSING", () => {
    const { verdict, failed } = judge(sliderCss, "const nothing = 1;", sliderLike);
    expect(verdict.missingDeclarations).toEqual(["--slider-fill-percent"]);
    expect(failed).toEqual(expect.arrayContaining(["css:declarations=CSS_DECLARATION_MISSING", "css:contract-surface=CSS_DECLARATION_MISSING"]));
  });

  it("runtime proof decides a candidate: pass, or CSS_RUNTIME_UNRESOLVED when nothing carries the value", () => {
    expect(runtimeSuppliedCheck(id, "slider", "--p", { status: "pass", detail: "ok" }, "")).toMatchObject({ status: "pass" });
    expect(runtimeSuppliedCheck(id, "slider", "--p", { status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED", detail: "none" }, "")).toMatchObject({ status: "fail", failureCode: "CSS_RUNTIME_UNRESOLVED" });
  });
});

describe("CCV-4 alias chains", () => {
  const problems = (css: string) => resolveAliasChains([css]).problems.map((p) => `${p.kind}:${p.name}`);

  it("mutation: an alias to an undeclared target without fallback is unresolved-target", () => {
    expect(problems(":root { --a: var(--missing); }")).toEqual(["unresolved-target:--a"]);
  });
  it("mutation: a cycle is detected", () => {
    expect(problems(":root { --a: var(--b); --b: var(--a); }")).toEqual(["cycle:--a", "cycle:--b"]);
  });
  it("mutation: a chain beyond the depth limit is reported", () => {
    const decls = Array.from({ length: 20 }, (_, i) => `--c${i}: var(--c${i + 1});`).join(" ");
    expect(problems(`:root { ${decls} --c20: 1px; }`)).toContain("depth-limit:--c0");
  });
  it("resolves against the declaration's own selector context before :root", () => {
    const css = ':root { --a: var(--b); } [data-skrewww-surface="glass"] { --a: var(--g); --g: red; }';
    const report = resolveAliasChains([css]);
    expect(report.problems).toEqual([{ name: "--a", context: ":root", kind: "unresolved-target", chain: ["--a", "--b"] }]);
    expect(report.chains).toEqual([{ name: "--a", context: '[data-skrewww-surface="glass"]', chain: ["--a", "--g"], terminal: "red" }]);
  });
  it("an absent target falls through to its fallback, following a var() fallback lazily (component/surface/content pattern)", () => {
    const report = resolveAliasChains([":root { --text: var(--surface-content, var(--inverse)); --inverse: #fff; }"]);
    expect(report.problems).toEqual([]);
    expect(report.chains[0]).toMatchObject({ name: "--text", terminal: "#fff" });
    expect(problems(":root { --text: var(--surface-content, var(--nope)); }")).toEqual(["unresolved-target:--text"]);
  });
  it("rootDeclaredCustomProperties reads only :root declarations", () => {
    expect(rootDeclaredCustomProperties([':root { --a: 1; } .x { --b: 2; } [data-skrewww-shape="pill"] { --c: 3; }'])).toEqual(["--a"]);
  });
});

describe("CCV-4 Foundation wiring", () => {
  const layout = 'import type { Metadata } from "next";\nimport "./globals.css";\n';
  it("wires Foundation once, before the consumer's own CSS", () => {
    const wired = wireFoundationImport(layout, "styles/skrewww-foundation.css");
    expect(stylesheetOrder(wired, "@/styles/skrewww-foundation.css")).toEqual({ imports: ["@/styles/skrewww-foundation.css", "./globals.css"], count: 1, index: 0, first: true });
  });
  it("mutation: imported twice or after consumer CSS is visible to the order check", () => {
    expect(stylesheetOrder('import "./globals.css";\nimport "@/f.css";\nimport "@/f.css";\n', "@/f.css")).toMatchObject({ count: 2, index: 1, first: false });
    expect(stylesheetOrder(layout, "@/f.css")).toMatchObject({ count: 0, index: -1 });
  });
  it("refuses a layout without the documented globals import", () => {
    expect(() => wireFoundationImport("export default 1;\n", "f.css")).toThrow(/globals\.css/);
  });
});

describe("CCV-4 coverage tiers — derived, never hand-listed", () => {
  const contracts = deriveAllShadcnContracts({ gitSha: SHA });
  const report = deriveCoverage(contracts, scenarioCapabilities(COMPONENT_DESCRIPTORS));

  it("T1 covers every distributed non-Foundation item; T2/T3 follow descriptor shape", () => {
    expect(report.items.length).toBe(contracts.filter((c) => !c.expectations.files.every((f) => f.kind === "foundation")).length);
    for (const item of report.items) {
      const descriptor = (COMPONENT_DESCRIPTORS as Record<string, { browserAssert?: unknown }>)[item.item];
      expect(item.tier, item.item).toBe(!descriptor ? "T1" : descriptor.browserAssert ? "T3" : "T2");
    }
    expect(report.counts.T1 + report.counts.T2 + report.counts.T3).toBe(report.items.length);
  });
  it("slider is T2 (renderHarness, no browserAssert) — so its runtime-supplied properties get a render scenario", () => {
    expect(report.items.find((item) => item.item === "slider")?.tier).toBe("T2");
  });
  it("T4 is derived from npm or non-Foundation registry dependencies", () => {
    for (const item of report.items) {
      const contract = contracts.find((c) => c.subject === item.item)!;
      const hasRisk = contract.expectations.dependencies.npm.length > 0 || contract.expectations.dependencies.registry.some((dep) => !/foundation$/.test(dep));
      expect(item.t4, item.item).toBe(hasRisk);
    }
  });
  it("composed descriptors that are not distributed items are reported, not counted as items", () => {
    expect(report.composedScenarios.every((name) => !report.items.some((item) => item.item === name))).toBe(true);
  });
  it("the tier module has no slug or tier table", () => {
    const source = readFileSync(join(process.cwd(), "lib/ccv/css/coverage-tiers.ts"), "utf8");
    // The Foundation subject's name is also the CCV-1 file kind `"foundation"` the module legitimately reads.
    for (const contract of contracts.filter((c) => !c.expectations.files.every((f) => f.kind === "foundation"))) expect(source, contract.subject).not.toMatch(new RegExp(`["'\`]${contract.subject}["'\`]`));
  });
});
