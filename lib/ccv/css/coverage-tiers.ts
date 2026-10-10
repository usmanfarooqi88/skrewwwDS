import { compareCodeUnits, sortedUnique } from "@/lib/ccv/serialize";
import type { ShadcnConsumerContract } from "@/lib/ccv/types";

/**
 * CCV-4 — derived coverage tiers (docs/architecture/consumer-contract-verification.md §10.8).
 * No component→tier table exists: T1 is every distributed item; T2/T3 come from
 * the SHAPE of the shared scenario descriptors (renderHarness → render,
 * browserAssert → runtime); T4 is a risk flag derived from the contract's
 * dependency facts. A T4 item keeps whatever T2/T3 scenarios it has.
 */

export type ScenarioCapability = { name: string; render: boolean; runtime: boolean };

export function scenarioCapabilities(descriptors: Record<string, { renderHarness?: unknown; browserAssert?: unknown }>): ScenarioCapability[] {
  return Object.entries(descriptors)
    .map(([name, descriptor]) => ({ name, render: typeof descriptor.renderHarness === "function", runtime: typeof descriptor.browserAssert === "function" }))
    .sort((a, b) => compareCodeUnits(a.name, b.name));
}

export type CoverageTier = "T1" | "T2" | "T3";

export type ItemCoverage = {
  item: string;
  tier: CoverageTier;
  /** T4 risk: a third-party npm dependency or a registry dependency other than Foundation. */
  t4: boolean;
  t4Reasons: string[];
  scenario?: string;
};

export type CoverageReport = { items: ItemCoverage[]; composedScenarios: string[]; counts: Record<CoverageTier | "T4", number> };

export function deriveCoverage(contracts: readonly ShadcnConsumerContract[], scenarios: readonly ScenarioCapability[]): CoverageReport {
  const byName = new Map(contracts.map((contract) => [contract.subject, contract]));
  const isFoundationOnly = (name: string) => {
    const contract = byName.get(name);
    return Boolean(contract) && contract!.expectations.files.every((file) => file.kind === "foundation");
  };
  const scenarioByName = new Map(scenarios.map((scenario) => [scenario.name, scenario]));
  const items: ItemCoverage[] = contracts
    .filter((contract) => !isFoundationOnly(contract.subject))
    .map((contract) => {
      const e = contract.expectations;
      const t4Reasons = sortedUnique([
        ...e.dependencies.npm.map((dep) => `npm:${dep}`),
        ...e.dependencies.registry.map((dep) => dep.replace(/^@skrewww\//, "")).filter((dep) => !isFoundationOnly(dep)).map((dep) => `registry:${dep}`),
      ]);
      const scenario = scenarioByName.get(contract.subject);
      const tier: CoverageTier = scenario?.runtime ? "T3" : scenario?.render ? "T2" : "T1";
      return { item: contract.subject, tier, t4: t4Reasons.length > 0, t4Reasons, ...(scenario ? { scenario: scenario.name } : {}) };
    });
  const itemNames = new Set(items.map((item) => item.item));
  const counts = { T1: 0, T2: 0, T3: 0, T4: 0 };
  for (const item of items) {
    counts[item.tier] += 1;
    if (item.t4) counts.T4 += 1;
  }
  return { items, composedScenarios: scenarios.filter((scenario) => !itemNames.has(scenario.name)).map((scenario) => scenario.name), counts };
}
