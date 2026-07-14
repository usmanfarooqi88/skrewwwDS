import { describe, expect, it } from "vitest";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import {
  FILE_UPLOAD_FIGMA_AUDIT_STATUS,
  FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID,
  FILE_UPLOAD_FIGMA_VARIANTS,
  FILE_UPLOAD_FIGMA_FILLED_ANATOMY,
  FILE_UPLOAD_IMPLEMENTATION_GATE,
  FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS,
} from "@/lib/file-upload-figma-metadata";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("File Upload discovery gate", () => {
  it("implements File Upload in the canonical registry", () => {
    const slugs = getImplementedRegistryEntries().map((entry) => entry.slug);
    expect(slugs).toContain("file-upload");
    expect(slugs).not.toContain("dropzone");
  });

  it("records react-first approval with the confirmed single-file Figma anatomy", () => {
    expect(FILE_UPLOAD_IMPLEMENTATION_GATE).toBe("approved-react-first");
    expect(FILE_UPLOAD_FIGMA_AUDIT_STATUS).toBe("verified-2026-07-15");
    expect(FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID).toBe("2024:2649");
    expect(FILE_UPLOAD_FIGMA_VARIANTS).toEqual([
      "Empty",
      "Dragging",
      "Error",
      "Disabled",
      "Filled",
    ]);
    expect(FILE_UPLOAD_FIGMA_FILLED_ANATOMY).toEqual([
      "File Icon",
      "File Name (text property)",
      "Remove Icon",
    ]);
  });

  it("records the confirmed absence of multi-file list anatomy in Figma", () => {
    expect(FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS).toBe("confirmed-absent");
  });

  it("documents the react-first implementation outcome", () => {
    const discovery = readFileSync(
      join(process.cwd(), "docs/architecture/file-upload-discovery.md"),
      "utf8",
    );
    expect(discovery).toContain("IMPLEMENTATION APPROVED");
    expect(discovery).toContain("IMPLEMENTATION BLOCKED");
  });

  it("documents the confirmed single-file vs multi-file anatomy split", () => {
    const discovery = readFileSync(
      join(process.cwd(), "docs/architecture/file-upload-discovery.md"),
      "utf8",
    );
    expect(discovery).toContain("2024:2649");
    expect(discovery).toMatch(/confirmed-absent|confirmed absent/i);
    expect(discovery).toMatch(/single-file.{0,40}confirmed/i);
  });
});
