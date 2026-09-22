"use client";

import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Per-slug preview loaders — each entry is an explicit dynamic `import()`.
 * Component-detail pages must not eagerly pull every preview (charts, tables,
 * calendars, overlays, banking compositions, etc.) into one shared client graph.
 *
 * Named preview exports are remapped to `default` for `React.lazy`.
 */
export const previewLoaders = {
  "calendar-day": () =>
    import("@/components/previews/CalendarDayPreview").then((m) => ({
      default: m.CalendarDayPreview,
    })),
  "calendar-grid": () =>
    import("@/components/previews/CalendarGridPreview").then((m) => ({
      default: m.CalendarGridPreview,
    })),
  "date-picker": () =>
    import("@/components/previews/DatePickerPreview").then((m) => ({
      default: m.DatePickerPreview,
    })),
  "empty-state": () =>
    import("@/components/previews/EmptyStatePreview").then((m) => ({
      default: m.EmptyStatePreview,
    })),
  "list-item": () =>
    import("@/components/previews/ListItemPreview").then((m) => ({
      default: m.ListItemPreview,
    })),
  table: () =>
    import("@/components/previews/TablePreview").then((m) => ({
      default: m.TablePreview,
    })),
  "data-table": () =>
    import("@/components/previews/DataTablePreview").then((m) => ({
      default: m.DataTablePreview,
    })),
  "tree-view": () =>
    import("@/components/previews/TreeViewPreview").then((m) => ({
      default: m.TreeViewPreview,
    })),
  "bar-chart": () =>
    import("@/components/previews/BarChartPreview").then((m) => ({
      default: m.BarChartPreview,
    })),
  "line-chart": () =>
    import("@/components/previews/LineChartPreview").then((m) => ({
      default: m.LineChartPreview,
    })),
  "area-chart": () =>
    import("@/components/previews/AreaChartPreview").then((m) => ({
      default: m.AreaChartPreview,
    })),
  timeline: () =>
    import("@/components/previews/TimelinePreview").then((m) => ({
      default: m.TimelinePreview,
    })),
  accordion: () =>
    import("@/components/previews/AccordionPreview").then((m) => ({
      default: m.AccordionPreview,
    })),
  avatar: () =>
    import("@/components/previews/AvatarPreview").then((m) => ({
      default: m.AvatarPreview,
    })),
  divider: () =>
    import("@/components/previews/DividerPreview").then((m) => ({
      default: m.DividerPreview,
    })),
  tag: () =>
    import("@/components/previews/TagPreview").then((m) => ({
      default: m.TagPreview,
    })),
  button: () =>
    import("@/components/previews/ButtonPreview").then((m) => ({
      default: m.ButtonPreview,
    })),
  "button-group": () =>
    import("@/components/previews/ButtonGroupPreview").then((m) => ({
      default: m.ButtonGroupPreview,
    })),
  "toggle-group": () =>
    import("@/components/previews/ToggleGroupPreview").then((m) => ({
      default: m.ToggleGroupPreview,
    })),
  "split-button": () =>
    import("@/components/previews/SplitButtonPreview").then((m) => ({
      default: m.SplitButtonPreview,
    })),
  card: () =>
    import("@/components/previews/CardPreview").then((m) => ({
      default: m.CardPreview,
    })),
  "chart-card": () =>
    import("@/components/previews/ChartCardPreview").then((m) => ({
      default: m.ChartCardPreview,
    })),
  "chart-metric": () =>
    import("@/components/previews/ChartMetricPreview").then((m) => ({
      default: m.ChartMetricPreview,
    })),
  dialog: () =>
    import("@/components/previews/DialogPreview").then((m) => ({
      default: m.DialogPreview,
    })),
  drawer: () =>
    import("@/components/previews/DrawerPreview").then((m) => ({
      default: m.DrawerPreview,
    })),
  popover: () =>
    import("@/components/previews/PopoverPreview").then((m) => ({
      default: m.PopoverPreview,
    })),
  "text-input": () =>
    import("@/components/previews/TextInputPreview").then((m) => ({
      default: m.TextInputPreview,
    })),
  textarea: () =>
    import("@/components/previews/TextareaPreview").then((m) => ({
      default: m.TextareaPreview,
    })),
  select: () =>
    import("@/components/previews/SelectPreview").then((m) => ({
      default: m.SelectPreview,
    })),
  combobox: () =>
    import("@/components/previews/ComboboxPreview").then((m) => ({
      default: m.ComboboxPreview,
    })),
  "file-upload": () =>
    import("@/components/previews/FileUploadPreview").then((m) => ({
      default: m.FileUploadPreview,
    })),
  "search-field": () =>
    import("@/components/previews/SearchFieldPreview").then((m) => ({
      default: m.SearchFieldPreview,
    })),
  "credit-card-field": () =>
    import("@/components/previews/CreditCardFieldPreview").then((m) => ({
      default: m.CreditCardFieldPreview,
    })),
  "phone-number-field": () =>
    import("@/components/previews/PhoneNumberFieldPreview").then((m) => ({
      default: m.PhoneNumberFieldPreview,
    })),
  "number-input": () =>
    import("@/components/previews/NumberInputPreview").then((m) => ({
      default: m.NumberInputPreview,
    })),
  "form-field": () =>
    import("@/components/previews/FormFieldPreview").then((m) => ({
      default: m.FormFieldPreview,
    })),
  "validation-message": () =>
    import("@/components/previews/ValidationMessagePreview").then((m) => ({
      default: m.ValidationMessagePreview,
    })),
  checkbox: () =>
    import("@/components/previews/CheckboxPreview").then((m) => ({
      default: m.CheckboxPreview,
    })),
  radio: () =>
    import("@/components/previews/RadioPreview").then((m) => ({
      default: m.RadioPreview,
    })),
  "radio-group": () =>
    import("@/components/previews/RadioPreview").then((m) => ({
      default: m.RadioPreview,
    })),
  switch: () =>
    import("@/components/previews/SwitchPreview").then((m) => ({
      default: m.SwitchPreview,
    })),
  slider: () =>
    import("@/components/previews/SliderPreview").then((m) => ({
      default: m.SliderPreview,
    })),
  link: () =>
    import("@/components/previews/LinkPreview").then((m) => ({
      default: m.LinkPreview,
    })),
  menu: () =>
    import("@/components/previews/MenuPreview").then((m) => ({
      default: m.MenuPreview,
    })),
  breadcrumb: () =>
    import("@/components/previews/BreadcrumbPreview").then((m) => ({
      default: m.BreadcrumbPreview,
    })),
  tabs: () =>
    import("@/components/previews/TabsPreview").then((m) => ({
      default: m.TabsPreview,
    })),
  pagination: () =>
    import("@/components/previews/PaginationPreview").then((m) => ({
      default: m.PaginationPreview,
    })),
  stepper: () =>
    import("@/components/previews/StepperPreview").then((m) => ({
      default: m.StepperPreview,
    })),
  alert: () =>
    import("@/components/previews/AlertPreview").then((m) => ({
      default: m.AlertPreview,
    })),
  badge: () =>
    import("@/components/previews/BadgePreview").then((m) => ({
      default: m.BadgePreview,
    })),
  toast: () =>
    import("@/components/previews/ToastPreview").then((m) => ({
      default: m.ToastPreview,
    })),
  tooltip: () =>
    import("@/components/previews/TooltipPreview").then((m) => ({
      default: m.TooltipPreview,
    })),
  skeleton: () =>
    import("@/components/previews/SkeletonPreview").then((m) => ({
      default: m.SkeletonPreview,
    })),
  "progress-bar": () =>
    import("@/components/previews/ProgressBarPreview").then((m) => ({
      default: m.ProgressBarPreview,
    })),
  spinner: () =>
    import("@/components/previews/SpinnerPreview").then((m) => ({
      default: m.SpinnerPreview,
    })),
  "banking-transaction-row": () =>
    import("@/components/previews/BankingTransactionRowPreview").then((m) => ({
      default: m.BankingTransactionRowPreview,
    })),
  "banking-account-card": () =>
    import("@/components/previews/BankingAccountCardPreview").then((m) => ({
      default: m.BankingAccountCardPreview,
    })),
  "banking-balance-summary": () =>
    import("@/components/previews/BankingBalanceSummaryPreview").then((m) => ({
      default: m.BankingBalanceSummaryPreview,
    })),
} as const satisfies Record<string, () => Promise<{ default: ComponentType }>>;

export type PreviewSlug = keyof typeof previewLoaders;

export const previewSlugs = Object.keys(previewLoaders) as PreviewSlug[];

/** True when `slug` has an explicit live-preview loader (not docs-only / unknown). */
export function hasLivePreviewLoader(slug: string): slug is PreviewSlug {
  return Object.prototype.hasOwnProperty.call(previewLoaders, slug);
}

/**
 * Module-level `lazy()` wrappers — one per slug. `import()` runs only when
 * that slug's lazy component is first rendered (not for sibling slugs).
 * Equivalent to per-slug `next/dynamic` without a variable import path.
 */
const lazyPreviews = Object.fromEntries(
  (Object.entries(previewLoaders) as Array<[PreviewSlug, (typeof previewLoaders)[PreviewSlug]]>).map(
    ([slug, loader]) => [slug, lazy(loader)],
  ),
) as Record<PreviewSlug, LazyExoticComponent<ComponentType>>;

/**
 * Reserves approximate preview-card space while the slug chunk loads —
 * same border/radius language as `ComponentPreview` / Card, no spinner.
 */
function PreviewLoadingFallback() {
  return (
    <div
      className="min-h-[14rem] rounded-lg border border-ink-200 bg-white"
      aria-hidden="true"
    />
  );
}

export function ComponentLiveSection({ slug }: { slug: string }) {
  if (!hasLivePreviewLoader(slug)) return null;
  const Preview = lazyPreviews[slug];
  return (
    <Suspense fallback={<PreviewLoadingFallback />}>
      <Preview />
    </Suspense>
  );
}
