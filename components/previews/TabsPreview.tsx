"use client";

import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/Tabs";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function TabsPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview title="Live preview" description="Keyboard-operable related views within the same context.">
        <Tabs defaultValue="overview" activationMode="automatic">
          <TabsList aria-label="Documentation examples">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsPanel value="overview">
            <p className="text-sm text-ink-700">Overview panel for preview-only content.</p>
          </TabsPanel>
          <TabsPanel value="tokens">
            <p className="text-sm text-ink-700">Token references stay in server-rendered docs.</p>
          </TabsPanel>
          <TabsPanel value="notes">
            <p className="text-sm text-ink-700">Use Arrow keys, Home, and End on the tab list.</p>
          </TabsPanel>
        </Tabs>
      </ComponentPreview>

      <ComponentPreview title="Manual activation">
        <Tabs defaultValue="draft" activationMode="manual">
          <TabsList aria-label="Manual activation example">
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
          <TabsPanel value="draft">
            <p className="text-sm text-ink-700">Manual activation waits for Enter/Space or click.</p>
          </TabsPanel>
          <TabsPanel value="published">
            <p className="text-sm text-ink-700">Use manual mode when panel content is expensive.</p>
          </TabsPanel>
        </Tabs>
      </ComponentPreview>
    </div>
  );
}
