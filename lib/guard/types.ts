/**
 * G-0 foundation types: PARSE → EXTRACT FACTS only.
 *
 * These types describe *what a source file structurally contains*
 * (imports, JSX elements, JSX attributes) — never a rule verdict, a
 * severity, or a diagnostic. No field here encodes "this is wrong."
 * See docs/architecture/guard-readiness-audit.md §36 (locked
 * implementation brief) for why this boundary is load-bearing: rule
 * evaluation (G-1) must be built against these facts without ever needing
 * to re-parse source, and extraction must stay provably rule-agnostic so
 * its own correctness can be tested independently of any rule.
 */

/** A caller-provided source file to analyze. Extraction never touches the filesystem itself — matches the same pure-input discipline as `ProjectFile` in lib/agent-kit/project-context-schema.ts. */
export type GuardSourceInput = {
  /** Repo-relative or logical path — never a machine-specific absolute path (see docs/architecture/guard-readiness-audit.md §22 / this doc's Part 22). */
  path: string;
  content: string;
};

/** A 0-based line/column position, matching TypeScript's own convention. */
export type GuardPosition = {
  line: number;
  column: number;
};

export type GuardSourceRange = {
  start: GuardPosition;
  end: GuardPosition;
};

export type ImportKind = "named" | "named-aliased" | "default" | "namespace";

/**
 * One imported binding from one import declaration. Deliberately one
 * fact per *binding*, not per *declaration* — `import { Button, Card }
 * from "..."` produces two `ImportFact`s, each independently resolvable,
 * since a later JSX-tag lookup only ever needs to resolve a single local
 * identifier.
 */
export type ImportFact = {
  /** The identifier actually used at JSX call sites in this file — always present, whether or not this import is aliased. */
  localName: string;
  /**
   * The name as exported by the source module. For a default import this
   * is always the literal string "default" (there is no real exported
   * name to preserve). For a namespace import (`import * as NS`) this is
   * "*" — the whole module, not one named export.
   */
  importedName: string;
  moduleSpecifier: string;
  kind: ImportKind;
  range: GuardSourceRange;
};

export type JsxAttributeValueKind = "boolean-shorthand" | "static-string" | "dynamic" | "spread";

/**
 * One JSX attribute. `spread` entries carry no `name` — a spread
 * attribute's contents are never knowable at this layer (see Part 10 of
 * the G-0 brief: "Do NOT expand spreads"). Guard rule logic (G-1) must
 * treat every element with one or more spread attributes as having an
 * unknown-but-possibly-nonempty prop set beyond whatever literal
 * attributes are also listed alongside it.
 */
export type JsxAttributeFact =
  | {
      valueKind: "boolean-shorthand";
      name: string;
      range: GuardSourceRange;
    }
  | {
      valueKind: "static-string";
      name: string;
      /**
       * The literal string value, decoded (quotes stripped, escapes
       * resolved). Captured for a possible future value-validation rule
       * (explicitly DEFERRED, never built in v0.1 —
       * docs/architecture/guard-readiness-audit.md §10) rather than
       * re-parsing later. No locked v0.1 rule reads this field — every
       * one only checks attribute *names*. This is an in-process
       * intermediate fact, never itself a diagnostic or CLI output; the
       * "never echo matched source text" safe default
       * (guard-readiness-audit.md §31) applies to a future *diagnostic*
       * layer's formatting choices (G-2, not built here), not to what
       * this extraction layer is allowed to compute internally.
       */
      value: string;
      range: GuardSourceRange;
    }
  | {
      valueKind: "dynamic";
      name: string;
      /** The attribute name is still known even though its value is not — a future rule may still safely check "was `size` passed at all," just never "what value." */
      range: GuardSourceRange;
    }
  | {
      valueKind: "spread";
      range: GuardSourceRange;
    };

export type JsxTagResolution =
  | {
      /** The tag's local identifier resolved to a real `ImportFact` in this same file — the only case a future rule may treat as "this element is a Skrewww component," and only after the loader further confirms the import's module specifier is a known Skrewww path (see provenance.ts). Resolution here is purely structural (identifier → import binding); it does NOT itself assert Skrewww provenance. */
      kind: "imported";
      import: ImportFact;
    }
  | {
      /** A lowercase tag (`<div>`, `<button>`) — always a native HTML element, never resolved against imports. */
      kind: "intrinsic";
      tagName: string;
    }
  | {
      /**
       * A capitalized tag with no matching import in this file — most
       * commonly a locally-declared component (`function Button() {}`,
       * `const Button = () => ...`) sharing a name with a real Skrewww
       * component. MUST NOT be treated as a Skrewww component reference
       * merely because the name matches — this is the exact
       * false-positive class Part 12 exists to prevent.
       */
      kind: "local-or-unresolved";
      tagName: string;
    }
  | {
      /**
       * A member-expression tag (`<UI.Button />`). Represented but not
       * resolved to an import in G-0 — see Part 8: real Skrewww import
       * conventions audited in this codebase never produce this shape
       * (no namespace-import + dot-access usage found anywhere), so
       * building real resolution for it now would be speculative.
       */
      kind: "member-expression";
      text: string;
    };

export type JsxElementFact = {
  resolution: JsxTagResolution;
  attributes: JsxAttributeFact[];
  /** True iff `attributes` contains at least one `spread` entry — a convenience mirror of scanning `attributes` yourself, kept because "does this element have ANY unknown prop surface" is expected to be a very hot check in G-1's rule logic. */
  hasSpreadAttributes: boolean;
  range: GuardSourceRange;
};

export type GuardParseError = {
  kind: "parse-error";
  /** TypeScript's own diagnostic message text, verbatim — never reworded, so the underlying compiler's own precision is preserved. */
  message: string;
  range: GuardSourceRange;
};

/**
 * The full, rule-agnostic extraction result for one source file. `ok:
 * false` means the file could not be parsed at all — callers must check
 * this before trusting `imports`/`jsxElements`, which are absent in that
 * case. There is no partial-success shape: TypeScript's parser is
 * error-tolerant by design (it always returns *a* SourceFile, using
 * "missing node" placeholders for unparseable regions - see
 * docs/architecture/guard-readiness-audit.md's "no silent regex
 * fallback" instruction), and this module treats any file whose parse
 * diagnostics report a syntax error as parse-failed rather than
 * attempting to extract facts from a partially-recovered tree, which
 * would produce nondeterministic-feeling results (see Part 23).
 */
export type ExtractedSourceFacts =
  | {
      ok: true;
      path: string;
      imports: ImportFact[];
      jsxElements: JsxElementFact[];
    }
  | {
      ok: false;
      path: string;
      errors: GuardParseError[];
    };
