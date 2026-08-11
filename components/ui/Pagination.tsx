import NextLink from "next/link";
import { cn } from "@/lib/cn";
import { getLinkRel, shouldUseNativeAnchor } from "@/components/ui/internal/link-utils";
import styles from "@/components/ui/pagination.module.css";

export type PaginationItem =
  | { type: "page"; page: number; href?: string; current?: boolean; disabled?: boolean }
  | { type: "ellipsis" }
  | { type: "previous"; href?: string; disabled?: boolean; label?: string; page?: number }
  | { type: "next"; href?: string; disabled?: boolean; label?: string; page?: number };

export type PaginationProps = {
  items: PaginationItem[];
  className?: string;
  onPageChange?: (page: number) => void;
  "aria-label"?: string;
};

function PageControl({
  page,
  href,
  current = false,
  disabled = false,
  onPageChange,
}: {
  page: number;
  href?: string;
  current?: boolean;
  disabled?: boolean;
  onPageChange?: (page: number) => void;
}) {
  const label = `Page ${page}`;
  const className = cn(
    styles.control,
    styles.pageItem,
    current && styles.current,
    disabled && styles.disabled,
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true" aria-label={label}>
        {page}
      </span>
    );
  }

  if (current) {
    return (
      <span className={className} aria-current="page" aria-label={label}>
        {page}
      </span>
    );
  }

  if (href) {
    const external = shouldUseNativeAnchor(href);
    if (external) {
      return (
        <a href={href} className={className} aria-label={label}>
          {page}
        </a>
      );
    }
    return (
      <NextLink href={href} className={className} aria-label={label}>
        {page}
      </NextLink>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={() => onPageChange?.(page)}
    >
      {page}
    </button>
  );
}

function BoundaryControl({
  kind,
  href,
  disabled = false,
  label,
  onPageChange,
  page,
}: {
  kind: "previous" | "next";
  href?: string;
  disabled?: boolean;
  label: string;
  onPageChange?: (page: number) => void;
  page?: number;
}) {
  const className = cn(styles.control, styles.boundary, disabled && styles.disabled);

  if (disabled) {
    return (
      <span className={className} aria-disabled="true" aria-label={label}>
        {kind === "previous" ? "Previous" : "Next"}
      </span>
    );
  }

  if (href) {
    const external = shouldUseNativeAnchor(href);
    if (external) {
      return (
        <a href={href} className={className} aria-label={label} rel={getLinkRel()}>
          {kind === "previous" ? "Previous" : "Next"}
        </a>
      );
    }
    return (
      <NextLink href={href} className={className} aria-label={label}>
        {kind === "previous" ? "Previous" : "Next"}
      </NextLink>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={() => {
        if (typeof page === "number") onPageChange?.(page);
      }}
    >
      {kind === "previous" ? "Previous" : "Next"}
    </button>
  );
}

export function Pagination({
  items,
  className,
  onPageChange,
  "aria-label": ariaLabel = "Pagination",
}: PaginationProps) {
  return (
    <nav aria-label={ariaLabel} className={cn(styles.root, className)}>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={`${item.type}-${index}`} className={styles.item}>
            {item.type === "page" ? (
              <PageControl
                page={item.page}
                href={item.href}
                current={item.current}
                disabled={item.disabled}
                onPageChange={onPageChange}
              />
            ) : null}
            {item.type === "ellipsis" ? (
              <span className={styles.ellipsis} aria-hidden="true">
                …
                <span className="sr-only">More pages</span>
              </span>
            ) : null}
            {item.type === "previous" ? (
              <BoundaryControl
                kind="previous"
                href={item.href}
                disabled={item.disabled}
                label={item.label ?? "Previous page"}
                onPageChange={onPageChange}
                page={item.page}
              />
            ) : null}
            {item.type === "next" ? (
              <BoundaryControl
                kind="next"
                href={item.href}
                disabled={item.disabled}
                label={item.label ?? "Next page"}
                onPageChange={onPageChange}
                page={item.page}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function buildPaginationRange(options: {
  currentPage: number;
  totalPages: number;
  siblingCount?: number;
  boundaryCount?: number;
}): number[] {
  const { currentPage, totalPages, siblingCount = 1, boundaryCount = 1 } = options;
  const pages = new Set<number>();

  for (let page = 1; page <= Math.min(boundaryCount, totalPages); page += 1) {
    pages.add(page);
  }
  for (
    let page = Math.max(1, currentPage - siblingCount);
    page <= Math.min(totalPages, currentPage + siblingCount);
    page += 1
  ) {
    pages.add(page);
  }
  for (let page = Math.max(1, totalPages - boundaryCount + 1); page <= totalPages; page += 1) {
    pages.add(page);
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export function buildPaginationItems(options: {
  currentPage: number;
  totalPages: number;
  hrefBuilder?: (page: number) => string | undefined;
  siblingCount?: number;
  boundaryCount?: number;
}): PaginationItem[] {
  const { currentPage, totalPages, hrefBuilder, siblingCount = 1, boundaryCount = 1 } = options;
  const items: PaginationItem[] = [
    {
      type: "previous",
      href: currentPage > 1 ? hrefBuilder?.(currentPage - 1) : undefined,
      disabled: currentPage <= 1,
      label: "Previous page",
      page: currentPage - 1,
    },
  ];

  const pages = buildPaginationRange({ currentPage, totalPages, siblingCount, boundaryCount });
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous > 1) {
      items.push({ type: "ellipsis" });
    }
    items.push({
      type: "page",
      page,
      current: page === currentPage,
      href: hrefBuilder?.(page),
    });
  });

  items.push({
    type: "next",
    href: currentPage < totalPages ? hrefBuilder?.(currentPage + 1) : undefined,
    disabled: currentPage >= totalPages,
    label: "Next page",
    page: currentPage + 1,
  });

  return items;
}
