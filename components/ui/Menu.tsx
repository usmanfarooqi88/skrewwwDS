"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  cloneElement,
  isValidElement,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type MutableRefObject,
} from "react";
import { cn } from "@/lib/cn";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  usePopoverOpen,
  usePopoverRequestClose,
  usePopoverSetOpen,
} from "@/components/ui/Popover";
import type { PopoverAlign, PopoverPlacement } from "@/components/ui/internal/popover-position";
import { createMenuTypeahead } from "@/components/ui/internal/menu-typeahead";
import styles from "@/components/ui/menu.module.css";

type MenuFocusTarget = "first" | "last";

type RegisteredMenuItem = {
  id: string;
  ref: RefObject<HTMLElement | null>;
  text: string;
  disabled: boolean;
  activate: () => void;
};

type MenuContextValue = {
  menuId: string;
  triggerId: string;
  loop: boolean;
  closeOnSelect: boolean;
  disabled: boolean;
  registerItem: (item: RegisteredMenuItem) => void;
  unregisterItem: (id: string) => void;
  getItems: () => RegisteredMenuItem[];
  setPendingFocus: (target: MenuFocusTarget | null) => void;
  consumePendingFocus: () => MenuFocusTarget | null;
  requestItemClose: (shouldClose?: boolean) => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(component: string): MenuContextValue {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error(`${component} must be used within Menu`);
  }
  return context;
}

function getEnabledItems(items: RegisteredMenuItem[]): RegisteredMenuItem[] {
  return items.filter((item) => !item.disabled);
}

function focusMenuItem(item: RegisteredMenuItem) {
  const node = item.ref.current;
  if (!node) return;
  node.focus({ preventScroll: true });
  if (typeof node.scrollIntoView === "function") {
    node.scrollIntoView({ block: "nearest" });
  }
}

function extractTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractTextContent).join("");
  return "";
}

export type MenuProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopoverPlacement;
  align?: PopoverAlign;
  loop?: boolean;
  closeOnSelect?: boolean;
  disabled?: boolean;
  children: ReactNode;
};

export function Menu({
  open,
  defaultOpen = false,
  onOpenChange,
  placement = "bottom",
  align = "start",
  loop = false,
  closeOnSelect = true,
  disabled = false,
  children,
}: MenuProps) {
  const menuId = useId();
  const triggerId = useId();
  const itemsRef = useRef<Map<string, RegisteredMenuItem>>(new Map());
  const pendingFocusRef = useRef<MenuFocusTarget | null>(null);
  const requestCloseRef = useRef<(options?: { restoreFocus?: boolean }) => void>(() => {});

  const registerItem = useCallback((item: RegisteredMenuItem) => {
    itemsRef.current.set(item.id, item);
  }, []);

  const unregisterItem = useCallback((id: string) => {
    itemsRef.current.delete(id);
  }, []);

  const getItems = useCallback(() => Array.from(itemsRef.current.values()), []);

  const setPendingFocus = useCallback((target: MenuFocusTarget | null) => {
    pendingFocusRef.current = target;
  }, []);

  const consumePendingFocus = useCallback(() => {
    const next = pendingFocusRef.current;
    pendingFocusRef.current = null;
    return next;
  }, []);

  const requestItemClose = useCallback(
    (shouldClose = closeOnSelect) => {
      if (shouldClose) {
        requestCloseRef.current({ restoreFocus: true });
      }
    },
    [closeOnSelect],
  );

  const value = useMemo(
    () => ({
      menuId,
      triggerId,
      loop,
      closeOnSelect,
      disabled,
      registerItem,
      unregisterItem,
      getItems,
      setPendingFocus,
      consumePendingFocus,
      requestItemClose,
    }),
    [
      closeOnSelect,
      consumePendingFocus,
      disabled,
      getItems,
      loop,
      menuId,
      registerItem,
      requestItemClose,
      setPendingFocus,
      triggerId,
      unregisterItem,
    ],
  );

  return (
    <Popover
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      placement={placement}
      align={align}
      focusMode="trigger"
      showArrow={false}
    >
      <MenuContext.Provider value={value}>
        <MenuCloseBridge requestCloseRef={requestCloseRef} />
        {children}
      </MenuContext.Provider>
    </Popover>
  );
}

function MenuCloseBridge({
  requestCloseRef,
}: {
  requestCloseRef: MutableRefObject<(options?: { restoreFocus?: boolean }) => void>;
}) {
  const requestClose = usePopoverRequestClose();
  useLayoutEffect(() => {
    requestCloseRef.current = requestClose;
  }, [requestClose, requestCloseRef]);
  return null;
}

export type MenuTriggerProps = {
  children: React.ReactElement<{
    id?: string;
    disabled?: boolean;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
    "aria-controls"?: string;
    "aria-expanded"?: boolean;
    "aria-haspopup"?: string | boolean;
    type?: "button" | "submit" | "reset";
  }>;
};

export function MenuTrigger({ children }: MenuTriggerProps) {
  const { menuId, triggerId, disabled: menuDisabled, setPendingFocus } = useMenuContext("MenuTrigger");
  const open = usePopoverOpen();
  const setOpen = usePopoverSetOpen();

  if (!isValidElement(children)) return children;

  const childDisabled = Boolean(children.props.disabled) || menuDisabled;

  const enhanced = cloneElement(children, {
    id: children.props.id ?? triggerId,
    type: children.props.type ?? "button",
    disabled: childDisabled,
    "aria-haspopup": "menu",
    "aria-controls": open ? menuId : children.props["aria-controls"],
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      children.props.onKeyDown?.(event);
      if (event.defaultPrevented || childDisabled) return;
      if (!open && event.key === "ArrowDown") {
        event.preventDefault();
        setPendingFocus("first");
        setOpen(true);
      } else if (!open && event.key === "ArrowUp") {
        event.preventDefault();
        setPendingFocus("last");
        setOpen(true);
      }
    },
  });

  return <PopoverTrigger>{enhanced}</PopoverTrigger>;
}

export type MenuContentProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function MenuContent({ children, className, "aria-label": ariaLabel }: MenuContentProps) {
  const {
    menuId,
    triggerId,
    loop,
    getItems,
    consumePendingFocus,
  } = useMenuContext("MenuContent");
  const open = usePopoverOpen();
  const requestClose = usePopoverRequestClose();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const typeaheadRef = useRef(createMenuTypeahead({ getItems: () => [], onMatch: () => {} }));

  useLayoutEffect(() => {
    typeaheadRef.current = createMenuTypeahead({
      getItems: () =>
        getItems().map((item) => ({ id: item.id, text: item.text, disabled: item.disabled })),
      onMatch: (id) => {
        const item = getItems().find((entry) => entry.id === id);
        if (item) focusMenuItem(item);
      },
    });
  }, [getItems, open]);

  useLayoutEffect(() => {
    if (!open) {
      typeaheadRef.current.reset();
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const enabled = getEnabledItems(getItems());
      if (enabled.length === 0) return;
      const pending = consumePendingFocus();
      const target = pending === "last" ? enabled[enabled.length - 1] : enabled[0];
      focusMenuItem(target);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [consumePendingFocus, getItems, open]);

  useEffect(() => {
    if (!open) return;
    function handleTabClose(event: globalThis.KeyboardEvent) {
      if (event.key === "Tab") {
        requestClose({ restoreFocus: false });
      }
    }
    document.addEventListener("keydown", handleTabClose);
    return () => document.removeEventListener("keydown", handleTabClose);
  }, [open, requestClose]);

  const moveFocus = useCallback(
    (direction: 1 | -1) => {
      const enabled = getEnabledItems(getItems());
      if (enabled.length === 0) return;
      const activeIndex = enabled.findIndex((item) => item.ref.current === document.activeElement);
      let nextIndex = activeIndex + direction;
      if (activeIndex === -1) {
        nextIndex = direction === 1 ? 0 : enabled.length - 1;
      } else if (loop) {
        nextIndex = (nextIndex + enabled.length) % enabled.length;
      } else {
        nextIndex = Math.max(0, Math.min(enabled.length - 1, nextIndex));
      }
      focusMenuItem(enabled[nextIndex]);
    },
    [getItems, loop],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const enabled = getEnabledItems(getItems());
      const activeItem = enabled.find((item) => item.ref.current === document.activeElement);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveFocus(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        if (enabled[0]) focusMenuItem(enabled[0]);
      } else if (event.key === "End") {
        event.preventDefault();
        if (enabled[enabled.length - 1]) focusMenuItem(enabled[enabled.length - 1]);
      } else if (event.key === "Enter" || event.key === " ") {
        if (activeItem) {
          event.preventDefault();
          activeItem.activate();
        }
      } else if (event.key === "Tab") {
        requestClose({ restoreFocus: false });
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (typeaheadRef.current.handleKey(event.key)) {
          event.preventDefault();
        }
      }
    },
    [getItems, moveFocus, requestClose],
  );

  return (
    <PopoverContent className={cn(styles.content, className)}>
      <PopoverBody className={styles.body}>
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : triggerId}
          className={styles.menu}
          onKeyDown={handleKeyDown}
        >
          {children}
        </div>
      </PopoverBody>
    </PopoverContent>
  );
}

export type MenuItemProps = {
  children: ReactNode;
  onSelect?: (event: Event) => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
  shortcut?: string;
  textValue?: string;
  closeOnSelect?: boolean;
  href?: string;
  /** Anchor target, e.g. "_blank" for an external destination. Only meaningful alongside `href`. */
  target?: string;
  /** Anchor rel — pass "noopener noreferrer" with target="_blank" for a real external link, matching the site's other external-link usage. */
  rel?: string;
  className?: string;
};

export function MenuItem({
  children,
  onSelect,
  disabled = false,
  destructive = false,
  icon,
  shortcut,
  textValue,
  closeOnSelect,
  href,
  target,
  rel,
  className,
}: MenuItemProps) {
  const itemId = useId();
  const itemRef = useRef<HTMLElement | null>(null);
  const { disabled: menuDisabled, registerItem, unregisterItem, requestItemClose } =
    useMenuContext("MenuItem");
  const isDisabled = disabled || menuDisabled;
  const resolvedText = textValue ?? extractTextContent(children);

  const activate = useCallback(
    (event?: Event) => {
      if (isDisabled) return;
      if (event) onSelect?.(event);
      else onSelect?.(new Event("select"));
      requestItemClose(closeOnSelect);
    },
    [closeOnSelect, isDisabled, onSelect, requestItemClose],
  );

  useLayoutEffect(() => {
    registerItem({
      id: itemId,
      ref: itemRef,
      text: resolvedText,
      disabled: isDisabled,
      activate,
    });
    return () => unregisterItem(itemId);
  }, [activate, isDisabled, itemId, registerItem, resolvedText, unregisterItem]);

  const classes = cn(
    styles.item,
    destructive && styles.itemDestructive,
    isDisabled && styles.itemDisabled,
    className,
  );

  const content = (
    <>
      {icon ? (
        <span className={styles.itemIcon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.itemLabel}>{children}</span>
      {shortcut ? <span className={styles.itemShortcut}>{shortcut}</span> : null}
    </>
  );

  if (href && !isDisabled) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        role="menuitem"
        ref={itemRef as RefObject<HTMLAnchorElement>}
        className={classes}
        onClick={(event) => {
          activate(event.nativeEvent);
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      ref={itemRef as RefObject<HTMLDivElement>}
      role="menuitem"
      tabIndex={-1}
      aria-disabled={isDisabled || undefined}
      className={classes}
      onClick={(event) => {
        if (isDisabled) return;
        activate(event.nativeEvent);
      }}
    >
      {content}
    </div>
  );
}

export type MenuSeparatorProps = {
  className?: string;
};

export function MenuSeparator({ className }: MenuSeparatorProps) {
  return <div role="separator" className={cn(styles.separator, className)} />;
}

export type MenuLabelProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function MenuLabel({ children, className, id: idProp }: MenuLabelProps) {
  const generatedId = useId();
  return (
    <div id={idProp ?? generatedId} className={cn(styles.label, className)}>
      {children}
    </div>
  );
}

export type MenuGroupProps = {
  children: ReactNode;
  label?: string;
  className?: string;
};

export function MenuGroup({ children, label, className }: MenuGroupProps) {
  const labelId = useId();
  return (
    <div
      role="group"
      aria-labelledby={label ? labelId : undefined}
      className={cn(styles.group, className)}
    >
      {label ? (
        <MenuLabel id={labelId}>{label}</MenuLabel>
      ) : null}
      {children}
    </div>
  );
}

export type MenuShortcutProps = {
  children: ReactNode;
  className?: string;
};

export function MenuShortcut({ children, className }: MenuShortcutProps) {
  return <span className={cn(styles.itemShortcut, className)}>{children}</span>;
}
