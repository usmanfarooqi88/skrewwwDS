/**
 * CCV-4 — Foundation stylesheet wiring in a consumer: present, imported exactly
 * once, and before the consumer's own CSS. Static (source of the consumer entry);
 * runtime activation is checked separately in the browser.
 */

const CSS_IMPORT = /^\s*import\s+["']([^"']+\.css)["'];?\s*$/gm;

export type StylesheetOrder = { imports: string[]; count: number; index: number; first: boolean };

/** Where `specifier` sits among the CSS imports of an entry module. */
export function stylesheetOrder(source: string, specifier: string): StylesheetOrder {
  const imports = Array.from(source.matchAll(CSS_IMPORT), (match) => match[1]);
  const count = imports.filter((entry) => entry === specifier).length;
  const index = imports.indexOf(specifier);
  return { imports, count, index, first: index === 0 };
}

/** Inserts the Foundation import immediately before the consumer's `./globals.css` import (the documented setup). */
export function wireFoundationImport(layoutSource: string, foundationInstallPath: string): string {
  const globals = /import\s+["']\.\/globals\.css["'];/;
  if (!globals.test(layoutSource)) throw new Error("the consumer layout has no `import \"./globals.css\";` to wire Foundation ahead of");
  return layoutSource.replace(globals, (match) => `import "@/${foundationInstallPath}";\n${match}`);
}
