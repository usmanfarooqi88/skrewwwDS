import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/card.module.css";

export type CardElevation = "flat" | "raised";
export type CardElement = "div" | "article" | "section" | "li";

export type CardProps = HTMLAttributes<HTMLElement> & {
  /** Semantic wrapper. Defaults to `div`. Use `article` only for independently meaningful content. */
  as?: CardElement;
  elevation?: CardElevation;
  title?: string;
  /** Heading level for the optional title. Defaults to `h3`. */
  headingLevel?: "h2" | "h3" | "h4";
  footer?: ReactNode;
  bodyClassName?: string;
};

export function Card({
  as = "div",
  elevation = "flat",
  title,
  headingLevel: Heading = "h3",
  footer,
  bodyClassName,
  children,
  className,
  ...props
}: CardProps) {
  return createElement(
    as,
    {
      className: cn(
        styles.card,
        elevation === "raised" ? styles.raised : styles.flat,
        className,
      ),
      ...props,
    },
    title ? (
      <header className={styles.header}>
        <Heading className={styles.title}>{title}</Heading>
      </header>
    ) : null,
    <div className={cn(styles.body, bodyClassName)}>{children}</div>,
    footer ? <footer className={styles.footer}>{footer}</footer> : null,
  );
}
