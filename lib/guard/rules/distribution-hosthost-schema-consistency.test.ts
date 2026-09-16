import { describe, expect, it } from "vitest";
import { loadGeneratedContracts, loadGeneratedManifests } from "@/lib/guard/generated-artifacts";
import { evaluateDistributionHosthostSchemaConsistency } from "@/lib/guard/rules/distribution-hosthost-schema-consistency";

describe("distribution/hosthost-schema-consistency — against the real generated artifacts", () => {
  it("real Agent Kit contracts never carry $schema; real shadcn manifests never carry guidance/tokens", () => {
    const contracts = loadGeneratedContracts();
    const manifests = loadGeneratedManifests();
    expect(contracts.length).toBeGreaterThan(0); // sanity: real output present
    expect(manifests.length).toBeGreaterThan(0);

    const evaluations = evaluateDistributionHosthostSchemaConsistency(contracts, manifests);
    const violations = evaluations.filter((e) => e.status === "violation");
    expect(violations).toEqual([]);
    expect(evaluations.every((e) => e.status === "pass")).toBe(true);
    expect(evaluations).toHaveLength(contracts.length + manifests.length);
  });

  it("a real contract genuinely has guidance/tokens (Agent-Kit-only fields) — proving the check is real, not vacuous", () => {
    const contracts = loadGeneratedContracts();
    const buttonContract = contracts.find((c) => c.fileName === "button.json");
    expect(buttonContract).toBeDefined();
    expect(buttonContract!.json).toHaveProperty("guidance");
    expect(buttonContract!.json).toHaveProperty("tokens");
  });

  it("a real manifest genuinely has files/dependencies (shadcn-only fields) — proving the check is real, not vacuous", () => {
    const manifests = loadGeneratedManifests();
    const buttonManifest = manifests.find((m) => m.fileName === "button.json");
    expect(buttonManifest).toBeDefined();
    expect(buttonManifest!.json).toHaveProperty("dependencies");
  });
});

describe("distribution/hosthost-schema-consistency — synthetic violation proof", () => {
  it("VIOLATION: a contract carrying $schema", () => {
    const evaluations = evaluateDistributionHosthostSchemaConsistency(
      [{ fileName: "leaky-contract.json", json: { slug: "x", $schema: "https://ui.shadcn.com/schema/registry-item.json" } }],
      [],
    );
    expect(evaluations).toHaveLength(1);
    expect(evaluations[0].status).toBe("violation");
    if (evaluations[0].status !== "violation") throw new Error("unreachable");
    expect(evaluations[0].finding.subject).toEqual({ kind: "contract", id: "leaky-contract.json" });
  });

  it("VIOLATION: a manifest carrying guidance and/or tokens", () => {
    const evaluations = evaluateDistributionHosthostSchemaConsistency(
      [],
      [{ fileName: "leaky-manifest.json", json: { name: "x", guidance: {}, tokens: {} } }],
    );
    expect(evaluations).toHaveLength(1);
    expect(evaluations[0].status).toBe("violation");
    if (evaluations[0].status !== "violation") throw new Error("unreachable");
    expect(evaluations[0].finding.canonicalEvidence).toContain("guidance");
    expect(evaluations[0].finding.canonicalEvidence).toContain("tokens");
  });

  it("PASS: clean contract and manifest, no cross-contamination", () => {
    const evaluations = evaluateDistributionHosthostSchemaConsistency(
      [{ fileName: "clean-contract.json", json: { slug: "x", guidance: {} } }],
      [{ fileName: "clean-manifest.json", json: { name: "x", files: [] } }],
    );
    expect(evaluations).toEqual([
      { status: "pass", ruleId: "distribution/hosthost-schema-consistency", subject: { kind: "contract", id: "clean-contract.json" } },
      { status: "pass", ruleId: "distribution/hosthost-schema-consistency", subject: { kind: "manifest", id: "clean-manifest.json" } },
    ]);
  });
});
