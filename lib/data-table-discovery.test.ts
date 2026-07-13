import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import {
  DATA_TABLE_CANONICAL_NAME,
  DATA_TABLE_CANONICAL_SLUG,
  DATA_TABLE_FIGMA_AUDIT_STATUS,
  DATA_TABLE_FIGMA_COMPONENT_SET_NODE_ID,
  DATA_TABLE_IMPLEMENTATION_GATE,
  DATA_TABLE_MVP_INTERACTIVE_PILLAR,
  DATA_TABLE_PAGINATION_APPROACH,
  DATA_TABLE_SEMANTICS,
} from "@/lib/data-table-figma-metadata";

describe("Data Table discovery gate", () => {
  it("keeps Data Table out of the implemented registry while Table may exist — implementation is a separate pass", () => {
    const slugs = getImplementedRegistryEntries().map((entry) => entry.slug);
    expect(slugs).not.toContain("data-grid");
    expect(slugs).not.toContain(DATA_TABLE_CANONICAL_SLUG);
    expect(slugs).toContain("table");
  });

  it("records the approved narrow-MVP gate and the decided naming/scope facts", () => {
    expect(DATA_TABLE_IMPLEMENTATION_GATE).toBe("approved-narrow-mvp");
    expect(DATA_TABLE_CANONICAL_NAME).toBe("Data Table");
    expect(DATA_TABLE_CANONICAL_SLUG).toBe("data-table");
    expect(DATA_TABLE_MVP_INTERACTIVE_PILLAR).toBe("sorting-only");
    expect(DATA_TABLE_PAGINATION_APPROACH).toBe("external-pagination-composition");
    expect(DATA_TABLE_SEMANTICS).toBe("native-table");
    // Figma parity is still a separate, non-blocking follow-up for this decision.
    expect(DATA_TABLE_FIGMA_AUDIT_STATUS).toBe("unresolved-mcp");
    expect(DATA_TABLE_FIGMA_COMPONENT_SET_NODE_ID).toBeNull();
  });

  it("documents the approved decision in architecture docs", () => {
    const discovery = readFileSync(
      join(process.cwd(), "docs/architecture/data-table-discovery.md"),
      "utf8",
    );
    expect(discovery).toContain("APPROVED — narrow MVP scope");
    expect(discovery).toContain("native HTML table");
    expect(discovery).toContain("TABLE FOUNDATION APPROVED — REACT-FIRST");
    expect(discovery).toContain("sorting only");
    expect(discovery).toMatch(/deferred to a later pass/i);
    expect(discovery).not.toMatch(/IMPLEMENTATION BLOCKED\*\*\s*\(Data Grid\)/);
  });
});
