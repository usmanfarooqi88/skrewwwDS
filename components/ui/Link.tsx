import NextLink from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { getLinkRel, shouldUseNativeAnchor } from "@/components/ui/internal/link-utils";
import styles from "@/components/ui/link.module.css";

export type LinkVariant = "default" | "subtle" | "danger";
export type LinkSize = "sm" | "md" | "lg";

export type LinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "children"
> & {
  href: string;
  variant?: LinkVariant;
  size?: LinkSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children: ReactNode;
  className?: string;
};

const variantClass: Record<LinkVariant, string> = {
  default: styles.default,
  subtle: styles.subtle,
  danger: styles.danger,
};

const sizeClass: Record<LinkSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export function Link({
  href,
  variant = "default",
  size = "md",
  leadingIcon,
  trailingIcon,
  children,
  className,
  target,
  rel,
  ...rest
}: LinkProps) {
  const external = shouldUseNativeAnchor(href);
  const resolvedRel = getLinkRel(target, rel);
  const classes = cn(styles.link, variantClass[variant], sizeClass[size], className);

  const content = (
    <>
      {leadingIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
      {trailingIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
    </>
  );

  if (external) {
    return (
      <a href={href} className={classes} target={target} rel={resolvedRel} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <NextLink href={href} className={classes} target={target} rel={resolvedRel} {...rest}>
      {content}
    </NextLink>
  );
}
