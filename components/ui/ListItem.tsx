"use client";

import NextLink from "next/link";
import { useEffect, type ReactNode } from "react";
import { getLinkRel, shouldUseNativeAnchor } from "@/components/ui/internal/link-utils";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/list-item.module.css";

export type ListItemProps = {
  title: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

function warnInvalidCombination(message: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[Skrewww ListItem] ${message}`);
  }
}

function ListItemContent({
  title,
  description,
  metadata,
  leading,
  trailing,
}: Pick<ListItemProps, "title" | "description" | "metadata" | "leading" | "trailing">) {
  return (
    <>
      {leading ? <span className={styles.leading}>{leading}</span> : null}
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        {description ? <span className={styles.description}>{description}</span> : null}
      </span>
      {metadata ? <span className={styles.metadata}>{metadata}</span> : null}
      {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
    </>
  );
}

export function ListItem({
  title,
  description,
  metadata,
  leading,
  trailing,
  href,
  onClick,
  disabled = false,
  className,
}: ListItemProps) {
  const isNavigational = Boolean(href);
  const isAction = Boolean(onClick);
  const isInteractive = isNavigational || isAction;

  useEffect(() => {
    if (href && onClick) {
      warnInvalidCombination("Provide either href or onClick — not both.");
    }
    if (isInteractive && trailing) {
      warnInvalidCombination(
        "Interactive List Item rows cannot include a trailing control — keep trailing content static or use a static row with a separate trailing action.",
      );
    }
  }, [href, isInteractive, onClick, trailing]);

  if (isNavigational && href) {
    const rowClassName = cn(styles.row, styles.interactive);
    const content = (
      <ListItemContent
        title={title}
        description={description}
        metadata={metadata}
        leading={leading}
        trailing={trailing}
      />
    );

    return (
      <li className={cn(styles.item, className)}>
        {shouldUseNativeAnchor(href) ? (
          <a
            href={href}
            className={rowClassName}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
          >
            {content}
          </a>
        ) : (
          <NextLink
            href={href}
            className={rowClassName}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
          >
            {content}
          </NextLink>
        )}
      </li>
    );
  }

  if (isAction && onClick) {
    return (
      <li className={cn(styles.item, className)}>
        <button
          type="button"
          className={cn(styles.row, styles.interactive)}
          onClick={onClick}
          disabled={disabled}
        >
          <ListItemContent
            title={title}
            description={description}
            metadata={metadata}
            leading={leading}
            trailing={trailing}
          />
        </button>
      </li>
    );
  }

  return (
    <li className={cn(styles.item, styles.static, className)}>
      <div className={styles.row}>
        <ListItemContent
          title={title}
          description={description}
          metadata={metadata}
          leading={leading}
          trailing={trailing}
        />
      </div>
    </li>
  );
}
