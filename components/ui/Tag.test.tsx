import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tag } from "@/components/ui/Tag";

describe("Tag", () => {
  it("defaults to a non-interactive span", () => {
    render(<Tag>Design Systems</Tag>);
    const tag = screen.getByText("Design Systems");
    expect(tag.tagName).toBe("SPAN");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("provides an accessible remove button name", () => {
    render(
      <Tag removable onRemove={vi.fn()}>
        Design Systems
      </Tag>,
    );
    expect(screen.getByRole("button", { name: "Remove Design Systems" })).toBeInTheDocument();
  });

  it("does not nest interactive controls inside another button", () => {
    render(
      <Tag removable removeLabel="Remove Filters" onRemove={vi.fn()}>
        Filters
      </Tag>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("hides leading icons from assistive technology", () => {
    const { container } = render(
      <Tag leadingIcon={<svg data-testid="icon" />}>Category</Tag>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("supports custom remove labels", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Tag removable removeLabel="Remove category Beta" onRemove={onRemove}>
        Beta
      </Tag>,
    );
    await user.click(screen.getByRole("button", { name: "Remove category Beta" }));
    expect(onRemove).toHaveBeenCalled();
  });
});
