import { extractCssVarRefs } from "@/lib/css-custom-properties";
import type { AliasHop, ParityLabel, RuntimeDeclaration, TokenResolution } from "@/lib/audit/repo-facts-types";

/**
 * Shallow, deterministic CSS evidence readers for the Audit Agent repo-facts
 * collector. These are NOT a CSS engine: no cascade, no computed values, no
 * `calc()`. They read custom-property references and declarations, attach the
 * `[VERIFIED]`-style parity comments `styles/tokens.css` uses, and follow exact
 * `var(--x)` aliases.
 */

const LABEL_PATTERN = /\[(VERIFIED|TEMPORARY|EXPERIMENTAL|ALIASED|UNRESOLVED)\]/;
const SECTION_HEADER_PATTERN = /──/;

/** Every distinct `var(--name)` reference in a CSS text (shared helper — one scanner, not two). */
export function readCssVarReferences(css: string): string[] {
  return extractCssVarRefs(css).sort();
}

export type CssCustomPropertyDeclaration = Omit<RuntimeDeclaration, "file"> & { name: string };

type PendingComment = { text: string; endLine: number };

function labelFrom(text: string): ParityLabel | undefined {
  return LABEL_PATTERN.exec(text)?.[1] as ParityLabel | undefined;
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function exactAliasTarget(value: string): string | undefined {
  return /^var\(\s*(--[A-Za-z0-9-]+)\s*(?:,[^)]*)?\)$/.exec(value.trim())?.[1];
}

/**
 * Reads every custom-property declaration (`--name: value;`) at any nesting
 * depth, with its selector context and any parity label.
 *
 * Label precedence: a comment on the same line after the declaration
 * (`inline`) → a comment ending on the line directly above it
 * (`preceding-comment`) → the most recent `── … [LABEL] ──` section header
 * (`section`). A section header without a label clears the section label.
 */
export function readCssCustomPropertyDeclarations(css: string): CssCustomPropertyDeclaration[] {
  const declarations: CssCustomPropertyDeclaration[] = [];
  const contextStack: string[] = [];
  let header = "";
  let pending: PendingComment | undefined;
  let sectionLabel: ParityLabel | undefined;
  let line = 1;
  let i = 0;
  const n = css.length;

  const currentContext = () => contextStack.join(" ").trim() || "(top level)";

  while (i < n) {
    const ch = css[i];
    if (ch === "\n") {
      line += 1;
      i += 1;
      continue;
    }
    if (ch === " " || ch === "\t" || ch === "\r") {
      i += 1;
      continue;
    }
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      const text = css.slice(i + 2, end === -1 ? n : end).trim();
      const endLine = line + (css.slice(i, stop).match(/\n/g) ?? []).length;
      if (SECTION_HEADER_PATTERN.test(text)) {
        sectionLabel = labelFrom(text);
        pending = undefined;
      } else {
        pending = { text, endLine };
      }
      line = endLine;
      i = stop;
      continue;
    }
    if (ch === "{") {
      contextStack.push(normalizeSpaces(header));
      header = "";
      i += 1;
      continue;
    }
    if (ch === "}") {
      contextStack.pop();
      header = "";
      i += 1;
      continue;
    }
    if (ch === ";") {
      header = "";
      i += 1;
      continue;
    }
    // Read a statement up to ';' or '}' or '{' (selector / at-rule header).
    let j = i;
    while (j < n && css[j] !== ";" && css[j] !== "{" && css[j] !== "}") {
      if (css[j] === "/" && css[j + 1] === "*") {
        const end = css.indexOf("*/", j + 2);
        j = end === -1 ? n : end + 2;
        continue;
      }
      j += 1;
    }
    const statement = css.slice(i, j);
    const statementLines = (statement.match(/\n/g) ?? []).length;
    const stopsAt = css[j];
    if (stopsAt === "{") {
      header += (header ? " " : "") + statement.replace(/\/\*[\s\S]*?\*\//g, "");
      line += statementLines;
      i = j;
      continue;
    }
    const cleaned = statement.replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const declarationMatch = /^(--[A-Za-z0-9-]+)\s*:\s*([\s\S]*)$/.exec(cleaned);
    if (declarationMatch) {
      // Line of the declaration = line where the name starts.
      const leading = statement.length - statement.trimStart().length;
      const declLine = line + (statement.slice(0, leading).match(/\n/g) ?? []).length;
      const value = normalizeSpaces(declarationMatch[2]);
      let label: ParityLabel | undefined;
      let labelSource: RuntimeDeclaration["labelSource"];
      let comment: string | undefined;

      const restOfLine = css.slice(j + (stopsAt === ";" ? 1 : 0)).split("\n", 1)[0];
      const inlineComment = /^\s*\/\*([\s\S]*?)\*\//.exec(restOfLine)?.[1]?.trim();
      const inlineLabel = inlineComment ? labelFrom(inlineComment) : undefined;
      if (inlineLabel) {
        label = inlineLabel;
        labelSource = "inline";
        comment = inlineComment;
      } else if (pending && pending.endLine >= declLine - 1 && labelFrom(pending.text)) {
        label = labelFrom(pending.text);
        labelSource = "preceding-comment";
        comment = normalizeSpaces(pending.text);
      } else if (sectionLabel) {
        label = sectionLabel;
        labelSource = "section";
      }

      const declaration: CssCustomPropertyDeclaration = {
        name: declarationMatch[1],
        line: declLine,
        context: currentContext(),
        value,
      };
      const alias = exactAliasTarget(value);
      if (alias) declaration.aliasTarget = alias;
      if (label) {
        declaration.parityLabel = label;
        declaration.labelSource = labelSource;
        if (comment) declaration.comment = comment;
      }
      declarations.push(declaration);
      pending = undefined;
    }
    line += statementLines;
    i = j + (stopsAt === ";" ? 1 : 0);
  }
  return declarations;
}

const ALIAS_DEPTH_LIMIT = 8;

/**
 * Resolves one observed custom property against the token declarations (and any
 * component-local declarations). Shallow by design — see module doc.
 */
export function resolveToken(
  name: string,
  tokenDeclarations: Map<string, RuntimeDeclaration[]>,
  localDeclarations: Map<string, RuntimeDeclaration[]>,
): TokenResolution {
  const declared = tokenDeclarations.get(name) ?? [];
  const local = localDeclarations.get(name) ?? [];
  const declarations = [...declared, ...local];
  const resolution: TokenResolution["resolution"] = declared.length > 0 ? "declared" : local.length > 0 ? "declared-locally" : "unresolved";

  const aliasChain: AliasHop[] = [];
  let chainEnd: TokenResolution["chainEnd"] = declarations.length === 0 ? "none" : "literal";
  const seen = new Set<string>();
  let current = name;
  for (let depth = 0; depth < ALIAS_DEPTH_LIMIT; depth += 1) {
    const candidates = [...(tokenDeclarations.get(current) ?? []), ...(localDeclarations.get(current) ?? [])];
    if (candidates.length === 0) {
      chainEnd = depth === 0 ? "none" : "unresolved";
      break;
    }
    const chosen = candidates.find((candidate) => candidate.context === ":root") ?? candidates[0];
    aliasChain.push({ name: current, value: chosen.value });
    seen.add(current);
    if (!chosen.aliasTarget) {
      chainEnd = "literal";
      break;
    }
    if (seen.has(chosen.aliasTarget)) {
      chainEnd = "cycle";
      break;
    }
    current = chosen.aliasTarget;
    if (depth === ALIAS_DEPTH_LIMIT - 1) chainEnd = "depth-limit";
  }
  return { name, resolution, declarations, aliasChain, chainEnd };
}
