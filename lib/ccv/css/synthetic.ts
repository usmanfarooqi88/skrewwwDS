import type { ExpectedCss } from "@/lib/ccv/css/static-delivery";

/**
 * Test support (CCV-4): deterministic CSS + script text whose analysed surface
 * equals a given contract surface. Lets verifier tests build a fake "installed"
 * stylesheet from the CCV-1 contract instead of reading ignored build output.
 */
export function syntheticCssFor(surface: ExpectedCss): { css: string; script: string } {
  const declared = surface.declaredCustomProperties;
  const fallback = new Set(surface.fallbackBackedUses);
  const lines = [`:root {`, ...declared.map((name) => `  ${name}: 1px;`), `}`];
  const anchor = declared[0];
  for (const selector of surface.modeSelectors) lines.push(`${selector} {`, anchor ? `  ${anchor}: 2px;` : "  color: inherit;", `}`);
  // Uses sit in a regular property so the declared set stays exactly the contract's.
  lines.push(`.ccv-synthetic {`, ...surface.usedCustomProperties.map((name) => `  margin: ${fallback.has(name) ? `var(${name}, 0px)` : `var(${name})`};`), `}`);
  const css = `${lines.join("\n")}\n`;
  const script = surface.scriptSuppliedCustomProperties.map((name) => `const s = { "${name}": "1px" };`).join("\n");
  return { css, script };
}
