import { describe, expect, it } from "vitest";
import { compileComponentContract } from "@/lib/agent-kit/contract-compiler";
import { componentRegistry, getRegistryEntry } from "@/lib/component-registry";
import { allComponents } from "@/lib/data";
import {
  FIGMA_IDENTITY_NODE_TYPES,
  FIGMA_IDENTITY_ROLES,
  PILOT_FIGMA_IDENTITIES,
  SKREWWW_PRO_FIGMA_FILE_KEY,
  figmaIdentityKey,
  validateFigmaIdentity,
  type FigmaIdentity,
} from "@/lib/figma-identity";

// Checks the checked-in evidence only — never a live Figma connection.

const FIXED_OPTIONS = {
  sourceGitSha: "0000000000000000000000000000000000000dead",
  sourceGitCommitTimestamp: "2026-09-29T00:00:00Z",
};

const PILOT_SLUGS = ["button", "text-input", "alert", "dialog", "chart-card"] as const;

const EXPECTED_PILOTS: Record<(typeof PILOT_SLUGS)[number], Pick<FigmaIdentity, "nodeId" | "nodeType">> = {
  button: { nodeId: "2012:7752", nodeType: "COMPONENT_SET" },
  "text-input": { nodeId: "2022:1151", nodeType: "COMPONENT_SET" },
  alert: { nodeId: "2034:25402", nodeType: "COMPONENT_SET" },
  dialog: { nodeId: "2044:25869", nodeType: "COMPONENT" },
  "chart-card": { nodeId: "3239:8017", nodeType: "COMPONENT" },
};

function contractFor(slug: string) {
  const entry = getRegistryEntry(slug)!;
  const doc = allComponents.find((d) => d.slug === slug)!;
  return compileComponentContract(entry, doc, FIXED_OPTIONS);
}

const validIdentity: FigmaIdentity = {
  fileKey: SKREWWW_PRO_FIGMA_FILE_KEY,
  nodeId: "1:2",
  nodeType: "COMPONENT",
  role: "master",
  verifiedAt: "2026-09-29",
};

describe("AG-1A — pilot Figma identities", () => {
  it("records exactly the five AG-1A pilots, each keyed by a real registry slug", () => {
    expect(Object.keys(PILOT_FIGMA_IDENTITIES).sort()).toEqual([...PILOT_SLUGS].sort());
    for (const slug of PILOT_SLUGS) expect(getRegistryEntry(slug), slug).toBeDefined();
  });

  it("pins each pilot to the verified Pro master (file key + node + type + role)", () => {
    for (const slug of PILOT_SLUGS) {
      const identity = PILOT_FIGMA_IDENTITIES[slug];
      expect(identity.fileKey, slug).toBe(SKREWWW_PRO_FIGMA_FILE_KEY);
      expect(identity.nodeId, slug).toBe(EXPECTED_PILOTS[slug].nodeId);
      expect(identity.nodeType, slug).toBe(EXPECTED_PILOTS[slug].nodeType);
      expect(identity.role, slug).toBe("master");
      expect(validateFigmaIdentity(identity), slug).toEqual([]);
    }
  });

  it("carries each pilot identity on its canonical registry entry, and on no other entry", () => {
    const withIdentity = componentRegistry.filter((e) => e.figmaIdentity).map((e) => e.slug);
    expect(withIdentity.sort()).toEqual([...PILOT_SLUGS].sort());
    for (const slug of PILOT_SLUGS) {
      expect(getRegistryEntry(slug)!.figmaIdentity).toEqual(PILOT_FIGMA_IDENTITIES[slug]);
    }
  });

  it("validates every identity recorded anywhere in the registry", () => {
    for (const entry of componentRegistry) {
      if (entry.figmaIdentity) expect(validateFigmaIdentity(entry.figmaIdentity), entry.slug).toEqual([]);
    }
  });

  it("keeps a legacy figmaNodeId consistent with the identity when both are set", () => {
    for (const entry of componentRegistry) {
      if (entry.figmaIdentity && entry.figmaNodeId) {
        expect(entry.figmaNodeId, entry.slug).toBe(entry.figmaIdentity.nodeId);
      }
    }
    // Chart Card is the pilot that already had a node ID recorded.
    expect(getRegistryEntry("chart-card")!.figmaNodeId).toBe(PILOT_FIGMA_IDENTITIES["chart-card"].nodeId);
  });

  it("never records the same (fileKey, nodeId) pair for two slugs", () => {
    const keys = componentRegistry.flatMap((e) => (e.figmaIdentity ? [figmaIdentityKey(e.figmaIdentity)] : []));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("does not change Figma availability — identity is independent of availability", () => {
    for (const slug of PILOT_SLUGS) expect(getRegistryEntry(slug)!.figmaAvailability, slug).toBe("available");
  });
});

describe("AG-1A — identity completeness", () => {
  it("requires a file key: the same node ID in two files is two different identities", () => {
    const pro = figmaIdentityKey({ fileKey: SKREWWW_PRO_FIGMA_FILE_KEY, nodeId: "2012:7752" });
    const otherFile = figmaIdentityKey({ fileKey: "KrQIUWznpBdP0ZuWjOu2e3", nodeId: "2012:7752" });
    expect(pro).not.toBe(otherFile);
  });

  it("does not treat a bare node ID as a complete identity", () => {
    // Data Table records a node ID but no identity (not an AG-1A pilot).
    const entry = componentRegistry.find((e) => e.figmaNodeId && !e.figmaIdentity);
    expect(entry, "fixture: an entry with a node ID but no identity").toBeDefined();
    const contract = contractFor(entry!.slug);
    expect(contract.figma.nodeId).toBe(entry!.figmaNodeId);
    expect(contract.figma.identity).toBeUndefined();
  });

  it("rejects malformed file keys, node IDs and dates", () => {
    expect(validateFigmaIdentity({ ...validIdentity, fileKey: "https://www.figma.com/design/x" })).not.toEqual([]);
    expect(validateFigmaIdentity({ ...validIdentity, fileKey: "" })).not.toEqual([]);
    expect(validateFigmaIdentity({ ...validIdentity, nodeId: "2012-7752" })).not.toEqual([]);
    expect(validateFigmaIdentity({ ...validIdentity, verifiedAt: "yesterday" })).not.toEqual([]);
    expect(validateFigmaIdentity(validIdentity)).toEqual([]);
  });

  it("only allows the documented node types and roles, in compatible pairs", () => {
    expect(FIGMA_IDENTITY_NODE_TYPES).toEqual(["COMPONENT_SET", "COMPONENT", "FRAME"]);
    expect(FIGMA_IDENTITY_ROLES).toEqual(["master", "static-reference", "composition-only"]);
    expect(validateFigmaIdentity({ ...validIdentity, role: "master", nodeType: "FRAME" })).not.toEqual([]);
    expect(validateFigmaIdentity({ ...validIdentity, role: "static-reference", nodeType: "COMPONENT" })).not.toEqual([]);
    expect(validateFigmaIdentity({ ...validIdentity, role: "static-reference", nodeType: "FRAME" })).toEqual([]);
    expect(
      validateFigmaIdentity({ ...validIdentity, role: "parity" as FigmaIdentity["role"] }),
    ).not.toEqual([]);
  });
});

describe("AG-1A — generated Agent contract exposure", () => {
  it("exposes each pilot identity 1:1 and marks the node as recorded", () => {
    for (const slug of PILOT_SLUGS) {
      const contract = contractFor(slug);
      expect(contract.figma.identity, slug).toEqual(PILOT_FIGMA_IDENTITIES[slug]);
      expect(contract.figma.nodeId, slug).toBe(PILOT_FIGMA_IDENTITIES[slug].nodeId);
      expect(contract.figma.verified, slug).toBe(true);
    }
  });

  it("encodes identity only — no parity state anywhere in the Figma block", () => {
    for (const slug of PILOT_SLUGS) {
      const figma = contractFor(slug).figma;
      expect(Object.keys(figma.identity!).sort()).toEqual(["fileKey", "nodeId", "nodeType", "role", "verifiedAt"]);
      expect(Object.keys(figma).every((k) => ["verified", "nodeId", "sourceUrl", "identity"].includes(k)), slug).toBe(true);
      expect(JSON.stringify(figma)).not.toMatch(/parity|match|pass|fail|in-sync/i);
    }
  });

  it("compiles pilot contracts reproducibly", () => {
    for (const slug of PILOT_SLUGS) {
      expect(JSON.stringify(contractFor(slug))).toBe(JSON.stringify(contractFor(slug)));
    }
  });
});
