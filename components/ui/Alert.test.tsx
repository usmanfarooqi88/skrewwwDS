import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "@/components/ui/Alert";

describe("Alert", () => {
  it("description tokens alias semantic-text-secondary, not content-muted", () => {
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
    const feedbackCss = readFileSync(
      resolve(process.cwd(), "components/ui/internal/feedback-surface.module.css"),
      "utf8",
    );

    expect(tokens).toMatch(/--semantic-text-secondary:\s*var\(--primitive-color-neutral-600\)/);
    expect(tokens).toMatch(/--primitive-color-neutral-600:\s*#5b5f68/i);

    for (const status of ["info", "success", "warning", "error"] as const) {
      expect(tokens).toMatch(
        new RegExp(`--feedback-${status}-text:\\s*var\\(--semantic-text-secondary\\)`),
      );
      expect(tokens).not.toMatch(
        new RegExp(`--feedback-${status}-text:\\s*var\\(--component-surface-content-muted\\)`),
      );
      expect(feedbackCss).toMatch(
        new RegExp(`\\.${status}[\\s\\S]*?--feedback-text:\\s*var\\(--feedback-${status}-text\\)`),
      );
    }

    expect(feedbackCss).toMatch(/\.description[\s\S]*?color:\s*var\(--feedback-text\)/);
    expect(feedbackCss).toMatch(/\.title[\s\S]*?color:\s*var\(--feedback-title\)/);
    expect(tokens).toMatch(/--feedback-info-title:\s*var\(--semantic-text-primary\)/);
    expect(tokens).toMatch(/--feedback-success-title:\s*var\(--semantic-text-primary\)/);
    expect(tokens).toMatch(/--feedback-warning-title:\s*var\(--semantic-text-primary\)/);
    expect(tokens).toMatch(/--feedback-error-title:\s*var\(--semantic-text-primary\)/);
    expect(tokens).toMatch(/--component-surface-content-muted:\s*var\(--semantic-icon-muted\)/);
    expect(feedbackCss).toMatch(/\.toast[\s\S]*?--feedback-text:\s*var\(--semantic-text-primary\)/);
  });

  it("resolves Info/Success/Warning/Error description color to #5B5F68 via semantic-text-secondary", () => {
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
    const feedbackCss = readFileSync(
      resolve(process.cwd(), "components/ui/internal/feedback-surface.module.css"),
      "utf8",
    );

    expect(tokens).toMatch(/--primitive-color-neutral-600:\s*#5b5f68/i);
    expect(tokens).toMatch(/--semantic-text-secondary:\s*var\(--primitive-color-neutral-600\)/);
    expect(feedbackCss).toMatch(/\.description[\s\S]*?color:\s*var\(--feedback-text\)/);

    for (const status of ["info", "success", "warning", "error"] as const) {
      expect(tokens).toMatch(
        new RegExp(`--feedback-${status}-text:\\s*var\\(--semantic-text-secondary\\)`),
      );
    }

    render(<Alert type="info" title="Title" description="Info description" />);
    expect(screen.getByText("Info description")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("error status icon stays on feedback-error-icon → semantic-icon-danger (#E5484D)", () => {
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
    const feedbackCss = readFileSync(
      resolve(process.cwd(), "components/ui/internal/feedback-surface.module.css"),
      "utf8",
    );
    expect(tokens).toMatch(/--feedback-error-icon:\s*var\(--semantic-icon-danger\)/);
    expect(tokens).toMatch(
      /--semantic-icon-danger:\s*var\(--primitive-color-danger-500\)/,
    );
    expect(tokens).toMatch(/--primitive-color-danger-500:\s*#e5484d/i);
    expect(feedbackCss).toMatch(
      /\.error[\s\S]*?--feedback-icon:\s*var\(--feedback-error-icon\)/,
    );
  });

  it("renders visible status text", () => {
    render(<Alert type="warning" title="Review required" description="Check the upload settings." />);
    expect(screen.getByText("Review required")).toBeInTheDocument();
    expect(screen.getByText("Check the upload settings.")).toBeInTheDocument();
  });

  it("does not announce statically by default", () => {
    render(<Alert type="error" title="Error" description="Something failed." />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("supports assertive announcement when requested", () => {
    render(
      <Alert
        type="error"
        title="Error"
        description="Something failed."
        announce="assertive"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Something failed.");
  });

  it("hides icon from assistive technology", () => {
    const { container } = render(<Alert type="info" description="Info message." />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("supports dismiss action", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert type="info" description="Dismiss me." dismissible onDismiss={onDismiss} />);
    await user.click(screen.getByRole("button", { name: "Dismiss alert" }));
    expect(onDismiss).toHaveBeenCalled();
    expect(screen.queryByText("Dismiss me.")).not.toBeInTheDocument();
  });
});
