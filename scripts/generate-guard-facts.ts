/**
 * Deterministic Guard consumer-facts generator.
 *
 *   npm run generate:guard-facts
 *
 * Writes lib/guard/generated/consumer-facts.json (committed artifact).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildConsumerFactsBundle, serializeConsumerFactsBundle } from "../lib/guard/build-consumer-facts";

const outPath = join(process.cwd(), "lib/guard/generated/consumer-facts.json");
mkdirSync(dirname(outPath), { recursive: true });
const bundle = buildConsumerFactsBundle();
writeFileSync(outPath, serializeConsumerFactsBundle(bundle), "utf8");
console.log(
  `Generated Guard consumer facts (${bundle.components.length} components) → ${outPath}`,
);
