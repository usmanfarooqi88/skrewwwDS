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
});
