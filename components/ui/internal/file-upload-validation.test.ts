import { describe, expect, it } from "vitest";
import {
  buildRejectionMessage,
  fileMatchesAccept,
  validateFileBatch,
} from "@/components/ui/internal/file-upload-validation";

describe("file upload validation", () => {
  it("matches exact mime, wildcard, and extension tokens", () => {
    const png = new File(["a"], "photo.png", { type: "image/png" });
    const pdf = new File(["a"], "report.pdf", { type: "application/pdf" });
    expect(fileMatchesAccept(png, "image/png,.pdf")).toBe(true);
    expect(fileMatchesAccept(png, "image/*")).toBe(true);
    expect(fileMatchesAccept(pdf, "image/*")).toBe(false);
  });

  it("accepts files exactly at max size and rejects larger files", () => {
    const exact = new File([new Uint8Array(5)], "exact.bin", { type: "application/octet-stream" });
    const large = new File([new Uint8Array(6)], "large.bin", { type: "application/octet-stream" });
    const result = validateFileBatch({ files: [exact, large], maxSize: 5, multiple: true });
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected[0]?.code).toBe("file-size");
    expect(result.rejected[0]?.message).toBe(buildRejectionMessage(large, "file-size", 5));
  });

  it("keeps valid files in mixed batches", () => {
    const good = new File(["a"], "good.png", { type: "image/png" });
    const bad = new File(["a"], "bad.exe", { type: "application/octet-stream" });
    const result = validateFileBatch({
      files: [good, bad],
      accept: "image/png",
      multiple: true,
    });
    expect(result.accepted.map((file) => file.name)).toEqual(["good.png"]);
    expect(result.rejected[0]?.code).toBe("file-type");
  });

  it("limits multiple selection to maxFiles", () => {
    const files = [
      new File(["1"], "one.png", { type: "image/png" }),
      new File(["2"], "two.png", { type: "image/png" }),
      new File(["3"], "three.png", { type: "image/png" }),
    ];
    const result = validateFileBatch({ files, accept: "image/png", multiple: true, maxFiles: 2 });
    expect(result.accepted).toHaveLength(2);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.code).toBe("max-files");
  });

  it("accepts only one file in single mode", () => {
    const files = [
      new File(["1"], "one.png", { type: "image/png" }),
      new File(["2"], "two.png", { type: "image/png" }),
    ];
    const result = validateFileBatch({ files, accept: "image/png", multiple: false });
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected[0]?.code).toBe("max-files");
  });
});
