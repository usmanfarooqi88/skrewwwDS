import { componentRegistry } from "@/lib/component-registry";
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
 * Given an `ImportFact` already classified as internal-ui provenance,
 * resolves it to a real canonical registry slug — or `undefined` if the
 * name doesn't match any real component's owned file. This is what
 * makes provenance a genuine safety mechanism rather than a name-based
 * heuristic in disguise: `components/ui/Button.tsx` must actually appear
 * in some real entry's `files` array, not merely "look like" a
 * component file path.
 *
 * For the barrel case, the imported name (not the local alias) is what
 * must match a real file — `import { Button as Action } from
 * "@/components/ui"` still resolves against "Button.tsx", since that's
 * what the barrel actually re-exports under that name.
 */
export function resolveInternalComponentSlug(fact: ImportFact): string | undefined {
  const provenance = classifyInternalImportProvenance(fact.moduleSpecifier);

  const candidateFileBaseName =
    provenance.kind === "internal-ui-direct"
      ? provenance.fileBaseName
      : provenance.kind === "internal-ui-barrel"
        ? fact.importedName
        : undefined;

  if (!candidateFileBaseName || candidateFileBaseName === "*" || candidateFileBaseName === "default") {
    return undefined;
  }

  const candidatePath = `components/ui/${candidateFileBaseName}.tsx`;
  const entry = componentRegistry.find((candidate) => candidate.files?.includes(candidatePath));
  return entry?.slug;
}
