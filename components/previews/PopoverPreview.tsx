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
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function PopoverPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Non-modal supplementary panel anchored to a trigger with collision-aware placement."
      >
        <PreviewGroup label="Informational">
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button type="button">View details</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>Documentation status</PopoverTitle>
              <PopoverDescription>
                Popover supplements the page without blocking background interaction.
              </PopoverDescription>
              <PopoverBody>
                <p className="text-sm text-ink-700">
                  Use Popover for richer content or a small set of related options.
                </p>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Interactive settings" description='focusMode="content" for mini-workflows.'>
        <Popover focusMode="content" placement="bottom" align="start">
          <PopoverTrigger>
            <Button type="button" variant="secondary">
              Quick settings
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverClose />
            <PopoverTitle>Preview settings</PopoverTitle>
            <PopoverBody>
              <Switch defaultChecked label="Show token names" />
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </ComponentPreview>

      <ComponentPreview title="Edge collision">
        <div className="flex justify-end">
          <Popover placement="right">
            <PopoverTrigger>
              <Button type="button">Near viewport edge</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>Placement</PopoverTitle>
              <PopoverBody>
                <p className="text-sm text-ink-700">
                  Popover flips or shifts to remain inside the viewport.
                </p>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </div>
      </ComponentPreview>

      <ComponentPreview title="Nested inside Dialog">
        <Dialog>
          <DialogTrigger>
            <Button type="button">Open dialog with popover</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nested overlays</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <Popover placement="bottom">
                <PopoverTrigger>
                  <Button type="button" variant="secondary">
                    Open nested popover
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverTitle>Inside dialog</PopoverTitle>
                  <PopoverBody>
                    <p className="text-sm text-ink-700">
                      Escape closes Popover first, then Dialog. Background remains inert because of
                      Dialog.
                    </p>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
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
