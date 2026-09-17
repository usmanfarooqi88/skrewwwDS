import { componentRegistry } from "@/lib/component-registry";
import { isDistributedViaSkrewwwRegistry } from "@/lib/agent-kit/project-context";
import {
  GUARD_CONSUMER_FACTS_SCHEMA_VERSION,
  type GuardConsumerFactsBundle,
} from "@/lib/guard/consumer-facts-schema";
import { GUARD_TOOL_VERSION } from "@/lib/guard/version";

/**
 * Project the canonical registry into the portable consumer fact bundle.
 * Deterministic: sorted by slug; no timestamps; no network.
 */
export function buildConsumerFactsBundle(
  registry: typeof componentRegistry = componentRegistry,
): GuardConsumerFactsBundle {
  const components = [...registry]
    .map((entry) => ({
      slug: entry.slug,
      displayName: entry.name,
      status: entry.status,
      installable: isDistributedViaSkrewwwRegistry(entry.slug),
    }))
    .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

  return {
    schemaVersion: GUARD_CONSUMER_FACTS_SCHEMA_VERSION,
    guardToolVersion: GUARD_TOOL_VERSION,
    source: "lib/component-registry.ts + isDistributedViaSkrewwwRegistry",
    components,
  };
}

/** Stable JSON serialization (trailing newline) for committed artifacts. */
export function serializeConsumerFactsBundle(bundle: GuardConsumerFactsBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}
