import { describe, expect, it, vi } from "vitest";
import { createMenuTypeahead } from "@/components/ui/internal/menu-typeahead";

describe("createMenuTypeahead", () => {
  const items = [
    { id: "edit", text: "Edit profile", disabled: false },
    { id: "duplicate", text: "Duplicate", disabled: false },
    { id: "delete", text: "Delete project", disabled: true },
  ];

  it("matches the first item from a single character", () => {
    const onMatch = vi.fn();
    const typeahead = createMenuTypeahead({ getItems: () => items, onMatch });
    expect(typeahead.handleKey("d")).toBe(true);
    expect(onMatch).toHaveBeenCalledWith("duplicate");
  });

  it("builds a multi-character buffer", () => {
    const onMatch = vi.fn();
    const typeahead = createMenuTypeahead({ getItems: () => items, onMatch });
    typeahead.handleKey("e");
    typeahead.handleKey("d");
    expect(onMatch).toHaveBeenLastCalledWith("edit");
  });

  it("cycles repeated characters", () => {
    const onMatch = vi.fn();
    const typeahead = createMenuTypeahead({ getItems: () => items, onMatch });
    typeahead.handleKey("d");
    typeahead.handleKey("d");
    expect(onMatch).toHaveBeenLastCalledWith("duplicate");
  });

  it("skips disabled items", () => {
    const onMatch = vi.fn();
    const typeahead = createMenuTypeahead({
      getItems: () => items,
      onMatch,
    });
    typeahead.handleKey("d");
    typeahead.handleKey("e");
    typeahead.handleKey("l");
    expect(onMatch).not.toHaveBeenCalledWith("delete");
  });
});
