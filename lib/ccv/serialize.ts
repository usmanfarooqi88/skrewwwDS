import { createHash } from "node:crypto";
import type { CcvResult, ConsumerContract } from "@/lib/ccv/types";

/**
 * CCV-1 — deterministic serialization. Object keys are sorted by code unit
 * (never locale), `undefined` is dropped, and the output ends with a newline,
 * so the same value always yields byte-identical JSON. Arrays keep their order:
 * the derivers sort them wherever order is semantically irrelevant, and a
 * `CcvResult`'s check order is meaningful and is preserved.
 */

const compareCodeUnits = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => compareCodeUnits(a, b))
        .map(([key, entry]) => [key, normalize(entry)]),
    );
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}

export function serializeConsumerContract(contract: ConsumerContract): string {
  return stableStringify(contract);
}

export function serializeCcvResult(result: CcvResult): string {
  return stableStringify(result);
}

export function sha256Hex(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export const sortedUnique = (values: Iterable<string>): string[] => Array.from(new Set(values)).sort(compareCodeUnits);
export { compareCodeUnits };
