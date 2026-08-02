import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyCodeButton } from "@/components/docs/CopyCodeButton";
import { ToastProvider } from "@/components/ui/ToastProvider";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock("@/lib/analytics", () => ({ trackEvent }));

function renderCopyButton(code: string, slug: string) {
  return render(
    <ToastProvider>
      <CopyCodeButton code={code} slug={slug} />
    </ToastProvider>,
  );
}

afterEach(() => {
  trackEvent.mockClear();
});

describe("CopyCodeButton", () => {
  it("copies the given code to the clipboard", async () => {
    // userEvent.setup() attaches its own navigator.clipboard stub (real
    // methods, not spies) — spy on it after setup rather than predefining
    // navigator.clipboard, which setup() would just overwrite anyway.
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    renderCopyButton("const x = 1;", "button");
    await user.click(screen.getByRole("button", { name: "Copy code example" }));
    expect(writeText).toHaveBeenCalledExactlyOnceWith("const x = 1;");
  });

  it("fires component_code_copied with the component's slug, never the copied code", async () => {
    const user = userEvent.setup();
    renderCopyButton("const x = 1;", "button");
    await user.click(screen.getByRole("button", { name: "Copy code example" }));
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("component_code_copied", {
      slug: "button",
    });
  });
});
