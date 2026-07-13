import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Portal } from "@/components/ui/internal/Portal";

describe("Portal", () => {
  it("does not access document before client mount", () => {
    const { container, rerender } = render(
      <Portal>
        <div>Portal content</div>
      </Portal>,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <Portal>
        <div>Portal content</div>
      </Portal>,
    );
  });

  it("portals content into document.body after mount", async () => {
    render(
      <Portal>
        <div>Portal content</div>
      </Portal>,
    );

    expect(await screen.findByText("Portal content")).toBeInTheDocument();
    expect(document.body.contains(screen.getByText("Portal content"))).toBe(true);
  });

  it("supports a custom container", async () => {
    const custom = document.createElement("div");
    document.body.append(custom);

    render(
      <Portal container={custom}>
        <div>Custom portal</div>
      </Portal>,
    );

    expect(await screen.findByText("Custom portal")).toBeInTheDocument();
    expect(custom.contains(screen.getByText("Custom portal"))).toBe(true);
  });
});
