import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { INTENTIONAL_DIFFERENCE_RECORDS, NOT_APPLICABLE_RECORDS } from "@/lib/audit/audit-records";
import { AUDIT_STATUSES, type AuditComparison, type AuditFinding, type PilotPropertyMap } from "@/lib/audit/audit-types";
import { collectRepoFacts, readGitInfo } from "@/lib/audit/collect-repo-facts";
import {
  compareAuditEvidence,
  findDuplicateFindingIds,
  serializeAuditComparison,
  summarizeFindings,
  type CompareAuditEvidenceInput,
} from "@/lib/audit/compare-audit-evidence";
import { makeFinding } from "@/lib/audit/compare-rules";
import { snapshotPathFor } from "@/lib/audit/load-audit-inputs";
import { PILOT_PROPERTY_MAPS, validatePropertyMap } from "@/lib/audit/pilot-property-maps";
import { PILOT_TOKEN_ROLE_MAPS } from "@/lib/audit/pilot-token-role-maps";
import type { RepoFacts } from "@/lib/audit/repo-facts-types";
import { evaluateInternalGuard } from "@/lib/audit/repo-guard";
import type { FigmaSnapshot } from "@/lib/figma-snapshot/schema";

const root = process.cwd();
const PILOTS = ["button", "text-input", "alert", "dialog", "chart-card"] as const;
type Pilot = (typeof PILOTS)[number];

const facts = {} as Record<Pilot, RepoFacts>;
const snapshots = {} as Record<Pilot, FigmaSnapshot>;
const comparisons = {} as Record<Pilot, AuditComparison>;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function input(slug: Pilot, overrides: Partial<CompareAuditEvidenceInput> = {}): CompareAuditEvidenceInput {
  return {
    slug,
    repoFacts: clone(facts[slug]),
    figmaSnapshot: clone(snapshots[slug]),
    propertyMap: clone(PILOT_PROPERTY_MAPS[slug]),
    tokenRoleMap: PILOT_TOKEN_ROLE_MAPS[slug] ? clone(PILOT_TOKEN_ROLE_MAPS[slug]) : null,
    ...overrides,
  };
}

function run(value: CompareAuditEvidenceInput): AuditComparison {
  const result = compareAuditEvidence(value);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message} ${JSON.stringify(result.error.problems ?? [])}`);
  return result.comparison;
}

const find = (comparison: AuditComparison, claimKey: string): AuditFinding | undefined =>
  comparison.findings.find((finding) => finding.claimKey === claimKey);

beforeAll(() => {
  const git = readGitInfo(root);
  const guardEvaluations = evaluateInternalGuard(root, git.sha, git.commitTimestamp);
  for (const slug of PILOTS) {
    const collected = collectRepoFacts({ repoRoot: root, slug, git, guardEvaluations });
    if (!collected.ok) throw new Error(collected.error.message);
    facts[slug] = collected.facts;
    const identity = collected.facts.registry.figmaIdentity!;
    snapshots[slug] = JSON.parse(readFileSync(snapshotPathFor(root, identity.fileKey, slug), "utf8")) as FigmaSnapshot;
    comparisons[slug] = run(input(slug));
  }
}, 120_000);

describe("AG-1D comparator — statuses and summary", () => {
  it("compares all five pilots without error", () => {
    for (const slug of PILOTS) {
      expect(comparisons[slug].component.slug).toBe(slug);
      expect(comparisons[slug].findings.length).toBeGreaterThan(0);
    }
  });

  it("represents every one of the five statuses", () => {
    const seen = new Set(PILOTS.flatMap((slug) => comparisons[slug].findings.map((finding) => finding.status)));
    // Real pilots: pass, unknown, not-applicable. fail and intentional-difference come from fixtures below.
    expect(seen.has("pass") && seen.has("unknown") && seen.has("not-applicable")).toBe(true);
    const failing = mismatchedStyleInput();
    expect(run(failing).findings.some((finding) => finding.status === "fail")).toBe(true);
    const intended = run({ ...failing, intentionalDifferences: [styleRecord()] });
    expect(intended.findings.some((finding) => finding.status === "intentional-difference")).toBe(true);
    expect(AUDIT_STATUSES).toEqual(["pass", "fail", "unknown", "not-applicable", "intentional-difference"]);
  });

  it("summary has all five counts and they add up to the findings", () => {
    for (const slug of PILOTS) {
      const { summary, findings } = comparisons[slug];
      expect(Object.keys(summary).sort()).toEqual(["fail", "intentionalDifference", "notApplicable", "pass", "unknown"]);
      expect(summary.pass + summary.fail + summary.unknown + summary.notApplicable + summary.intentionalDifference).toBe(findings.length);
      expect(summarizeFindings(findings)).toEqual(summary);
    }
    expect(JSON.stringify(comparisons.alert)).not.toMatch(/percent|score|passRate/i);
  });

  it("preserves provenance from both inputs", () => {
    const { provenance } = comparisons.alert;
    expect(provenance.repoGitSha).toBe(facts.alert.provenance.gitSha);
    expect(provenance.figmaFileKey).toBe(snapshots.alert.identity.fileKey);
    expect(provenance.figmaNodeId).toBe(snapshots.alert.identity.nodeId);
    expect(provenance.figmaCapturedAt).toBe(snapshots.alert.capturedAt);
    expect(provenance.repoFactsSchemaVersion).toBe("1.1.0");
    expect(provenance.figmaSnapshotSchemaVersion).toBe("1.1.0");
    expect(provenance.propertyMapVersion).toBe("1.0.0");
    expect(provenance.tokenRoleMapVersion).toBe("1.0.0");
  });
});

describe("AG-1D comparator — input validation", () => {
  it("aborts on a mismatched Figma identity instead of emitting false fails", () => {
    const value = input("alert");
    value.figmaSnapshot!.identity.nodeId = "9999:1";
    const result = compareAuditEvidence(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("FIGMA_IDENTITY_MISMATCH");

    const wrongEntity = compareAuditEvidence({ ...input("alert"), figmaSnapshot: clone(snapshots.button) });
    expect(wrongEntity.ok).toBe(false);
    if (!wrongEntity.ok) expect(wrongEntity.error.code).toBe("FIGMA_IDENTITY_MISMATCH");
  });

  it("returns a typed unavailable state when there is no snapshot or no identity", () => {
    const noSnapshot = compareAuditEvidence(input("alert", { figmaSnapshot: null }));
    expect(!noSnapshot.ok && noSnapshot.error.code).toBe("FIGMA_EVIDENCE_UNAVAILABLE");
    const value = input("alert");
    delete value.repoFacts.registry.figmaIdentity;
    const noIdentity = compareAuditEvidence(value);
    expect(!noIdentity.ok && noIdentity.error.code).toBe("FIGMA_EVIDENCE_UNAVAILABLE");
  });

  it("rejects a slug mismatch, unsupported schemas, stale contract provenance and an invalid map", () => {
    expect(compareAuditEvidence({ ...input("alert"), slug: "button" }).ok).toBe(false);
    const schema = input("alert");
    schema.figmaSnapshot!.schemaVersion = "9.9.9";
    const schemaResult = compareAuditEvidence(schema);
    expect(!schemaResult.ok && schemaResult.error.code).toBe("UNSUPPORTED_SCHEMA");
    const stale = input("alert");
    stale.repoFacts.contract.provenanceMatchesRepoSha = false;
    const staleResult = compareAuditEvidence(stale);
    expect(!staleResult.ok && staleResult.error.code).toBe("CONTRACT_PROVENANCE_INVALID");
    const badMap = input("alert", { propertyMap: { ...clone(PILOT_PROPERTY_MAPS.alert), componentSlug: "button" } });
    const badMapResult = compareAuditEvidence(badMap);
    expect(!badMapResult.ok && badMapResult.error.code).toBe("PROPERTY_MAP_INVALID");
  });
});

describe("AG-1D comparator — finding ids and evidence", () => {
  it("uses stable ids of the form slug:category:claimKey with no duplicates", () => {
    for (const slug of PILOTS) {
      for (const finding of comparisons[slug].findings) {
        expect(finding.findingId).toBe(`${slug}:${finding.category}:${finding.claimKey}`);
        expect(finding.claimKey).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
      expect(findDuplicateFindingIds(comparisons[slug].findings)).toEqual([]);
    }
    expect(find(comparisons.button, "figma-property-style")?.findingId).toBe("button:api:figma-property-style");
    expect(find(comparisons.button, "figma-node")?.findingId).toBe("button:identity:figma-node");
  });

  it("rejects duplicate finding ids", () => {
    const value = input("button");
    value.repoFacts.guard.evaluations = [...value.repoFacts.guard.evaluations, value.repoFacts.guard.evaluations[0]];
    const result = compareAuditEvidence(value);
    expect(!result.ok && result.error.code).toBe("DUPLICATE_FINDING_ID");
  });

  it("every pass and fail cites both compared sides; every unknown cites the observed side", () => {
    const all = [...PILOTS.flatMap((slug) => comparisons[slug].findings), ...run(mismatchedStyleInput()).findings];
    for (const finding of all) {
      if (finding.status === "pass" || finding.status === "fail") {
        expect(new Set(finding.evidence.map((entry) => entry.sourceRef)).size).toBeGreaterThanOrEqual(2);
      }
      expect(finding.evidence.length).toBeGreaterThan(0);
    }
    expect(() =>
      makeFinding("x", { category: "api", claimKey: "k", claim: "c", status: "pass", reasonCode: "equal", expectedEvidence: [], actualEvidence: [] }),
    ).toThrow(/both compared sides/);
  });

  it("is deterministic: same inputs serialize byte-identically with sorted keys", () => {
    for (const slug of PILOTS) {
      expect(serializeAuditComparison(run(input(slug)))).toBe(serializeAuditComparison(comparisons[slug]));
    }
    const text = serializeAuditComparison(comparisons.alert);
    const keys = Object.keys(JSON.parse(text));
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });

  it("deterministic findings are high confidence; inferred ones are only ever unknown", () => {
    for (const slug of PILOTS) {
      for (const finding of comparisons[slug].findings) {
        if (finding.basis === "inferred") expect(finding.status).toBe("unknown");
        if (finding.status !== "unknown") expect(finding).toMatchObject({ basis: "deterministic", confidence: "high" });
      }
    }
  });
});

describe("AG-1D comparator — unknown, temporary and intentional-difference safety", () => {
  it("never turns an unknown into pass or fail", () => {
    const unknownReasons = new Set(["unmapped", "mapping-unknown", "alias-target-only", "not-observed-alias-chain-truncated", "requires-rendering", "no-figma-css-map", "prose-only", "free-form-api-name", "registry-subset-allowed", "undocumented-representation"]);
    for (const slug of PILOTS) {
      for (const finding of comparisons[slug].findings) {
        if (unknownReasons.has(finding.reasonCode)) expect(finding.status).toBe("unknown");
      }
    }
    const noMap = run(input("button", { propertyMap: null }));
    const propertyFindings = noMap.findings.filter((finding) => finding.claimKey.startsWith("figma-property-"));
    expect(propertyFindings.length).toBe(snapshots.button.observed.componentProperties.length);
    expect(propertyFindings.every((finding) => finding.status === "unknown" && finding.reasonCode === "unmapped")).toBe(true);
  });

  it("keeps TEMPORARY as evidence: it never becomes intentional-difference", () => {
    const parity = find(comparisons.alert, "css-implementation-parity")!;
    expect(parity.evidence.some((entry) => entry.observed.includes("TEMPORARY"))).toBe(true);
    expect(parity.status).toBe("unknown");
    for (const slug of PILOTS) expect(comparisons[slug].summary.intentionalDifference).toBe(0);
    expect(INTENTIONAL_DIFFERENCE_RECORDS).toEqual([]);
  });

  it("CSS evidence is a pass/fail basis only through an explicit token-role map; parity labels never decide", () => {
    for (const slug of PILOTS) {
      for (const finding of comparisons[slug].findings) {
        if ((finding.status === "pass" || finding.status === "fail") && finding.evidence.some((entry) => entry.sourceType === "css")) {
          expect(finding.claimKey.startsWith("role-")).toBe(true);
          expect(finding.evidence.some((entry) => entry.sourceType === "audit-map")).toBe(true);
        }
      }
    }
  });

  it("an unresolved custom property drives unknown", () => {
    const value = input("button");
    value.repoFacts.tokens.unresolved = ["--made-up"];
    const finding = find(run(value), "css-unresolved-properties")!;
    expect(finding).toMatchObject({ status: "unknown", reasonCode: "missing-repo-side" });
  });

  it("requires an exact structured record for intentional-difference", () => {
    const failing = mismatchedStyleInput();
    expect(find(run(failing), "figma-options-style")?.status).toBe("fail");
    expect(find(run({ ...failing, intentionalDifferences: [{ ...styleRecord(), claimKey: "figma-options-size" }] }), "figma-options-style")?.status).toBe("fail");
    expect(find(run({ ...failing, intentionalDifferences: [{ ...styleRecord(), componentSlug: "alert" }] }), "figma-options-style")?.status).toBe("fail");
    const intended = find(run({ ...failing, intentionalDifferences: [styleRecord()] }), "figma-options-style")!;
    expect(intended).toMatchObject({ status: "intentional-difference", reasonCode: "recorded-intentional-difference" });
    expect(intended.evidence.some((entry) => entry.sourceRef === styleRecord().sourceRef)).toBe(true);
  });

  it("dark mode is not-applicable only with a record and no contradicting repo declaration", () => {
    expect(find(comparisons.alert, "dark-mode")).toMatchObject({ status: "not-applicable", reasonCode: "not-applicable-recorded" });
    expect(find(run(input("alert", { notApplicable: [] })), "dark-mode")).toBeUndefined();
    const contradicted = input("alert");
    contradicted.repoFacts.tokens.runtimeDeclarations[0].declarations.push({ file: "styles/tokens.css", line: 1, context: '[data-theme="dark"]', value: "#000" });
    expect(find(run(contradicted), "dark-mode")).toMatchObject({ status: "unknown", reasonCode: "not-applicable-record-contradicted" });
    expect(NOT_APPLICABLE_RECORDS.every((record) => record.sourceRef.length > 0)).toBe(true);
  });
});

describe("AG-1D comparator — Guard translation", () => {
  const withGuard = (statuses: Array<"pass" | "violation" | "unknown" | "not-applicable">) => {
    const value = input("button");
    value.repoFacts.guard.evaluations = statuses.map((status, i) => ({
      ruleId: "token/undeclared-css-var",
      status,
      subject: status === "not-applicable" ? undefined : { kind: "token", id: `--t${i}` },
      reason: status === "unknown" || status === "not-applicable" ? "reason" : undefined,
      finding: status === "violation" ? { severity: "error", canonicalEvidence: 'x.css: references var(--t1); "button"' } : undefined,
      attribution: "subject" as const,
    }));
    return run(value).findings.filter((finding) => finding.category === "guard");
  };

  it("maps pass→pass, violation→fail, unknown→unknown, not-applicable→not-applicable, one finding each", () => {
    const findings = withGuard(["pass", "violation", "unknown", "not-applicable"]);
    expect(findings.map((finding) => [finding.claimKey, finding.status, finding.reasonCode]).sort()).toEqual(
      [
        ["token-undeclared-css-var-token-t0", "pass", "guard-pass"],
        ["token-undeclared-css-var-token-t1", "fail", "guard-violation"],
        ["token-undeclared-css-var-token-t2", "unknown", "guard-unknown"],
        ["token-undeclared-css-var-scope", "not-applicable", "guard-not-applicable"],
      ].sort(),
    );
    const violation = findings.find((finding) => finding.status === "fail")!;
    expect(violation.severity).toBe("major");
    expect(violation.evidence.some((entry) => entry.sourceRef === "guard:token/undeclared-css-var" && entry.capturedAt === facts.button.guard.evidenceSourceGitSha)).toBe(true);
  });
});

describe("AG-1D comparator — token dependencies (Figma-name domain)", () => {
  it("follows the registry → Figma direction: extra Figma bindings are never a fail", () => {
    const outside = find(comparisons.alert, "figma-bindings-outside-registry")!;
    expect(outside).toMatchObject({ status: "unknown", reasonCode: "registry-subset-allowed" });
    expect(outside.actual).toContain("component/radius/feedback");
  });

  it("classifies bound, nested, alias-only and truncated cases without guessing", () => {
    expect(find(comparisons.alert, "figma-binding-component-feedback-info-surface")).toMatchObject({ status: "pass", reasonCode: "bound-directly" });
    expect(find(comparisons.alert, "figma-binding-component-surface-content-muted")).toMatchObject({ status: "pass", reasonCode: "bound-within-instance" });
    expect(find(comparisons.button, "figma-binding-semantic-action-primary")).toMatchObject({ status: "unknown", reasonCode: "alias-target-only" });
    // With the complete alias closure (snapshot 1.1.0) absence from the master's whole dependency graph is provable.
    expect(find(comparisons.alert, "figma-binding-component-radius-container")).toMatchObject({ status: "fail", reasonCode: "not-observed" });
  });

  it("fails an unbound registry token only when the alias closure is fully captured", () => {
    const radius = "figma-binding-component-radius-container";
    // Complete closure (the committed 1.1.0 snapshot): absence is provable.
    expect(find(comparisons.alert, radius)).toMatchObject({ status: "fail", reasonCode: "not-observed", severity: "major" });

    // A 1.0.0 snapshot has no closure: alias chains past one hop stay open, so no fail.
    const legacy = input("alert");
    const snapshot = legacy.figmaSnapshot!;
    snapshot.schemaVersion = "1.0.0";
    delete snapshot.observed.aliasClosure;
    delete snapshot.derived.aliasClosureComplete;
    expect(find(run(legacy), radius)).toMatchObject({ status: "unknown", reasonCode: "not-observed-alias-chain-truncated" });

    // A 1.1.0 closure with an unresolved alias target is incomplete: still unknown.
    const incomplete = input("alert");
    const closure = incomplete.figmaSnapshot!.observed.aliasClosure!;
    const dropped = closure.variables.find((variable) => variable.name === "radius/lg")!;
    closure.variables = closure.variables.filter((variable) => variable.id !== dropped.id);
    closure.unresolvedIds = [dropped.id];
    incomplete.figmaSnapshot!.derived.aliasClosureComplete = false;
    expect(find(run(incomplete), radius)).toMatchObject({ status: "unknown", reasonCode: "not-observed-alias-chain-truncated" });

    const finding = find(comparisons.alert, radius)!;
    expect(finding.evidence.map((entry) => entry.sourceType).sort()).toEqual(["figma", "registry"]);
  });

  it("never compares Figma variable names with CSS custom-property names", () => {
    for (const slug of PILOTS) {
      // Only an explicit token-role map (AG-1F, `role-…` findings) may pair a Figma variable with a CSS custom property.
      const tokenFindings = comparisons[slug].findings.filter(
        (finding) => finding.category === "tokens" && (finding.status === "pass" || finding.status === "fail") && !finding.claimKey.startsWith("role-"),
      );
      for (const finding of tokenFindings) expect(finding.evidence.every((entry) => entry.sourceType === "figma" || entry.sourceType === "registry")).toBe(true);
      expect(find(comparisons[slug], "css-implementation-parity")).toMatchObject({ status: "unknown", reasonCode: "no-figma-css-map" });
    }
  });
});

describe("AG-1D comparator — property maps", () => {
  it("validates the schema and rejects malformed maps", () => {
    const base = clone(PILOT_PROPERTY_MAPS.button);
    expect(validatePropertyMap({ ...base, mappings: [...base.mappings, base.mappings[0]] }, "button").join()).toMatch(/duplicate/);
    expect(validatePropertyMap({ ...base, mappings: [{ figmaProperty: "X", kind: "react-prop", reactProperty: "bad name", rationale: "r" }] }, "button").join()).toMatch(/identifier/);
    expect(validatePropertyMap({ ...base, mappings: [{ figmaProperty: "X", kind: "unsupported", sourceRef: "", rationale: "r" }] }, "button").join()).toMatch(/sourceRef/);
    expect(validatePropertyMap({ ...base, mappings: [{ figmaProperty: "X", kind: "magic", rationale: "r" } as never] }, "button").join()).toMatch(/unknown kind/);
  });

  it.each(PILOTS)("%s map is schema-valid and covers every snapshot property", (slug) => {
    const map = PILOT_PROPERTY_MAPS[slug] as PilotPropertyMap;
    expect(validatePropertyMap(map, slug)).toEqual([]);
    expect(map.verifiedAgainst.figmaCapturedAt).toBe(snapshots[slug].capturedAt);
    const names = snapshots[slug].observed.componentProperties.map((property) => property.name).sort();
    expect(map.mappings.map((mapping) => mapping.figmaProperty).sort()).toEqual(names);
    // Property mapping is complete. (`role-…-unmapped-modes` is a token-role finding about CSS-less Figma modes, not a property.)
    expect(comparisons[slug].findings.filter((finding) => finding.reasonCode === "unmapped" && !finding.claimKey.startsWith("role-"))).toEqual([]);
  });

  it("Button: Style and Size compare through explicit option maps; State is a CSS state, not a prop", () => {
    expect(find(comparisons.button, "figma-options-style")).toMatchObject({ status: "pass", expected: "danger|primary|secondary" });
    expect(find(comparisons.button, "figma-options-size")).toMatchObject({ status: "pass", expected: "lg|md|sm" });
    expect(find(comparisons.button, "figma-property-state")).toMatchObject({ category: "states", status: "unknown", reasonCode: "requires-rendering" });
    expect(comparisons.button.findings.some((finding) => finding.category === "api" && finding.claimKey === "figma-property-state")).toBe(false);
    expect(JSON.stringify(comparisons.button.findings.filter((finding) => finding.status === "fail"))).toBe("[]");
  });

  it("Button: Label maps to children without inventing a label prop; icon presence uses leadingIcon / trailingIcon", () => {
    const label = find(comparisons.button, "figma-property-label")!;
    expect(label.status).not.toBe("fail");
    expect(label.expected).toBe("children");
    expect(find(comparisons.button, "figma-property-show-leading-icon")).toMatchObject({ status: "pass", expected: "leadingIcon" });
    expect(find(comparisons.button, "figma-property-trailing-icon")).toMatchObject({ status: "pass", expected: "trailingIcon" });
  });

  it("Text Input: State is a CSS state, Value stays unknown, sizes compare explicitly", () => {
    expect(find(comparisons["text-input"], "figma-property-state")).toMatchObject({ category: "states", status: "unknown" });
    expect(find(comparisons["text-input"], "figma-property-value")).toMatchObject({ status: "unknown", reasonCode: "mapping-unknown" });
    expect(find(comparisons["text-input"], "figma-options-size")?.status).toBe("pass");
    expect(comparisons["text-input"].findings.some((finding) => /form-field/.test(finding.claimKey))).toBe(false);
  });

  it("an option the map does not cover is unknown, a different option set is fail", () => {
    const missing = input("button");
    delete (missing.propertyMap!.mappings[0] as { optionMap: Record<string, string> }).optionMap.Danger;
    expect(find(run(missing), "figma-options-style")).toMatchObject({ status: "unknown", reasonCode: "unmapped" });
    expect(find(run(mismatchedStyleInput()), "figma-options-style")).toMatchObject({ status: "fail", reasonCode: "different" });
  });

  it("Dialog: Title and Body map to public compound exports, never to flat props", () => {
    expect(find(comparisons.dialog, "figma-property-title")).toMatchObject({ status: "pass", expected: "DialogTitle" });
    expect(find(comparisons.dialog, "figma-property-body")).toMatchObject({ status: "pass", expected: "DialogBody" });
    const value = input("dialog");
    value.repoFacts.react.publicExports.values = value.repoFacts.react.publicExports.values.filter((name) => name !== "DialogTitle");
    expect(find(run(value), "figma-property-title")).toMatchObject({ status: "fail", reasonCode: "different" });
  });

  it("Dialog: free-form documented names and stale figmaReference prose stay unknown evidence", () => {
    expect(find(comparisons.dialog, "documented-free-form-names")).toMatchObject({ status: "unknown", reasonCode: "free-form-api-name" });
    expect(find(comparisons.dialog, "documented-free-form-names")?.actual).toContain("DialogBody children");
    const prose = find(comparisons.dialog, "figma-reference-prose")!;
    expect(prose).toMatchObject({ status: "unknown", reasonCode: "prose-only" });
    expect(prose.actual).toBe(facts.dialog.registry.figmaReference);
    // The only Dialog fails are the stale-reference contradiction and the registry radius token — nothing from compound architecture.
    expect(comparisons.dialog.findings.filter((finding) => finding.status === "fail").map((finding) => finding.claimKey)).toEqual([
      "figma-reference-negative-master-claim",
      "figma-binding-component-radius-container",
    ]);
    expect(comparisons.dialog.findings.some((finding) => finding.claimKey.includes("children") && finding.status === "fail")).toBe(false);
  });

  it("Chart Card: no Figma properties is not-applicable, with no invented property findings", () => {
    expect(find(comparisons["chart-card"], "component-properties")).toMatchObject({ status: "not-applicable", reasonCode: "not-applicable-observed" });
    expect(comparisons["chart-card"].findings.some((finding) => finding.claimKey.startsWith("figma-property-") || finding.claimKey.startsWith("mapped-property-"))).toBe(false);
    expect(find(comparisons["chart-card"], "figma-node")?.status).toBe("pass");
  });

  it("a map entry naming a property Figma no longer has is a structure fail", () => {
    const value = input("alert");
    value.figmaSnapshot!.observed.componentProperties = value.figmaSnapshot!.observed.componentProperties.filter((property) => property.name !== "Title");
    expect(find(run(value), "mapped-property-title")).toMatchObject({ category: "figma-structure", status: "fail", severity: "minor" });
  });
});

describe("AG-1D comparator — Alert calibration (semantic, not hard-coded)", () => {
  it("confirms identity, compares tokens under R1 direction, and keeps the radius chain as evidence", () => {
    const alert = comparisons.alert;
    expect(find(alert, "figma-node")).toMatchObject({ status: "pass", expected: "U6KUuNf7DF4CP9QBOkLSUx/2034:25402" });
    const container = find(alert, "figma-binding-component-radius-container")!;
    expect(container.status).toBe("fail");
    const parity = find(alert, "css-implementation-parity")!;
    expect(parity.evidence.some((entry) => entry.observed.includes("--feedback-radius") && entry.observed.includes("--shape-radius-container"))).toBe(true);
    expect(alert.findings.some((finding) => finding.status === "intentional-difference")).toBe(false);
  });
});

describe("AG-1D comparator — purity and boundaries", () => {
  it("does not mutate its inputs and writes nothing", () => {
    const porcelain = () => execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, encoding: "utf8" });
    const before = porcelain();
    const value = input("alert");
    const frozen = JSON.stringify(value);
    run(value);
    expect(JSON.stringify(value)).toBe(frozen);
    expect(porcelain()).toBe(before);
  });

  it("the comparator path imports no model, network or live-Figma code", () => {
    const files = ["audit-types.ts", "audit-records.ts", "compare-rules.ts", "compare-audit-evidence.ts", "pilot-property-maps.ts"];
    for (const file of files) {
      const source = readFileSync(join(root, "lib/audit", file), "utf8");
      expect(source).not.toMatch(/anthropic|openai|@ai-sdk|from "ai"|fetch\(|node:https?|node:net|node:fs|node:child_process|use_figma|figma-console/i);
      expect(source).not.toMatch(/Date\.now|new Date\(|Math\.random/);
    }
  });
});

// ── fixtures ──────────────────────────────────────────────────────────────

function mismatchedStyleInput(): CompareAuditEvidenceInput {
  const value = input("button");
  value.repoFacts.registry.supportedVariants = ["danger", "primary", "tertiary"];
  return value;
}

function styleRecord() {
  return {
    componentSlug: "button",
    claimKey: "figma-options-style",
    sourceRef: "docs:fixture#style",
    statement: "Fixture: the tertiary React variant intentionally replaces Secondary.",
  };
}
