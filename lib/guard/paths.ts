import { basename, isAbsolute, relative, resolve, sep } from "node:path";

/**
 * Normalize a path for diagnostics and CLI output.
 * Prefer project-relative paths; never require absolute user home paths.
 * Paths outside the project root emit basename only (privacy — G-3).
 */
export function toProjectRelativePath(targetPath: string, projectRoot: string): string {
  const root = resolve(projectRoot);
  const absolute = isAbsolute(targetPath) ? resolve(targetPath) : resolve(root, targetPath);
  const rel = relative(root, absolute);
  if (rel === "") return ".";
  if (rel.startsWith(`..${sep}`) || rel === "..") {
    return basename(absolute);
  }
  return rel.split(sep).join("/");
}

/** Strip absolute prefixes from incidental error strings when they leak. */
export function sanitizePathInMessage(message: string, projectRoot: string): string {
  let out = message;
  const root = resolve(projectRoot).split(sep).join("/");
  const withSlash = root.endsWith("/") ? root : `${root}/`;
  out = out.split(withSlash).join("").split(root).join(".");
  // Strip common absolute home / temp prefixes that may appear in Node errors.
  out = out.replace(/(?:\/Users\/[^/\s]+|\/home\/[^/\s]+|\/tmp|\/var\/folders\/[^\s]*)(?:\/[^\s:]*)+/g, (match) => {
    const base = match.split("/").filter(Boolean).pop();
    return base ?? "file";
  });
  return out;
}
