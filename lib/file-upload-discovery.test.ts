import { describe, expect, it } from "vitest";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import {
  FILE_UPLOAD_FIGMA_AUDIT_STATUS,
  FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID,
  FILE_UPLOAD_IMPLEMENTATION_GATE,
} from "@/lib/file-upload-figma-metadata";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("File Upload discovery gate", () => {
  it("implements File Upload in the canonical registry", () => {
    const slugs = getImplementedRegistryEntries().map((entry) => entry.slug);
    expect(slugs).toContain("file-upload");
    expect(slugs).not.toContain("dropzone");
  });

  it("records react-first approval with unresolved Figma MCP", () => {
    expect(FILE_UPLOAD_IMPLEMENTATION_GATE).toBe("approved-react-first");
    expect(FILE_UPLOAD_FIGMA_AUDIT_STATUS).toBe("unresolved-mcp");
    expect(FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID).toBeNull();
  });

  it("documents the react-first implementation outcome", () => {
    const discovery = readFileSync(
      join(process.cwd(), "docs/architecture/file-upload-discovery.md"),
      "utf8",
    );
    expect(discovery).toContain("IMPLEMENTATION APPROVED");
    expect(discovery).toContain("IMPLEMENTATION BLOCKED");
  });
});
