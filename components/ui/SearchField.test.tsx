import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchField } from "@/components/ui/SearchField";

describe("SearchField", () => {
  it("uses search input semantics", () => {
    render(<SearchField label="Search" />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("shows clear button only when value is present", () => {
    render(<SearchField label="Search" defaultValue="button" />);
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });

  it("hides clear button when empty", () => {
    render(<SearchField label="Search" defaultValue="" />);
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });

  it("clears value when clear button is activated", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SearchField label="Search" defaultValue="card" onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("");
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("clears on Escape when enabled", async () => {
    const user = userEvent.setup();
    render(<SearchField label="Search" defaultValue="forms" />);
    const input = screen.getByRole("searchbox");
    input.focus();
    await user.keyboard("{Escape}");
    expect(input).toHaveValue("");
  });

  it("keeps leading and clear icons inside a constrained control wrapper", () => {
    const { container } = render(
      <SearchField label="Search components" className="max-w-md" defaultValue="button" />,
    );
    const wrap = container.querySelector('[class*="controlWrap"]');
    expect(wrap).toHaveClass("max-w-md");
    expect(wrap).toContainElement(screen.getByRole("searchbox"));
    expect(wrap).toContainElement(screen.getByRole("button", { name: "Clear search" }));
  });
});
