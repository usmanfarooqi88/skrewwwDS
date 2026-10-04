import { join } from "node:path";

/**
 * CCV-2 — the child-process environment for consumer tooling.
 *
 * An explicit ALLOWLIST, never "parent environment minus a few names": a
 * variable is forwarded only when it is needed to find binaries, pick a locale
 * or reach the network through a configured proxy. HOME, the npm cache, npm's
 * user config, XDG config and TMPDIR all point inside the workspace, so the
 * user's ~/.npmrc (and any token in it), ~/.config and real npm cache are never
 * read or written. Secret-bearing variables are never forwarded.
 */

const FORWARDED = ["PATH", "LANG", "LC_ALL", "LC_CTYPE", "TERM", "SYSTEMROOT", "COMSPEC"] as const;
const FORWARDED_PROXY = ["HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "no_proxy"] as const;

/** Names that look secret-bearing. Used for redaction and as a guard: none of these may ever be forwarded. */
export const SECRET_NAME_PATTERN = /TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|AUTH|CREDENTIAL|PRIVATE|SESSION|COOKIE|NPM_CONFIG_|_KEY$|^VERCEL|^FIGMA|^GH_|^GITHUB_|^AWS_|^GOOGLE_|^AZURE_|^OPENAI|^ANTHROPIC/i;

/** The parent process environment (only read, never forwarded wholesale). */
export type ParentEnv = Readonly<Record<string, string | undefined>>;

export type WorkspacePaths = { root: string; home: string; npmCache: string; tmp: string };

export function workspacePaths(root: string): WorkspacePaths {
  return { root, home: join(root, "home"), npmCache: join(root, "npm-cache"), tmp: join(root, "tmp") };
}

export function buildChildEnv(parent: ParentEnv, paths: WorkspacePaths): Record<string, string> {
  const env: Record<string, string> = {};
  for (const name of [...FORWARDED, ...FORWARDED_PROXY]) {
    const value = parent[name];
    if (typeof value === "string" && value.length > 0) env[name] = value;
  }
  Object.assign(env, {
    HOME: paths.home,
    USERPROFILE: paths.home,
    XDG_CONFIG_HOME: join(paths.home, ".config"),
    XDG_CACHE_HOME: join(paths.home, ".cache"),
    TMPDIR: paths.tmp,
    TMP: paths.tmp,
    TEMP: paths.tmp,
    npm_config_cache: paths.npmCache,
    npm_config_userconfig: join(paths.home, ".npmrc"),
    npm_config_globalconfig: join(paths.home, ".npmrc-global"),
    npm_config_update_notifier: "false",
    npm_config_fund: "false",
    npm_config_audit: "false",
    npm_config_yes: "true",
    CI: "1",
    NEXT_TELEMETRY_DISABLED: "1",
    DO_NOT_TRACK: "1",
  });
  return env;
}

/** Replaces secret values present in the parent environment, and the workspace path, in captured text. */
export function redactEvidence(text: string, options: { parent: ParentEnv; workspaceRoot?: string; registryOrigin?: string }): string {
  let out = text;
  if (options.workspaceRoot) out = out.split(options.workspaceRoot).join("<workspace>");
  if (options.registryOrigin) out = out.split(options.registryOrigin).join("<local-registry>");
  out = out.replace(/http:\/\/127\.0\.0\.1:\d+/g, "<local-registry>");
  for (const [name, value] of Object.entries(options.parent)) {
    if (typeof value === "string" && value.length >= 8 && SECRET_NAME_PATTERN.test(name)) out = out.split(value).join(`<redacted:${name}>`);
  }
  return out;
}
