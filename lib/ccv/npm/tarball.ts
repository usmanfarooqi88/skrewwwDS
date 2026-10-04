import { gunzipSync } from "node:zlib";

/**
 * CCV-3 — a minimal, dependency-free reader for the `.tgz` npm produces
 * (gzip + ustar, with pax extended headers for long paths). Read-only and pure:
 * it returns each regular file's bytes keyed by its path inside the archive, and
 * reports anything that is not a regular file or directory (a symlink, a device)
 * instead of silently skipping it.
 */

export type TarEntries = { files: Map<string, Buffer>; nonRegular: Array<{ path: string; type: string }> };

const text = (block: Buffer, start: number, length: number) => {
  const raw = block.subarray(start, start + length);
  const end = raw.indexOf(0);
  return raw.subarray(0, end === -1 ? raw.length : end).toString("utf8");
};

function paxPath(data: Buffer): string | undefined {
  let offset = 0;
  const body = data.toString("utf8");
  while (offset < body.length) {
    const space = body.indexOf(" ", offset);
    if (space === -1) break;
    const length = Number(body.slice(offset, space));
    if (!Number.isFinite(length) || length <= 0) break;
    const record = body.slice(space + 1, offset + length - 1);
    const equals = record.indexOf("=");
    if (record.slice(0, equals) === "path") return record.slice(equals + 1);
    offset += length;
  }
  return undefined;
}

export function readTarGz(archive: Buffer): TarEntries {
  const buffer = gunzipSync(archive);
  const files = new Map<string, Buffer>();
  const nonRegular: TarEntries["nonRegular"] = [];
  let offset = 0;
  let pendingPath: string | undefined;
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = text(header, 0, 100);
    const size = Number.parseInt(text(header, 124, 12).trim() || "0", 8);
    const type = String.fromCharCode(header[156] || 48);
    const prefix = text(header, 257, 6).startsWith("ustar") ? text(header, 345, 155) : "";
    const path = pendingPath ?? (prefix ? `${prefix}/${name}` : name);
    offset += 512;
    const data = buffer.subarray(offset, offset + size);
    offset += Math.ceil(size / 512) * 512;
    if (type === "x") {
      pendingPath = paxPath(data);
      continue;
    }
    if (type === "g") continue;
    pendingPath = undefined;
    if (type === "0" || type === "7") files.set(path, Buffer.from(data));
    else if (type !== "5") nonRegular.push({ path, type });
  }
  return { files, nonRegular };
}

/** Archive paths are `package/<path>`; anything else is reported, never guessed. */
export function packageRelative(entries: Map<string, Buffer>): { files: Map<string, Buffer>; outside: string[] } {
  const files = new Map<string, Buffer>();
  const outside: string[] = [];
  entries.forEach((data, path) => {
    if (path.startsWith("package/")) files.set(path.slice("package/".length), data);
    else outside.push(path);
  });
  return { files, outside };
}
