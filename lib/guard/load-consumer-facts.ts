import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GUARD_CONSUMER_FACTS_SCHEMA_VERSION,
  type GuardConsumerFactEntry,
  type GuardConsumerFactsBundle,
} from "@/lib/guard/consumer-facts-schema";
import type { ComponentFact, ComponentFactSource } from "@/lib/guard/component-facts";

export type LoadConsumerFactsResult =
  | { ok: true; bundle: GuardConsumerFactsBundle; source: ComponentFactSource }
  | { ok: false; message: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEntry(value: unknown, index: number): GuardConsumerFactEntry | string {
  if (!isPlainObject(value)) return `components[${index}] must be an object`;
  if (typeof value.slug !== "string" || value.slug.length === 0) {
    return `components[${index}].slug must be a non-empty string`;
  }
  if (typeof value.displayName !== "string") {
    return `components[${index}].displayName must be a string`;
  }
  if (typeof value.status !== "string" || value.status.length === 0) {
    return `components[${index}].status must be a non-empty string`;
  }
  if (typeof value.installable !== "boolean") {
    return `components[${index}].installable must be a boolean`;
  }
  return {
    slug: value.slug,
    displayName: value.displayName,
    status: value.status,
    installable: value.installable,
  };
}

/** Validate and normalize an already-parsed JSON value into a fact source. */
export function parseConsumerFactsBundle(raw: unknown): LoadConsumerFactsResult {
  if (!isPlainObject(raw)) {
    return { ok: false, message: "Consumer facts bundle must be a JSON object" };
  }
  if (raw.schemaVersion !== GUARD_CONSUMER_FACTS_SCHEMA_VERSION) {
    return {
      ok: false,
      message: `Unsupported consumer facts schemaVersion (expected ${GUARD_CONSUMER_FACTS_SCHEMA_VERSION})`,
    };
  }
  if (typeof raw.guardToolVersion !== "string" || raw.guardToolVersion.length === 0) {
    return { ok: false, message: "guardToolVersion must be a non-empty string" };
  }
  if (typeof raw.source !== "string" || raw.source.length === 0) {
    return { ok: false, message: "source must be a non-empty string" };
  }
  if (!Array.isArray(raw.components)) {
    return { ok: false, message: "components must be an array" };
  }

  const components: GuardConsumerFactEntry[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < raw.components.length; i++) {
    const parsed = parseEntry(raw.components[i], i);
    if (typeof parsed === "string") return { ok: false, message: parsed };
    if (seen.has(parsed.slug)) {
      return { ok: false, message: `Duplicate component slug in facts bundle: ${parsed.slug}` };
    }
    seen.add(parsed.slug);
    components.push(parsed);
  }

  const bundle: GuardConsumerFactsBundle = {
    schemaVersion: GUARD_CONSUMER_FACTS_SCHEMA_VERSION,
    guardToolVersion: raw.guardToolVersion,
    source: raw.source,
    components,
  };

  const facts = new Map<string, ComponentFact>(
    components.map((entry) => [
      entry.slug,
      {
        slug: entry.slug,
        displayName: entry.displayName,
        status: entry.status,
        installable: entry.installable,
        publicPropertyNames: [],
      },
    ]),
  );

  return {
    ok: true,
    bundle,
    source: {
      getBySlug: (slug) => facts.get(slug),
      listSlugs: () => Array.from(facts.keys()),
    },
  };
}

export function loadConsumerFactsFromFile(filePath: string): LoadConsumerFactsResult {
  if (!existsSync(filePath)) {
    return { ok: false, message: `Consumer facts file not found: ${filePath}` };
  }
  let text: string;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    return { ok: false, message: `Could not read consumer facts file: ${filePath}` };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, message: `Consumer facts file is not valid JSON: ${filePath}` };
  }
  return parseConsumerFactsBundle(parsed);
}

/** Default committed artifact path inside this repository. */
export function defaultRepoConsumerFactsPath(repoRoot: string = process.cwd()): string {
  return join(repoRoot, "lib/guard/generated/consumer-facts.json");
}

/**
 * Resolve packaged facts next to the installed package (dist/../facts or
 * alongside this module when running from source).
 */
export function defaultPackagedConsumerFactsPath(fromModuleUrl: string = import.meta.url): string {
  const here = dirname(fileURLToPath(fromModuleUrl));
  // packages/guard/dist/*.js → packages/guard/facts/
  const candidate = join(here, "..", "facts", "consumer-facts.json");
  if (existsSync(candidate)) return candidate;
  // lib/guard/*.ts during repo development
  return join(here, "generated", "consumer-facts.json");
}
