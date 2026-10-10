/**
 * Common representative runtime scenario shared by every distribution (CCV-4).
 * Scenario INPUT, not inventory: the representative control is the same control the
 * package smoke already uses for Shape and Surface (its accessible name "Action").
 */

export const REPRESENTATIVE_CONTROL = { item: "button", exportName: "Button", label: "Action" } as const;

/** A minimal page rendering only the representative control (so the first Tab stop is the control). */
export function commonScenarioPage(importSpecifier: string): string {
  return [
    `import { ${REPRESENTATIVE_CONTROL.exportName} } from "${importSpecifier}";`,
    "",
    "export default function CcvCommonRuntime() {",
    "  return (",
    "    <main>",
    `      <${REPRESENTATIVE_CONTROL.exportName}>${REPRESENTATIVE_CONTROL.label}</${REPRESENTATIVE_CONTROL.exportName}>`,
    "    </main>",
    "  );",
    "}",
    "",
  ].join("\n");
}
