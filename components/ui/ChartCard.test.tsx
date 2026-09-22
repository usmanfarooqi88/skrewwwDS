import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartCard } from "@/components/ui/ChartCard";

describe("ChartCard — header and composition", () => {
  it("renders no header when title, description, and actions are all omitted", () => {
    const { container } = render(<ChartCard>content</ChartCard>);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(container.querySelector('[class*="header"]')).toBeNull();
  });

  it("renders title, description, and actions together, with the given heading level", () => {
    render(
      <ChartCard title="Revenue" description="Last 30 days" headingLevel="h2" actions={<button>Export</button>}>
        content
      </ChartCard>,
    );
    const heading = screen.getByRole("heading", { name: "Revenue", level: 2 });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("defaults to an h3 heading, matching Card's own default", () => {
    render(<ChartCard title="Revenue">content</ChartCard>);
    expect(screen.getByRole("heading", { level: 3, name: "Revenue" })).toBeInTheDocument();
  });

  it("renders children only in the ready state (the default)", () => {
    render(<ChartCard>my chart</ChartCard>);
    expect(screen.getByText("my chart")).toBeInTheDocument();
  });

  it("passes elevation, footer, and className through to Card", () => {
    const { container } = render(
      <ChartCard elevation="raised" footer={<span>footer content</span>} className="custom">
        content
      </ChartCard>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("custom");
    expect(screen.getByText("footer content")).toBeInTheDocument();
    // Card's own raised styling is Card's responsibility (covered by Card.test.tsx);
    // this only proves the prop reaches Card, via the same class Card.test.tsx checks.
    expect(root.className).toMatch(/raised/);
  });
});

describe("ChartCard — state ownership", () => {
  it("loading: hides children, shows an aria-busy region with an accessible loading label, no fake data", () => {
    render(
      <ChartCard state="loading" loadingLabel="Loading revenue">
        my chart
      </ChartCard>,
    );
    expect(screen.queryByText("my chart")).toBeNull();
    expect(screen.getByText("Loading revenue")).toHaveClass("sr-only");
    const busy = document.querySelector('[aria-busy="true"]');
    expect(busy).not.toBeNull();
  });

  it("empty: hides children, shows an EmptyState with the given title and description, defaulting the title", () => {
    const { rerender } = render(
      <ChartCard state="empty" emptyTitle="No transactions" emptyDescription="Try a different range.">
        my chart
      </ChartCard>,
    );
    expect(screen.queryByText("my chart")).toBeNull();
    expect(screen.getByRole("heading", { name: "No transactions" })).toBeInTheDocument();
    expect(screen.getByText("Try a different range.")).toBeInTheDocument();

    rerender(<ChartCard state="empty">my chart</ChartCard>);
    expect(screen.getByRole("heading", { name: "No data" })).toBeInTheDocument();
  });

  it("error: hides children, shows an alert with the given message and an optional action, defaulting the title", () => {
    const { rerender } = render(
      <ChartCard state="error" errorTitle="Failed to load" errorDescription="Try again later." errorAction={<button>Retry</button>}>
        my chart
      </ChartCard>,
    );
    expect(screen.queryByText("my chart")).toBeNull();
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByText("Try again later.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();

    rerender(<ChartCard state="error">my chart</ChartCard>);
    expect(screen.getByText("Couldn't load chart")).toBeInTheDocument();
  });

  it("error is announced (role=status, aria-live=polite); loading and empty are not announced as alerts", () => {
    const { rerender } = render(
      <ChartCard state="error" errorTitle="Failed">
        x
      </ChartCard>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Failed");

    rerender(
      <ChartCard state="loading" loadingLabel="Loading">
        x
      </ChartCard>,
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();

    rerender(
      <ChartCard state="empty" emptyTitle="Empty">
        x
      </ChartCard>,
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("only one state region renders at a time", () => {
    for (const state of ["ready", "loading", "empty", "error"] as const) {
      const { container, unmount } = render(<ChartCard state={state}>content</ChartCard>);
      const regions = [
        screen.queryByText("content"),
        container.querySelector('[aria-busy="true"]'),
        screen.queryByRole("heading", { name: "No data" }),
        screen.queryByRole("status"),
      ].filter(Boolean);
      expect(regions, `state=${state} rendered ${regions.length} regions`).toHaveLength(1);
      unmount();
    }
  });
});

describe("ChartCard — layout stability", () => {
  it("reserves the same minimum body height in every state (contentHeight is a floor, not a fixed box)", () => {
    for (const state of ["ready", "loading", "empty", "error"] as const) {
      const { container, unmount } = render(
        <ChartCard state={state} contentHeight={280}>
          content
        </ChartCard>,
      );
      const content = container.querySelector('[class*="content"]') as HTMLElement;
      expect(content.style.minHeight, `state=${state}`).toBe("280px");
      unmount();
    }
  });

  it("defaults contentHeight to 240, matching a chart's own default height", () => {
    const { container } = render(<ChartCard>content</ChartCard>);
    const content = container.querySelector('[class*="content"]') as HTMLElement;
    expect(content.style.minHeight).toBe("240px");
  });
});

describe("ChartCard — Shape/Surface boundary", () => {
  it("declares no background, border, or radius property anywhere in its own stylesheet — every surface property is Card's", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const css = readFileSync(join(process.cwd(), "components/ui/chart-card.module.css"), "utf8");
    expect(css).not.toMatch(/\b(background|border|border-radius|box-shadow|backdrop-filter)\s*:/);
  });
});

describe("ChartCard — ChartMetric composition (no dedicated metric prop)", () => {
  it("renders a ChartMetric passed as a child alongside other ready content", async () => {
    const { ChartMetric } = await import("@/components/ui/ChartMetric");
    render(
      <ChartCard title="Revenue">
        <ChartMetric label="Total" value="$1,200" />
        <div>chart goes here</div>
      </ChartCard>,
    );
    expect(within(screen.getByText("Total").closest("div")!).getByText("$1,200")).toBeInTheDocument();
    expect(screen.getByText("chart goes here")).toBeInTheDocument();
  });
});
