import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartMetric } from "@/components/ui/ChartMetric";

describe("ChartMetric", () => {
  it("renders the label and value with no delta when none is given", () => {
    render(<ChartMetric label="Total balance" value="$4,231.09" />);
    expect(screen.getByText("Total balance")).toBeInTheDocument();
    expect(screen.getByText("$4,231.09")).toBeInTheDocument();
  });

  it("renders the delta value and optional comparison label as visible text", () => {
    render(<ChartMetric label="Revenue" value="$12,000" delta={{ direction: "up", value: "+4.2%", label: "vs last 30 days" }} />);
    expect(screen.getByText("+4.2%")).toBeInTheDocument();
    expect(screen.getByText("vs last 30 days")).toBeInTheDocument();
  });

  it.each([
    ["up", "Increased"],
    ["down", "Decreased"],
    ["flat", "Unchanged"],
  ] as const)("announces %s as the visually-hidden word %s, not only via the icon", (direction, word) => {
    const { container } = render(<ChartMetric label="Orders" value="120" delta={{ direction, value: "3" }} />);
    expect(screen.getByText(word, { exact: false })).toHaveClass("sr-only");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("colors .delta with the same neutral text token as .label, never a status/feedback color — proven against the real compiled stylesheet, not direction-specific classes", () => {
    const css = readFileSync(join(process.cwd(), "components/ui/chart-metric.module.css"), "utf8");
    const declaration = (selector: string, property: string) => {
      const rule = css.match(new RegExp(`\\.${selector}\\s*\\{[^}]*\\}`));
      expect(rule, `.${selector} rule not found`).not.toBeNull();
      const decl = rule![0].match(new RegExp(`${property}\\s*:\\s*([^;]+);`));
      expect(decl, `${property} not declared on .${selector}`).not.toBeNull();
      return decl![1].trim();
    };
    const deltaColor = declaration("delta", "color");
    expect(deltaColor).toBe(declaration("label", "color"));
    expect(deltaColor).not.toMatch(/--semantic-feedback-(success|error|warning|info)/);
    // No per-direction class exists at all — direction never selects a different style.
    expect(css).not.toMatch(/\.(up|down|flat)\s*\{/);
  });

  it("applies the given className to the root", () => {
    const { container } = render(<ChartMetric label="x" value="1" className="custom" />);
    expect(container.firstElementChild).toHaveClass("custom");
  });
});
