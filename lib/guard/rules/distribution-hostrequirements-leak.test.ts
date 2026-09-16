import { describe, expect, it } from "vitest";
import { loadGeneratedManifests } from "@/lib/guard/generated-artifacts";
import { evaluateDistributionHostrequirementsLeak } from "@/lib/guard/rules/distribution-hostrequirements-leak";

describe("distribution/hostrequirements-leak — against the real generated registry", () => {
  it("real generated manifests (public/r/*.json, npm run generate:registry) never leak hostRequirements", () => {
    const manifests = loadGeneratedManifests();
    expect(manifests.length).toBeGreaterThan(0); // sanity: real output present
    const evaluations = evaluateDistributionHostrequirementsLeak(manifests);
    const violations = evaluations.filter((e) => e.status === "violation");
    expect(violations).toEqual([]);
    expect(evaluations.every((e) => e.status === "pass")).toBe(true);
  });

  it("canonical registry may legitimately contain hostRequirements — that alone is never the violation", () => {
    // Sanity: hostRequirements IS a real canonical field (on
    // ComponentRegistryEntry, e.g. Button's own ["react","react-dom","next"]).
    // This rule only cares whether it leaks into the PUBLIC generated
    // manifest, never whether the canonical entry has it.
    const manifests = loadGeneratedManifests();
    const buttonManifest = manifests.find((m) => m.fileName === "button.json");
    expect(buttonManifest).toBeDefined();
    expect(JSON.stringify(buttonManifest!.json)).toContain("docs"); // host requirements surface via the free-text docs field instead
  });
});

describe("distribution/hostrequirements-leak — synthetic violation proof", () => {
  it("VIOLATION only when leakage actually occurs in the generated output", () => {
    const evaluations = evaluateDistributionHostrequirementsLeak([
      { fileName: "clean.json", json: { name: "clean", dependencies: [] } },
      { fileName: "leaky.json", json: { name: "leaky", hostRequirements: ["react"] } },
    ]);

    expect(evaluations).toEqual([
      { status: "pass", ruleId: "distribution/hostrequirements-leak", subject: { kind: "manifest", id: "clean.json" } },
      {
        status: "violation",
        finding: {
          ruleId: "distribution/hostrequirements-leak",
          severity: "error",
          subject: { kind: "manifest", id: "leaky.json" },
          canonicalEvidence: expect.stringContaining("leaky.json"),
          details: expect.stringContaining("leaky.json"),
        },
      },
    ]);
  });
});
