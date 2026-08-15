import { describe, expect, it } from "vitest";
import { changelogEntries, getSortedChangelogEntries } from "@/content/changelog";

describe("changelog data integrity", () => {
  it("has unique entry IDs", () => {
    const ids = changelogEntries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("sorts entries newest first, deterministically", () => {
    const sorted = getSortedChangelogEntries();
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].date >= sorted[i].date).toBe(true);
    }
  });

  it("uses ISO (YYYY-MM-DD) internal dates", () => {
    for (const entry of changelogEntries) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("every entry has at least one item", () => {
    for (const entry of changelogEntries) {
      expect(entry.items.length).toBeGreaterThan(0);
    }
  });

  it("every item uses a valid type", () => {
    const validTypes = new Set(["new", "improved", "fixed"]);
    for (const entry of changelogEntries) {
      for (const item of entry.items) {
        expect(validTypes.has(item.type)).toBe(true);
      }
    }
  });
});

/**
 * This is public, user-facing release communication — not an internal
 * audit trail. These patterns must never appear in changelog copy: Figma
 * node/variable IDs, commit hashes, local filesystem paths, internal
 * agent/workflow references, internal batch names, raw CSS custom
 * properties or hex values, and internal test-count style figures.
 */
describe("changelog public-content leak guard", () => {
  const forbiddenPatterns: Array<{ label: string; pattern: RegExp }> = [
    { label: "Figma node/variable ID", pattern: /\b\d{3,}:\d{3,}\b|VariableID/ },
    { label: "commit hash", pattern: /\b[0-9a-f]{7,40}\b/ },
    { label: "local filesystem path", pattern: /\/Users\// },
    { label: "AI agent/workflow reference", pattern: /\bClaude\b|\bCodex\b|\bMCP\b/i },
    { label: "internal batch name", pattern: /\bbatch[\s-]?[a-z0-9]\b/i },
    { label: "raw CSS custom property", pattern: /--[a-z][a-z0-9-]*\b/ },
    { label: "raw hex color", pattern: /#[0-9a-fA-F]{3,8}\b/ },
    { label: "localhost reference", pattern: /localhost/i },
  ];

  it("contains no forbidden internal details in any entry text", () => {
    const violations: string[] = [];
    for (const entry of changelogEntries) {
      const strings = [entry.title, entry.summary ?? "", ...entry.items.map((item) => item.text)];
      for (const text of strings) {
        for (const { label, pattern } of forbiddenPatterns) {
          if (pattern.test(text)) {
            violations.push(`${label} found in "${text}"`);
          }
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
