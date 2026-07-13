"use client";

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
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function DrawerPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Left-anchored modal panel with the same focus, inert and dismissal model as Dialog."
      >
        <PreviewGroup label="Settings panel">
          <Drawer placement="left">
            <DrawerTrigger>
              <Button type="button">Open drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Documentation settings</DrawerTitle>
                <DrawerClose />
              </DrawerHeader>
              <DrawerDescription>
                Drawer slides from the viewport edge for supplementary settings or forms.
              </DrawerDescription>
              <DrawerBody>
                <p className="text-sm text-ink-700">
                  Focus moves inside the drawer while open and returns to the trigger when closed.
                </p>
              </DrawerBody>
              <DrawerFooter>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
                <Button type="button">Save</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Form drawer">
        <Drawer>
          <DrawerTrigger>
            <Button type="button" variant="secondary">
              Edit profile
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Edit profile</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              <div className="space-y-4">
                <TextInput label="Display name" defaultValue="Skrewww" />
                <TextInput label="Email" type="email" defaultValue="docs@example.com" />
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button type="button">Update</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </ComponentPreview>

      <ComponentPreview title="Long content">
        <Drawer>
          <DrawerTrigger>
            <Button type="button">Open scrolling drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Token reference</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              <div className="space-y-3 text-sm text-ink-700">
                {Array.from({ length: 14 }, (_, index) => (
                  <p key={index}>
                    Token group {index + 1}. Drawer body scrolls internally while the page behind
                    remains locked and inert.
                  </p>
                ))}
              </div>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </ComponentPreview>

      <ComponentPreview title="Popover inside Drawer">
        <Drawer>
          <DrawerTrigger>
            <Button type="button">Open drawer with popover</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Nested overlays</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              <Popover placement="bottom">
                <PopoverTrigger>
                  <Button type="button" variant="secondary">
                    Open nested popover
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverTitle>Inside drawer</PopoverTitle>
                  <PopoverBody>
                    <p className="text-sm text-ink-700">
                      Escape closes Popover first, then Drawer. Background stays inert because of
                      Drawer.
                    </p>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </ComponentPreview>
    </div>
  );
}
