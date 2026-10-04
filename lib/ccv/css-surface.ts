import { readCssCustomPropertyDeclarations } from "@/lib/audit/repo-css";
import { sortedUnique } from "@/lib/ccv/serialize";
import type { CssSurface } from "@/lib/ccv/types";

/**
 * CCV-1 — the consumer-visible CSS custom-property surface of CSS that is
 * actually delivered (Foundation plus component CSS). Deterministic, offline and
 * not a CSS engine: no cascade, no computed values.
 *
 * `var(--x, fallback)` is NEVER treated as `var(--x)` (CCV-0 finding F7):
 * - declared name                                 → resolves;
 * - undeclared, literal fallback                  → resolves only through the fallback
 *                                                   (`fallbackBackedUses`, not a failure);
 * - undeclared, no fallback (or a fallback whose
 *   own nested `var()` cannot resolve)            → `unresolvedWithoutFallback`.
 *
 * Evaluation is lazy like CSS itself: a nested `var()` inside a fallback is only
 * judged when its outer property is undeclared.
 */

type VarUse = { name: string; hasFallback: boolean; nested: VarUse[] };

const IDENTIFIER_CHAR = /[A-Za-z0-9_-]/;
const MODE_SELECTOR = /\[data-skrewww-(?:shape|surface)(?:="[^"]*")?\]/g;

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, " ");
}

/** Index of the `)` that closes the `(` at `open`, or -1. */
function closingParen(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Top-level `var()` calls in `text` (with their fallbacks parsed recursively). */
function parseVarUses(text: string): VarUse[] {
  const uses: VarUse[] = [];
  let from = 0;
  for (;;) {
    const at = text.indexOf("var(", from);
    if (at === -1) return uses;
    if (at > 0 && IDENTIFIER_CHAR.test(text[at - 1])) {
      from = at + 4;
      continue;
    }
    const open = at + 3;
    const close = closingParen(text, open);
    if (close === -1) return uses;
    const inner = text.slice(open + 1, close);
    const comma = topLevelComma(inner);
    const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
    if (/^--[A-Za-z0-9_-]+$/.test(name)) {
      const fallback = comma === -1 ? undefined : inner.slice(comma + 1);
      uses.push({ name, hasFallback: fallback !== undefined, nested: fallback === undefined ? [] : parseVarUses(fallback) });
    }
    from = close + 1;
  }
}

function topLevelComma(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")") depth -= 1;
    else if (text[i] === "," && depth === 0) return i;
  }
  return -1;
}

function collectNames(uses: readonly VarUse[], into: Set<string>): void {
  for (const use of uses) {
    into.add(use.name);
    collectNames(use.nested, into);
  }
}

export type CssSurfaceOptions = {
  /** Names declared by CSS that is delivered alongside (dependency closure), used only to judge resolution. */
  alsoDeclared?: Iterable<string>;
};

export function analyzeCssSurface(cssTexts: readonly string[], options: CssSurfaceOptions = {}): CssSurface {
  const declared = new Set<string>();
  const used = new Set<string>();
  const modeSelectors = new Set<string>();
  const topLevelUses: VarUse[] = [];

  for (const css of cssTexts) {
    for (const declaration of readCssCustomPropertyDeclarations(css)) declared.add(declaration.name);
    const stripped = stripComments(css);
    for (const match of Array.from(stripped.matchAll(MODE_SELECTOR))) modeSelectors.add(match[0]);
    const uses = parseVarUses(stripped);
    collectNames(uses, used);
    topLevelUses.push(...uses);
  }

  const known = new Set<string>(Array.from(declared).concat(Array.from(options.alsoDeclared ?? [])));
  const unresolved = new Set<string>();
  const fallbackBacked = new Set<string>();

  const evaluate = (use: VarUse): "declared" | "fallback" | "unresolved" => {
    if (known.has(use.name)) return "declared";
    if (!use.hasFallback) {
      unresolved.add(use.name);
      return "unresolved";
    }
    const nested = use.nested.map(evaluate);
    if (nested.includes("unresolved")) {
      unresolved.add(use.name);
      return "unresolved";
    }
    fallbackBacked.add(use.name);
    return "fallback";
  };
  for (const use of topLevelUses) evaluate(use);

  return {
    declaredCustomProperties: sortedUnique(declared),
    usedCustomProperties: sortedUnique(used),
    unresolvedWithoutFallback: sortedUnique(unresolved),
    fallbackBackedUses: sortedUnique(Array.from(fallbackBacked).filter((name) => !unresolved.has(name))),
    modeSelectors: sortedUnique(modeSelectors),
  };
}

const SCRIPT_CUSTOM_PROPERTY_KEY = /["'](--[A-Za-z0-9_-]+)["']\s*:/g;

/**
 * Custom properties a TS/TSX source assigns itself (an object key such as
 * `"--slider-fill-percent": …` in an inline `style`). Reported beside the CSS
 * surface so a later verifier can tell "supplied at runtime" from "missing"; the
 * CSS analysis itself never subtracts them.
 */
export function readScriptSuppliedCustomProperties(sources: readonly string[]): string[] {
  const names = new Set<string>();
  for (const source of sources) {
    for (const match of Array.from(source.matchAll(SCRIPT_CUSTOM_PROPERTY_KEY))) names.add(match[1]);
  }
  return sortedUnique(names);
}
