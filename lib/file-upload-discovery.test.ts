import { describe, expect, it } from "vitest";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import {
  FILE_UPLOAD_FIGMA_AUDIT_STATUS,
  FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID,
  FILE_UPLOAD_FIGMA_VARIANTS,
  FILE_UPLOAD_FIGMA_FILLED_VARIANT_NODE_ID,
  FILE_UPLOAD_FIGMA_FILE_ROW_NODE_ID,
  FILE_UPLOAD_FIGMA_FILE_ROW_ANATOMY,
  FILE_UPLOAD_FIGMA_MULTI_FILE_EXAMPLE_NODE_ID,
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

  it("records react-first approval with the confirmed Figma anatomy", () => {
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
    expect(FILE_UPLOAD_FIGMA_FILLED_VARIANT_NODE_ID).toBe("2024:2648");
    expect(FILE_UPLOAD_FIGMA_FILE_ROW_NODE_ID).toBe("2107:10");
    expect(FILE_UPLOAD_FIGMA_FILE_ROW_ANATOMY).toEqual([
      "File Icon (instance)",
      "File Name (text)",
      "Remove Icon (instance)",
    ]);
    expect(FILE_UPLOAD_FIGMA_MULTI_FILE_EXAMPLE_NODE_ID).toBe("2108:21");
  });

  it("records multi-file list anatomy as now confirmed present in Figma", () => {
    expect(FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS).toBe("confirmed-present");
  });

  it("documents the react-first implementation outcome", () => {
    const discovery = readFileSync(
      join(process.cwd(), "docs/architecture/file-upload-discovery.md"),
      "utf8",
    );
    expect(discovery).toContain("IMPLEMENTATION APPROVED");
    expect(discovery).toContain("IMPLEMENTATION BLOCKED");
  });

  it("documents the corrected multi-file anatomy as confirmed present, not absent", () => {
    const discovery = readFileSync(
      join(process.cwd(), "docs/architecture/file-upload-discovery.md"),
      "utf8",
    );
    expect(discovery).toContain("2024:2649");
    expect(discovery).toContain("2107:10");
    expect(discovery).toContain("2108:21");
    // The doc explains that "confirmed-absent" was the earlier, now-stale
    // value — it may still appear in that historical framing — but the
    // doc's own final claim must be the corrected "confirmed-present".
    expect(discovery).toMatch(/FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS = "confirmed-present"/);
    expect(discovery).toMatch(/both single-file and multi-file anatomy are now[\s\S]{0,20}figma-confirmed/i);
  });
});
