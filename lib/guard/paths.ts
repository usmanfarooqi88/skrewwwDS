import { isAbsolute, relative, resolve, sep } from "node:path";

/**
 * Normalize a path for diagnostics and CLI output.
 * Prefer project-relative paths; never require absolute user home paths.
 */
export function toProjectRelativePath(targetPath: string, projectRoot: string): string {
  const root = resolve(projectRoot);
  const absolute = isAbsolute(targetPath) ? resolve(targetPath) : resolve(root, targetPath);
  const rel = relative(root, absolute);
  if (rel === "") return ".";
  // Outside the project root — keep a stable absolute-looking form without
  // expanding further; prefer posix-style separators for determinism.
  if (rel.startsWith(`..${sep}`) || rel === "..") {
    return absolute.split(sep).join("/");
  }
  return rel.split(sep).join("/");
}

/** Strip absolute prefixes from incidental error strings when they leak. */
export function sanitizePathInMessage(message: string, projectRoot: string): string {
  const root = resolve(projectRoot).split(sep).join("/");
  const withSlash = root.endsWith("/") ? root : `${root}/`;
  return message.split(withSlash).join("").split(root).join(".");
}
