import { describe, expect, it } from "vitest";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import { buildLlmsTxt } from "@/lib/llms-content";

/**
 * Regression guard for a real stale-claim bug: the "Current status" line
 * used to hardcode "(Beta)" regardless of actual maturity split, even
 * though the registry has always held a mix of Stable and Beta components.
 * This asserts the line is derived from real data, not a fixed label.
 */
describe("buildLlmsTxt current-status line", () => {
  it("reports the real Stable/Beta split for indexable implemented components, not a hardcoded label", () => {
    const indexable = getImplementedRegistryEntries().filter(
      (entry) => entry.indexing === "index",
    );
    const stable = indexable.filter((entry) => entry.status === "stable").length;
    const beta = indexable.filter((entry) => entry.status === "beta").length;

    expect(stable + beta).toBe(indexable.length);

    const txt = buildLlmsTxt();
    const line = txt
      .split("\n")
      .find((l) => l.startsWith("- Implemented React components:"));

    expect(line).toBe(
      `- Implemented React components: ${indexable.length} (${stable} Stable, ${beta} Beta)`,
    );
    // A single-word maturity label (the old bug) would never match this shape.
    expect(line).not.toMatch(/\(Beta\)$/);
  });
});
