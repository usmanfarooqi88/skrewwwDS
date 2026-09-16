import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as ts from "typescript";
import { componentRegistry } from "@/lib/component-registry";
import { parseSource } from "@/lib/guard/parse-source";
import { extractImports } from "@/lib/guard/extract-imports";
import type { ImportFact } from "@/lib/guard/types";

/**
 * Skrewww import provenance (G-0 brief Part 6). This is the single
 * mechanism that keeps a future rule from ever flagging a user's own
 * component (`RequestForm`, `ReferencePageHeader`, an "Advanced Filters"
 * composition) as an invented Skrewww component — see
 * docs/architecture/guard-readiness-audit.md §9: "a component/prop check
 * may only ever fire on an element whose import resolves to a known
 * Skrewww source path... never on name similarity alone." Nothing in
 * this module ever inspects an identifier's *name* to decide provenance
 * — only its *import source*.
 *
 * Real supported import patterns audited directly against this
 * repository's own source (Part 6 — "use real distribution/install
 * instructions/docs, do not guess"):
 *   - `import { Button } from "@/components/ui/Button"` — direct file
 *     import, confirmed via `components/reference-app/RequestsDataView
 *     .tsx` (this repo's own real usage).
 *   - `import { Button } from "@/components/ui"` — the barrel,
 *     confirmed via `components/ui/index.ts`'s own real
 *     `export { Button } from "@/components/ui/Button";` re-export.
 *   - `@/*` resolves to the repo root (`./*`) per this repo's own
 *     `tsconfig.json` `paths` — a fixed, known alias, safe to hardcode
 *     for INTERNAL (in-repo) analysis only.
 *
 * Explicit, honest limitation for EXTERNAL/consumer analysis: a
 * consumer project's own alias root is configurable via their own
 * `components.json` (`docs/architecture/shadcn-distribution.md`'s own
 * documented default aliases use `@/components/ui` too, but this is a
 * *convention*, not a guarantee — a consumer may have picked a different
 * alias at `shadcn init` time). `KNOWN_INTERNAL_UI_PATH_PREFIXES` below
 * is therefore explicitly scoped to internal (this-repository) analysis;
 * external/consumer provenance matching needs its own, caller-supplied
 * prefix list — never assumed to be the same one. This is recorded here
 * as a real G-1/G-2 concern, not solved by guessing a universal prefix.
 */

const KNOWN_INTERNAL_UI_BARREL = "@/components/ui";
const KNOWN_INTERNAL_UI_DIRECT_PREFIX = "@/components/ui/";

export type ImportProvenance =
  | { kind: "internal-ui-barrel" }
  | { kind: "internal-ui-direct"; fileBaseName: string }
  | { kind: "unknown" };

/**
 * Classifies one import's *module specifier* only — never its local
 * name. Both `import { Button } from "@/components/ui"` and
 * `import { Button as Action } from "@/components/ui"` classify
 * identically (barrel), regardless of aliasing, since aliasing never
 * changes where the binding actually comes from.
 */
export function classifyInternalImportProvenance(moduleSpecifier: string): ImportProvenance {
  if (moduleSpecifier === KNOWN_INTERNAL_UI_BARREL) {
    return { kind: "internal-ui-barrel" };
  }
  if (moduleSpecifier.startsWith(KNOWN_INTERNAL_UI_DIRECT_PREFIX)) {
    const fileBaseName = moduleSpecifier.slice(KNOWN_INTERNAL_UI_DIRECT_PREFIX.length);
    // Reject anything with a further path segment (e.g. a hypothetical
    // "@/components/ui/internal/TreeItem") — a bare file name only, so
    // this never accidentally matches an internal-helper subdirectory as
    // if it were a public component file.
    if (fileBaseName.length > 0 && !fileBaseName.includes("/")) {
      return { kind: "internal-ui-direct", fileBaseName };
    }
  }
  return { kind: "unknown" };
}

/**
 * Maps a component's own file base name (e.g. "BankingAccountCard") to
 * its real canonical slug — for EVERY implemented component, not only
 * distributed ones. `entry.files` alone is insufficient here: it is the
 * shadcn-distribution file list, populated only for the 52 distributed
 * components, absent entirely for implemented-but-deliberately-
 * undistributed ones (the banking trio, Class B — see
 * `docs/distribution-expansion.md` Part 10). A first version of this
 * resolver used `entry.files` exclusively and was proven wrong by
 * running it against every real `.tsx` file in this repo: it falsely
 * reported `BankingAccountCard`/`BankingBalanceSummary`/
 * `BankingTransactionRow` as nonexistent, when they are real,
 * implemented, canonically-registered components — exactly the
 * "implemented ≠ distributed" collapse
 * docs/architecture/guard-readiness-audit.md §4 warns a Guard must never
 * make.
 *
 * Fixed by reading `entry.reactExample` — a real, non-optional field on
 * every implemented entry, containing a real code sample that always
 * imports the component's own file — with G-0's own parser (not string
 * matching), then cross-referencing the resulting imports against
 * `entry.name` (stripped of spaces) to pick the entry's OWN import, not
 * merely the first `@/components/ui/*` import the example happens to
 * use (a composed example like Split Button's imports Button and Menu
 * before its own SplitButton import). This is not a name-based
 * heuristic applied to an arbitrary JSX tag being checked — it is a
 * one-time, registry-wide computation cross-referencing two real,
 * already-canonical fields (`reactExample`, `name`) against each other,
 * used only to build this lookup table.
 *
 * **`entry.files` is checked FIRST and is the primary, most precise
 * signal** — it directly and completely names every distributed
 * component's own file(s), needing no parsing or cross-referencing at
 * all, and correctly handles cases where the file name doesn't match
 * the display name at all (`data-table`'s own file is
 * `DataTableSortHeader.tsx` — "Data Table" has no dedicated top-level
 * component, per `docs/distribution-expansion.md`'s CE-3L record — a
 * name-based guess would never find this, but `files` names it
 * directly). The `reactExample` cross-reference is a **fallback only**,
 * for the small set of implemented-but-undistributed entries (the
 * banking trio) that have no `files` to check. A prior version of this
 * function used the `reactExample` path as the *only* signal and was
 * proven wrong by running it against every real `.tsx` file in this
 * repo: it false-flagged `FormField` (whose own `reactExample`
 * demonstrates `TextInput` instead of importing itself directly) and
 * `DataTableSortHeader` (whose display name doesn't match its file name
 * at all) as nonexistent, despite both being real, correctly-listed
 * `entry.files` entries.
 *
 * A component's own `reactExample`, when used as the fallback, may
 * import itself either directly (`from "@/components/ui/BarChart"`) or
 * via the barrel (`from "@/components/ui"`) — both real, both seen in
 * this repo's own authored examples (Bar Chart/Line Chart use the
 * barrel form) — so both are checked.
 */
let fileBaseNameToSlugCache: Map<string, string> | undefined;

function fileBaseNameToSlug(): Map<string, string> {
  if (fileBaseNameToSlugCache) return fileBaseNameToSlugCache;

  const map = new Map<string, string>();
  for (const entry of componentRegistry) {
    if (!entry.hasImplementation) continue;

    // Primary: entry.files, exact and complete for every distributed
    // component, regardless of whether the file name matches the
    // display name.
    const ownFiles = (entry.files ?? []).filter(
      (relPath) => relPath.startsWith("components/ui/") && relPath.endsWith(".tsx") && !relPath.includes("/internal/"),
    );
    if (ownFiles.length > 0) {
      for (const relPath of ownFiles) {
        const fileBaseName = relPath.slice("components/ui/".length, -".tsx".length);
        map.set(fileBaseName, entry.slug);
      }
      continue;
    }

    // Fallback: implemented but undistributed (no `files`) — cross-
    // reference the entry's own reactExample against its display name.
    const expectedFileBaseName = entry.name.replace(/\s+/g, "");
    const expectedDirectSpecifier = `@/components/ui/${expectedFileBaseName}`;

    const parsed = parseSource(`${entry.slug}--react-example.tsx`, entry.reactExample);
    if (!parsed.ok) continue; // an unparseable example is a docs-content issue, not this resolver's concern
    const imports = extractImports(parsed);
    const ownImport = imports.find(
      (imp) =>
        imp.moduleSpecifier === expectedDirectSpecifier ||
        (imp.moduleSpecifier === KNOWN_INTERNAL_UI_BARREL && imp.importedName === expectedFileBaseName),
    );
    if (ownImport) {
      map.set(expectedFileBaseName, entry.slug);
    }
  }

  fileBaseNameToSlugCache = map;
  return map;
}

/**
 * Maps a name the barrel (`components/ui/index.ts`) re-exports to the
 * *file base name* it actually comes from — e.g. `"DrawerTrigger" ->
 * "Drawer"`, not `"DrawerTrigger" -> "DrawerTrigger"`. Needed because
 * compound components export many named symbols from one physical file
 * (`Drawer.tsx` exports `Drawer`, `DrawerTrigger`, `DrawerContent`,
 * `DrawerBody`, `DrawerClose`, `DrawerDescription`, `DrawerFooter`,
 * `DrawerHeader`, `DrawerTitle` — confirmed directly against this repo's
 * own `components/ui/index.ts`, whose real re-export statement is
 * `export { Drawer, DrawerBody, ..., DrawerTrigger } from
 * "@/components/ui/Drawer";`), all re-exported through the same barrel
 * `export { ... } from "@/components/ui/Drawer"` statement.
 *
 * A prior version of `resolveInternalComponentSlug` assumed a
 * barrel-imported name always equals some component's own file base
 * name — true for `import { Button } from "@/components/ui"`, false for
 * `import { DrawerTrigger } from "@/components/ui"` — and was proven
 * wrong by running it against this repo's own real
 * `components/reference-app/RequestsDataView.tsx`, which false-flagged
 * `DrawerTrigger` as an invented component. This resolver reads the
 * barrel file itself (the real, canonical source of truth for which
 * name comes from which file — not a guess) with G-0's own parser, so
 * every real compound sub-export resolves correctly and nothing not
 * actually re-exported by the barrel is ever assumed present.
 */
let barrelReexportToFileBaseNameCache: Map<string, string> | undefined;

function barrelReexportToFileBaseName(): Map<string, string> {
  if (barrelReexportToFileBaseNameCache) return barrelReexportToFileBaseNameCache;

  const map = new Map<string, string>();
  const barrelPath = join(process.cwd(), "components/ui/index.ts");
  if (existsSync(barrelPath)) {
    const content = readFileSync(barrelPath, "utf8");
    const parsed = parseSource("components/ui/index.ts", content);
    if (parsed.ok) {
      for (const statement of parsed.sourceFile.statements) {
        if (!ts.isExportDeclaration(statement)) continue;
        if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
        if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue;

        const moduleSpecifier = statement.moduleSpecifier.text;
        if (!moduleSpecifier.startsWith(KNOWN_INTERNAL_UI_DIRECT_PREFIX)) continue;
        const fileBaseName = moduleSpecifier.slice(KNOWN_INTERNAL_UI_DIRECT_PREFIX.length);
        if (fileBaseName.length === 0 || fileBaseName.includes("/")) continue;

        for (const specifier of statement.exportClause.elements) {
          if (specifier.isTypeOnly) continue; // a type export (e.g. `export type { DrawerBodyProps }`) is never a JSX-renderable component identity claim
          const exportedName = specifier.name.text;
          map.set(exportedName, fileBaseName);
        }
      }
    }
  }

  barrelReexportToFileBaseNameCache = map;
  return map;
}

/**
 * True when a candidate path (e.g. "components/ui/icons.tsx") is a real,
 * canonically-acknowledged internal helper — bundled as a private
 * dependency of one or more public components (`entry
 * .internalDependencies`) but never itself an independently public
 * component. Real example proven against this repo's own source:
 * `components/ui/icons.tsx` is a real file living directly under
 * `components/ui/` (not nested in an `internal/` subdirectory), listed
 * in Button's own `internalDependencies`, and directly imported by both
 * `Button.tsx` itself (`LoadingSpinner`) and `Button.test.tsx`
 * (`PlusIcon`) — real, legitimate usage that is NOT a claim that
 * "icons.tsx is a public Skrewww component," and must never be flagged
 * as one merely because it isn't independently registered.
 *
 * This is exactly Category C from docs/architecture/
 * guard-readiness-audit.md §4 ("internal helper... never independently
 * installable") — distinguished here from Category E (nonexistent),
 * which `fileBaseNameToSlug` alone would otherwise conflate: "not found
 * as a public component" does not mean "invented," when the file is a
 * real, acknowledged internal dependency.
 */
export function isKnownInternalHelperPath(candidatePath: string): boolean {
  return componentRegistry.some((entry) => entry.internalDependencies?.includes(candidatePath));
}

/**
 * Given an `ImportFact` already classified as internal-ui provenance,
 * resolves it to the real file base name it actually comes from — e.g.
 * `import { DrawerTrigger } from "@/components/ui"` resolves to
 * `"Drawer"`, not `"DrawerTrigger"`. Shared by both
 * `resolveInternalComponentSlug` (the slug-resolution path) and the
 * `component/nonexistent-slug` rule's internal-helper fallback check, so
 * a compound sub-export can never desync between the two — a name the
 * barrel doesn't re-export at all falls back to the raw imported name
 * unchanged, left for the caller's own "not found" handling.
 *
 * For the barrel case, the imported name (not the local alias) is what
 * is translated — `import { Button as Action } from "@/components/ui"`
 * still resolves against "Button.tsx", since that's what the barrel
 * actually re-exports under that name.
 */
export function resolveImportedFileBaseName(fact: ImportFact): string | undefined {
  const provenance = classifyInternalImportProvenance(fact.moduleSpecifier);

  if (provenance.kind === "internal-ui-direct") {
    return provenance.fileBaseName;
  }
  if (provenance.kind === "internal-ui-barrel") {
    return barrelReexportToFileBaseName().get(fact.importedName) ?? fact.importedName;
  }
  return undefined;
}

/**
 * Resolves an `ImportFact` already classified as internal-ui provenance
 * to a real canonical registry slug — or `undefined` if the name doesn't
 * match any real, implemented component. This is what makes provenance a
 * genuine safety mechanism rather than a name-based heuristic in
 * disguise: the candidate file name must actually be proven to be some
 * real entry's own component file (via `fileBaseNameToSlug` above), not
 * merely "look like" one.
 */
export function resolveInternalComponentSlug(fact: ImportFact): string | undefined {
  const candidateFileBaseName = resolveImportedFileBaseName(fact);

  if (!candidateFileBaseName || candidateFileBaseName === "*" || candidateFileBaseName === "default") {
    return undefined;
  }

  return fileBaseNameToSlug().get(candidateFileBaseName);
}
