import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ComparisonTable } from "@/components/compare/ComparisonTable";
import {
  comparisonGroups,
  comparisonSources,
  comparisonSystems,
  getComparisonCategories,
  getComparisonValue,
} from "@/lib/comparison";

function setup() {
  const categories = getComparisonCategories();
  render(
    <ComparisonTable
      systems={comparisonSystems}
      groups={comparisonGroups}
      categories={categories}
      sources={comparisonSources}
    />,
  );
  return categories;
}

function countUnverified(categories: ReturnType<typeof getComparisonCategories>) {
  let count = 0;
  for (const category of categories) {
    for (const system of comparisonSystems) {
      if (getComparisonValue(category, system.id).status === "unverified") count += 1;
    }
  }
  return count;
}

describe("ComparisonTable semantics", () => {
  it("renders a labelled, focusable scroll region around a semantic table", () => {
    setup();
    const region = screen.getByRole("region", { name: /design system comparison table/i });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(within(region).getByRole("table")).toBeInTheDocument();
  });

  it("uses column headers for systems and row headers for capabilities", () => {
    const categories = setup();
    const columnHeaders = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(columnHeaders).toEqual(["Capability", ...comparisonSystems.map((system) => system.name)]);

    const rowHeaders = screen.getAllByRole("rowheader").filter((header) => header.getAttribute("scope") === "row");
    expect(rowHeaders).toHaveLength(categories.length);
    categories.forEach((category, index) => {
      expect(rowHeaders[index].textContent?.startsWith(category.label)).toBe(true);
    });

    const groupHeaders = screen.getAllByRole("rowheader").filter((header) => header.getAttribute("scope") === "rowgroup");
    expect(groupHeaders.map((header) => header.textContent)).toEqual(comparisonGroups.map((group) => group.label));
  });

  it("states unverified cells in words, with no source affordance", () => {
    const categories = setup();
    const unverified = screen.getAllByText("Not yet verified");
    expect(unverified).toHaveLength(countUnverified(categories));
    for (const node of unverified) {
      expect(within(node.closest("td") as HTMLElement).queryByText("Source")).not.toBeInTheDocument();
    }
  });

  it("marks glyphs decorative so the visible text is the accessible value", () => {
    setup();
    const glyphs = Array.from(document.querySelectorAll("table svg"));
    expect(glyphs.length).toBeGreaterThan(0);
    for (const svg of glyphs) expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});

describe("ComparisonTable source details", () => {
  it("offers a Source disclosure on every populated cell and none elsewhere", () => {
    const categories = setup();
    const populated = categories.length * comparisonSystems.length - countUnverified(categories);
    expect(document.querySelectorAll("td details")).toHaveLength(populated);
  });

  it("names each disclosure by system and capability, so it is not an ambiguous 'Source'", () => {
    setup();
    const summary = screen.getByText((_, el) => el?.tagName === "SUMMARY" && /Carbon, Figma support/.test(el.textContent ?? ""));
    expect(summary.textContent).toMatch(/Source\s+and notes for Carbon, Figma support/);
  });

  it("reveals the note, an external source link and the verification date when opened", async () => {
    setup();
    const user = userEvent.setup();
    const summary = screen.getByText((_, el) => el?.tagName === "SUMMARY" && /Atlassian, Deterministic validation/.test(el.textContent ?? ""));
    const details = summary.closest("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);

    // jsdom does not implement Enter/Space activation of <summary>; that is covered in the real-browser check.
    await user.click(summary);
    expect(details.open).toBe(true);

    expect(within(details).getByText(/Design-system and UI styling-standard rules/)).toBeInTheDocument();
    // jsdom caches the closed-<details> state for accessible-name computation, so match on text (names are checked in the browser).
    const links = within(details).getAllByRole("link", { hidden: true });
    const link = links.find((candidate) => candidate.getAttribute("href") === "https://atlassian.design/llms.txt") as HTMLElement;
    expect(link.textContent).toBe("Atlassian Design System llms.txt (opens in a new tab)");
    expect(link).toHaveAttribute("href", "https://atlassian.design/llms.txt");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("rel")).toContain("noreferrer");
    const time = within(details).getByText("Oct 17, 2026");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-10-17");
  });

  it("toggles on a pointer tap, as on touch devices", async () => {
    setup();
    const user = userEvent.setup();
    const summary = screen.getByText((_, el) => el?.tagName === "SUMMARY" && /Spectrum, Registry installability/.test(el.textContent ?? ""));
    const details = summary.closest("details") as HTMLDetailsElement;
    await user.click(summary);
    expect(details.open).toBe(true);
    expect(within(details).getByText(/not React Spectrum S2/)).toBeInTheDocument();
    await user.click(summary);
    expect(details.open).toBe(false);
  });

  it("does not show raw URLs as visible cell text", () => {
    setup();
    const text = (document.querySelector("table") as HTMLElement).textContent ?? "";
    expect(text).not.toMatch(/https?:\/\//);
  });
});
