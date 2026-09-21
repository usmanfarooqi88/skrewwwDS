import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildConsumerFactsBundle, serializeConsumerFactsBundle } from "@/lib/guard/build-consumer-facts";
import { loadConsumerFactsFromFile, parseConsumerFactsBundle } from "@/lib/guard/load-consumer-facts";
import { GUARD_TOOL_VERSION } from "@/lib/guard/version";

const FACTS_PATH = join(process.cwd(), "lib/guard/generated/consumer-facts.json");

describe("Guard consumer facts bundle", () => {
  it("committed artifact is byte-identical to a fresh projection", () => {
    const expected = serializeConsumerFactsBundle(buildConsumerFactsBundle());
    const actual = readFileSync(FACTS_PATH, "utf8");
    expect(actual).toBe(expected);
  });

  it("covers every registry component with correct banking installability", () => {
    const loaded = loadConsumerFactsFromFile(FACTS_PATH);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.bundle.guardToolVersion).toBe(GUARD_TOOL_VERSION);
    expect(loaded.bundle.components).toHaveLength(56);
    const bySlug = new Map(loaded.bundle.components.map((c) => [c.slug, c]));
    expect(bySlug.get("button")?.installable).toBe(true);
    expect(bySlug.get("button")?.status).toBe("stable");
    for (const slug of [
      "banking-account-card",
      "banking-balance-summary",
      "banking-transaction-row",
    ]) {
      expect(bySlug.get(slug)?.installable, slug).toBe(false);
    }
    const slugs = loaded.bundle.components.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("rejects corrupt / duplicate bundles (no silent pass)", () => {
    expect(parseConsumerFactsBundle({ schemaVersion: 99, components: [] }).ok).toBe(false);
    expect(
      parseConsumerFactsBundle({
        schemaVersion: 1,
        guardToolVersion: "x",
        source: "x",
        components: [
          { slug: "a", displayName: "A", status: "stable", installable: true },
          { slug: "a", displayName: "A2", status: "stable", installable: true },
        ],
      }).ok,
    ).toBe(false);
  });
});
