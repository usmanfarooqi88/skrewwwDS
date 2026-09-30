import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";
import {
  REACT_PACKAGE_PILOT_SLUGS,
  buildReactPackageEntry,
  resolvePilotComponents,
  selectBarrelExports,
} from "@/lib/react-package/pilot-entry";

const barrel = readFileSync(join(process.cwd(), "components/ui/index.ts"), "utf8");

describe("@skrewww/react pilot entry", () => {
  it("resolves every pilot slug to an implemented canonical component and keeps its registry status", () => {
    const facts = resolvePilotComponents(componentRegistry);
    expect(facts.map((fact) => fact.slug)).toEqual([...REACT_PACKAGE_PILOT_SLUGS]);
    for (const fact of facts) {
      const entry = componentRegistry.find((candidate) => candidate.slug === fact.slug);
      expect(entry?.hasImplementation).toBe(true);
      expect(fact.status).toBe(entry?.status);
    }
  });

  it("pilot modules come from the registry, never a hand-maintained list", () => {
    const modules = resolvePilotComponents(componentRegistry).map((fact) => fact.module);
    expect(modules).toEqual(["Button", "Link", "Card", "TextInput", "FormField", "ValidationMessage", "Spinner", "Dialog"]);
  });

  it("generates an entry that re-exports only pilot modules and the router module", () => {
    const { source } = buildReactPackageEntry(componentRegistry, barrel);
    const modules = Array.from(source.matchAll(/from "@\/components\/ui\/([^"]+)"/g)).map((match) => match[1]);
    const allowed = new Set([
      "Button", "Link", "Card", "TextInput", "FormField", "ValidationMessage", "Spinner", "Dialog", "router-navigation",
    ]);
    expect(modules.length).toBeGreaterThan(0);
    for (const name of modules) expect(allowed.has(name)).toBe(true);
    expect(new Set(modules)).toEqual(allowed);
  });

  it("never pulls in chart, Beta, internal or framework-coupled modules", () => {
    const { source } = buildReactPackageEntry(componentRegistry, barrel);
    expect(source).not.toMatch(/internal\//);
    expect(source).not.toMatch(/Chart|Table|Calendar|DatePicker|ListItem|Pagination/);
    expect(source).not.toMatch(/recharts|next/);
  });

  it("exports the router provider and its types", () => {
    const { source } = buildReactPackageEntry(componentRegistry, barrel);
    expect(source).toMatch(/SkrewwwRouterProvider/);
    expect(source).toMatch(/SkrewwwNavigate/);
  });

  it("fails loudly for a module the public barrel does not export", () => {
    expect(() => selectBarrelExports(barrel, ["NotAComponent"])).toThrow(/does not export/);
  });

  it("fails loudly for an unknown or unimplemented slug", () => {
    expect(() => resolvePilotComponents(componentRegistry, ["not-a-component"])).toThrow(/not in the canonical registry/);
  });
});
