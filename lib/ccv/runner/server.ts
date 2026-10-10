import { spawn } from "node:child_process";
import { createServer } from "node:net";

/**
 * CCV-4 — a bounded, loopback-only consumer server (`next start`, `vite preview`).
 * Random free port on 127.0.0.1, readiness polled with a hard timeout, the whole
 * process group killed on stop. The environment is the contained child env.
 */

export type ServerSpec = { command: string; args: (port: number) => string[]; cwd: string; env: Record<string, string>; readyTimeoutMs: number; phase: string };
export type RunningServer = { ok: true; origin: string; stop: () => Promise<void> } | { ok: false; reason: string };
export type ServerStarter = (spec: ServerSpec) => Promise<RunningServer>;

export function freeLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
}

export const startServer: ServerStarter = async (spec) => {
  const port = await freeLoopbackPort();
  const origin = `http://127.0.0.1:${port}`;
  let exited: string | undefined;
  const child = spawn(spec.command, spec.args(port), { cwd: spec.cwd, env: spec.env as unknown as NodeJS.ProcessEnv, stdio: "ignore", detached: process.platform !== "win32" });
  child.on("exit", (code, signal) => (exited = `exited ${code ?? signal}`));
  child.on("error", (error) => (exited = error.message));
  const kill = (signal: NodeJS.Signals) => {
    try {
      if (child.pid && process.platform !== "win32") process.kill(-child.pid, signal);
      else child.kill(signal);
    } catch {
      /* gone */
    }
  };
  const stop = async () => {
    kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 500));
    kill("SIGKILL");
  };
  const deadline = Date.now() + spec.readyTimeoutMs;
  while (Date.now() < deadline) {
    if (exited) return { ok: false, reason: `${spec.phase} ${exited} before becoming ready` };
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(2000) });
      if (response.status < 500) return { ok: true, origin, stop };
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  await stop();
  return { ok: false, reason: `${spec.phase} did not become ready within ${Math.round(spec.readyTimeoutMs / 1000)} s` };
};
