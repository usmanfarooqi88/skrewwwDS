/**
 * Writes the shadcn-compatible distribution manifests to public/r/, served
 * by Next.js as static files at /r/foundation.json, /r/button.json,
 * /r/card.json, /r/text-input.json, /r/form-field.json, and
 * /r/validation-message.json.
 *
 * All actual generation logic (extraction, canonical-to-shadcn mapping,
 * file classification) lives in lib/shadcn-registry-generator.ts as pure,
 * independently-tested functions — this script only does the filesystem
 * write. Run via `npm run generate:registry`, and as part of `npm run
 * build` (see package.json) so `public/r/*.json` exists before `next
 * build`/`next start` serve it. Output is gitignored — see
 * docs/architecture/shadcn-distribution.md for why it is generated, not
 * committed.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildButtonManifest,
  buildCardManifest,
  buildFormFieldManifest,
  buildFoundationManifest,
  buildTextInputManifest,
  buildValidationMessageManifest,
} from "../lib/shadcn-registry-generator";

const OUT_DIR = join(process.cwd(), "public", "r");

mkdirSync(OUT_DIR, { recursive: true });

const foundationManifest = buildFoundationManifest();
const buttonManifest = buildButtonManifest();
const cardManifest = buildCardManifest();
const textInputManifest = buildTextInputManifest();
const formFieldManifest = buildFormFieldManifest();
const validationMessageManifest = buildValidationMessageManifest();

writeFileSync(join(OUT_DIR, "foundation.json"), `${JSON.stringify(foundationManifest, null, 2)}\n`);
writeFileSync(join(OUT_DIR, "button.json"), `${JSON.stringify(buttonManifest, null, 2)}\n`);
writeFileSync(join(OUT_DIR, "card.json"), `${JSON.stringify(cardManifest, null, 2)}\n`);
writeFileSync(join(OUT_DIR, "text-input.json"), `${JSON.stringify(textInputManifest, null, 2)}\n`);
writeFileSync(join(OUT_DIR, "form-field.json"), `${JSON.stringify(formFieldManifest, null, 2)}\n`);
writeFileSync(join(OUT_DIR, "validation-message.json"), `${JSON.stringify(validationMessageManifest, null, 2)}\n`);

console.log("Generated shadcn registry manifests:");
console.log(" -", join(OUT_DIR, "foundation.json"));
console.log(" -", join(OUT_DIR, "button.json"));
console.log(" -", join(OUT_DIR, "card.json"));
console.log(" -", join(OUT_DIR, "text-input.json"));
console.log(" -", join(OUT_DIR, "form-field.json"));
console.log(" -", join(OUT_DIR, "validation-message.json"));
