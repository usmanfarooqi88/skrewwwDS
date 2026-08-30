import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "@/components/ui/ToastProvider";

function ToastDemo() {
  const { toast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        toast({ type: "success", title: "Saved", description: "Changes were saved." })
      }
    >
      Trigger toast
    </button>
  );
}

describe("Toast", () => {
  it("error status icon stays on feedback-error-icon → semantic-icon-danger (#E5484D)", () => {
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
    const feedbackCss = readFileSync(
      resolve(process.cwd(), "components/ui/internal/feedback-surface.module.css"),
      "utf8",
    );
    const toastSrc = readFileSync(
      resolve(process.cwd(), "components/ui/ToastProvider.tsx"),
      "utf8",
    );
    expect(tokens).toMatch(/--feedback-error-icon:\s*var\(--semantic-icon-danger\)/);
    expect(tokens).toMatch(/--primitive-color-danger-500:\s*#e5484d/i);
    expect(feedbackCss).toMatch(
      /\.error[\s\S]*?--feedback-icon:\s*var\(--feedback-error-icon\)/,
    );
    expect(toastSrc).toMatch(/FeedbackSurface/);
    // Toast surface overrides card chrome only — error icons still inherit .error token map
    expect(feedbackCss).toMatch(/\.toast[\s\S]*?--feedback-surface:\s*var\(--component-card-surface\)/);
    expect(feedbackCss).toMatch(/\.toast[\s\S]*?--feedback-text:\s*var\(--semantic-text-primary\)/);
    expect(feedbackCss).not.toMatch(/\.toast[\s\S]*?--feedback-icon:/);
  });

  it("creates and dismisses a toast", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Trigger toast" }));
    expect(screen.getByText("Changes were saved.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Changes were saved.")).not.toBeInTheDocument();
  });

  it("auto-dismisses after duration", () => {
    vi.useFakeTimers();

    function Demo() {
      const { toast } = useToast();
      return (
        <button
          type="button"
          onClick={() =>
            toast({
              type: "info",
              description: "Temporary message",
              duration: 1000,
            })
          }
        >
          Show
        </button>
      );
    }

    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByText("Temporary message")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText("Temporary message")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
