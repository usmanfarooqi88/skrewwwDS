"use client";

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
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function DialogPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview title="Live preview" description="Modal dialog with background inert, focus trap, and backdrop dismissal.">
        <PreviewGroup label="Informational">
          <Dialog>
            <DialogTrigger>
              <Button type="button">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Beta documentation</DialogTitle>
                <DialogClose />
              </DialogHeader>
              <DialogDescription>
                Dialog interrupts workflow for focused attention or a required decision.
              </DialogDescription>
              <DialogBody>
                <p className="text-sm text-ink-700">
                  Focus moves inside the dialog while open and returns to this trigger when closed.
                </p>
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
                <Button type="button">Continue</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Long content">
        <Dialog>
          <DialogTrigger>
            <Button type="button" variant="secondary">
              Open scrolling dialog
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keyboard interaction details</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <div className="space-y-3 text-sm text-ink-700">
                {Array.from({ length: 12 }, (_, index) => (
                  <p key={index}>
                    Paragraph {index + 1}. Dialog body scrolls inside the viewport while the page
                    behind remains locked.
                  </p>
                ))}
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button">Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ComponentPreview>
    </div>
  );
}
