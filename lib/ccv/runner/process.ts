import { spawn } from "node:child_process";

/**
 * CCV-2 — one bounded external command. Every command has a hard timeout; on
 * timeout the whole process group is terminated (SIGTERM, then SIGKILL), so a
 * stuck `npx` cannot leave children behind. Output is captured in memory as a
 * bounded tail — never to temp files, so nothing can leak on disk.
 */

export type CommandSpec = {
  command: string;
  args: readonly string[];
  cwd: string;
  env: Record<string, string>;
  timeoutMs: number;
  /** Short stable name of the phase, used in evidence (`scaffold`, `shadcn-add`, …). */
  phase: string;
};

export type CommandOutcome = {
  phase: string;
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  spawnError?: string;
  stdoutTail: string;
  stderrTail: string;
  durationMs: number;
};

/** The runner seam: real processes in the CLI, a fake in fixture tests. */
export type CommandRunner = (spec: CommandSpec) => Promise<CommandOutcome>;

export const OUTPUT_TAIL_BYTES = 64 * 1024;
const KILL_GRACE_MS = 5_000;

function appendTail(current: string, chunk: string, limit: number): string {
  const next = current + chunk;
  return next.length > limit ? next.slice(next.length - limit) : next;
}

export const runCommand: CommandRunner = (spec) =>
  new Promise((resolve) => {
    const started = Date.now();
    let stdoutTail = "";
    let stderrTail = "";
    let timedOut = false;
    let settled = false;
    let killTimer: NodeJS.Timeout | undefined;
    const finish = (outcome: Omit<CommandOutcome, "phase" | "stdoutTail" | "stderrTail" | "durationMs" | "timedOut">) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      resolve({ phase: spec.phase, ...outcome, timedOut, stdoutTail, stderrTail, durationMs: Date.now() - started });
    };
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(spec.command, [...spec.args], { cwd: spec.cwd, env: spec.env as unknown as NodeJS.ProcessEnv, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" });
    } catch (error) {
      resolve({ phase: spec.phase, exitCode: null, signal: null, timedOut: false, spawnError: error instanceof Error ? error.message : String(error), stdoutTail, stderrTail, durationMs: 0 });
      return;
    }
    const killGroup = (signal: NodeJS.Signals) => {
      try {
        if (child.pid && process.platform !== "win32") process.kill(-child.pid, signal);
        else child.kill(signal);
      } catch {
        /* already gone */
      }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      killGroup("SIGTERM");
      killTimer = setTimeout(() => killGroup("SIGKILL"), KILL_GRACE_MS);
    }, spec.timeoutMs);
    child.stdout?.setEncoding("utf8").on("data", (chunk: string) => (stdoutTail = appendTail(stdoutTail, chunk, OUTPUT_TAIL_BYTES)));
    child.stderr?.setEncoding("utf8").on("data", (chunk: string) => (stderrTail = appendTail(stderrTail, chunk, OUTPUT_TAIL_BYTES)));
    child.on("error", (error) => finish({ exitCode: null, signal: null, spawnError: error.message }));
    child.on("close", (code, signal) => {
      if (timedOut) killGroup("SIGKILL");
      finish({ exitCode: code, signal: signal ?? null });
    });
  });

export type OutcomeClass = "ok" | "environment" | "contract";

const NETWORK_PATTERN = /\b(ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|socket hang up|network request to .* failed|getaddrinfo|request to https?:\/\/registry\.npmjs\.org.* failed|503 Service Unavailable|502 Bad Gateway|ERR_SOCKET_TIMEOUT|ENOSPC|EACCES)\b/i;

/**
 * Environment vs contract: a timeout, a process that could not start, a signal
 * kill or a recognisable network/disk failure is ENVIRONMENT (no contract
 * conclusion); any other non-zero exit is a CONTRACT-relevant failure of that phase.
 */
export function classifyOutcome(outcome: CommandOutcome): OutcomeClass {
  if (!outcome.timedOut && !outcome.spawnError && outcome.exitCode === 0) return "ok";
  if (outcome.timedOut || outcome.spawnError || outcome.exitCode === null) return "environment";
  if (NETWORK_PATTERN.test(`${outcome.stdoutTail}\n${outcome.stderrTail}`)) return "environment";
  return "contract";
}

/** A concise, single-line reason for evidence (no full log). */
export function describeOutcome(outcome: CommandOutcome): string {
  if (outcome.timedOut) return `${outcome.phase}: timed out and was terminated`;
  if (outcome.spawnError) return `${outcome.phase}: could not start (${outcome.spawnError})`;
  if (outcome.exitCode === null) return `${outcome.phase}: killed by ${outcome.signal ?? "signal"}`;
  return `${outcome.phase}: exit ${outcome.exitCode}`;
}
