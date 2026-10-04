import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { ShadcnRegistryItem } from "@/lib/shadcn-registry-generator";

/**
 * CCV-2 — LOCAL_CANONICAL registry: serves exactly the given generator items as
 * `/r/<name>.json` on 127.0.0.1 with an ephemeral port. Nothing is written to
 * `public/r`, no production URL is involved, and every request path is logged so
 * the verifier can check which items the installer actually resolved.
 */

export type LocalRegistry = {
  origin: string;
  /** The `{name}` template the consumer's components.json uses. */
  template: string;
  host: string;
  /** Request paths in arrival order (`/r/button.json`, …). */
  requests: () => string[];
  close: () => Promise<void>;
};

export function serializeServedItem(item: ShadcnRegistryItem): string {
  return `${JSON.stringify(item, null, 2)}\n`;
}

export function startLocalRegistry(items: readonly ShadcnRegistryItem[]): Promise<LocalRegistry> {
  const payloads = new Map(items.map((item) => [`/r/${item.name}.json`, serializeServedItem(item)]));
  const log: string[] = [];
  const server = createServer((request, response) => {
    response.setHeader("Connection", "close");
    const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    log.push(path);
    const body = request.method === "GET" || request.method === "HEAD" ? payloads.get(path) : undefined;
    if (body === undefined) {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(request.method === "HEAD" ? undefined : body);
  });
  server.keepAliveTimeout = 0;
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      if (address.address !== "127.0.0.1") {
        server.close();
        reject(new Error(`registry bound to ${address.address}, not loopback`));
        return;
      }
      const origin = `http://127.0.0.1:${address.port}`;
      resolve({
        origin,
        template: `${origin}/r/{name}.json`,
        host: address.address,
        requests: () => [...log],
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}
