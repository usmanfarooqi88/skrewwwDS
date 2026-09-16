import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  componentFactFromContract,
  componentFactFromIndexEntry,
  loadComponentFactsFromContracts,
  loadInternalComponentFacts,
} from "@/lib/guard/component-facts";
import { isDistributedViaSkrewwwRegistry } from "@/lib/agent-kit/project-context";
import type { ComponentAgentContract, AgentContractIndex } from "@/lib/agent-kit/contract-schema";

describe("loadInternalComponentFacts", () => {
  const facts = loadInternalComponentFacts();

  it("resolves a real, distributed component with its real status and public prop names", () => {
    const button = facts.getBySlug("button");
    expect(button).toBeDefined();
    expect(button!.slug).toBe("button");
    expect(button!.status).toBe("stable");
    expect(button!.installable).toBe(isDistributedViaSkrewwwRegistry("button"));
    expect(button!.installable).toBe(true);
    expect(button!.publicPropertyNames).toContain("variant");
    expect(button!.publicPropertyNames).toContain("size");
  });

  it("marks a deferred banking component as implemented but not installable", () => {
    const banking = facts.getBySlug("banking-account-card");
    expect(banking).toBeDefined();
    expect(banking!.installable).toBe(false);
    expect(banking!.installable).toBe(isDistributedViaSkrewwwRegistry("banking-account-card"));
  });

  it("returns undefined for a slug that does not exist in the canonical registry", () => {
    expect(facts.getBySlug("command-palette")).toBeUndefined();
    expect(facts.getBySlug("not-a-real-component")).toBeUndefined();
  });

  it("lists every canonical slug, matching the real registry count", () => {
    expect(facts.listSlugs().length).toBeGreaterThan(0);
    expect(facts.listSlugs()).toContain("button");
    expect(facts.listSlugs()).toContain("toggle-group");
  });
});

describe("consumer-mode loader — proven against real generated Agent Kit artifacts on disk", () => {
  const CONTRACTS_DIR = join(process.cwd(), "public/agent/contracts");
  const INDEX_PATH = join(process.cwd(), "public/agent/index.json");

  it("componentFactFromIndexEntry: builds partial facts (no installability) from a real generated index.json entry", () => {
    const index = JSON.parse(readFileSync(INDEX_PATH, "utf8")) as AgentContractIndex;
    const buttonEntry = index.components.find((c) => c.slug === "button");
    expect(buttonEntry).toBeDefined();

    const fact = componentFactFromIndexEntry(buttonEntry!);
    expect(fact.slug).toBe("button");
    expect(fact.publicPropertyNames).toContain("variant");
    expect(fact).not.toHaveProperty("installable"); // deliberately absent — the index alone doesn't carry this signal
  });

  it("componentFactFromContract / loadComponentFactsFromContracts: builds full facts, including installability, from a real generated per-component contract", () => {
    const contract = JSON.parse(readFileSync(join(CONTRACTS_DIR, "button.json"), "utf8")) as ComponentAgentContract;
    const fact = componentFactFromContract(contract);
    expect(fact.slug).toBe("button");
    expect(fact.installable).toBe(true);

    const source = loadComponentFactsFromContracts([contract]);
    expect(source.getBySlug("button")).toEqual(fact);
    expect(source.getBySlug("not-a-real-component")).toBeUndefined();
    expect(source.listSlugs()).toEqual(["button"]);
  });

  it("consumer-mode installable matches internal-mode installable for the same real component (both derived from the same underlying files signal)", () => {
    const contract = JSON.parse(readFileSync(join(CONTRACTS_DIR, "button.json"), "utf8")) as ComponentAgentContract;
    const consumerFact = componentFactFromContract(contract);
    const internalFact = loadInternalComponentFacts().getBySlug("button");
    expect(consumerFact.installable).toBe(internalFact!.installable);
  });
});
