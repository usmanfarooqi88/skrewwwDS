import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formatGuardResult } from "@/lib/guard/format";
import { runGuard, type GuardExitCode } from "@/lib/guard/run";
import { GUARD_TOOL_VERSION } from "@/lib/guard/version";
import { defaultRepoConsumerFactsPath } from "@/lib/guard/load-consumer-facts";

/**
 * Public package CLI — consumer rules only, packaged facts, marker provenance.
 * Does not expose --internal (Skrewww-repo invariants).
 */

export type ParsedPublicCliArgs =
  | { kind: "help" }
  | { kind: "version" }
  | { kind: "run"; target: string; claimsPath?: string }
  | { kind: "usage-error"; message: string };

export function printPublicHelp(): string {
  return `Skrewww Guard ${GUARD_TOOL_VERSION} (public consumer package)

Offline, local checks for Skrewww canonical-contract violations (Beta).
Does not replace TypeScript. Does not validate accessibility, Figma,
Shape/Surface, or visual parity.

Public consumer rules (3):
  component/nonexistent-slug
  maturity/false-stable-claim
  distribution/false-installable-claim

Usage:
  skrewww-guard [path]
  skrewww-guard [path] --claims <claims.json>

Arguments:
  path              File or directory (.ts/.tsx). Default: current directory.

Options:
  --claims <file>   Structured claims JSON (maturity / installability data).
                    Not a Guard config file.
  --help, -h        Show this help
  --version, -v     Show Guard tool version

Exit codes:
  0  no ERROR findings
  1  one or more ERROR findings
  2  tool / parse / input / facts failure

Provenance (v0.1):
  Only files carrying an @skrewww-component origin marker (from a Skrewww
  registry install) establish a Skrewww claim. Path/name alone never does.

Notes:
  - Zero-config. No suppressions. Offline/local only.
  - api/nonexistent-prop is deferred (not a prop-type checker).
  - Internal Skrewww-repo rules are not included in this package.
`;
}

export function parsePublicCliArgs(argv: string[]): ParsedPublicCliArgs {
  const args = [...argv];
  let claimsPath: string | undefined;
  let target: string | undefined;
  let wantHelp = false;
  let wantVersion = false;

  while (args.length > 0) {
    const arg = args.shift()!;
    if (arg === "--help" || arg === "-h") {
      wantHelp = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      wantVersion = true;
      continue;
    }
    if (arg === "--internal") {
      return {
        kind: "usage-error",
        message:
          "--internal is not available in the public Guard package (Skrewww-repo invariants only)",
      };
    }
    if (arg === "--claims") {
      const next = args.shift();
      if (!next || next.startsWith("-")) {
        return { kind: "usage-error", message: "--claims requires a JSON file path" };
      }
      claimsPath = next;
      continue;
    }
    if (arg === "--json") {
      return {
        kind: "usage-error",
        message: "--json is deferred; use the programmatic runGuard() API for structured results",
      };
    }
    if (arg.startsWith("-")) {
      return { kind: "usage-error", message: `Unknown option: ${arg}` };
    }
    if (target !== undefined) {
      return { kind: "usage-error", message: `Unexpected extra argument: ${arg}` };
    }
    target = arg;
  }

  if (wantHelp) return { kind: "help" };
  if (wantVersion) return { kind: "version" };

  return { kind: "run", target: target ?? ".", claimsPath };
}

export type PublicCliRunResult = {
  exitCode: GuardExitCode;
  stdout: string;
  stderr: string;
};

export function runPublicGuardCli(
  argv: string[],
  options?: { projectRoot?: string; consumerFactsPath?: string },
): PublicCliRunResult {
  const parsed = parsePublicCliArgs(argv);
  if (parsed.kind === "help") {
    return { exitCode: 0, stdout: printPublicHelp(), stderr: "" };
  }
  if (parsed.kind === "version") {
    return { exitCode: 0, stdout: `${GUARD_TOOL_VERSION}\n`, stderr: "" };
  }
  if (parsed.kind === "usage-error") {
    return {
      exitCode: 2,
      stdout: "",
      stderr: `${parsed.message}\n\n${printPublicHelp()}`,
    };
  }

  const projectRoot = resolve(options?.projectRoot ?? process.cwd());
  const result = runGuard({
    target: parsed.target,
    projectRoot,
    mode: "consumer",
    factSource: "packaged",
    consumerFactsPath: options?.consumerFactsPath,
    claimsPath: parsed.claimsPath,
  });

  const text = formatGuardResult({
    diagnostics: result.diagnostics,
    executionErrors: result.executionErrors,
  });

  if (result.exitCode === 2) {
    return { exitCode: 2, stdout: "", stderr: text };
  }
  return { exitCode: result.exitCode, stdout: text, stderr: "" };
}

export function mainPublic(argv: string[] = process.argv.slice(2)): GuardExitCode {
  const here = dirname(fileURLToPath(import.meta.url));
  const besideDist = join(here, "..", "facts", "consumer-facts.json");
  const repoFacts = defaultRepoConsumerFactsPath(process.cwd());
  const consumerFactsPath = existsSync(besideDist)
    ? besideDist
    : existsSync(repoFacts)
      ? repoFacts
      : undefined;

  const result = runPublicGuardCli(argv, {
    projectRoot: process.cwd(),
    consumerFactsPath,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.exitCode;
}
