/**
 * Portable Guard consumer fact bundle — generated from the canonical
 * component registry. Not a second hand-authored database.
 *
 * Schema is intentionally narrow: only fields public consumer rules need
 * (slug existence, maturity status, installability). No Figma / Shape /
 * Surface / accessibility / token / prop metadata.
 */
import { GUARD_TOOL_VERSION } from "@/lib/guard/version";

export const GUARD_CONSUMER_FACTS_SCHEMA_VERSION = 1 as const;

export type GuardConsumerFactEntry = {
  slug: string;
  displayName: string;
  status: string;
  installable: boolean;
};

export type GuardConsumerFactsBundle = {
  schemaVersion: typeof GUARD_CONSUMER_FACTS_SCHEMA_VERSION;
  /** Matches lib/guard/version.ts — tool identity, not an independent ruleset version. */
  guardToolVersion: string;
  /** Deterministic generation label — not a git SHA (avoids dirty-tree churn). */
  source: string;
  components: GuardConsumerFactEntry[];
};

export const DEFAULT_CONSUMER_FACTS_SOURCE = GUARD_TOOL_VERSION;
