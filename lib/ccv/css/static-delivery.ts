import { analyzeCssSurface, readScriptSuppliedCustomProperties } from "@/lib/ccv/css-surface";
import { sortedUnique } from "@/lib/ccv/serialize";
import type { CssSurface } from "@/lib/ccv/types";

/**
 * CCV-4 — static delivery of the CSS actually INSTALLED in a consumer, judged
 * against the CCV-1 contract (the expectation). Reuses `analyzeCssSurface` (no
 * second var()/fallback parser). A name the delivered CSS uses without a usable
 * fallback is never silently excused: it is either supplied at runtime by the
 * installed source (a CANDIDATE that the runtime layer must prove) or missing.
 */

export type ExpectedCss = CssSurface & { scriptSuppliedCustomProperties: string[] };

export type StaticCssInput = {
  /** Installed CSS of the subject (one item's CSS files, or the package stylesheet). */
  cssTexts: readonly string[];
  /** Names declared by installed CSS delivered alongside (the item's dependency closure). */
  alsoDeclared?: readonly string[];
  /** Installed TS/TSX sources of the subject (where runtime assignments would live). */
  scriptSources: readonly string[];
  expected: ExpectedCss;
};

export type SurfaceField = "declaredCustomProperties" | "usedCustomProperties" | "unresolvedWithoutFallback" | "fallbackBackedUses" | "modeSelectors" | "scriptSuppliedCustomProperties";

export type StaticCssVerdict = {
  observed: ExpectedCss;
  /** Fields where the installed surface differs from the contract. */
  differences: Array<{ field: SurfaceField; missing: string[]; extra: string[] }>;
  /** Used without declaration or fallback, and not assigned by installed source. */
  missingDeclarations: string[];
  /** Used without declaration or fallback, but assigned by installed source — runtime proof required. */
  runtimeSupplyCandidates: string[];
  /** Undeclared, every use backed by a literal fallback (not a failure). */
  fallbackBacked: string[];
};

const FIELDS: readonly SurfaceField[] = ["declaredCustomProperties", "usedCustomProperties", "unresolvedWithoutFallback", "fallbackBackedUses", "modeSelectors", "scriptSuppliedCustomProperties"];

export function verifyStaticCss(input: StaticCssInput): StaticCssVerdict {
  const surface = analyzeCssSurface(input.cssTexts, { alsoDeclared: input.alsoDeclared });
  const observed: ExpectedCss = { ...surface, scriptSuppliedCustomProperties: readScriptSuppliedCustomProperties(input.scriptSources) };
  const differences = FIELDS.map((field) => {
    const want = new Set(input.expected[field]);
    const got = new Set(observed[field]);
    return { field, missing: sortedUnique(Array.from(want).filter((name) => !got.has(name))), extra: sortedUnique(Array.from(got).filter((name) => !want.has(name))) };
  }).filter((entry) => entry.missing.length > 0 || entry.extra.length > 0);
  const supplied = new Set(observed.scriptSuppliedCustomProperties);
  return {
    observed,
    differences,
    missingDeclarations: observed.unresolvedWithoutFallback.filter((name) => !supplied.has(name)),
    runtimeSupplyCandidates: observed.unresolvedWithoutFallback.filter((name) => supplied.has(name)),
    fallbackBacked: observed.fallbackBackedUses,
  };
}
