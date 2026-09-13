/**
 * Types for the AK-3 project-context detector (lib/agent-kit/project-context.ts).
 *
 * Every field is either a deterministically confirmed value with its
 * evidence, or explicitly "unknown" — never a guess. See
 * docs/architecture/agent-kit.md's "Project context" section for the full
 * design rationale (ephemeral, evidence-only, no new persisted config
 * format).
 */

/**
 * A value the detector either proved from real file content, or could not
 * prove — there is no third "guessed" state. `unknown` must be treated by
 * every consumer (the Skill, future adapters) as "do not assume a
 * default," not as an invitation to infer a common case.
 */
export type Evidence<T> =
  | { status: "confirmed"; value: T; source: string }
  | { status: "unknown" };

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export type SkrewwwRegistryConfig = {
  namespace: string;
  /** The registry URL template as declared in the consumer's own components.json, verbatim — never assumed. */
  template: string;
};

/**
 * One file handed to the detector: a relative path plus its raw text
 * content. The detector is pure — it never reads the filesystem itself;
 * a thin caller (a script, a test, a future adapter) gathers real files
 * and passes them in. Passing a path with empty content is sufficient for
 * existence-only checks (e.g. proving a component file was installed);
 * content is only required for checks that scan file text (package.json/
 * components.json parsing, Shape/Surface attribute detection, Foundation
 * import detection).
 */
export type ProjectFile = {
  path: string;
  content: string;
};

export type ProjectContext = {
  framework: Evidence<string>;
  packageManager: Evidence<PackageManager>;
  skrewwwRegistry: Evidence<SkrewwwRegistryConfig>;
  /**
   * Component slugs whose full registered `files` set (from the canonical
   * registry) was found present among the provided files. An empty array
   * is itself a confirmed observation ("none detected"), not unknown —
   * unlike the Evidence<T> fields above, "nothing found" is a real,
   * useful answer here.
   */
  installedComponentSlugs: string[];
  foundationInstalled: Evidence<true>;
  foundationImported: Evidence<true>;
  shapeMode: Evidence<string>;
  surfaceMode: Evidence<string>;
  /** Project instruction files observed present at the root — names only, never their content interpreted as Skrewww system instruction. */
  projectInstructionFilesPresent: string[];
};
