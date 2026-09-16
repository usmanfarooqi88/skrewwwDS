import { resolve } from "node:path";
import { formatGuardResult } from "@/lib/guard/format";
import { runGuard, type GuardExitCode, type GuardMode } from "@/lib/guard/run";
import { GUARD_TOOL_VERSION } from "@/lib/guard/version";
import { GUARD_RULE_CATALOG } from "@/lib/guard/rules";

/**
 * Minimal Guard CLI — docs/architecture/guard-readiness-audit.md §23.
 *
 * Usage:
 *   npm run guard -- [path]
 *   npm run guard -- --internal [path]
 *   npm run guard -- [path] --claims <file.json>
 *
 * Default path: current working directory.
 * `--json` is deferred (G-3+). Zero config. No suppressions.
 */

export type ParsedCliArgs =
  | { kind: "help" }
  | { kind: "version" }
  | {
      kind: "run";
      target: string;
      mode: GuardMode;
      claimsPath?: string;
    }
  | { kind: "usage-error"; message: string };

export function printHelp(): string {
  return `Skrewww Guard ${GUARD_TOOL_VERSION}

Validate source and structured claims against the canonical Skrewww registry
(offline, local, zero-config).

Usage:
  npm run guard -- [path]
  npm run guard -- --internal [path]
  npm run guard -- [path] --claims <claims.json>

Arguments:
  path              File or directory to scan (.ts/.tsx). Default: current directory.

Options:
  --internal        Run internal-repo registry/artifact rules only
                    (token/undeclared-css-var, distribution/*).
                    Do not use on external consumer projects.
  --claims <file>   Structured claims JSON (maturity / installability data).
                    Not a Guard config file.
  --help, -h        Show this help
  --version, -v     Show Guard tool version

Exit codes:
  0  no ERROR findings
  1  one or more ERROR findings
  2  tool / parse / input failure

v0.1 rules (${GUARD_RULE_CATALOG.length}):
${GUARD_RULE_CATALOG.map((e) => `  ${e.id} (${e.domain})`).join("\n")}

Notes:
  - api/nonexistent-prop is deferred (not in v0.1).
  - Unknown import provenance never produces a finding.
  - --json output is deferred.
  - No configuration or suppression system.
`;
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const args = [...argv];
  let mode: GuardMode = "consumer";
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
      mode = "internal";
      continue;
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

  if (mode === "internal" && claimsPath) {
    return {
      kind: "usage-error",
      message: "--claims is only valid in consumer mode (omit --internal)",
    };
  }

  return {
    kind: "run",
    target: target ?? ".",
    mode,
    claimsPath,
  };
}

export type CliRunResult = {
  exitCode: GuardExitCode;
  stdout: string;
  stderr: string;
};

/**
 * Execute the CLI against argv (excluding node + script). Pure enough for tests:
 * returns strings + exit code instead of writing process streams.
 */
export function runGuardCli(
  argv: string[],
  options?: { projectRoot?: string; cwd?: string },
): CliRunResult {
  const parsed = parseCliArgs(argv);

  if (parsed.kind === "help") {
    return { exitCode: 0, stdout: printHelp(), stderr: "" };
  }
  if (parsed.kind === "version") {
    return { exitCode: 0, stdout: `${GUARD_TOOL_VERSION}\n`, stderr: "" };
  }
  if (parsed.kind === "usage-error") {
    return {
      exitCode: 2,
      stdout: "",
      stderr: `${parsed.message}\n\n${printHelp()}`,
    };
  }

  const projectRoot = resolve(options?.projectRoot ?? options?.cwd ?? process.cwd());
  const result = runGuard({
    target: parsed.target,
    projectRoot,
    mode: parsed.mode,
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

/** Process entry used by scripts/guard.ts */
export function main(argv: string[] = process.argv.slice(2)): GuardExitCode {
  const result = runGuardCli(argv, { projectRoot: process.cwd() });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.exitCode;
}
