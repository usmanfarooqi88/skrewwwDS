import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import {
  resetBackgroundInertForTests,
  supportsInert,
} from "@/components/ui/internal/useBackgroundInert";
import * as PublicUi from "@/components/ui";
import drawerStyles from "@/components/ui/drawer.module.css";

function BasicDrawer({ closeOnOverlayClick = true }: { closeOnOverlayClick?: boolean }) {
  return (
    <Drawer closeOnOverlayClick={closeOnOverlayClick} placement="left">
      <DrawerTrigger>
        <Button type="button">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer title</DrawerTitle>
          <DrawerClose />
        </DrawerHeader>
        <DrawerDescription>Drawer description text.</DrawerDescription>
        <DrawerBody>
          <button type="button">Inside drawer</button>
        </DrawerBody>
        <DrawerFooter>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

describe("Drawer", () => {
  afterEach(() => {
    resetBackgroundInertForTests();
  });

  it("opens from trigger with modal dialog semantics", async () => {
    const user = userEvent.setup();
    render(<BasicDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const drawer = screen.getByRole("dialog", { name: "Drawer title" });
    expect(drawer).toHaveAttribute("aria-modal", "true");
    expect(document.querySelector('[data-skrewww-drawer-placement="left"]')).toBeTruthy();
  });

  it("closes from close button and escape with reasons", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer onOpenChange={onOpenChange}>
        <DrawerTrigger>
          <Button type="button">Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Drawer title</DrawerTitle>
          <DrawerClose />
        </DrawerContent>
      </Drawer>,
    );

    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    await user.click(screen.getByRole("button", { name: "Close drawer" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, "close-button");

    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false, "escape-key");
  });

  it("requests controlled closure without silently closing", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer open onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerTitle>Controlled drawer</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false, "escape-key");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("uses initialFocusRef and finalFocusRef", async () => {
    const user = userEvent.setup();
    const initialFocusRef = createRef<HTMLButtonElement>();
    const finalFocusRef = createRef<HTMLButtonElement>();

    render(
      <div>
        <button ref={finalFocusRef} type="button">
          Final target
        </button>
        <Drawer defaultOpen>
          <DrawerContent initialFocusRef={initialFocusRef} finalFocusRef={finalFocusRef}>
            <DrawerTitle>Focus drawer</DrawerTitle>
            <DrawerBody>
              <button ref={initialFocusRef} type="button">
                Preferred focus
              </button>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </div>,
    );

    expect(screen.getByRole("button", { name: "Preferred focus" })).toHaveFocus();
  });

  it("locks body scroll and inerts background while open", async () => {
    if (!supportsInert()) return;
    const user = userEvent.setup();
    const background = document.createElement("main");
    document.body.prepend(background);

    render(<BasicDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(document.body.style.overflow).toBe("hidden");
    expect(background.inert).toBe(true);

    await user.keyboard("{Escape}");
    expect(background.inert).toBe(false);
    background.remove();
  });

  it("warns in development when drawer has no accessible title", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerBody>Unnamed drawer</DrawerBody>
        </DrawerContent>
      </Drawer>,
    );

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  it("applies left placement class for edge-anchored geometry", async () => {
    const user = userEvent.setup();
    render(<BasicDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const panel = screen.getByRole("dialog", { name: "Drawer title" });
    expect(panel.classList.contains(drawerStyles.left)).toBe(true);
    expect(document.querySelector('[data-skrewww-drawer-placement="left"]')).toBeTruthy();
  });

  it("does not export internal overlay infrastructure", () => {
    expect(Object.keys(PublicUi)).not.toContain("registerOverlay");
    expect(Object.keys(PublicUi)).not.toContain("useFloatingPosition");
  });
});
