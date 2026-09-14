/**
 * Writes the shadcn-compatible distribution manifests to public/r/.
 *
 * All actual generation logic lives in lib/shadcn-registry-generator.ts.
 * Run via `npm run generate:registry` (also part of `npm run build`).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildButtonManifest,
  buildCardManifest,
  buildCheckboxManifest,
  buildDividerManifest,
  buildFormFieldManifest,
  buildFoundationManifest,
  buildLinkManifest,
  buildProgressBarManifest,
  buildRadioManifest,
  buildSkeletonManifest,
  buildSpinnerManifest,
  buildSwitchManifest,
  buildTextInputManifest,
  buildValidationMessageManifest,
} from "../lib/shadcn-registry-generator";

const OUT_DIR = join(process.cwd(), "public", "r");

mkdirSync(OUT_DIR, { recursive: true });

const manifests = [
  ["foundation.json", buildFoundationManifest()],
  ["button.json", buildButtonManifest()],
  ["card.json", buildCardManifest()],
  ["text-input.json", buildTextInputManifest()],
  ["form-field.json", buildFormFieldManifest()],
  ["validation-message.json", buildValidationMessageManifest()],
  ["spinner.json", buildSpinnerManifest()],
  ["divider.json", buildDividerManifest()],
  ["link.json", buildLinkManifest()],
  ["checkbox.json", buildCheckboxManifest()],
  ["progress-bar.json", buildProgressBarManifest()],
  ["skeleton.json", buildSkeletonManifest()],
  ["radio.json", buildRadioManifest()],
  ["switch.json", buildSwitchManifest()],
] as const;

console.log("Generated shadcn registry manifests:");
for (const [filename, manifest] of manifests) {
  const path = join(OUT_DIR, filename);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(" -", path);
}
