"use client";

import { CalendarDayPreview } from "@/components/previews/CalendarDayPreview";
import { CalendarGridPreview } from "@/components/previews/CalendarGridPreview";
import { DatePickerPreview } from "@/components/previews/DatePickerPreview";
import { EmptyStatePreview } from "@/components/previews/EmptyStatePreview";
import { ListItemPreview } from "@/components/previews/ListItemPreview";
import { AccordionPreview } from "@/components/previews/AccordionPreview";
import { AvatarPreview } from "@/components/previews/AvatarPreview";
import { DividerPreview } from "@/components/previews/DividerPreview";
import { TagPreview } from "@/components/previews/TagPreview";
import { AlertPreview } from "@/components/previews/AlertPreview";
import { BadgePreview } from "@/components/previews/BadgePreview";
import { ButtonPreview } from "@/components/previews/ButtonPreview";
import { CardPreview } from "@/components/previews/CardPreview";
import { DialogPreview } from "@/components/previews/DialogPreview";
import { DrawerPreview } from "@/components/previews/DrawerPreview";
import { PopoverPreview } from "@/components/previews/PopoverPreview";
import { CheckboxPreview } from "@/components/previews/CheckboxPreview";
import { FormFieldPreview } from "@/components/previews/FormFieldPreview";
import { LinkPreview } from "@/components/previews/LinkPreview";
import { BreadcrumbPreview } from "@/components/previews/BreadcrumbPreview";
import { TabsPreview } from "@/components/previews/TabsPreview";
import { PaginationPreview } from "@/components/previews/PaginationPreview";
import { RadioPreview } from "@/components/previews/RadioPreview";
import { SwitchPreview } from "@/components/previews/SwitchPreview";
import { TextInputPreview } from "@/components/previews/TextInputPreview";
import { ValidationMessagePreview } from "@/components/previews/ValidationMessagePreview";
import { ProgressBarPreview } from "@/components/previews/ProgressBarPreview";
import { SkeletonPreview } from "@/components/previews/SkeletonPreview";
import { SpinnerPreview } from "@/components/previews/SpinnerPreview";
import { ToastPreview } from "@/components/previews/ToastPreview";
import { TooltipPreview } from "@/components/previews/TooltipPreview";
import { SearchFieldPreview } from "@/components/previews/SearchFieldPreview";
import { MenuPreview } from "@/components/previews/MenuPreview";
import { ComboboxPreview } from "@/components/previews/ComboboxPreview";
import { FileUploadPreview } from "@/components/previews/FileUploadPreview";
import { TablePreview } from "@/components/previews/TablePreview";
import { DataTablePreview } from "@/components/previews/DataTablePreview";
import { SelectPreview } from "@/components/previews/SelectPreview";
import { TextareaPreview } from "@/components/previews/TextareaPreview";
import { TreeViewPreview } from "@/components/previews/TreeViewPreview";
import { BarChartPreview } from "@/components/previews/BarChartPreview";
import { LineChartPreview } from "@/components/previews/LineChartPreview";
import { TimelinePreview } from "@/components/previews/TimelinePreview";
import { BankingTransactionRowPreview } from "@/components/previews/BankingTransactionRowPreview";
import { BankingAccountCardPreview } from "@/components/previews/BankingAccountCardPreview";
import { BankingBalanceSummaryPreview } from "@/components/previews/BankingBalanceSummaryPreview";

import type { ComponentType } from "react";

const previewMap: Record<string, ComponentType> = {
  "calendar-day": CalendarDayPreview,
  "calendar-grid": CalendarGridPreview,
  "date-picker": DatePickerPreview,
  "empty-state": EmptyStatePreview,
  "list-item": ListItemPreview,
  table: TablePreview,
  "data-table": DataTablePreview,
  "tree-view": TreeViewPreview,
  "bar-chart": BarChartPreview,
  "line-chart": LineChartPreview,
  timeline: TimelinePreview,
  accordion: AccordionPreview,
  avatar: AvatarPreview,
  divider: DividerPreview,
  tag: TagPreview,
  button: ButtonPreview,
  card: CardPreview,
  dialog: DialogPreview,
  drawer: DrawerPreview,
  popover: PopoverPreview,
  "text-input": TextInputPreview,
  textarea: TextareaPreview,
  select: SelectPreview,
  combobox: ComboboxPreview,
  "file-upload": FileUploadPreview,
  "search-field": SearchFieldPreview,
  "form-field": FormFieldPreview,
  "validation-message": ValidationMessagePreview,
  checkbox: CheckboxPreview,
  radio: RadioPreview,
  "radio-group": RadioPreview,
  switch: SwitchPreview,
  link: LinkPreview,
  menu: MenuPreview,
  breadcrumb: BreadcrumbPreview,
  tabs: TabsPreview,
  pagination: PaginationPreview,
  alert: AlertPreview,
  badge: BadgePreview,
  toast: ToastPreview,
  tooltip: TooltipPreview,
  skeleton: SkeletonPreview,
  "progress-bar": ProgressBarPreview,
  spinner: SpinnerPreview,
  "banking-transaction-row": BankingTransactionRowPreview,
  "banking-account-card": BankingAccountCardPreview,
  "banking-balance-summary": BankingBalanceSummaryPreview,
};

export function ComponentLiveSection({ slug }: { slug: string }) {
  const Preview = previewMap[slug];
  if (!Preview) return null;
  return <Preview />;
}
