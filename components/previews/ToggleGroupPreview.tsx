"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";
import {
  PreviewModeProvider,
  previewShapeModes,
  previewSurfaceModes,
  usePreviewMode,
} from "@/components/docs/PreviewMode";

function modeLabel(mode: string) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function ToggleGroupModeControls() {
  const { surface, shape, setSurface, setShape } = usePreviewMode();

  return (
    <div className="mb-5 flex flex-wrap gap-5" data-testid="toggle-group-preview-mode-controls">
      <fieldset>
        <legend className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-500">
          Surface
        </legend>
        <div className="inline-flex rounded-lg border border-ink-200 bg-white p-1" aria-label="Surface mode">
          {previewSurfaceModes.map((mode) => {
            const active = surface === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100"
                }`}
                onClick={() => setSurface(mode)}
              >
                {modeLabel(mode)}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-500">
          Shape
        </legend>
        <div className="inline-flex flex-wrap rounded-lg border border-ink-200 bg-white p-1" aria-label="Shape mode">
          {previewShapeModes.map((mode) => {
            const active = shape === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100"
                }`}
                onClick={() => setShape(mode)}
              >
                {modeLabel(mode)}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function LiveGroup() {
  const [value, setValue] = useState("list");

  return (
    <div className="space-y-2">
      <ToggleGroup aria-label="View mode" value={value} onValueChange={setValue}>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>
      <p className="font-mono text-[11px] text-ink-500" data-testid="toggle-group-value">
        Value: {value}
      </p>
    </div>
  );
}

function ToggleGroupExamples() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Exclusive radiogroup selection with segmented chrome. Segmented Control is this presentation — not a separate component."
        controls={<ToggleGroupModeControls />}
      >
        <PreviewGroup label="Interactive">
          <LiveGroup />
        </PreviewGroup>
        <PreviewGroup label="Three options">
          <ToggleGroup aria-label="Period" defaultValue="week">
            <ToggleGroupItem value="day">Day</ToggleGroupItem>
            <ToggleGroupItem value="week">Week</ToggleGroupItem>
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
          </ToggleGroup>
        </PreviewGroup>
        <PreviewGroup label="Disabled group">
          <ToggleGroup aria-label="View mode" defaultValue="list" disabled>
            <ToggleGroupItem value="list">List</ToggleGroupItem>
            <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          </ToggleGroup>
        </PreviewGroup>
        <PreviewGroup label="Disabled item">
          <ToggleGroup aria-label="Alignment" defaultValue="left">
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="center" disabled>
              Center
            </ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        </PreviewGroup>
        <PreviewGroup label="Vertical">
          <ToggleGroup aria-label="Density" defaultValue="comfortable" orientation="vertical">
            <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
            <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
          </ToggleGroup>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}

export function ToggleGroupPreview() {
  return (
    <PreviewModeProvider>
      <ToggleGroupExamples />
    </PreviewModeProvider>
  );
}
