/**
 * Pure, importable generator for the shadcn-compatible distribution layer
 * (`/r/foundation.json`, `/r/button.json`, `/r/card.json`,
 * `/r/text-input.json`, `/r/form-field.json`, `/r/validation-message.json`,
 * `/r/spinner.json`, `/r/divider.json`, `/r/link.json`).
 * Every function here is a pure transform of real repo files or the
 * canonical registry — importing this module performs no filesystem
 * writes. The file-writing CLI entry point lives in
 * scripts/generate-shadcn-registry.ts, which imports the build* functions
 * below and is the only place `public/r/*.json` gets written.
 *
 * This generator is a second, independent distribution channel alongside
 * the still-unimplemented `@skrewww/core` + `npx skrewww` roadmap in
 * skrewww-claude-project-instructions.md — see
 * docs/architecture/shadcn-distribution.md for how the two relate.
 *
 * Scope (see docs/architecture/shadcn-distribution.md): Foundation +
 * Button + Card + Text Input + Form Field + Validation Message + Spinner +
 * Divider + Link. Adding another component means adding its file(s) to
 * FILE_DESTINATIONS and a thin `buildXManifest() { return buildComponentManifest("x"); }`
 * wrapper — buildComponentManifest itself is already generic across any
 * single-component canonical entry, including multi-hop
 * registryDependencies chains (text-input -> form-field ->
 * validation-message -> foundation) and real npm `dependencies`
 * (validation-message -> @phosphor-icons/react).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { componentRegistry } from "@/lib/component-registry";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export type ShadcnFileType = "registry:ui" | "registry:lib" | "registry:file";

export type ShadcnRegistryFile = {
  path: string;
  content: string;
  type: ShadcnFileType;
  target: string;
};

export type ShadcnRegistryItem = {
  $schema: string;
  name: string;
  type: ShadcnFileType;
  title: string;
  description: string;
  author: string;
  dependencies: string[];
  registryDependencies: string[];
  docs?: string;
  files: ShadcnRegistryFile[];
};

export function readSourceFile(relPath: string): string {
  return readFileSync(join(REPO_ROOT, relPath), "utf8");
}

/**
 * Explicit shadcn `type` + `target` for every file this generator is
 * allowed to transport. Deliberately exhaustive with no fallback: a path
 * not listed here is a generation error (see classifyFile), not a
 * silently-assumed default. `target` is an explicit `~/`-rooted install
 * path (not left as `""`), so installation does not depend on a
 * consumer's own components.json aliases lining up with the exact paths
 * Button's own source imports (`@/lib/cn`, `@/components/ui/icons`,
 * `@/components/ui/button.module.css`) — the CLI is told exactly where
 * each file goes, regardless of consumer alias configuration.
 */
const FILE_DESTINATIONS: Record<string, { type: ShadcnFileType; target: string }> = {
  "components/ui/Button.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Button.tsx",
  },
  "components/ui/button.module.css": {
    type: "registry:ui",
    target: "~/components/ui/button.module.css",
  },
  "components/ui/icons.tsx": {
    type: "registry:ui",
    target: "~/components/ui/icons.tsx",
  },
  "components/ui/Card.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Card.tsx",
  },
  "components/ui/card.module.css": {
    type: "registry:ui",
    target: "~/components/ui/card.module.css",
  },
  "components/ui/TextInput.tsx": {
    type: "registry:ui",
    target: "~/components/ui/TextInput.tsx",
  },
  "components/ui/TextInputControl.tsx": {
    type: "registry:ui",
    target: "~/components/ui/TextInputControl.tsx",
  },
  "components/ui/text-input.module.css": {
    type: "registry:ui",
    target: "~/components/ui/text-input.module.css",
  },
  "components/ui/FormField.tsx": {
    type: "registry:ui",
    target: "~/components/ui/FormField.tsx",
  },
  "components/ui/form-field.module.css": {
    type: "registry:ui",
    target: "~/components/ui/form-field.module.css",
  },
  "components/ui/ValidationMessage.tsx": {
    type: "registry:ui",
    target: "~/components/ui/ValidationMessage.tsx",
  },
  "components/ui/validation-message.module.css": {
    type: "registry:ui",
    target: "~/components/ui/validation-message.module.css",
  },
  "components/ui/Spinner.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Spinner.tsx",
  },
  "components/ui/spinner.module.css": {
    type: "registry:ui",
    target: "~/components/ui/spinner.module.css",
  },
  "components/ui/Divider.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Divider.tsx",
  },
  "components/ui/divider.module.css": {
    type: "registry:ui",
    target: "~/components/ui/divider.module.css",
  },
  "components/ui/Link.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Link.tsx",
  },
  "components/ui/link.module.css": {
    type: "registry:ui",
    target: "~/components/ui/link.module.css",
  },
  "components/ui/internal/link-utils.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/link-utils.ts",
  },
  "lib/cn.ts": {
    type: "registry:lib",
    target: "~/lib/cn.ts",
  },
};

export function classifyFile(relPath: string): { type: ShadcnFileType; target: string } {
  const destination = FILE_DESTINATIONS[relPath];
  if (!destination) {
    throw new Error(
      `generate-shadcn-registry: no explicit shadcn type/target mapping for "${relPath}". ` +
        `Every transported file must be explicitly classified — add an entry to ` +
        `FILE_DESTINATIONS in lib/shadcn-registry-generator.ts. There is no default.`,
    );
  }
  return destination;
}

function must(index: number, label: string): number {
  if (index === -1) {
    throw new Error(
      `generate-shadcn-registry: extraction marker not found: "${label}". The Foundation ` +
        `CSS boundary in styles/tokens.css may have moved — re-verify before regenerating.`,
    );
  }
  return index;
}

/**
 * Mechanically extracts the Foundation tier from the real content of
 * styles/tokens.css + styles/foundation.css, using the existing boundary
 * markers already present in the source rather than hardcoded line
 * numbers, so this stays correct if tokens.css is edited above these
 * markers. No token value is retyped; every byte returned is a verbatim
 * substring of the two inputs. Pure function of its two string arguments
 * — see extractFoundationCss() for the real-file-reading wrapper.
 */
export function extractFoundationCssFromSource(tokensCss: string, foundationUtilCss: string): string {
  const rootOpenIdx = must(tokensCss.indexOf(":root {"), ":root {");
  const firstComponentBlockIdx = must(
    tokensCss.indexOf("/* ── Form control geometry"),
    "/* ── Form control geometry",
  );
  const shapeModesIdx = must(tokensCss.indexOf("/* ── Shape modes ── */"), "/* ── Shape modes ── */");
  const surfaceModesIdx = must(
    tokensCss.indexOf("/* ── Surface modes ── */"),
    "/* ── Surface modes ── */",
  );

  if (
    !(
      rootOpenIdx < firstComponentBlockIdx &&
      firstComponentBlockIdx < shapeModesIdx &&
      shapeModesIdx < surfaceModesIdx
    )
  ) {
    throw new Error(
      "generate-shadcn-registry: Foundation CSS marker ordering assumption violated — " +
        "re-verify the Foundation boundary in styles/tokens.css before regenerating.",
    );
  }

  const rootBody = tokensCss.slice(rootOpenIdx + ":root {".length, firstComponentBlockIdx).trimEnd();
  const shapeModes = tokensCss.slice(shapeModesIdx, surfaceModesIdx).trim();
  const surfaceModes = tokensCss.slice(surfaceModesIdx).trim();

  return [
    "/* ── AUTO-GENERATED Skrewww Foundation transport ──",
    " * Mechanically extracted from styles/tokens.css + styles/foundation.css",
    " * at build time — every declaration below is a verbatim substring of",
    " * those two files, never hand-retyped. Do not edit this file directly;",
    " * it will be overwritten on the next generate. ── */",
    "",
    ":root {",
    rootBody,
    "}",
    "",
    shapeModes,
    "",
    surfaceModes,
    "",
    foundationUtilCss.trim(),
    "",
  ].join("\n");
}

export function extractFoundationCss(): string {
  const tokensCss = readSourceFile("styles/tokens.css");
  const foundationUtilCss = readSourceFile("styles/foundation.css");
  return extractFoundationCssFromSource(tokensCss, foundationUtilCss);
}

const FOUNDATION_TARGET = "~/styles/skrewww-foundation.css";

export function buildFoundationManifest(): ShadcnRegistryItem {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "foundation",
    type: "registry:file",
    title: "Skrewww Foundation",
    description:
      "Universal Primitive/Semantic/Brand/Shape/Surface token tier plus the shared .sr-only accessibility utility. Installed once; every other @skrewww/* component depends on it.",
    author: "Skrewww",
    dependencies: [],
    registryDependencies: [],
    files: [
      {
        path: "styles/tokens.css",
        content: extractFoundationCss(),
        type: "registry:file",
        target: FOUNDATION_TARGET,
      },
    ],
  };
}

/**
 * Generic build for any single-component registry:ui manifest, driven
 * entirely by that component's canonical entry — no component-specific
 * logic lives here. Extracted once Button and Card needed the identical
 * transform; add a new component by giving it a canonical entry + the
 * relevant FILE_DESTINATIONS rows, not by writing a new build function.
 */
function buildComponentManifest(slug: string): ShadcnRegistryItem {
  const entry = componentRegistry.find((candidate) => candidate.slug === slug);
  if (!entry) {
    throw new Error(`generate-shadcn-registry: canonical "${slug}" entry not found in lib/component-registry.ts.`);
  }

  // Transport-layer flattening happens HERE, not in the canonical model —
  // entry.files (component-owned) and entry.internalDependencies (private
  // helpers) stay separate arrays on ComponentRegistryEntry by design;
  // this is the one place they merge into a single shadcn files[] array.
  const ownedFiles = entry.files ?? [];
  const internalFiles = entry.internalDependencies ?? [];
  const transportedPaths = [...ownedFiles, ...internalFiles];

  const files: ShadcnRegistryFile[] = transportedPaths.map((relPath) => {
    const { type, target } = classifyFile(relPath);
    return {
      path: relPath,
      content: readSourceFile(relPath),
      type,
      target,
    };
  });

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: entry.slug,
    type: "registry:ui",
    title: entry.name,
    description: entry.summary,
    author: "Skrewww",
    // Real npm dependencies only (schema 1.4.0 semantics) — react/react-dom/
    // next are host requirements, deliberately never placed here so the CLI
    // never tries to auto-install them; surfaced as a human-facing `docs`
    // note instead, which is a real shadcn schema field for exactly this.
    dependencies: entry.dependencies ?? [],
    registryDependencies: entry.registryDependencies ?? [],
    docs: `Host requirements (assumed already present, not installed by this command): ${(entry.hostRequirements ?? []).join(", ")}.`,
    files,
  };
}

export function buildButtonManifest(): ShadcnRegistryItem {
  return buildComponentManifest("button");
}

export function buildCardManifest(): ShadcnRegistryItem {
  return buildComponentManifest("card");
}

export function buildTextInputManifest(): ShadcnRegistryItem {
  return buildComponentManifest("text-input");
}

export function buildFormFieldManifest(): ShadcnRegistryItem {
  return buildComponentManifest("form-field");
}

export function buildValidationMessageManifest(): ShadcnRegistryItem {
  return buildComponentManifest("validation-message");
}

export function buildSpinnerManifest(): ShadcnRegistryItem {
  return buildComponentManifest("spinner");
}

export function buildDividerManifest(): ShadcnRegistryItem {
  return buildComponentManifest("divider");
}

export function buildLinkManifest(): ShadcnRegistryItem {
  return buildComponentManifest("link");
}

/**
 * Lightweight structural check against the real shadcn registry-item.json
 * shape (confirmed via a live fetch of ui.shadcn.com's own schema/example
 * during the POC — not reproduced here as a live network call, since a
 * test suite shouldn't depend on network access). Throws with a specific
 * message on the first violation found; does not attempt full JSON Schema
 * validation.
 */
export function assertValidShadcnRegistryItem(item: unknown): asserts item is ShadcnRegistryItem {
  if (typeof item !== "object" || item === null) {
    throw new Error("shadcn registry item must be an object");
  }
  const candidate = item as Record<string, unknown>;

  for (const field of ["$schema", "name", "type", "title", "description", "author"] as const) {
    if (typeof candidate[field] !== "string" || candidate[field] === "") {
      throw new Error(`shadcn registry item missing required non-empty string field "${field}"`);
    }
  }

  for (const field of ["dependencies", "registryDependencies"] as const) {
    const value = candidate[field];
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
      throw new Error(`shadcn registry item field "${field}" must be a string array`);
    }
  }

  if (!Array.isArray(candidate.files) || candidate.files.length === 0) {
    throw new Error('shadcn registry item "files" must be a non-empty array');
  }

  for (const file of candidate.files as unknown[]) {
    if (typeof file !== "object" || file === null) {
      throw new Error("shadcn registry item file entry must be an object");
    }
    const fileCandidate = file as Record<string, unknown>;
    for (const field of ["path", "content", "type", "target"] as const) {
      if (typeof fileCandidate[field] !== "string") {
        throw new Error(`shadcn registry item file entry missing required string field "${field}"`);
      }
    }
    if (fileCandidate.target === "") {
      throw new Error(
        `shadcn registry item file entry for "${String(fileCandidate.path)}" has an empty target — ` +
          "this generator requires explicit, non-empty targets for every file.",
      );
    }
  }
}
