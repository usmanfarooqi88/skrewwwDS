import { describe, expect, it } from "vitest";
import {
  filterComboboxOptions,
  findOptionByLabel,
  resolveOptionLabel,
} from "@/components/ui/internal/combobox-filter";

const options = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom", disabled: true },
];

describe("filterComboboxOptions", () => {
  it("returns all options for an empty query", () => {
    expect(filterComboboxOptions(options, "")).toEqual(options);
  });

  it("filters with case-insensitive prefix matching by default", () => {
    expect(filterComboboxOptions(options, "un")).toEqual([
      { value: "us", label: "United States" },
      { value: "uk", label: "United Kingdom", disabled: true },
    ]);
  });

  it("supports substring matching", () => {
    expect(filterComboboxOptions(options, "nada", "substring")).toEqual([
      { value: "ca", label: "Canada" },
    ]);
  });

  it("does not mutate the source options", () => {
    const copy = [...options];
    filterComboboxOptions(copy, "c");
    expect(copy).toEqual(options);
  });
});

describe("findOptionByLabel", () => {
  it("matches labels case-insensitively", () => {
    expect(findOptionByLabel(options, "canada")?.value).toBe("ca");
  });

  it("returns undefined for duplicate labels", () => {
    const duplicateOptions = [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Alpha" },
    ];
    expect(findOptionByLabel(duplicateOptions, "Alpha")).toBeUndefined();
  });

  it("returns a disabled option for exact label lookup", () => {
    expect(findOptionByLabel(options, "United Kingdom")?.disabled).toBe(true);
  });
});

describe("resolveOptionLabel", () => {
  it("returns the label for a known value", () => {
    expect(resolveOptionLabel(options, "ca")).toBe("Canada");
  });
});
