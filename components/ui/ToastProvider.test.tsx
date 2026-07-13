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
