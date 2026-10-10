import { readCssCustomPropertyDeclarations } from "@/lib/audit/repo-css";
import { compareCodeUnits } from "@/lib/ccv/serialize";

/**
 * CCV-4 — deterministic custom-property alias chains in delivered CSS. Not a
 * cascade engine: it follows EXACT aliases (`--a: var(--b)` or `--a: var(--b, x)`)
 * from each declaration, looking the target up first in the SAME selector context
 * and then in `:root`, so a mode block (`[data-skrewww-shape="pill"]`) resolves
 * against its own overrides before the defaults. Every chain must reach a
 * literal or composite value; an absent target falls through to its fallback (itself
 * followed when it is an alias); an unresolved target with no fallback, a cycle
 * or a chain longer than the depth limit is reported.
 */

export type AliasChain = { name: string; context: string; chain: string[]; terminal: string };
export type AliasProblem = { name: string; context: string; kind: "unresolved-target" | "cycle" | "depth-limit"; chain: string[] };
export type AliasReport = { declarations: number; aliases: number; chains: AliasChain[]; problems: AliasProblem[] };

const ALIAS = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(,\s*([\s\S]*))?\)$/;
const DEPTH_LIMIT = 16;

type Decl = { name: string; context: string; value: string };

export function resolveAliasChains(cssTexts: readonly string[]): AliasReport {
  const declarations: Decl[] = cssTexts.flatMap((css) => readCssCustomPropertyDeclarations(css).map((d) => ({ name: d.name, context: d.context, value: d.value.trim() })));
  const byName = new Map<string, Decl[]>();
  for (const decl of declarations) byName.set(decl.name, [...(byName.get(decl.name) ?? []), decl]);
  const lookup = (name: string, context: string): Decl | undefined => {
    const candidates = byName.get(name) ?? [];
    return candidates.find((d) => d.context === context) ?? candidates.find((d) => d.context === ":root") ?? candidates.find((d) => d.context.endsWith(":root"));
  };
  const chains: AliasChain[] = [];
  const problems: AliasProblem[] = [];
  let aliases = 0;
  for (const decl of declarations) {
    if (!ALIAS.test(decl.value)) continue;
    aliases += 1;
    const chain = [decl.name];
    const seen = new Set([decl.name]);
    let current = decl;
    for (;;) {
      const match = ALIAS.exec(current.value);
      if (!match) {
        chains.push({ name: decl.name, context: decl.context, chain, terminal: current.value });
        break;
      }
      const [, target, hasFallback, fallback] = match;
      if (seen.has(target)) {
        problems.push({ name: decl.name, context: decl.context, kind: "cycle", chain: [...chain, target] });
        break;
      }
      const next = lookup(target, decl.context);
      if (!next) {
        if (!hasFallback) {
          problems.push({ name: decl.name, context: decl.context, kind: "unresolved-target", chain: [...chain, target] });
          break;
        }
        // Lazy like CSS: an absent target falls through to its fallback, which may itself be an alias.
        chain.push(`${target}?`);
        current = { name: target, context: decl.context, value: (fallback ?? "").trim() };
        if (!ALIAS.test(current.value)) {
          chains.push({ name: decl.name, context: decl.context, chain, terminal: `fallback ${current.value}` });
          break;
        }
        continue;
      }
      chain.push(target);
      seen.add(target);
      if (chain.length > DEPTH_LIMIT) {
        problems.push({ name: decl.name, context: decl.context, kind: "depth-limit", chain });
        break;
      }
      current = next;
    }
  }
  const order = (a: { name: string; context: string }, b: { name: string; context: string }) => compareCodeUnits(a.name, b.name) || compareCodeUnits(a.context, b.context);
  return { declarations: declarations.length, aliases, chains: chains.sort(order), problems: problems.sort(order) };
}

/** Names declared in a `:root` context (inherited by every element) — what the runtime "Foundation active" check reads. */
export function rootDeclaredCustomProperties(cssTexts: readonly string[]): string[] {
  const names = new Set<string>();
  for (const css of cssTexts) for (const decl of readCssCustomPropertyDeclarations(css)) if (decl.context === ":root") names.add(decl.name);
  return Array.from(names).sort(compareCodeUnits);
}
