"use client";

import { User } from "@phosphor-icons/react";
import {
  useCallback,
  useState,
  type ImgHTMLAttributes,
  type SyntheticEvent,
} from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/avatar.module.css";

export type AvatarSize = "sm" | "md" | "lg";

export type AvatarProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "children"> & {
  size?: AvatarSize;
  src?: string;
  alt?: string;
  initials?: string;
  /** Accessible name for initials or icon fallback when informative. */
  label?: string;
  /** When true, hides the avatar from assistive technology. */
  decorative?: boolean;
};

export function Avatar({
  size = "md",
  src,
  alt,
  initials,
  label,
  decorative = false,
  className,
  onError,
  ...props
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src) && !imageFailed;

  const handleError = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      setImageFailed(true);
      onError?.(event);
    },
    [onError],
  );

  const imageAlt = decorative ? "" : alt ?? "";
  const fallbackLabel = !decorative && !showImage ? label : undefined;

  return (
    <span
      className={cn(styles.root, styles[size], className)}
      data-fallback={showImage ? undefined : initials ? "initials" : "icon"}
      aria-hidden={decorative || undefined}
      aria-label={fallbackLabel}
      role={fallbackLabel ? "img" : undefined}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- native img required for onError fallback
        <img
          {...props}
          src={src}
          alt={imageAlt}
          className={styles.image}
          onError={handleError}
        />
      ) : initials ? (
        <span className={styles.initials} aria-hidden={fallbackLabel ? true : undefined}>
          {initials.slice(0, 2).toUpperCase()}
        </span>
      ) : (
        <User size={size === "sm" ? 16 : size === "lg" ? 28 : 20} aria-hidden="true" />
      )}
    </span>
  );
}
