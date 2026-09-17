/**
 * Pure, importable generator for the shadcn-compatible distribution layer
 * (`/r/foundation.json`, `/r/button.json`, `/r/card.json`,
 * `/r/text-input.json`, `/r/form-field.json`, `/r/validation-message.json`,
 * `/r/spinner.json`, `/r/divider.json`, `/r/link.json`,
 * `/r/radio.json`, `/r/switch.json`, `/r/textarea.json`, `/r/pagination.json`).
 * Every function here is a pure transform of real repo files or the
 * canonical registry — importing this module performs no filesystem
 * writes. The file-writing CLI entry point lives in
 * scripts/generate-shadcn-registry.ts, which imports the build* functions
 * below and is the only place `public/r/*.json` gets written.
 *
 * This generator is a second, independent distribution channel alongside
 * the still-unimplemented `@skrewww/core` + `npx skrewww` roadmap in
 * skrewww-claude-project-instructions.md — see
 * docs/architecture/shadcn-distribution.md for how the two relate.
 *
 * Scope (see docs/architecture/shadcn-distribution.md and
 * docs/distribution-expansion.md): Foundation + distributed components
 * through CE-3D (including Textarea + Pagination). Adding another
 * component means adding its file(s) to FILE_DESTINATIONS and a thin
 * `buildXManifest() { return buildComponentManifest("x"); }` wrapper —
 * buildComponentManifest itself is already generic across any
 * single-component canonical entry, including multi-hop
 * registryDependencies chains (text-input -> form-field ->
 * validation-message -> foundation) and real npm `dependencies`
 * (validation-message -> @phosphor-icons/react).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { componentRegistry } from "@/lib/component-registry";
import {
  isTypeScriptSourcePath,
  withSkrewwwComponentMarker,
} from "@/lib/guard/provenance-marker";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export type ShadcnFileType = "registry:ui" | "registry:lib" | "registry:file";

export type ShadcnRegistryFile = {
  path: string;
  content: string;
  type: ShadcnFileType;
  target: string;
};

export type ShadcnRegistryItem = {
  $schema: string;
  name: string;
  type: ShadcnFileType;
  title: string;
  description: string;
  author: string;
  dependencies: string[];
  registryDependencies: string[];
  docs?: string;
  files: ShadcnRegistryFile[];
};

/**
 * Catalog-facing file entry for `/r/registry.json`. Official Registry
 * Directory guidance requires that index `files` omit `content` — install
 * payloads stay on the individual `/r/<name>.json` manifests.
 */
export type ShadcnRegistryIndexFile = {
  path: string;
  type: ShadcnFileType;
  target?: string;
};

/** Catalog item projected from a generated install manifest (CE-3N). */
export type ShadcnRegistryIndexItem = {
  name: string;
  type: ShadcnFileType;
  title: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: ShadcnRegistryIndexFile[];
};

/**
 * Official shadcn `registry.json` root document
 * (`https://ui.shadcn.com/schema/registry.json`).
 */
export type ShadcnRegistry = {
  $schema: string;
  name: string;
  homepage: string;
  items: ShadcnRegistryIndexItem[];
};

/** Registry metadata for the generated `/r/registry.json` catalog. */
export const SKREWWW_SHADCN_REGISTRY_NAME = "skrewww";
export const SKREWWW_SHADCN_REGISTRY_HOMEPAGE = "https://skrewww.com";

export function readSourceFile(relPath: string): string {
  return readFileSync(join(REPO_ROOT, relPath), "utf8");
}

/**
 * Explicit shadcn `type` + `target` for every file this generator is
 * allowed to transport. Deliberately exhaustive with no fallback: a path
 * not listed here is a generation error (see classifyFile), not a
 * silently-assumed default. `target` is an explicit `~/`-rooted install
 * path (not left as `""`), so installation does not depend on a
 * consumer's own components.json aliases lining up with the exact paths
 * Button's own source imports (`@/lib/cn`, `@/components/ui/icons`,
 * `@/components/ui/button.module.css`) — the CLI is told exactly where
 * each file goes, regardless of consumer alias configuration.
 */
const FILE_DESTINATIONS: Record<string, { type: ShadcnFileType; target: string }> = {
  "components/ui/Button.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Button.tsx",
  },
  "components/ui/button.module.css": {
    type: "registry:ui",
    target: "~/components/ui/button.module.css",
  },
  "components/ui/icons.tsx": {
    type: "registry:ui",
    target: "~/components/ui/icons.tsx",
  },
  "components/ui/Card.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Card.tsx",
  },
  "components/ui/card.module.css": {
    type: "registry:ui",
    target: "~/components/ui/card.module.css",
  },
  "components/ui/TextInput.tsx": {
    type: "registry:ui",
    target: "~/components/ui/TextInput.tsx",
  },
  "components/ui/TextInputControl.tsx": {
    type: "registry:ui",
    target: "~/components/ui/TextInputControl.tsx",
  },
  "components/ui/text-input.module.css": {
    type: "registry:ui",
    target: "~/components/ui/text-input.module.css",
  },
  "components/ui/FormField.tsx": {
    type: "registry:ui",
    target: "~/components/ui/FormField.tsx",
  },
  "components/ui/form-field.module.css": {
    type: "registry:ui",
    target: "~/components/ui/form-field.module.css",
  },
  "components/ui/ValidationMessage.tsx": {
    type: "registry:ui",
    target: "~/components/ui/ValidationMessage.tsx",
  },
  "components/ui/validation-message.module.css": {
    type: "registry:ui",
    target: "~/components/ui/validation-message.module.css",
  },
  "components/ui/Spinner.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Spinner.tsx",
  },
  "components/ui/spinner.module.css": {
    type: "registry:ui",
    target: "~/components/ui/spinner.module.css",
  },
  "components/ui/Divider.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Divider.tsx",
  },
  "components/ui/divider.module.css": {
    type: "registry:ui",
    target: "~/components/ui/divider.module.css",
  },
  "components/ui/Link.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Link.tsx",
  },
  "components/ui/link.module.css": {
    type: "registry:ui",
    target: "~/components/ui/link.module.css",
  },
  "components/ui/Checkbox.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Checkbox.tsx",
  },
  "components/ui/checkbox.module.css": {
    type: "registry:ui",
    target: "~/components/ui/checkbox.module.css",
  },
  "components/ui/ProgressBar.tsx": {
    type: "registry:ui",
    target: "~/components/ui/ProgressBar.tsx",
  },
  "components/ui/progress-bar.module.css": {
    type: "registry:ui",
    target: "~/components/ui/progress-bar.module.css",
  },
  "components/ui/Skeleton.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Skeleton.tsx",
  },
  "components/ui/skeleton.module.css": {
    type: "registry:ui",
    target: "~/components/ui/skeleton.module.css",
  },
  "components/ui/Radio.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Radio.tsx",
  },
  "components/ui/radio.module.css": {
    type: "registry:ui",
    target: "~/components/ui/radio.module.css",
  },
  "components/ui/Switch.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Switch.tsx",
  },
  "components/ui/switch.module.css": {
    type: "registry:ui",
    target: "~/components/ui/switch.module.css",
  },
  "components/ui/Textarea.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Textarea.tsx",
  },
  "components/ui/textarea.module.css": {
    type: "registry:ui",
    target: "~/components/ui/textarea.module.css",
  },
  "public/right-bottom-icon.svg": {
    type: "registry:file",
    target: "~/public/right-bottom-icon.svg",
  },
  "components/ui/Pagination.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Pagination.tsx",
  },
  "components/ui/pagination.module.css": {
    type: "registry:ui",
    target: "~/components/ui/pagination.module.css",
  },
  "components/ui/Avatar.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Avatar.tsx",
  },
  "components/ui/avatar.module.css": {
    type: "registry:ui",
    target: "~/components/ui/avatar.module.css",
  },
  "components/ui/Breadcrumb.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Breadcrumb.tsx",
  },
  "components/ui/breadcrumb.module.css": {
    type: "registry:ui",
    target: "~/components/ui/breadcrumb.module.css",
  },
  "components/ui/RadioGroup.tsx": {
    type: "registry:ui",
    target: "~/components/ui/RadioGroup.tsx",
  },
  "components/ui/Slider.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Slider.tsx",
  },
  "components/ui/slider.module.css": {
    type: "registry:ui",
    target: "~/components/ui/slider.module.css",
  },
  "components/ui/Stepper.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Stepper.tsx",
  },
  "components/ui/stepper.module.css": {
    type: "registry:ui",
    target: "~/components/ui/stepper.module.css",
  },
  "components/ui/Table.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Table.tsx",
  },
  "components/ui/table.module.css": {
    type: "registry:ui",
    target: "~/components/ui/table.module.css",
  },
  "components/ui/internal/link-utils.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/link-utils.ts",
  },
  "lib/cn.ts": {
    type: "registry:lib",
    target: "~/lib/cn.ts",
  },
  "lib/use-controllable.ts": {
    type: "registry:lib",
    target: "~/lib/use-controllable.ts",
  },
  // CE-3H — safe compound batch
  "components/ui/Badge.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Badge.tsx",
  },
  "components/ui/badge.module.css": {
    type: "registry:ui",
    target: "~/components/ui/badge.module.css",
  },
  "components/ui/internal/feedback-types.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/feedback-types.ts",
  },
  "components/ui/Tag.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Tag.tsx",
  },
  "components/ui/tag.module.css": {
    type: "registry:ui",
    target: "~/components/ui/tag.module.css",
  },
  "components/ui/ListItem.tsx": {
    type: "registry:ui",
    target: "~/components/ui/ListItem.tsx",
  },
  "components/ui/list-item.module.css": {
    type: "registry:ui",
    target: "~/components/ui/list-item.module.css",
  },
  "components/ui/Timeline.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Timeline.tsx",
  },
  "components/ui/timeline.module.css": {
    type: "registry:ui",
    target: "~/components/ui/timeline.module.css",
  },
  "components/ui/internal/TimelineItemRow.tsx": {
    type: "registry:ui",
    target: "~/components/ui/internal/TimelineItemRow.tsx",
  },
  "components/ui/internal/timeline-item-row.module.css": {
    type: "registry:ui",
    target: "~/components/ui/internal/timeline-item-row.module.css",
  },
  "components/ui/EmptyState.tsx": {
    type: "registry:ui",
    target: "~/components/ui/EmptyState.tsx",
  },
  "components/ui/empty-state.module.css": {
    type: "registry:ui",
    target: "~/components/ui/empty-state.module.css",
  },
  "components/ui/Alert.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Alert.tsx",
  },
  "components/ui/internal/FeedbackSurface.tsx": {
    type: "registry:ui",
    target: "~/components/ui/internal/FeedbackSurface.tsx",
  },
  "components/ui/internal/feedback-surface.module.css": {
    type: "registry:ui",
    target: "~/components/ui/internal/feedback-surface.module.css",
  },
  "components/ui/internal/feedback-icons.tsx": {
    type: "registry:ui",
    target: "~/components/ui/internal/feedback-icons.tsx",
  },
  "components/ui/ToastProvider.tsx": {
    type: "registry:ui",
    target: "~/components/ui/ToastProvider.tsx",
  },
  "components/ui/toast.module.css": {
    type: "registry:ui",
    target: "~/components/ui/toast.module.css",
  },
  "components/ui/ButtonGroup.tsx": {
    type: "registry:ui",
    target: "~/components/ui/ButtonGroup.tsx",
  },
  "components/ui/button-group.module.css": {
    type: "registry:ui",
    target: "~/components/ui/button-group.module.css",
  },
  "components/ui/button-group-context.ts": {
    type: "registry:lib",
    target: "~/components/ui/button-group-context.ts",
  },
  "components/ui/ToggleGroup.tsx": {
    type: "registry:ui",
    target: "~/components/ui/ToggleGroup.tsx",
  },
  "components/ui/toggle-group.module.css": {
    type: "registry:ui",
    target: "~/components/ui/toggle-group.module.css",
  },
  "components/ui/internal/toggle-group-keyboard.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/toggle-group-keyboard.ts",
  },
  "components/ui/Accordion.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Accordion.tsx",
  },
  "components/ui/accordion.module.css": {
    type: "registry:ui",
    target: "~/components/ui/accordion.module.css",
  },
  "components/ui/Tabs.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Tabs.tsx",
  },
  "components/ui/tabs.module.css": {
    type: "registry:ui",
    target: "~/components/ui/tabs.module.css",
  },
  "components/ui/internal/tab-keyboard.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/tab-keyboard.ts",
  },
  // CE-3I — form/composite batch
  "components/ui/SearchField.tsx": {
    type: "registry:ui",
    target: "~/components/ui/SearchField.tsx",
  },
  "components/ui/search-field.module.css": {
    type: "registry:ui",
    target: "~/components/ui/search-field.module.css",
  },
  "components/ui/CreditCardField.tsx": {
    type: "registry:ui",
    target: "~/components/ui/CreditCardField.tsx",
  },
  "components/ui/credit-card-field.module.css": {
    type: "registry:ui",
    target: "~/components/ui/credit-card-field.module.css",
  },
  "lib/credit-card-field-format.ts": {
    type: "registry:lib",
    target: "~/lib/credit-card-field-format.ts",
  },
  "components/ui/NumberInput.tsx": {
    type: "registry:ui",
    target: "~/components/ui/NumberInput.tsx",
  },
  "components/ui/number-input.module.css": {
    type: "registry:ui",
    target: "~/components/ui/number-input.module.css",
  },
  "lib/number-input-value.ts": {
    type: "registry:lib",
    target: "~/lib/number-input-value.ts",
  },
  "components/ui/FileUpload.tsx": {
    type: "registry:ui",
    target: "~/components/ui/FileUpload.tsx",
  },
  "components/ui/file-upload.module.css": {
    type: "registry:ui",
    target: "~/components/ui/file-upload.module.css",
  },
  "components/ui/internal/file-upload-file-list.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/file-upload-file-list.ts",
  },
  "components/ui/internal/file-upload-validation.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/file-upload-validation.ts",
  },
  // CE-3J — overlay/navigation batch
  "components/ui/Popover.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Popover.tsx",
  },
  "components/ui/popover.module.css": {
    type: "registry:ui",
    target: "~/components/ui/popover.module.css",
  },
  "components/ui/Tooltip.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Tooltip.tsx",
  },
  "components/ui/tooltip.module.css": {
    type: "registry:ui",
    target: "~/components/ui/tooltip.module.css",
  },
  "components/ui/Dialog.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Dialog.tsx",
  },
  "components/ui/dialog.module.css": {
    type: "registry:ui",
    target: "~/components/ui/dialog.module.css",
  },
  "components/ui/Drawer.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Drawer.tsx",
  },
  "components/ui/drawer.module.css": {
    type: "registry:ui",
    target: "~/components/ui/drawer.module.css",
  },
  "components/ui/Menu.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Menu.tsx",
  },
  "components/ui/menu.module.css": {
    type: "registry:ui",
    target: "~/components/ui/menu.module.css",
  },
  "components/ui/SplitButton.tsx": {
    type: "registry:ui",
    target: "~/components/ui/SplitButton.tsx",
  },
  "components/ui/internal/Portal.tsx": {
    type: "registry:ui",
    target: "~/components/ui/internal/Portal.tsx",
  },
  "components/ui/internal/OverlayScopeContext.tsx": {
    type: "registry:ui",
    target: "~/components/ui/internal/OverlayScopeContext.tsx",
  },
  "components/ui/internal/useIsClient.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useIsClient.ts",
  },
  "components/ui/internal/useOverlayEscape.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useOverlayEscape.ts",
  },
  "components/ui/internal/overlay-stack.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/overlay-stack.ts",
  },
  "components/ui/internal/useLatestRef.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useLatestRef.ts",
  },
  "components/ui/internal/useOutsidePointer.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useOutsidePointer.ts",
  },
  "components/ui/internal/popover-position.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/popover-position.ts",
  },
  "components/ui/internal/focus-utils.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/focus-utils.ts",
  },
  "components/ui/internal/useFloatingPosition.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useFloatingPosition.ts",
  },
  "components/ui/internal/assign-ref.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/assign-ref.ts",
  },
  "components/ui/internal/useBackgroundInert.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useBackgroundInert.ts",
  },
  "components/ui/internal/useBodyScrollLock.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useBodyScrollLock.ts",
  },
  "components/ui/internal/useFocusTrap.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useFocusTrap.ts",
  },
  "components/ui/internal/overlay-types.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/overlay-types.ts",
  },
  "components/ui/internal/tooltip-position.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/tooltip-position.ts",
  },
  "components/ui/internal/useTooltipController.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useTooltipController.ts",
  },
  "components/ui/internal/menu-typeahead.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/menu-typeahead.ts",
  },
  // CE-3K — search/date interaction batch
  "components/ui/Combobox.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Combobox.tsx",
  },
  "components/ui/combobox.module.css": {
    type: "registry:ui",
    target: "~/components/ui/combobox.module.css",
  },
  "components/ui/internal/combobox-filter.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/combobox-filter.ts",
  },
  "components/ui/internal/combobox-list-status.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/combobox-list-status.ts",
  },
  "components/ui/internal/combobox-keyboard.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/combobox-keyboard.ts",
  },
  "components/ui/internal/combobox-scroll.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/combobox-scroll.ts",
  },
  "components/ui/Select.tsx": {
    type: "registry:ui",
    target: "~/components/ui/Select.tsx",
  },
  "components/ui/select.module.css": {
    type: "registry:ui",
    target: "~/components/ui/select.module.css",
  },
  "components/ui/CalendarDay.tsx": {
    type: "registry:ui",
    target: "~/components/ui/CalendarDay.tsx",
  },
  "components/ui/calendar-day.module.css": {
    type: "registry:ui",
    target: "~/components/ui/calendar-day.module.css",
  },
  "components/ui/internal/calendar-date.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/calendar-date.ts",
  },
  "components/ui/CalendarGrid.tsx": {
    type: "registry:ui",
    target: "~/components/ui/CalendarGrid.tsx",
  },
  "components/ui/calendar-grid.module.css": {
    type: "registry:ui",
    target: "~/components/ui/calendar-grid.module.css",
  },
  "components/ui/CalendarMonthCell.tsx": {
    type: "registry:ui",
    target: "~/components/ui/CalendarMonthCell.tsx",
  },
  "components/ui/CalendarYearCell.tsx": {
    type: "registry:ui",
    target: "~/components/ui/CalendarYearCell.tsx",
  },
  "components/ui/calendar-period-cell.module.css": {
    type: "registry:ui",
    target: "~/components/ui/calendar-period-cell.module.css",
  },
  "components/ui/internal/calendar-math.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/calendar-math.ts",
  },
  "components/ui/internal/useCalendarKeyboard.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useCalendarKeyboard.ts",
  },
  "components/ui/internal/useCalendarCellGridKeyboard.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/useCalendarCellGridKeyboard.ts",
  },
  "components/ui/DatePicker.tsx": {
    type: "registry:ui",
    target: "~/components/ui/DatePicker.tsx",
  },
  "components/ui/date-picker.module.css": {
    type: "registry:ui",
    target: "~/components/ui/date-picker.module.css",
  },
  "components/ui/PhoneNumberField.tsx": {
    type: "registry:ui",
    target: "~/components/ui/PhoneNumberField.tsx",
  },
  "components/ui/phone-number-field.module.css": {
    type: "registry:ui",
    target: "~/components/ui/phone-number-field.module.css",
  },
  "lib/phone-number-field-countries.ts": {
    type: "registry:lib",
    target: "~/lib/phone-number-field-countries.ts",
  },
  // CE-3L — data/tree batch
  "components/ui/TreeView.tsx": {
    type: "registry:ui",
    target: "~/components/ui/TreeView.tsx",
  },
  "components/ui/tree-view.module.css": {
    type: "registry:ui",
    target: "~/components/ui/tree-view.module.css",
  },
  "components/ui/internal/TreeItem.tsx": {
    type: "registry:ui",
    target: "~/components/ui/internal/TreeItem.tsx",
  },
  "components/ui/internal/tree-item.module.css": {
    type: "registry:ui",
    target: "~/components/ui/internal/tree-item.module.css",
  },
  "components/ui/internal/tree-flatten.ts": {
    type: "registry:lib",
    target: "~/components/ui/internal/tree-flatten.ts",
  },
  "components/ui/DataTableSortHeader.tsx": {
    type: "registry:ui",
    target: "~/components/ui/DataTableSortHeader.tsx",
  },
  "components/ui/data-table-sort-header.module.css": {
    type: "registry:ui",
    target: "~/components/ui/data-table-sort-header.module.css",
  },
  "lib/use-data-table-sort.ts": {
    type: "registry:lib",
    target: "~/lib/use-data-table-sort.ts",
  },
  // CE-3M — charts batch
  "components/ui/BarChart.tsx": {
    type: "registry:ui",
    target: "~/components/ui/BarChart.tsx",
  },
  "components/ui/bar-chart.module.css": {
    type: "registry:ui",
    target: "~/components/ui/bar-chart.module.css",
  },
  "components/ui/LineChart.tsx": {
    type: "registry:ui",
    target: "~/components/ui/LineChart.tsx",
  },
  "components/ui/line-chart.module.css": {
    type: "registry:ui",
    target: "~/components/ui/line-chart.module.css",
  },
};

export function classifyFile(relPath: string): { type: ShadcnFileType; target: string } {
  const destination = FILE_DESTINATIONS[relPath];
  if (!destination) {
    throw new Error(
      `generate-shadcn-registry: no explicit shadcn type/target mapping for "${relPath}". ` +
        `Every transported file must be explicitly classified — add an entry to ` +
        `FILE_DESTINATIONS in lib/shadcn-registry-generator.ts. There is no default.`,
    );
  }
  return destination;
}

function must(index: number, label: string): number {
  if (index === -1) {
    throw new Error(
      `generate-shadcn-registry: extraction marker not found: "${label}". The Foundation ` +
        `CSS boundary in styles/tokens.css may have moved — re-verify before regenerating.`,
    );
  }
  return index;
}

/**
 * Mechanically extracts the Foundation tier from the real content of
 * styles/tokens.css + styles/foundation.css, using the existing boundary
 * markers already present in the source rather than hardcoded line
 * numbers, so this stays correct if tokens.css is edited above these
 * markers. No token value is retyped; every byte returned is a verbatim
 * substring of the two inputs. Pure function of its two string arguments
 * — see extractFoundationCss() for the real-file-reading wrapper.
 */
export function extractFoundationCssFromSource(tokensCss: string, foundationUtilCss: string): string {
  const rootOpenIdx = must(tokensCss.indexOf(":root {"), ":root {");
  const firstComponentBlockIdx = must(
    tokensCss.indexOf("/* ── Form control geometry"),
    "/* ── Form control geometry",
  );
  const shapeModesIdx = must(tokensCss.indexOf("/* ── Shape modes ── */"), "/* ── Shape modes ── */");
  const surfaceModesIdx = must(
    tokensCss.indexOf("/* ── Surface modes ── */"),
    "/* ── Surface modes ── */",
  );

  if (
    !(
      rootOpenIdx < firstComponentBlockIdx &&
      firstComponentBlockIdx < shapeModesIdx &&
      shapeModesIdx < surfaceModesIdx
    )
  ) {
    throw new Error(
      "generate-shadcn-registry: Foundation CSS marker ordering assumption violated — " +
        "re-verify the Foundation boundary in styles/tokens.css before regenerating.",
    );
  }

  const rootBody = tokensCss.slice(rootOpenIdx + ":root {".length, firstComponentBlockIdx).trimEnd();
  const shapeModes = tokensCss.slice(shapeModesIdx, surfaceModesIdx).trim();
  const surfaceModes = tokensCss.slice(surfaceModesIdx).trim();

  return [
    "/* ── AUTO-GENERATED Skrewww Foundation transport ──",
    " * Mechanically extracted from styles/tokens.css + styles/foundation.css",
    " * at build time — every declaration below is a verbatim substring of",
    " * those two files, never hand-retyped. Do not edit this file directly;",
    " * it will be overwritten on the next generate. ── */",
    "",
    ":root {",
    rootBody,
    "}",
    "",
    shapeModes,
    "",
    surfaceModes,
    "",
    foundationUtilCss.trim(),
    "",
  ].join("\n");
}

export function extractFoundationCss(): string {
  const tokensCss = readSourceFile("styles/tokens.css");
  const foundationUtilCss = readSourceFile("styles/foundation.css");
  return extractFoundationCssFromSource(tokensCss, foundationUtilCss);
}

const FOUNDATION_TARGET = "~/styles/skrewww-foundation.css";

export function buildFoundationManifest(): ShadcnRegistryItem {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "foundation",
    type: "registry:file",
    title: "Skrewww Foundation",
    description:
      "Universal Primitive/Semantic/Brand/Shape/Surface token tier plus the shared .sr-only accessibility utility. Installed once; every other @skrewww/* component depends on it.",
    author: "Skrewww",
    dependencies: [],
    registryDependencies: [],
    files: [
      {
        path: "styles/tokens.css",
        content: extractFoundationCss(),
        type: "registry:file",
        target: FOUNDATION_TARGET,
      },
    ],
  };
}

/**
 * Generic build for any single-component registry:ui manifest, driven
 * entirely by that component's canonical entry — no component-specific
 * logic lives here. Extracted once Button and Card needed the identical
 * transform; add a new component by giving it a canonical entry + the
 * relevant FILE_DESTINATIONS rows, not by writing a new build function.
 */
function buildComponentManifest(slug: string): ShadcnRegistryItem {
  const entry = componentRegistry.find((candidate) => candidate.slug === slug);
  if (!entry) {
    throw new Error(`generate-shadcn-registry: canonical "${slug}" entry not found in lib/component-registry.ts.`);
  }

  // Transport-layer flattening happens HERE, not in the canonical model —
  // entry.files (component-owned) and entry.internalDependencies (private
  // helpers) stay separate arrays on ComponentRegistryEntry by design;
  // this is the one place they merge into a single shadcn files[] array.
  const ownedFiles = entry.files ?? [];
  const internalFiles = entry.internalDependencies ?? [];
  const transportedPaths = [...ownedFiles, ...internalFiles];

  const files: ShadcnRegistryFile[] = transportedPaths.map((relPath) => {
    const { type, target } = classifyFile(relPath);
    let content = readSourceFile(relPath);
    // Origin provenance for Guard: owned TS/TSX files carry a machine-
    // readable marker in the *transported* install payload only (repo
    // source on disk is unchanged). Meaning: originated from Skrewww
    // registry install — not byte-identical forever.
    if (ownedFiles.includes(relPath) && isTypeScriptSourcePath(relPath)) {
      content = withSkrewwwComponentMarker(content, entry.slug);
    }
    return {
      path: relPath,
      content,
      type,
      target,
    };
  });

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: entry.slug,
    type: "registry:ui",
    title: entry.name,
    description: entry.summary,
    author: "Skrewww",
    // Real npm dependencies only (schema 1.4.0 semantics) — react/react-dom/
    // next are host requirements, deliberately never placed here so the CLI
    // never tries to auto-install them; surfaced as a human-facing `docs`
    // note instead, which is a real shadcn schema field for exactly this.
    dependencies: entry.dependencies ?? [],
    registryDependencies: entry.registryDependencies ?? [],
    docs: `Host requirements (assumed already present, not installed by this command): ${(entry.hostRequirements ?? []).join(", ")}.`,
    files,
  };
}

export function buildButtonManifest(): ShadcnRegistryItem {
  return buildComponentManifest("button");
}

export function buildCardManifest(): ShadcnRegistryItem {
  return buildComponentManifest("card");
}

export function buildTextInputManifest(): ShadcnRegistryItem {
  return buildComponentManifest("text-input");
}

export function buildFormFieldManifest(): ShadcnRegistryItem {
  return buildComponentManifest("form-field");
}

export function buildValidationMessageManifest(): ShadcnRegistryItem {
  return buildComponentManifest("validation-message");
}

export function buildSpinnerManifest(): ShadcnRegistryItem {
  return buildComponentManifest("spinner");
}

export function buildDividerManifest(): ShadcnRegistryItem {
  return buildComponentManifest("divider");
}

export function buildLinkManifest(): ShadcnRegistryItem {
  return buildComponentManifest("link");
}

export function buildCheckboxManifest(): ShadcnRegistryItem {
  return buildComponentManifest("checkbox");
}

export function buildProgressBarManifest(): ShadcnRegistryItem {
  return buildComponentManifest("progress-bar");
}

export function buildSkeletonManifest(): ShadcnRegistryItem {
  return buildComponentManifest("skeleton");
}

export function buildRadioManifest(): ShadcnRegistryItem {
  return buildComponentManifest("radio");
}

export function buildSwitchManifest(): ShadcnRegistryItem {
  return buildComponentManifest("switch");
}

export function buildTextareaManifest(): ShadcnRegistryItem {
  return buildComponentManifest("textarea");
}

export function buildPaginationManifest(): ShadcnRegistryItem {
  return buildComponentManifest("pagination");
}

export function buildAvatarManifest(): ShadcnRegistryItem {
  return buildComponentManifest("avatar");
}

export function buildBreadcrumbManifest(): ShadcnRegistryItem {
  return buildComponentManifest("breadcrumb");
}

export function buildRadioGroupManifest(): ShadcnRegistryItem {
  return buildComponentManifest("radio-group");
}

export function buildSliderManifest(): ShadcnRegistryItem {
  return buildComponentManifest("slider");
}

export function buildStepperManifest(): ShadcnRegistryItem {
  return buildComponentManifest("stepper");
}

export function buildTableManifest(): ShadcnRegistryItem {
  return buildComponentManifest("table");
}

// CE-3H — safe compound batch
export function buildBadgeManifest(): ShadcnRegistryItem {
  return buildComponentManifest("badge");
}

export function buildTagManifest(): ShadcnRegistryItem {
  return buildComponentManifest("tag");
}

export function buildListItemManifest(): ShadcnRegistryItem {
  return buildComponentManifest("list-item");
}

export function buildTimelineManifest(): ShadcnRegistryItem {
  return buildComponentManifest("timeline");
}

export function buildEmptyStateManifest(): ShadcnRegistryItem {
  return buildComponentManifest("empty-state");
}

export function buildAlertManifest(): ShadcnRegistryItem {
  return buildComponentManifest("alert");
}

export function buildToastManifest(): ShadcnRegistryItem {
  return buildComponentManifest("toast");
}

export function buildButtonGroupManifest(): ShadcnRegistryItem {
  return buildComponentManifest("button-group");
}

export function buildToggleGroupManifest(): ShadcnRegistryItem {
  return buildComponentManifest("toggle-group");
}

export function buildAccordionManifest(): ShadcnRegistryItem {
  return buildComponentManifest("accordion");
}

export function buildTabsManifest(): ShadcnRegistryItem {
  return buildComponentManifest("tabs");
}

// CE-3I — form/composite batch
export function buildSearchFieldManifest(): ShadcnRegistryItem {
  return buildComponentManifest("search-field");
}

export function buildCreditCardFieldManifest(): ShadcnRegistryItem {
  return buildComponentManifest("credit-card-field");
}

export function buildNumberInputManifest(): ShadcnRegistryItem {
  return buildComponentManifest("number-input");
}

export function buildFileUploadManifest(): ShadcnRegistryItem {
  return buildComponentManifest("file-upload");
}

// CE-3J — overlay/navigation batch
export function buildPopoverManifest(): ShadcnRegistryItem {
  return buildComponentManifest("popover");
}

export function buildTooltipManifest(): ShadcnRegistryItem {
  return buildComponentManifest("tooltip");
}

export function buildDialogManifest(): ShadcnRegistryItem {
  return buildComponentManifest("dialog");
}

export function buildDrawerManifest(): ShadcnRegistryItem {
  return buildComponentManifest("drawer");
}

export function buildMenuManifest(): ShadcnRegistryItem {
  return buildComponentManifest("menu");
}

export function buildSplitButtonManifest(): ShadcnRegistryItem {
  return buildComponentManifest("split-button");
}

// CE-3K — search/date interaction batch
export function buildComboboxManifest(): ShadcnRegistryItem {
  return buildComponentManifest("combobox");
}

export function buildSelectManifest(): ShadcnRegistryItem {
  return buildComponentManifest("select");
}

export function buildCalendarDayManifest(): ShadcnRegistryItem {
  return buildComponentManifest("calendar-day");
}

export function buildCalendarGridManifest(): ShadcnRegistryItem {
  return buildComponentManifest("calendar-grid");
}

export function buildDatePickerManifest(): ShadcnRegistryItem {
  return buildComponentManifest("date-picker");
}

export function buildPhoneNumberFieldManifest(): ShadcnRegistryItem {
  return buildComponentManifest("phone-number-field");
}

// CE-3L — data/tree batch
export function buildTreeViewManifest(): ShadcnRegistryItem {
  return buildComponentManifest("tree-view");
}

export function buildDataTableManifest(): ShadcnRegistryItem {
  return buildComponentManifest("data-table");
}

// CE-3M — charts batch
export function buildBarChartManifest(): ShadcnRegistryItem {
  return buildComponentManifest("bar-chart");
}

export function buildLineChartManifest(): ShadcnRegistryItem {
  return buildComponentManifest("line-chart");
}

/**
 * Single ordered collection of every installable `@skrewww/*` registry
 * item currently generated. Order is deliberate and deterministic:
 * Foundation first, then component manifests in the historical CE-3
 * generation sequence (same order previously hard-coded in
 * `scripts/generate-shadcn-registry.ts`). Both individual `/r/<name>.json`
 * writes and `/r/registry.json` derive from this list — no second allowlist.
 */
export function buildDistributedRegistryItems(): ShadcnRegistryItem[] {
  return [
    buildFoundationManifest(),
    buildButtonManifest(),
    buildCardManifest(),
    buildTextInputManifest(),
    buildFormFieldManifest(),
    buildValidationMessageManifest(),
    buildSpinnerManifest(),
    buildDividerManifest(),
    buildLinkManifest(),
    buildCheckboxManifest(),
    buildProgressBarManifest(),
    buildSkeletonManifest(),
    buildRadioManifest(),
    buildSwitchManifest(),
    buildTextareaManifest(),
    buildPaginationManifest(),
    buildAvatarManifest(),
    buildBreadcrumbManifest(),
    buildRadioGroupManifest(),
    buildSliderManifest(),
    buildStepperManifest(),
    buildTableManifest(),
    buildBadgeManifest(),
    buildTagManifest(),
    buildListItemManifest(),
    buildTimelineManifest(),
    buildEmptyStateManifest(),
    buildAlertManifest(),
    buildToastManifest(),
    buildButtonGroupManifest(),
    buildToggleGroupManifest(),
    buildAccordionManifest(),
    buildTabsManifest(),
    buildSearchFieldManifest(),
    buildCreditCardFieldManifest(),
    buildNumberInputManifest(),
    buildFileUploadManifest(),
    buildPopoverManifest(),
    buildTooltipManifest(),
    buildDialogManifest(),
    buildDrawerManifest(),
    buildMenuManifest(),
    buildSplitButtonManifest(),
    buildCalendarDayManifest(),
    buildCalendarGridManifest(),
    buildSelectManifest(),
    buildComboboxManifest(),
    buildDatePickerManifest(),
    buildPhoneNumberFieldManifest(),
    buildTreeViewManifest(),
    buildDataTableManifest(),
    buildBarChartManifest(),
    buildLineChartManifest(),
  ];
}

/**
 * Project an install manifest into a discovery/catalog item.
 *
 * Keeps only official shadcn registry-item fields useful for list/search.
 * Strips `content` (Directory / discovery rule), `$schema`, `author`, and
 * `docs` (host-requirement prose stays on the install manifest only).
 * Does not invent maturity/category/Figma fields — those remain
 * canonical/docs-side (CE-3G Part 19's richer index metadata is superseded
 * by the current official schema + CE-3N constraints).
 */
export function projectRegistryIndexItem(item: ShadcnRegistryItem): ShadcnRegistryIndexItem {
  return {
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    dependencies: [...item.dependencies],
    registryDependencies: [...item.registryDependencies],
    files: item.files.map((file) => ({
      path: file.path,
      type: file.type,
      ...(file.target ? { target: file.target } : {}),
    })),
  };
}

/**
 * Build `/r/registry.json` from the same distributed manifest collection
 * used for individual item files. Foundation is included because it is a
 * real installable `@skrewww/foundation` registry item (type
 * `registry:file`) — not excluded by schema.
 */
export function buildRegistryIndex(
  items: ShadcnRegistryItem[] = buildDistributedRegistryItems(),
): ShadcnRegistry {
  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: SKREWWW_SHADCN_REGISTRY_NAME,
    homepage: SKREWWW_SHADCN_REGISTRY_HOMEPAGE,
    items: items.map(projectRegistryIndexItem),
  };
}

/**
 * Lightweight structural check against the real shadcn registry-item.json
 * shape (confirmed via a live fetch of ui.shadcn.com's own schema/example
 * during the POC — not reproduced here as a live network call, since a
 * test suite shouldn't depend on network access). Throws with a specific
 * message on the first violation found; does not attempt full JSON Schema
 * validation.
 */
export function assertValidShadcnRegistryItem(item: unknown): asserts item is ShadcnRegistryItem {
  if (typeof item !== "object" || item === null) {
    throw new Error("shadcn registry item must be an object");
  }
  const candidate = item as Record<string, unknown>;

  for (const field of ["$schema", "name", "type", "title", "description", "author"] as const) {
    if (typeof candidate[field] !== "string" || candidate[field] === "") {
      throw new Error(`shadcn registry item missing required non-empty string field "${field}"`);
    }
  }

  for (const field of ["dependencies", "registryDependencies"] as const) {
    const value = candidate[field];
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
      throw new Error(`shadcn registry item field "${field}" must be a string array`);
    }
  }

  if (!Array.isArray(candidate.files) || candidate.files.length === 0) {
    throw new Error('shadcn registry item "files" must be a non-empty array');
  }

  for (const file of candidate.files as unknown[]) {
    if (typeof file !== "object" || file === null) {
      throw new Error("shadcn registry item file entry must be an object");
    }
    const fileCandidate = file as Record<string, unknown>;
    for (const field of ["path", "content", "type", "target"] as const) {
      if (typeof fileCandidate[field] !== "string") {
        throw new Error(`shadcn registry item file entry missing required string field "${field}"`);
      }
    }
    if (fileCandidate.target === "") {
      throw new Error(
        `shadcn registry item file entry for "${String(fileCandidate.path)}" has an empty target — ` +
          "this generator requires explicit, non-empty targets for every file.",
      );
    }
  }
}

const ALLOWED_INDEX_ITEM_KEYS = new Set([
  "name",
  "type",
  "title",
  "description",
  "dependencies",
  "registryDependencies",
  "files",
]);

const ALLOWED_INDEX_FILE_KEYS = new Set(["path", "type", "target"]);

/**
 * Structural check for the generated `/r/registry.json` catalog against the
 * official shadcn registry.json shape. Index items must not carry install
 * `content`, `hostRequirements`, or other canonical-only fields.
 */
export function assertValidShadcnRegistry(registry: unknown): asserts registry is ShadcnRegistry {
  if (typeof registry !== "object" || registry === null) {
    throw new Error("shadcn registry must be an object");
  }
  const candidate = registry as Record<string, unknown>;

  if (candidate.$schema !== "https://ui.shadcn.com/schema/registry.json") {
    throw new Error('shadcn registry "$schema" must be https://ui.shadcn.com/schema/registry.json');
  }
  if (typeof candidate.name !== "string" || candidate.name === "") {
    throw new Error('shadcn registry "name" must be a non-empty string');
  }
  if (typeof candidate.homepage !== "string" || candidate.homepage === "") {
    throw new Error('shadcn registry "homepage" must be a non-empty string');
  }
  if (!Array.isArray(candidate.items) || candidate.items.length === 0) {
    throw new Error('shadcn registry "items" must be a non-empty array');
  }

  const seen = new Set<string>();
  for (const item of candidate.items as unknown[]) {
    if (typeof item !== "object" || item === null) {
      throw new Error("shadcn registry index item must be an object");
    }
    const indexItem = item as Record<string, unknown>;
    for (const key of Object.keys(indexItem)) {
      if (!ALLOWED_INDEX_ITEM_KEYS.has(key)) {
        throw new Error(`shadcn registry index item has unexpected field "${key}"`);
      }
    }
    for (const field of ["name", "type", "title", "description"] as const) {
      if (typeof indexItem[field] !== "string" || indexItem[field] === "") {
        throw new Error(`shadcn registry index item missing required non-empty string field "${field}"`);
      }
    }
    for (const field of ["dependencies", "registryDependencies"] as const) {
      const value = indexItem[field];
      if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
        throw new Error(`shadcn registry index item field "${field}" must be a string array`);
      }
    }
    if (!Array.isArray(indexItem.files) || indexItem.files.length === 0) {
      throw new Error('shadcn registry index item "files" must be a non-empty array');
    }
    for (const file of indexItem.files as unknown[]) {
      if (typeof file !== "object" || file === null) {
        throw new Error("shadcn registry index file entry must be an object");
      }
      const fileCandidate = file as Record<string, unknown>;
      for (const key of Object.keys(fileCandidate)) {
        if (!ALLOWED_INDEX_FILE_KEYS.has(key)) {
          throw new Error(`shadcn registry index file entry has unexpected field "${key}"`);
        }
      }
      if (typeof fileCandidate.path !== "string" || fileCandidate.path === "") {
        throw new Error('shadcn registry index file entry missing non-empty "path"');
      }
      if (typeof fileCandidate.type !== "string" || fileCandidate.type === "") {
        throw new Error('shadcn registry index file entry missing non-empty "type"');
      }
      if ("content" in fileCandidate) {
        throw new Error("shadcn registry index file entry must not include content");
      }
      if ("target" in fileCandidate && (typeof fileCandidate.target !== "string" || fileCandidate.target === "")) {
        throw new Error('shadcn registry index file entry "target" must be a non-empty string when present');
      }
    }

    const name = indexItem.name as string;
    if (seen.has(name)) {
      throw new Error(`shadcn registry index contains duplicate item name "${name}"`);
    }
    seen.add(name);
  }

  const serialized = JSON.stringify(candidate);
  if (serialized.includes("hostRequirements")) {
    throw new Error("shadcn registry index must not leak hostRequirements");
  }
  if (serialized.includes("/Users/") || serialized.includes("\\\\")) {
    throw new Error("shadcn registry index must not contain absolute filesystem paths");
  }
}
