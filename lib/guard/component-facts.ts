import { componentRegistry } from "@/lib/component-registry";
import { isDistributedViaSkrewwwRegistry } from "@/lib/agent-kit/project-context";
import type { ComponentAgentContract, AgentContractIndexEntry } from "@/lib/agent-kit/contract-schema";

/**
 * The canonical-fact layer (G-0 brief Parts 14–16): a single normalized
 * `ComponentFact` shape, loadable from either the canonical in-repo
 * registry (internal mode) or generated Agent Kit contracts (external/
 * consumer mode) — never a new, third truth database.
 *
 * Deliberately narrow, per Part 16: only fields the 7 locked v0.1 rules
 * (docs/architecture/guard-readiness-audit.md §5) actually need. No
 * Shape, Surface, Figma, or accessibility metadata — those rule
 * candidates are DEFERRED (§6/§7 of the audit), and adding fields for
 * them now would be exactly the "speculative schema growth ahead of any
 * proven need" both PH-0 and the readiness audit warn against.
 *
 * G-0 provides query helpers only — no rule evaluates against this data
 * yet (Part 17: "No Rule Engine" in G-0).
 */

export type ComponentFact = {
  slug: string;
  displayName: string;
  status: string;
  /** Mirrors `isDistributedViaSkrewwwRegistry(slug)` exactly — never a separately maintained flag. */
  installable: boolean;
  /** From `apiProps`/`api.properties` — the only valid React prop allow-list (see docs/architecture/agent-kit.md's locked API rule). */
  publicPropertyNames: string[];
};

export type ComponentFactSource = {
  getBySlug: (slug: string) => ComponentFact | undefined;
  listSlugs: () => string[];
};

// ---------------------------------------------------------------------
// Internal mode — reads the canonical registry directly. Zero new fields
// duplicated: `installable` reuses `isDistributedViaSkrewwwRegistry`
// itself rather than re-reading `entry.files`, so this loader can never
// drift from that function's own definition of "installable."
// ---------------------------------------------------------------------

export function loadInternalComponentFacts(): ComponentFactSource {
  const facts = new Map<string, ComponentFact>(
    componentRegistry.map((entry) => [
      entry.slug,
      {
        slug: entry.slug,
        displayName: entry.name,
        status: entry.status,
        installable: isDistributedViaSkrewwwRegistry(entry.slug),
        publicPropertyNames: entry.apiProps.map((prop) => prop.name),
      },
    ]),
  );

  return {
    getBySlug: (slug) => facts.get(slug),
    listSlugs: () => Array.from(facts.keys()),
  };
}

// ---------------------------------------------------------------------
// External/consumer mode — builds the same normalized shape from
// *already-generated* Agent Kit artifacts (public/agent/index.json,
// public/agent/contracts/<slug>.json), proving the adaptor boundary
// against real, currently-generated output rather than inventing new
// packaging. No network fetch here — a caller (a future CLI, a future
// test) supplies the already-retrieved JSON; this function never reaches
// the filesystem or network itself, matching the same pure-input
// discipline as `detectProjectContext`.
//
// Packaging debt, recorded not solved (see docs/architecture/
// guard-readiness-audit.md §14/§15): an index entry alone
// (`AgentContractIndexEntry`) carries slug/status/apiPropertyNames but
// NOT installability — that requires the full per-component contract's
// optional `distribution` field. A real external CLI validating many
// files would need to decide whether to eagerly fetch every contract or
// fetch them lazily per referenced slug; that fetching/caching strategy
// is explicitly G-2/G-3 scope, not G-0's.
// ---------------------------------------------------------------------

export function componentFactFromIndexEntry(entry: AgentContractIndexEntry): Omit<ComponentFact, "installable"> {
  return {
    slug: entry.slug,
    displayName: entry.name,
    status: entry.status,
    publicPropertyNames: entry.apiPropertyNames,
  };
}

export function componentFactFromContract(contract: ComponentAgentContract): ComponentFact {
  return {
    slug: contract.slug,
    displayName: contract.name,
    status: contract.status,
    installable: Boolean(contract.distribution?.files && contract.distribution.files.length > 0),
    publicPropertyNames: contract.api.properties.map((prop) => prop.name),
  };
}

/**
 * Builds a `ComponentFactSource` from already-retrieved full contracts —
 * the accurate mode (installability known). A caller with only the
 * lighter `index.json` (no installability signal) should use
 * `componentFactFromIndexEntry` directly and treat `installable` as
 * unknown rather than guessing — never defaulted to `false`, which would
 * misreport a genuinely-distributed component as not installable.
 */
export function loadComponentFactsFromContracts(contracts: ComponentAgentContract[]): ComponentFactSource {
  const facts = new Map(contracts.map((contract) => [contract.slug, componentFactFromContract(contract)]));
  return {
    getBySlug: (slug) => facts.get(slug),
    listSlugs: () => Array.from(facts.keys()),
  };
}
