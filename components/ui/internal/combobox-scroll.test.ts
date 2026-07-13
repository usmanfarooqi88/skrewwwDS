import { describe, expect, it, vi } from "vitest";
import { scrollComboboxOptionIntoView } from "@/components/ui/internal/combobox-scroll";

describe("scrollComboboxOptionIntoView", () => {
  it("scrolls only when the active option is outside the listbox viewport", () => {
    const listbox = document.createElement("ul");
    const option = document.createElement("li");
    listbox.appendChild(option);
    document.body.append(listbox, option);

    listbox.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      bottom: 100,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    option.getBoundingClientRect = vi.fn(() => ({
      top: 120,
      bottom: 140,
      left: 0,
      right: 100,
      width: 100,
      height: 20,
      x: 0,
      y: 120,
      toJSON: () => ({}),
    }));

    const scrollIntoView = vi.fn();
    option.scrollIntoView = scrollIntoView;
    scrollComboboxOptionIntoView(listbox, option);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });

    scrollIntoView.mockClear();
    option.getBoundingClientRect = vi.fn(() => ({
      top: 20,
      bottom: 40,
      left: 0,
      right: 100,
      width: 100,
      height: 20,
      x: 0,
      y: 20,
      toJSON: () => ({}),
    }));
    scrollComboboxOptionIntoView(listbox, option);
    expect(scrollIntoView).not.toHaveBeenCalled();

    listbox.remove();
    option.remove();
  });
});
