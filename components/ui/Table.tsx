"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/table.module.css";

export type TableAlign = "start" | "center" | "end";

export type TableProps = ComponentPropsWithoutRef<"table"> & {
  /** Table layout algorithm. Defaults to browser auto layout. */
  layout?: "auto" | "fixed";
};

export type TableCaptionProps = ComponentPropsWithoutRef<"caption"> & {
  /** Visible caption (default) or visually hidden while remaining accessible. */
  visibility?: "visible" | "screen-reader";
};

export type TableHeadProps = Omit<ComponentPropsWithoutRef<"th">, "align"> & {
  align?: TableAlign;
};

export type TableCellProps = Omit<ComponentPropsWithoutRef<"td">, "align"> & {
  align?: TableAlign;
};

export type TableScrollAreaProps = ComponentPropsWithoutRef<"div"> & {
  /**
   * Accessible name for the overflow region.
   * When provided (or when aria-label / aria-labelledby is set), the wrapper uses role="region".
   * Prefer a label that describes scrolling/navigation value — do not duplicate the table caption verbatim.
   *
   * Focus policy: tabIndex remains consumer-controlled. Do not set tabIndex={0} on every table.
   * For known horizontally scrollable application tables, set tabIndex={0} so keyboard users can
   * focus the region and scroll with arrow keys / shift+scroll. Omit tabIndex when the table fits.
   */
  accessibleLabel?: string;
};

const alignClass: Record<TableAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
};

export const Table = forwardRef<ElementRef<"table">, TableProps>(function Table(
  { className, layout = "auto", ...props },
  ref,
) {
  return (
    <table
      ref={ref}
      data-layout={layout}
      className={cn(styles.table, layout === "fixed" && styles.layoutFixed, className)}
      {...props}
    />
  );
});

export const TableCaption = forwardRef<ElementRef<"caption">, TableCaptionProps>(
  function TableCaption({ className, visibility = "visible", ...props }, ref) {
    return (
      <caption
        ref={ref}
        data-visibility={visibility}
        className={cn(
          styles.caption,
          visibility === "screen-reader" && styles.captionScreenReader,
          className,
        )}
        {...props}
      />
    );
  },
);

export const TableHeader = forwardRef<
  ElementRef<"thead">,
  ComponentPropsWithoutRef<"thead">
>(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn(styles.header, className)} {...props} />;
});

export const TableBody = forwardRef<
  ElementRef<"tbody">,
  ComponentPropsWithoutRef<"tbody">
>(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn(styles.body, className)} {...props} />;
});

export const TableFooter = forwardRef<
  ElementRef<"tfoot">,
  ComponentPropsWithoutRef<"tfoot">
>(function TableFooter({ className, ...props }, ref) {
  return <tfoot ref={ref} className={cn(styles.footer, className)} {...props} />;
});

export const TableRow = forwardRef<ElementRef<"tr">, ComponentPropsWithoutRef<"tr">>(
  function TableRow({ className, ...props }, ref) {
    return <tr ref={ref} className={cn(styles.row, className)} {...props} />;
  },
);

export const TableHead = forwardRef<ElementRef<"th">, TableHeadProps>(function TableHead(
  { className, align = "start", ...props },
  ref,
) {
  return (
    <th
      ref={ref}
      data-align={align}
      className={cn(styles.head, alignClass[align], className)}
      {...props}
    />
  );
});

export const TableCell = forwardRef<ElementRef<"td">, TableCellProps>(function TableCell(
  { className, align = "start", ...props },
  ref,
) {
  return (
    <td
      ref={ref}
      data-align={align}
      className={cn(styles.cell, alignClass[align], className)}
      {...props}
    />
  );
});

export const TableScrollArea = forwardRef<ElementRef<"div">, TableScrollAreaProps>(
  function TableScrollArea(
    { className, accessibleLabel, role, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props },
    ref,
  ) {
    const resolvedLabel = accessibleLabel ?? ariaLabel;
    const hasAccessibleName = Boolean(resolvedLabel || ariaLabelledBy);
    const regionRole = role ?? (hasAccessibleName ? "region" : undefined);

    return (
      <div
        ref={ref}
        role={regionRole}
        aria-label={resolvedLabel}
        aria-labelledby={ariaLabelledBy}
        data-table-scroll=""
        className={cn(styles.scrollArea, className)}
        {...props}
      />
    );
  },
);
