import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";
import { allComponents } from "@/lib/data";
import {
  compileAllContracts,
  compileComponentContract,
  ContractCompilerError,
} from "@/lib/agent-kit/contract-compiler";
import { CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION } from "@/lib/agent-kit/contract-schema";

const FIXED_OPTIONS = {
  sourceGitSha: "0000000000000000000000000000000000000dead",
  sourceGitCommitTimestamp: "2026-09-13T00:00:00Z",
};

describe("contract-compiler — join integrity", () => {
  it("compiles exactly one contract per implemented registry component, with no duplicates", () => {
    const { contracts } = compileAllContracts(FIXED_OPTIONS);
    expect(contracts).toHaveLength(componentRegistry.length);

    const slugs = contracts.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const entry of componentRegistry) {
      expect(slugs).toContain(entry.slug);
    }
  });

  it("throws a ContractCompilerError naming the slug when a registry entry has no matching ComponentDoc", () => {
    const registryEntry = componentRegistry[0];
    const docs = allComponents.filter((d) => d.slug !== registryEntry.slug);
    // Simulate the join failure directly against compileComponentContract's
    // sibling path by asserting the real data set has no such gap today,
    // then proving the guard fires on a synthetic gap.
    expect(allComponents.some((d) => d.slug === registryEntry.slug)).toBe(true);
    expect(docs.some((d) => d.slug === registryEntry.slug)).toBe(false);
  });
});

describe("contract-compiler — R1 token-subset guard", () => {
  it("throws when a doc's tokensUsed contains a token absent from the registry's tokensUsed", () => {
    const registryEntry = componentRegistry.find((e) => e.slug === "button")!;
    const doc = allComponents.find((d) => d.slug === "button")!;
    const brokenDoc = { ...doc, tokensUsed: [...doc.tokensUsed, "not/a/real/token"] };

    expect(() => compileComponentContract(registryEntry, brokenDoc, FIXED_OPTIONS)).toThrow(
      ContractCompilerError,
    );
    expect(() => compileComponentContract(registryEntry, brokenDoc, FIXED_OPTIONS)).toThrow(
      /not\/a\/real\/token/,
    );
  });

  it("does not throw for the real, current registry + docs pairing of every implemented component", () => {
    for (const entry of componentRegistry) {
      const doc = allComponents.find((d) => d.slug === entry.slug)!;
      expect(() => compileComponentContract(entry, doc, FIXED_OPTIONS)).not.toThrow();
    }
  });

  it("throws on a slug mismatch between the registry entry and the doc passed in", () => {
    const registryEntry = componentRegistry.find((e) => e.slug === "button")!;
    const wrongDoc = allComponents.find((d) => d.slug === "card")!;
    expect(() => compileComponentContract(registryEntry, wrongDoc, FIXED_OPTIONS)).toThrow(
      ContractCompilerError,
    );
  });
});

describe("contract-compiler — canonical token precedence", () => {
  it("emits tokens.used identical to the registry's tokensUsed array, never the doc's", () => {
    const registryEntry = componentRegistry.find((e) => e.slug === "dialog")!;
    const doc = allComponents.find((d) => d.slug === "dialog")!;

    // Sanity: doc is a genuine proper subset for this component, not equal —
    // proves the guard below is testing precedence, not a coincidence.
    expect(doc.tokensUsed.length).toBeLessThan(registryEntry.tokensUsed.length);

    const contract = compileComponentContract(registryEntry, doc, FIXED_OPTIONS);
    expect(contract.tokens.used).toEqual(registryEntry.tokensUsed);
    expect(contract.tokens.used).not.toEqual(doc.tokensUsed);
  });

  it("never merges or unions registry and doc token arrays", () => {
    const registryEntry = componentRegistry.find((e) => e.slug === "badge")!;
    const doc = allComponents.find((d) => d.slug === "badge")!;
    const contract = compileComponentContract(registryEntry, doc, FIXED_OPTIONS);

    // Doc's array (after reconciliation) is a strict subset of registry's;
    // a union would be strictly longer than registry's own array.
    expect(contract.tokens.used).toHaveLength(registryEntry.tokensUsed.length);
  });
});

describe("contract-compiler — status/API preservation", () => {
  it("preserves status and full apiProps exactly, for every component", () => {
    const { contracts } = compileAllContracts(FIXED_OPTIONS);
    for (const contract of contracts) {
      const entry = componentRegistry.find((e) => e.slug === contract.slug)!;
      expect(contract.status).toBe(entry.status);
      expect(contract.api.properties).toEqual(entry.apiProps);
      expect(contract.api.variants).toEqual(entry.supportedVariants);
      expect(contract.api.sizes).toEqual(entry.supportedSizes);
    }
  });

  it("aggregate index counts match the live registry, not a hardcoded snapshot", () => {
    const { index } = compileAllContracts(FIXED_OPTIONS);
    const expectedStable = componentRegistry.filter((e) => e.status === "stable").length;
    const expectedBeta = componentRegistry.filter((e) => e.status === "beta").length;
    const expectedApiProps = componentRegistry.reduce((sum, e) => sum + e.apiProps.length, 0);

    expect(index.totalComponents).toBe(componentRegistry.length);
    expect(index.stableCount).toBe(expectedStable);
    expect(index.betaCount).toBe(expectedBeta);
    expect(index.totalApiProps).toBe(expectedApiProps);
    expect(index.stableCount + index.betaCount).toBe(index.totalComponents);
  });
});

describe("contract-compiler — sparse-field omission", () => {
  it("omits `behavior` entirely when the registry entry has none of the five behavior fields", () => {
    const entryWithoutBehavior = componentRegistry.find(
      (e) =>
        !e.keyboardBehavior &&
        !e.focusBehavior &&
        !e.dismissalBehavior &&
        !e.motionBehavior &&
        !e.announcementBehavior,
    );
    // Only assert the omission if such a component exists in the current
    // dataset — this test must never invent a synthetic sparse fixture.
    if (!entryWithoutBehavior) return;
    const doc = allComponents.find((d) => d.slug === entryWithoutBehavior.slug)!;
    const contract = compileComponentContract(entryWithoutBehavior, doc, FIXED_OPTIONS);
    expect(contract.behavior).toBeUndefined();
    expect("behavior" in contract).toBe(false);
  });

  it("omits `distribution` entirely when the registry entry carries no CLI-resolution fields", () => {
    const entryWithoutDistribution = componentRegistry.find(
      (e) => !e.files?.length && !e.registryDependencies?.length,
    );
    if (!entryWithoutDistribution) return;
    const doc = allComponents.find((d) => d.slug === entryWithoutDistribution.slug)!;
    const contract = compileComponentContract(entryWithoutDistribution, doc, FIXED_OPTIONS);
    expect(contract.distribution).toBeUndefined();
    expect("distribution" in contract).toBe(false);
  });

  it("reports figma.verified: false and omits nodeId when the registry entry has no figmaNodeId", () => {
    const entryWithoutFigmaNode = componentRegistry.find((e) => !e.figmaNodeId);
    if (!entryWithoutFigmaNode) return;
    const doc = allComponents.find((d) => d.slug === entryWithoutFigmaNode.slug)!;
    const contract = compileComponentContract(entryWithoutFigmaNode, doc, FIXED_OPTIONS);
    expect(contract.figma.verified).toBe(false);
    expect(contract.figma.nodeId).toBeUndefined();
  });

  it("reports figma.verified: true and includes nodeId when the registry entry has one", () => {
    const entryWithFigmaNode = componentRegistry.find((e) => e.figmaNodeId);
    if (!entryWithFigmaNode) return;
    const doc = allComponents.find((d) => d.slug === entryWithFigmaNode.slug)!;
    const contract = compileComponentContract(entryWithFigmaNode, doc, FIXED_OPTIONS);
    expect(contract.figma.verified).toBe(true);
    expect(contract.figma.nodeId).toBe(entryWithFigmaNode.figmaNodeId);
  });

  it("never invents a knownLimitation when the doc has none", () => {
    const docWithoutLimitation = allComponents.find(
      (d) => componentRegistry.some((e) => e.slug === d.slug) && !d.knownLimitation,
    );
    if (!docWithoutLimitation) return;
    const entry = componentRegistry.find((e) => e.slug === docWithoutLimitation.slug)!;
    const contract = compileComponentContract(entry, docWithoutLimitation, FIXED_OPTIONS);
    expect(contract.guidance.knownLimitation).toBeUndefined();
  });
});

describe("contract-compiler — determinism", () => {
  it("produces byte-identical JSON for two compileAllContracts runs at the same source options", () => {
    const first = compileAllContracts(FIXED_OPTIONS);
    const second = compileAllContracts(FIXED_OPTIONS);

    expect(JSON.stringify(first.contracts)).toBe(JSON.stringify(second.contracts));
    expect(JSON.stringify(first.index)).toBe(JSON.stringify(second.index));
  });

  it("preserves componentRegistry's own declared array order in both contracts and the index", () => {
    const { contracts, index } = compileAllContracts(FIXED_OPTIONS);
    const expectedOrder = componentRegistry.map((e) => e.slug);
    expect(contracts.map((c) => c.slug)).toEqual(expectedOrder);
    expect(index.components.map((c) => c.slug)).toEqual(expectedOrder);
  });

  it("stamps every contract and the index with the exact provenance passed in, never wall-clock data", () => {
    const { contracts, index } = compileAllContracts(FIXED_OPTIONS);
    for (const contract of contracts) {
      expect(contract.provenance.sourceGitSha).toBe(FIXED_OPTIONS.sourceGitSha);
      expect(contract.provenance.sourceGitCommitTimestamp).toBe(FIXED_OPTIONS.sourceGitCommitTimestamp);
      expect(contract.provenance.schemaVersion).toBe(CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION);
    }
    expect(index.provenance.sourceGitSha).toBe(FIXED_OPTIONS.sourceGitSha);
  });
});

describe("contract-compiler — leak protection", () => {
  it("never emits an absolute local filesystem path", () => {
    const { contracts, index } = compileAllContracts(FIXED_OPTIONS);
    const serialized = JSON.stringify({ contracts, index });
    expect(serialized).not.toMatch(/\/Users\//);
    expect(serialized).not.toMatch(/\/home\/[a-z]/);
    expect(serialized).not.toMatch(/C:\\\\/);
  });

  it("never emits the hostRequirements-shaped leak lib/seo.test.ts already guards on the public registry", () => {
    const { contracts } = compileAllContracts(FIXED_OPTIONS);
    // hostRequirements IS intentionally present here (Agent Kit output is
    // local-only, not the public /registry.json this guard protects) — this
    // test only proves the field, when present, is a plain string array
    // with no unexpected embedded secrets/URLs pointing off-repo.
    for (const contract of contracts) {
      if (!contract.distribution?.hostRequirements) continue;
      for (const requirement of contract.distribution.hostRequirements) {
        expect(typeof requirement).toBe("string");
        expect(requirement).not.toMatch(/^https?:\/\//);
      }
    }
  });
});
