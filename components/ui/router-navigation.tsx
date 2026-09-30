"use client";

import {
  createContext,
  forwardRef,
  useContext,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { shouldInterceptNavigation } from "@/components/ui/internal/link-utils";

/**
 * Router integration for link-bearing components (Button, Link, Pagination,
 * List Item). Components always render a native `<a href>`; with no provider
 * a click is ordinary browser navigation. A host application may mount one
 * `SkrewwwRouterProvider` so eligible internal navigations are handed to its
 * own router instead of reloading the page. The contract is navigation
 * intent ("go to this path"), not any particular router.
 */
export type SkrewwwNavigate = (href: string) => void;

const SkrewwwNavigateContext = createContext<SkrewwwNavigate | null>(null);

export type SkrewwwRouterProviderProps = {
  /**
   * Called with the root-relative href of a plain, same-window click on an
   * internal link. Modified or non-primary clicks, `target` other than
   * `_self`, `download`, prevented events and every non-root-relative href
   * are never passed to it. Memoize it to avoid re-rendering link consumers.
   */
  navigate: SkrewwwNavigate;
  children: ReactNode;
};

export function SkrewwwRouterProvider({ navigate, children }: SkrewwwRouterProviderProps) {
  return <SkrewwwNavigateContext.Provider value={navigate}>{children}</SkrewwwNavigateContext.Provider>;
}

export type RouterAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** Internal building block — not part of the public package API. */
export const RouterAnchor = forwardRef<HTMLAnchorElement, RouterAnchorProps>(function RouterAnchor(
  { href, target, download, onClick, ...rest },
  ref,
) {
  const navigate = useContext(SkrewwwNavigateContext);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (!navigate) return;
    const intercept = shouldInterceptNavigation({
      href,
      target,
      download,
      button: event.button,
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      defaultPrevented: event.defaultPrevented,
    });
    if (!intercept) return;
    event.preventDefault();
    navigate(href);
  }

  return <a ref={ref} href={href} target={target} download={download} onClick={handleClick} {...rest} />;
});
