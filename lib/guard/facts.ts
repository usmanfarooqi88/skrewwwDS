import { parseSource } from "@/lib/guard/parse-source";
import { extractImports } from "@/lib/guard/extract-imports";
import { extractJsxElements } from "@/lib/guard/extract-jsx";
import type { ExtractedSourceFacts, GuardSourceInput } from "@/lib/guard/types";

/**
 * The G-0 pipeline entry point: PARSE → EXTRACT FACTS, nothing further.
 * No rule evaluation, no diagnostics (see Part 17 of the G-0 brief).
 * Deterministic: given the same `input.content`, this function always
 * returns structurally identical facts (proven by the determinism test
 * in facts.test.ts — see docs/architecture/guard-readiness-audit.md's
 * `retrieval.test.ts`-style "run twice, deep-equal" precedent).
 */
export function extractSourceFacts(input: GuardSourceInput): ExtractedSourceFacts {
  const parsed = parseSource(input.path, input.content);
  if (!parsed.ok) {
    return { ok: false, path: input.path, errors: parsed.errors };
  }

  const imports = extractImports(parsed);
  const jsxElements = extractJsxElements(parsed, imports);

  return { ok: true, path: input.path, imports, jsxElements };
}
