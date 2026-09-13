"use client";

import Link from "next/link";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { LoadingSpinner } from "@/components/ui/icons";
import { useButtonGroupItem } from "@/components/ui/button-group-context";
import styles from "@/components/ui/button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type SharedButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Visible label. For icon-only buttons, also pass `aria-label`. */
  children: ReactNode;
  className?: string;
};

export type ButtonProps = SharedButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedButtonProps> & {
    href?: never;
    target?: never;
    rel?: never;
  };

export type ButtonLinkProps = SharedButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedButtonProps | "href"> & {
    href: string;
    disabled?: boolean;
    target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
    rel?: string;
  };

export type ButtonComponentProps = ButtonProps | ButtonLinkProps;

const sizeClass: Record<ButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
};

function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

function ButtonContent({
  loading,
  leadingIcon,
  trailingIcon,
  children,
}: Pick<SharedButtonProps, "loading" | "leadingIcon" | "trailingIcon" | "children">) {
  return (
    <>
      {loading ? (
        <span className={styles.icon} aria-hidden="true">
          <LoadingSpinner className={styles.spinner} />
        </span>
      ) : leadingIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
      {!loading && trailingIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
      {loading ? <span className="sr-only">Loading</span> : null}
    </>
  );
}

function ButtonLayers({
  loading,
  leadingIcon,
  trailingIcon,
  children,
}: Pick<SharedButtonProps, "loading" | "leadingIcon" | "trailingIcon" | "children">) {
  return (
    <>
      <span className={styles.visualSurface} aria-hidden="true" />
      <span className={styles.content}>
        <ButtonContent loading={loading} leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
          {children}
        </ButtonContent>
      </span>
    </>
  );
}

function useButtonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  inGroup: boolean,
  className?: string,
) {
  return cn(
    styles.button,
    variantClass[variant],
    sizeClass[size],
    fullWidth && styles.fullWidth,
    inGroup && styles.inGroup,
    className,
  );
}

function DisabledLink({
  className,
  loading,
  leadingIcon,
  trailingIcon,
  children,
  ariaLabel,
}: {
  className: string;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <span
      role="link"
      className={className}
      aria-disabled="true"
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      tabIndex={-1}
    >
      <ButtonLayers loading={loading} leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children}
      </ButtonLayers>
    </span>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonComponentProps>(function Button(
  props,
  ref,
) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
  } = props;

  const inGroup = useButtonGroupItem();
  const classes = useButtonClasses(variant, size, fullWidth, inGroup, className);
  const isDisabled = Boolean(props.disabled || loading);

  if ("href" in props && props.href) {
    const {
      href,
      target,
      rel,
      disabled,
      "aria-label": ariaLabel,
      variant: _variant,
      size: _size,
      loading: _loading,
      fullWidth: _fullWidth,
      leadingIcon: _leadingIcon,
      trailingIcon: _trailingIcon,
      className: _className,
      children: _children,
      ...anchorRest
    } = props;
    const linkDisabled = Boolean(disabled || loading);

    if (linkDisabled) {
      return (
        <DisabledLink
          className={classes}
          loading={loading}
          leadingIcon={leadingIcon}
          trailingIcon={trailingIcon}
          ariaLabel={ariaLabel}
        >
          {children}
        </DisabledLink>
      );
    }

    const external = isExternalHref(href);
    const resolvedRel =
      rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);

    if (external) {
      return (
        <a
          href={href}
          className={classes}
          target={target}
          rel={resolvedRel}
          aria-busy={loading || undefined}
          aria-label={ariaLabel}
          {...anchorRest}
        >
          <ButtonLayers
            loading={loading}
            leadingIcon={leadingIcon}
            trailingIcon={trailingIcon}
          >
            {children}
          </ButtonLayers>
        </a>
      );
    }

    return (
      <Link
        href={href}
        className={classes}
        target={target}
        rel={resolvedRel}
        aria-busy={loading || undefined}
        aria-label={ariaLabel}
        {...anchorRest}
      >
        <ButtonLayers
          loading={loading}
          leadingIcon={leadingIcon}
          trailingIcon={trailingIcon}
        >
          {children}
        </ButtonLayers>
      </Link>
    );
  }

  const {
    type = "button",
    disabled,
    "aria-label": ariaLabel,
    variant: _variant,
    size: _size,
    loading: _loading,
    fullWidth: _fullWidth,
    leadingIcon: _leadingIcon,
    trailingIcon: _trailingIcon,
    className: _className,
    children: _children,
    ...buttonRest
  } = props as ButtonProps;

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      aria-label={ariaLabel}
      {...buttonRest}
    >
      <ButtonLayers loading={loading} leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children}
      </ButtonLayers>
    </button>
  );
});
