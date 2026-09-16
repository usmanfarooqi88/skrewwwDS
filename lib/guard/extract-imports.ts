import * as ts from "typescript";
import type { ImportFact, ImportKind } from "@/lib/guard/types";
import type { ParsedSource } from "@/lib/guard/parse-source";

/**
 * Structural import extraction — see docs/architecture/
 * guard-readiness-audit.md's G-0 brief, Part 5: "Do not assume any
 * identifier named `Button` is Skrewww." This module records *what a
 * file imports and under what local name*, nothing more — it never
 * decides whether a module specifier is a real Skrewww path (that's
 * provenance.ts's job) and never looks at how an imported name is
 * subsequently used.
 *
 * One `ImportFact` per imported *binding*, not per declaration —
 * `import { Button, Card } from "..."` produces two facts, and
 * `import Default, { Named } from "..."` (a combined default + named
 * import) produces two facts from the same declaration, matching real
 * TypeScript AST shape (`ImportClause.name` and `.namedBindings` can
 * both be present simultaneously).
 */

function extractFromNamedImports(
  namedImports: ts.NamedImports,
  moduleSpecifier: string,
  toRange: ParsedSource["toRange"],
): ImportFact[] {
  return namedImports.elements.map((specifier) => {
    const localName = specifier.name.text;
    const isAliased = specifier.propertyName !== undefined;
    const importedName = isAliased ? specifier.propertyName!.text : localName;
    const kind: ImportKind = isAliased ? "named-aliased" : "named";
    return {
      localName,
      importedName,
      moduleSpecifier,
      kind,
      range: toRange(specifier.getStart(), specifier.getEnd()),
    };
  });
}

export function extractImports(parsed: ParsedSource): ImportFact[] {
  const { sourceFile, toRange } = parsed;
  const facts: ImportFact[] = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue; // dynamic/computed specifier — not a statically knowable import, skip rather than guess

    const moduleSpecifier = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (!clause) continue; // `import "./side-effect-only"` — no binding to extract

    if (clause.name) {
      facts.push({
        localName: clause.name.text,
        importedName: "default",
        moduleSpecifier,
        kind: "default",
        range: toRange(clause.name.getStart(), clause.name.getEnd()),
      });
    }

    if (clause.namedBindings) {
      if (ts.isNamedImports(clause.namedBindings)) {
        facts.push(...extractFromNamedImports(clause.namedBindings, moduleSpecifier, toRange));
      } else if (ts.isNamespaceImport(clause.namedBindings)) {
        facts.push({
          localName: clause.namedBindings.name.text,
          importedName: "*",
          moduleSpecifier,
          kind: "namespace",
          range: toRange(clause.namedBindings.getStart(), clause.namedBindings.getEnd()),
        });
      }
    }
  }

  return facts;
}
