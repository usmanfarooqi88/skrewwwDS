"use client";

import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/empty-state.module.css";

export type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  illustration?: ReactNode;
  illustrationAlt?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
};

function EmptyStateActionControl({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: "primary" | "secondary";
}) {
  if (action.href) {
    return (
      <Link href={action.href} className={variant === "primary" ? styles.primaryLink : styles.secondaryLink}>
        {action.label}
      </Link>
    );
  }

  return (
    <Button type="button" variant={variant === "primary" ? "primary" : "secondary"} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  illustration,
  illustrationAlt,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const titleId = useId();
  const hasIllustration = Boolean(illustration);
  const informativeIllustration = hasIllustration && Boolean(illustrationAlt?.trim());

  return (
    <section className={cn(styles.root, className)} aria-labelledby={titleId}>
      {icon ? (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      ) : null}
      {hasIllustration ? (
        informativeIllustration ? (
          <div className={styles.illustration}>{illustration}</div>
        ) : (
          <div className={styles.illustration} aria-hidden="true">
            {illustration}
          </div>
        )
      ) : null}
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {primaryAction || secondaryAction ? (
        <div className={styles.actions}>
          {primaryAction ? (
            <EmptyStateActionControl action={primaryAction} variant="primary" />
          ) : null}
          {secondaryAction ? (
            <EmptyStateActionControl action={secondaryAction} variant="secondary" />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
