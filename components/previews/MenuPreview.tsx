"use client";

import {
  Copy,
  DownloadSimple,
  FolderOpen,
  PencilSimple,
  Trash,
  UserCircle,
} from "@phosphor-icons/react";
import { useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/Menu";
import { Button } from "@/components/ui/Button";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function MenuPreview() {
  const [lastAction, setLastAction] = useState("No action yet");
  const [controlledOpen, setControlledOpen] = useState(false);

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Menu is a compact command list — not for navigation landmarks or form value selection. Dropdown Menu is this same Menu pattern opened from a trigger."
      >
        <PreviewGroup label="Project actions">
          <Menu>
            <MenuTrigger>
              <Button type="button" variant="secondary">
                Project actions
              </Button>
            </MenuTrigger>
            <MenuContent aria-label="Project actions">
              <MenuItem
                icon={<PencilSimple size={16} weight="bold" />}
                shortcut="⌘E"
                onSelect={() => setLastAction("Edit profile")}
              >
                Edit profile
              </MenuItem>
              <MenuItem
                icon={<Copy size={16} weight="bold" />}
                onSelect={() => setLastAction("Duplicate")}
              >
                Duplicate
              </MenuItem>
              <MenuItem
                icon={<FolderOpen size={16} weight="bold" />}
                onSelect={() => setLastAction("Move to folder")}
              >
                Move to folder
              </MenuItem>
              <MenuItem
                icon={<DownloadSimple size={16} weight="bold" />}
                onSelect={() => setLastAction("Download")}
              >
                Download
              </MenuItem>
              <MenuSeparator />
              <MenuItem destructive icon={<Trash size={16} weight="bold" />} onSelect={() => setLastAction("Delete project")}>
                Delete project
              </MenuItem>
            </MenuContent>
          </Menu>
          <p className="mt-3 text-sm text-ink-600">Last action: {lastAction}</p>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Disabled item and keyboard navigation">
        <Menu>
          <MenuTrigger>
            <Button type="button">More actions</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem onSelect={() => setLastAction("Archive")}>Archive</MenuItem>
            <MenuItem disabled onSelect={() => setLastAction("Should not run")}>
              Export (disabled)
            </MenuItem>
            <MenuItem onSelect={() => setLastAction("Share link")}>Share link</MenuItem>
          </MenuContent>
        </Menu>
      </ComponentPreview>

      <ComponentPreview title="Groups and separators">
        <Menu>
          <MenuTrigger>
            <Button type="button" variant="secondary">
              Account menu
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuGroup label="Account">
              <MenuItem icon={<UserCircle size={16} weight="bold" />}>View profile</MenuItem>
              <MenuItem>Settings</MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuItem>Sign out</MenuItem>
          </MenuContent>
        </Menu>
      </ComponentPreview>

      <ComponentPreview title="Controlled open state">
        <Menu open={controlledOpen} onOpenChange={setControlledOpen}>
          <MenuTrigger>
            <Button type="button">Controlled menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem onSelect={() => setControlledOpen(false)}>Close from item</MenuItem>
          </MenuContent>
        </Menu>
      </ComponentPreview>

      <ComponentPreview title="Long menu with internal scrolling">
        <Menu>
          <MenuTrigger>
            <Button type="button">Sort by</Button>
          </MenuTrigger>
          <MenuContent>
            {[
              "Name",
              "Created date",
              "Updated date",
              "Owner",
              "Status",
              "Priority",
              "Size",
              "Type",
              "Folder",
              "Tag",
              "Last opened",
              "Popularity",
            ].map((label) => (
              <MenuItem key={label} textValue={label} onSelect={() => setLastAction(`Sort by ${label}`)}>
                {label}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      </ComponentPreview>

      <ComponentPreview title="Menu inside Dialog">
        <Dialog>
          <DialogTrigger>
            <Button type="button">Open dialog with menu</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nested overlays</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <Menu>
                <MenuTrigger>
                  <Button type="button" variant="secondary">
                    Row actions
                  </Button>
                </MenuTrigger>
                <MenuContent>
                  <MenuItem onSelect={() => setLastAction("Rename row")}>Rename</MenuItem>
                  <MenuItem onSelect={() => setLastAction("Remove row")}>Remove</MenuItem>
                </MenuContent>
              </Menu>
            </DialogBody>
          </DialogContent>
        </Dialog>
      </ComponentPreview>
    </div>
  );
}
