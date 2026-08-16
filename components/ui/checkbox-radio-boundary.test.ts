import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Source-contract guard for the Checkbox/Radio boundary width.
 *
 * Figma verifies the unselected Default/Hover boundary at 1.5px on both
 * controls. This is asserted against the stylesheet source rather than a
 * rendered browser value on purpose: headless Chromium floors a 1.5px
 * border to 1px in its used value (headed Chromium preserves it, so real
 * users do get 1.5px), which makes the rendered number unusable as a
 * cross-environment assertion. The companion Playwright spec
 * (e2e/checkbox-radio-boundary.spec.ts) covers everything about these
 * controls that IS environment-stable — outer geometry, box-sizing,
 * colours, and the checked/selected hover contract.
 *
 * Same file-reading approach as lib/gradient-foundation.test.ts.
 */

const read = (file: string) =>
  readFileSync(join(process.cwd(), "components/ui", file), "utf8");

const checkbox = read("checkbox.module.css");
const radio = read("radio.module.css");

describe("Checkbox boundary source contract", () => {
  it("declares the verified 1.5px semantic-border-default boundary", () => {
    expect(checkbox).toContain("border: 1.5px solid var(--semantic-border-default)");
    expect(checkbox).not.toContain("border: 1px solid var(--semantic-border-default)");
  });

  it("declares box-sizing explicitly rather than relying on Tailwind Preflight", () => {
    expect(checkbox).toContain("box-sizing: border-box");
  });

  it("scopes the border-strong hover away from checked and indeterminate", () => {
    expect(checkbox).toContain(
      ".input:hover:not(:disabled):not(:checked):not(:indeterminate)",
    );
  });

  it("keeps the action-primary selected treatment untouched", () => {
    expect(checkbox).toContain("border-color: var(--semantic-action-primary)");
    expect(checkbox).toContain("background: var(--semantic-action-primary)");
  });
});

describe("Radio boundary source contract", () => {
  it("declares the verified 1.5px semantic-border-default boundary", () => {
    expect(radio).toContain("border: 1.5px solid var(--semantic-border-default)");
    expect(radio).not.toContain("border: 1px solid var(--semantic-border-default)");
  });

  it("declares box-sizing explicitly rather than relying on Tailwind Preflight", () => {
    expect(radio).toContain("box-sizing: border-box");
  });

  it("scopes the border-strong hover away from the selected state", () => {
    expect(radio).toContain(".input:hover:not(:disabled):not(:checked)");
  });

  it("preserves the selected dot's explicit 5px ring — not migrated to 1.5px", () => {
    expect(radio).toContain("border-width: 5px");
  });
});
