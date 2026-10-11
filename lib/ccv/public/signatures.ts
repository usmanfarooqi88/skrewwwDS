import { createPublicKey, verify } from "node:crypto";

/**
 * CCV-5 — npm registry signature verification with Node crypto only (no `npm audit
 * signatures`, no network inside this module). The registry signs the message
 * `<name>@<version>:<dist.integrity>` with an ECDSA P-256 key published at
 * `<registry>/-/npm/v1/keys`; the signature is DER, base64-encoded.
 */

export type NpmSignature = { keyid: string; sig: string };
export type NpmRegistryKey = { keyid: string; key: string; expires?: string | null };

export type SignatureVerdict = { valid: string[]; invalid: string[]; unknownKey: string[] };

export function verifyNpmSignatures(input: { name: string; version: string; integrity: string; signatures: readonly NpmSignature[]; keys: readonly NpmRegistryKey[] }): SignatureVerdict {
  const message = Buffer.from(`${input.name}@${input.version}:${input.integrity}`, "utf8");
  const verdict: SignatureVerdict = { valid: [], invalid: [], unknownKey: [] };
  for (const signature of input.signatures) {
    const key = input.keys.find((candidate) => candidate.keyid === signature.keyid);
    if (!key) {
      verdict.unknownKey.push(signature.keyid);
      continue;
    }
    let ok = false;
    try {
      ok = verify("sha256", message, createPublicKey({ key: Buffer.from(key.key, "base64"), format: "der", type: "spki" }), Buffer.from(signature.sig, "base64"));
    } catch {
      ok = false;
    }
    (ok ? verdict.valid : verdict.invalid).push(signature.keyid);
  }
  return verdict;
}
