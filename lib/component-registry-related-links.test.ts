import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";

/**
 * ComponentRelatedLinks (components/docs/ComponentPageMeta.tsx) renders each
 * group's links keyed by `link.label`, not `link.href` — many components
 * legitimately list several distinct tokens/components/concepts that all
 * point to the same destination (most commonly /foundations, since there's
 * no per-token anchor page), so href is not a valid React key. Label is.
 * This guards the invariant the fix actually depends on: labels must stay
 * unique within a single group, for every registry entry — a future data
 * change reintroducing a duplicate label would break that key uniqueness
 * again, silently, the same way the original duplicate-href bug did.
 */
describe("Component registry related-link groups", () => {
  it("has unique labels within relatedComponents/relatedTokens/relatedConcepts for every entry", () => {
    const violations: string[] = [];

    for (const entry of componentRegistry) {
      const groups = [
        ["relatedComponents", entry.relatedComponents],
        ["relatedTokens", entry.relatedTokens],
        ["relatedConcepts", entry.relatedConcepts],
      ] as const;

      for (const [groupName, links] of groups) {
        const seen = new Set<string>();
        for (const link of links) {
          if (seen.has(link.label)) {
            violations.push(`${entry.slug} / ${groupName}: duplicate label "${link.label}"`);
          }
          seen.add(link.label);
        }
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
