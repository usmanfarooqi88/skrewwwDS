import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  resetBackgroundInertForTests,
  supportsInert,
} from "@/components/ui/internal/useBackgroundInert";
import { createRef } from "react";
import * as PublicUi from "@/components/ui";

function BasicDialog({ closeOnOverlayClick = true }: { closeOnOverlayClick?: boolean }) {
  return (
    <Dialog closeOnOverlayClick={closeOnOverlayClick}>
      <DialogTrigger>
        <Button type="button">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <DialogDescription>Dialog description text.</DialogDescription>
        <DialogBody>
          <button type="button">Inside dialog</button>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  afterEach(() => {
    resetBackgroundInertForTests();
  });

  it("opens from trigger and exposes dialog semantics", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(screen.getByText("Dialog title")).toBeInTheDocument();
  });

  it("closes from close button and escape", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("associates description with aria-describedby", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-describedby")).toContain(
      screen.getByText("Dialog description text.").id,
    );
  });

  it("locks body scroll while open", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("uses type=button for non-submit footer controls", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute("type", "button");
  });

  it("supports controlled open state", () => {
    render(
      <Dialog open onOpenChange={vi.fn()}>
        <DialogContent>
          <DialogTitle>Controlled</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Controlled");
  });

  it("traps tab focus within the dialog", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Inside dialog" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
  });

  it("restores focus to trigger on close", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("requests controlled closure without silently ignoring escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Controlled dialog</DialogTitle>
          <DialogClose />
        </DialogContent>
      </Dialog>,
    );

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false, "escape-key");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("uses initialFocusRef when provided", async () => {
    const initialFocusRef = createRef<HTMLButtonElement>();

    render(
      <Dialog defaultOpen>
        <DialogContent initialFocusRef={initialFocusRef}>
          <DialogTitle>Focus target</DialogTitle>
          <DialogBody>
            <button ref={initialFocusRef} type="button">
              Preferred focus
            </button>
            <button type="button">Other control</button>
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("button", { name: "Preferred focus" })).toHaveFocus();
  });

  it("restores finalFocusRef when provided", async () => {
    const user = userEvent.setup();
    const finalFocusRef = createRef<HTMLButtonElement>();

    render(
      <div>
        <button ref={finalFocusRef} type="button">
          Final target
        </button>
        <Dialog>
          <DialogTrigger>
            <Button type="button">Open dialog</Button>
          </DialogTrigger>
          <DialogContent finalFocusRef={finalFocusRef}>
            <DialogTitle>Focus restore</DialogTitle>
            <DialogClose />
          </DialogContent>
        </Dialog>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Final target" })).toHaveFocus();
  });

  it("inerts background siblings while open", async () => {
    if (!supportsInert()) return;

    const user = userEvent.setup();
    const background = document.createElement("main");
    document.body.prepend(background);

    render(<BasicDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(background.inert).toBe(true);

    await user.keyboard("{Escape}");
    expect(background.inert).toBe(false);
    background.remove();
  });

  it("warns in development when dialog has no accessible title", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogBody>Unnamed dialog</DialogBody>
        </DialogContent>
      </Dialog>,
    );

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  // Regression guard: DialogTrigger composes a caller-supplied ref with its
  // own via cloneElement. Reading element.ref directly (instead of
  // child.props.ref) is the exact API React 19 deprecated — but React only
  // installs the warning getter on an element when it actually carries a
  // ref, so the trigger's child must supply one (matching real composed-ref
  // usage) or this test would pass regardless of the bug. React also warns
  // only once per element-type name for the module's life, so this uses a
  // bare native <button> — every other trigger in this file wraps its child
  // in the shared <Button> component, so "button" is guaranteed untouched
  // here; reusing an already-warned type would silently mask a regression.
  it("does not access the deprecated element.ref API when opened", async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const callerRef = createRef<HTMLButtonElement>();
    render(
      <Dialog>
        <DialogTrigger>
          <button type="button" ref={callerRef}>
            Open dialog
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogBody>Content</DialogBody>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(callerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(
      error.mock.calls.some((call) => String(call[0]).includes("element.ref")),
    ).toBe(false);
    error.mockRestore();
  });

  it("does not export internal overlay utilities", () => {
    expect(Object.keys(PublicUi)).not.toContain("Portal");
    expect(Object.keys(PublicUi)).not.toContain("useBackgroundInert");
    expect(Object.keys(PublicUi)).not.toContain("registerOverlay");
  });

  it("composes arbitrary body and footer ReactNode and unmounts them when closed", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>
          <Button type="button">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compose</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <div data-testid="custom-dialog-content">
              <p>Custom content</p>
              <Button>Action</Button>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
            <Button type="button">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("custom-dialog-content")).not.toBeInTheDocument();
    expect(screen.queryByText(/add content/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = screen.getByRole("dialog", { name: "Compose" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getAllByTestId("custom-dialog-content")).toHaveLength(1);
    const content = screen.getByTestId("custom-dialog-content");
    expect(content).toHaveTextContent("Custom content");
    expect(within(content).getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("custom-dialog-content")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByTestId("custom-dialog-content")).toHaveTextContent("Custom content");
    expect(
      within(screen.getByTestId("custom-dialog-content")).getByRole("button", { name: "Action" }),
    ).toBeInTheDocument();
  });
});

describe("Dialog overlay dismissal", () => {
  it("closes when overlay click is enabled", async () => {
    const user = userEvent.setup();
    render(<BasicDialog closeOnOverlayClick />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const backdrop = screen.getByRole("dialog").previousElementSibling;
    expect(backdrop).toBeTruthy();
    await act(async () => {
      fireEvent.mouseDown(backdrop!);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
