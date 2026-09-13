"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/Menu";
import { SplitButton } from "@/components/ui/SplitButton";
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

function SplitButtonModeControls() {
  const { surface, shape, setSurface, setShape } = usePreviewMode();

  return (
    <div className="mb-5 flex flex-wrap gap-5" data-testid="split-button-preview-mode-controls">
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

function SaveSplit({
  variant,
  divider,
  size = "md",
  primaryDisabled = false,
  menuDisabled = false,
  loading = false,
  groupLabel,
}: {
  variant: "primary" | "secondary" | "danger";
  divider: "primary" | "neutral" | "danger";
  size?: "sm" | "md" | "lg";
  primaryDisabled?: boolean;
  menuDisabled?: boolean;
  loading?: boolean;
  groupLabel: string;
}) {
  const [lastAction, setLastAction] = useState("No action yet");
  const iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;

  return (
    <div className="space-y-2">
      <SplitButton aria-label={groupLabel} divider={divider}>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={primaryDisabled}
          loading={loading}
          onClick={() => setLastAction("Saved")}
        >
          Save
        </Button>
        <Menu disabled={menuDisabled}>
          <MenuTrigger>
            <Button
              type="button"
              variant={variant}
              size={size}
              disabled={menuDisabled}
              aria-label={`${groupLabel} menu`}
            >
              <CaretDown size={iconSize} weight="bold" />
            </Button>
          </MenuTrigger>
          <MenuContent aria-label={`${groupLabel} menu`}>
            <MenuItem onSelect={() => setLastAction("Saved as draft")}>Save as draft</MenuItem>
            <MenuItem onSelect={() => setLastAction("Saved and published")}>
              Save and publish
            </MenuItem>
          </MenuContent>
        </Menu>
      </SplitButton>
      <p className="font-mono text-[11px] text-ink-500" data-testid={`${groupLabel}-last-action`}>
        Last action: {lastAction}
      </p>
    </div>
  );
}

function SplitButtonExamples() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Primary Button + MenuTrigger Button joined with Button Group chrome. Menu owns the popup; Split Button owns adjacency only."
        controls={<SplitButtonModeControls />}
      >
        <PreviewGroup label="Primary (divider=primary)">
          <SaveSplit variant="primary" divider="primary" groupLabel="Save options" />
        </PreviewGroup>
        <PreviewGroup label="Secondary (divider=neutral)">
          <SaveSplit variant="secondary" divider="neutral" groupLabel="Secondary save" />
        </PreviewGroup>
        <PreviewGroup label="Danger (divider=danger)">
          <SaveSplit variant="danger" divider="danger" groupLabel="Destructive save" />
        </PreviewGroup>
        <PreviewGroup label="Sizes">
          <div className="flex flex-wrap items-end gap-4">
            <SaveSplit variant="primary" divider="primary" size="sm" groupLabel="Small save" />
            <SaveSplit variant="primary" divider="primary" size="md" groupLabel="Medium save" />
            <SaveSplit variant="primary" divider="primary" size="lg" groupLabel="Large save" />
          </div>
        </PreviewGroup>
        <PreviewGroup label="Disabled primary">
          <SaveSplit
            variant="primary"
            divider="primary"
            primaryDisabled
            groupLabel="Disabled primary save"
          />
        </PreviewGroup>
        <PreviewGroup label="Disabled menu">
          <SaveSplit
            variant="primary"
            divider="primary"
            menuDisabled
            groupLabel="Disabled menu save"
          />
        </PreviewGroup>
        <PreviewGroup label="Loading primary">
          <SaveSplit variant="primary" divider="primary" loading groupLabel="Loading save" />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}

export function SplitButtonPreview() {
  return (
    <PreviewModeProvider>
      <SplitButtonExamples />
    </PreviewModeProvider>
  );
}
