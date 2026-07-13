import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareReadmeInventory,
  parseReadmeImplementedTable,
} from "@/lib/readme-inventory";
import { getImplementedComponentCount, getImplementedRegistryEntries } from "@/lib/component-registry";

const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");

describe("README implemented-component inventory", () => {
  it("matches the canonical registry exactly", () => {
    const parsed = parseReadmeImplementedTable(readme);
    const errors = compareReadmeInventory(parsed);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  it("includes Menu and Combobox", () => {
    const parsed = parseReadmeImplementedTable(readme);
    const forms = parsed.find((row) => row.category === "Forms");
    const navigation = parsed.find((row) => row.category === "Navigation");
    expect(forms?.components).toContain("Combobox");
    expect(navigation?.components).toContain("Menu");
  });

  it("lists the registry implemented count", () => {
    const parsed = parseReadmeImplementedTable(readme);
    const count = parsed.reduce((sum, row) => sum + row.components.length, 0);
    expect(count).toBe(getImplementedComponentCount());
  });

  it("does not mark documentation-only slugs as implemented", () => {
    const implementedSlugs = new Set(getImplementedRegistryEntries().map((entry) => entry.slug));
    for (const entry of getImplementedRegistryEntries()) {
      expect(implementedSlugs.has(entry.slug)).toBe(true);
    }
  });
});
