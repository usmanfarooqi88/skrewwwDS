import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "@/components/ui/ProgressBar";

describe("ProgressBar", () => {
  it("exposes determinate values accessibly", () => {
    render(<ProgressBar label="Uploading files" value={40} max={100} />);
    const progress = screen.getByRole("progressbar", { name: "Uploading files" });
    expect(progress).toHaveValue(40);
    expect(progress).toHaveAttribute("max", "100");
  });

  it("supports indeterminate mode without a numeric value", () => {
    render(<ProgressBar label="Processing" indeterminate />);
    expect(screen.getByRole("progressbar", { name: "Processing" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("binds Danger indicator fill to BASE semantic-action-danger (D3)", () => {
    const css = readFileSync(resolve(process.cwd(), "components/ui/progress-bar.module.css"), "utf8");
    expect(css).toMatch(/\.danger\s*\{[^}]*--progress-indicator:\s*var\(--semantic-action-danger\)/);
  });
});
