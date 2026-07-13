"use client";

import { Folder } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListItem } from "@/components/ui/ListItem";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function ListItemPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Compose rows inside native ul/ol lists. Only one root interactive element per row."
      >
        <PreviewGroup label="Static / avatar / metadata / badge">
          <ul className="w-full max-w-lg rounded-lg border border-ink-200 p-1">
            <ListItem
              leading={<Avatar size="sm" initials="UF" label="Usman Farooqi" decorative />}
              title="Usman Farooqi"
              description="Updated Button documentation"
              metadata="2h ago"
            />
            <ListItem
              leading={<Folder size={20} aria-hidden="true" />}
              title="Design tokens"
              description="Foundations reference"
              metadata={<Badge variant="info">Beta</Badge>}
            />
          </ul>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Interactive modes">
        <PreviewGroup label="Navigational / action / trailing action">
          <ul className="w-full max-w-lg rounded-lg border border-ink-200 p-1">
            <ListItem
              href="/components/button"
              title="Button"
              description="Primary actions and links-as-buttons"
            />
            <ListItem
              onClick={() => undefined}
              title="Show archived components"
              description="Action row using a native button"
            />
            <ListItem
              title="Registry export"
              description="Static row with separate trailing action"
              trailing={
                <Button type="button" size="sm" variant="secondary">
                  Download
                </Button>
              }
            />
          </ul>
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          Do not combine a row-level href or onClick with an interactive trailing control — use a
          static row when a separate trailing action is required.
        </p>
      </ComponentPreview>
    </div>
  );
}
