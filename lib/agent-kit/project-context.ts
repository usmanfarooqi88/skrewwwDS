import { componentRegistry } from "@/lib/component-registry";
import type {
  Evidence,
  PackageManager,
  ProjectContext,
  ProjectFile,
} from "@/lib/agent-kit/project-context-schema";

/**
 * Pure, deterministic detector of a REAL consumer project's Skrewww
 * state — never a new source of design-system truth, never a persisted
 * config format. Accepts already-gathered file inputs (never reaches into
 * the filesystem itself) so it stays usable from a Skill, a test, or a
 * future adapter without coupling to any one transport. See
 * docs/architecture/agent-kit.md.
 *
 * Every field returns a confirmed value with its evidence, or `unknown`.
 * There is no heuristic/guessing path — a field that cannot be
 * deterministically proven from the provided files is `unknown`, full
 * stop, even when a guess would usually be right.
 */

const FOUNDATION_TARGET_PATH = "styles/skrewww-foundation.css";

const LOCKFILE_BY_PACKAGE_MANAGER: Record<PackageManager, string> = {
  npm: "package-lock.json",
  pnpm: "pnpm-lock.yaml",
  yarn: "yarn.lock",
  bun: "bun.lockb",
};

const PROJECT_INSTRUCTION_FILENAMES = ["AGENTS.md", "CLAUDE.md"];

function findFile(files: ProjectFile[], path: string): ProjectFile | undefined {
  return files.find((file) => file.path === path);
}

function tryParseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

function detectFramework(files: ProjectFile[]): Evidence<string> {
  const packageJsonFile = findFile(files, "package.json");
  if (!packageJsonFile) return { status: "unknown" };

  const parsed = tryParseJson(packageJsonFile.content) as
    | { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    | undefined;
  if (!parsed) return { status: "unknown" };

  const deps = { ...parsed.dependencies, ...parsed.devDependencies };
  if (deps.next) return { status: "confirmed", value: "next", source: "package.json dependency: next" };
  if (deps.react) return { status: "confirmed", value: "react", source: "package.json dependency: react" };
  return { status: "unknown" };
}

function detectPackageManager(files: ProjectFile[]): Evidence<PackageManager> {
  const present = (Object.keys(LOCKFILE_BY_PACKAGE_MANAGER) as PackageManager[]).filter(
    (manager) => findFile(files, LOCKFILE_BY_PACKAGE_MANAGER[manager]) !== undefined,
  );
  // Zero or ambiguous (more than one lockfile) both stay unknown — never guess which one governs.
  if (present.length !== 1) return { status: "unknown" };
  const manager = present[0];
  return { status: "confirmed", value: manager, source: `lockfile present: ${LOCKFILE_BY_PACKAGE_MANAGER[manager]}` };
}

function detectSkrewwwRegistry(files: ProjectFile[]): Evidence<{ namespace: string; template: string }> {
  const componentsJsonFile = findFile(files, "components.json");
  if (!componentsJsonFile) return { status: "unknown" };

  const parsed = tryParseJson(componentsJsonFile.content) as
    | { registries?: Record<string, string> }
    | undefined;
  const template = parsed?.registries?.["@skrewww"];
  if (!template) return { status: "unknown" };

  return {
    status: "confirmed",
    value: { namespace: "@skrewww", template },
    source: "components.json registries.@skrewww",
  };
}

/**
 * A registry component counts as installed when every path in its
 * canonical `files` list is present among the provided files. Driven
 * entirely by `lib/component-registry*.ts` — no separate hardcoded slug
 * list — so this scales automatically as more components gain
 * distribution metadata, and never drifts from the real registry.
 */
function detectInstalledComponentSlugs(files: ProjectFile[]): string[] {
  const providedPaths = new Set(files.map((file) => file.path));
  return componentRegistry
    .filter((entry) => entry.files && entry.files.length > 0)
    .filter((entry) => entry.files!.every((path) => providedPaths.has(path)))
    .map((entry) => entry.slug);
}

function detectFoundationInstalled(files: ProjectFile[]): Evidence<true> {
  if (findFile(files, FOUNDATION_TARGET_PATH)) {
    return { status: "confirmed", value: true, source: `file present: ${FOUNDATION_TARGET_PATH}` };
  }
  return { status: "unknown" };
}

function detectFoundationImported(files: ProjectFile[]): Evidence<true> {
  const importer = files.find((file) => file.content.includes(FOUNDATION_TARGET_PATH));
  if (importer) {
    return { status: "confirmed", value: true, source: `referenced in: ${importer.path}` };
  }
  return { status: "unknown" };
}

function detectDataAttributeMode(
  files: ProjectFile[],
  attribute: "data-skrewww-shape" | "data-skrewww-surface",
): Evidence<string> {
  const pattern = new RegExp(`${attribute}=["']([a-zA-Z0-9-]+)["']`);
  for (const file of files) {
    const match = file.content.match(pattern);
    if (match) {
      return { status: "confirmed", value: match[1], source: `${attribute} found in: ${file.path}` };
    }
  }
  return { status: "unknown" };
}

function detectProjectInstructionFiles(files: ProjectFile[]): string[] {
  const providedPaths = new Set(files.map((file) => file.path));
  return PROJECT_INSTRUCTION_FILENAMES.filter((name) => providedPaths.has(name));
}

export function detectProjectContext(files: ProjectFile[]): ProjectContext {
  return {
    framework: detectFramework(files),
    packageManager: detectPackageManager(files),
    skrewwwRegistry: detectSkrewwwRegistry(files),
    installedComponentSlugs: detectInstalledComponentSlugs(files),
    foundationInstalled: detectFoundationInstalled(files),
    foundationImported: detectFoundationImported(files),
    shapeMode: detectDataAttributeMode(files, "data-skrewww-shape"),
    surfaceMode: detectDataAttributeMode(files, "data-skrewww-surface"),
    projectInstructionFilesPresent: detectProjectInstructionFiles(files),
  };
}

/**
 * Whether a canonical component is currently installable through the
 * @skrewww shadcn registry — derived from the same `files` field
 * `detectInstalledComponentSlugs` uses, never a separately maintained
 * list. Distinct from "implemented" (`hasImplementation` on the registry
 * entry): a component can be implemented in React without yet having
 * shadcn distribution metadata.
 */
export function isDistributedViaSkrewwwRegistry(slug: string): boolean {
  const entry = componentRegistry.find((candidate) => candidate.slug === slug);
  return Boolean(entry?.files && entry.files.length > 0);
}
