/**
 * Fails a publish of a prerelease version unless npm resolved the publish
 * dist-tag to that prerelease's own tag (0.1.0-beta.1 -> "beta").
 *
 * Why this exists: on npm 11.12.1 `publishConfig.tag` in package.json is NOT
 * applied — a plain `npm publish` of 0.1.0-beta.1 resolves to `latest`
 * ("Publishing ... with tag latest"). Only an explicit `--tag beta` works.
 *
 * What npm exposes (verified with `npm publish --dry-run` in a throwaway
 * package): lifecycle scripts see the resolved tag as `npm_config_tag` only
 * when it differs from the default, so `undefined` means `latest`; `--tag beta`
 * gives "beta", `--tag next` gives "next", `--tag latest` gives `undefined`.
 * `NPM_CONFIG_TAG=beta` makes npm publish under beta but does NOT set
 * `npm_config_tag`, so this guard deliberately requires the explicit flag.
 *
 * Runs as the package's own `prepublishOnly` (npm_lifecycle_event=prepublishOnly).
 * When run by hand, outside a publish, it is informational and passes.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The tag a prerelease must publish under: its first non-numeric prerelease identifier, else null for a stable version. */
export function expectedPublishTag(version) {
  const prerelease = /^\d+\.\d+\.\d+-([0-9A-Za-z.-]+)$/.exec(version)?.[1];
  if (!prerelease) return null;
  return prerelease.split(".").find((part) => /[A-Za-z]/.test(part)) ?? null;
}

/** @returns {{ ok: boolean, message: string }} */
export function checkPublishTag({ version, lifecycleEvent, resolvedTag }) {
  if (lifecycleEvent !== "prepublishOnly") {
    return { ok: true, message: "Not running inside npm publish; publish-tag check skipped." };
  }
  const expected = expectedPublishTag(version);
  if (expected === null) {
    return { ok: true, message: `${version} is a stable version; no prerelease tag is required.` };
  }
  if (resolvedTag === expected) {
    return { ok: true, message: `Publish tag is "${expected}", as required for ${version}.` };
  }
  const resolved = resolvedTag === undefined ? "latest (npm exposes no tag when it resolves to latest)" : `"${resolvedTag}"`;
  return {
    ok: false,
    message:
      `Refusing to publish ${version}: npm resolved the publish tag to ${resolved}, but a prerelease must publish under "${expected}".\n` +
      `  npm 11.12.1 ignores publishConfig.tag. Publish with the explicit flag:\n` +
      `    npm publish --tag ${expected}`,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(here, "..", "packages", "react", "package.json"), "utf8"));
  const result = checkPublishTag({
    version: pkg.version,
    lifecycleEvent: process.env.npm_lifecycle_event,
    resolvedTag: process.env.npm_config_tag,
  });
  if (result.ok) {
    console.log(result.message);
  } else {
    console.error(result.message);
    process.exit(1);
  }
}
