import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { ListItem } from "@/components/ui/ListItem";
import { Pagination } from "@/components/ui/Pagination";
import { RouterAnchor, SkrewwwRouterProvider } from "@/components/ui/router-navigation";
import {
  isRouterNavigableHref,
  shouldInterceptNavigation,
} from "@/components/ui/internal/link-utils";

function renderWithRouter(ui: React.ReactElement) {
  const navigate = vi.fn();
  render(<SkrewwwRouterProvider navigate={navigate}>{ui}</SkrewwwRouterProvider>);
  return navigate;
}

/** Dispatches a cancelable click and reports whether the browser default survived. */
function click(el: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init });
  el.dispatchEvent(event);
  return event;
}

describe("isRouterNavigableHref", () => {
  it.each([
    ["/components/button", true],
    ["/", true],
    ["/docs?x=1#y", true],
    ["//cdn.example/x", false],
    ["#section", false],
    ["./sibling", false],
    ["../up", false],
    ["sibling", false],
    ["mailto:a@b.co", false],
    ["tel:+15551234567", false],
    ["https://skrewww.com/docs", false],
    ["", false],
  ])("%s -> %s", (href, expected) => {
    expect(isRouterNavigableHref(href)).toBe(expected);
  });
});

describe("shouldInterceptNavigation", () => {
  const base = {
    href: "/docs",
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
  };

  it("intercepts a plain primary click on an internal path", () => {
    expect(shouldInterceptNavigation(base)).toBe(true);
    expect(shouldInterceptNavigation({ ...base, target: "_self" })).toBe(true);
  });

  it.each([
    ["meta", { metaKey: true }],
    ["ctrl", { ctrlKey: true }],
    ["shift", { shiftKey: true }],
    ["alt", { altKey: true }],
    ["middle button", { button: 1 }],
    ["right button", { button: 2 }],
    ["target _blank", { target: "_blank" }],
    ["target named frame", { target: "preview" }],
    ["download attribute", { download: "" }],
    ["download filename", { download: "report.pdf" }],
    ["already prevented", { defaultPrevented: true }],
    ["external href", { href: "https://example.com" }],
    ["hash href", { href: "#top" }],
  ])("leaves %s to the browser", (_name, patch) => {
    expect(shouldInterceptNavigation({ ...base, ...patch })).toBe(false);
  });
});

describe("RouterAnchor without a provider", () => {
  it("is a plain native anchor and never prevents the browser default", () => {
    render(<RouterAnchor href="/docs">Docs</RouterAnchor>);
    const anchor = screen.getByRole("link", { name: "Docs" });
    expect(anchor.tagName).toBe("A");
    expect(anchor).toHaveAttribute("href", "/docs");
    expect(click(anchor).defaultPrevented).toBe(false);
  });

  it("forwards its ref to the anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <RouterAnchor ref={ref} href="/docs">
        Docs
      </RouterAnchor>,
    );
    expect(ref.current?.tagName).toBe("A");
  });
});

describe("RouterAnchor with a provider", () => {
  it("hands a plain internal click to navigate and cancels the browser default", () => {
    const navigate = renderWithRouter(<RouterAnchor href="/docs">Docs</RouterAnchor>);
    const event = click(screen.getByRole("link", { name: "Docs" }));
    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/docs");
  });

  it("keeps href and accessible name on the anchor", () => {
    renderWithRouter(<RouterAnchor href="/docs">Docs</RouterAnchor>);
    const anchor = screen.getByRole("link", { name: "Docs" });
    expect(anchor).toHaveAttribute("href", "/docs");
  });

  it.each([
    ["ctrl-click", { ctrlKey: true }],
    ["meta-click", { metaKey: true }],
    ["shift-click", { shiftKey: true }],
    ["middle-click", { button: 1 }],
  ])("does not intercept %s", (_name, init) => {
    const navigate = renderWithRouter(<RouterAnchor href="/docs">Docs</RouterAnchor>);
    const event = click(screen.getByRole("link", { name: "Docs" }), init);
    expect(event.defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("does not intercept target=_blank, download, external, hash or relative links", () => {
    const navigate = renderWithRouter(
      <>
        <RouterAnchor href="/a" target="_blank">blank</RouterAnchor>
        <RouterAnchor href="/b" download>dl</RouterAnchor>
        <RouterAnchor href="https://example.com/c">ext</RouterAnchor>
        <RouterAnchor href="#d">hash</RouterAnchor>
        <RouterAnchor href="./e">rel</RouterAnchor>
      </>,
    );
    for (const name of ["blank", "dl", "ext", "hash", "rel"]) {
      expect(click(screen.getByRole("link", { name })).defaultPrevented).toBe(false);
    }
    expect(navigate).not.toHaveBeenCalled();
  });

  it("respects a consumer onClick that prevents default", () => {
    const navigate = vi.fn();
    render(
      <SkrewwwRouterProvider navigate={navigate}>
        <RouterAnchor href="/docs" onClick={(event) => event.preventDefault()}>
          Docs
        </RouterAnchor>
      </SkrewwwRouterProvider>,
    );
    click(screen.getByRole("link", { name: "Docs" }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("still calls a consumer onClick first", () => {
    const order: string[] = [];
    const navigate = vi.fn(() => order.push("navigate"));
    render(
      <SkrewwwRouterProvider navigate={navigate}>
        <RouterAnchor href="/docs" onClick={() => order.push("onClick")}>
          Docs
        </RouterAnchor>
      </SkrewwwRouterProvider>,
    );
    click(screen.getByRole("link", { name: "Docs" }));
    expect(order).toEqual(["onClick", "navigate"]);
  });
});

describe("link-bearing components use the router contract", () => {
  it("Button href renders a native anchor and navigates through the provider", () => {
    const navigate = renderWithRouter(<Button href="/components">Browse</Button>);
    const anchor = screen.getByRole("link", { name: "Browse" });
    expect(anchor.tagName).toBe("A");
    expect(click(anchor).defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/components");
  });

  it("Button renders an anchor with no provider at all", () => {
    render(<Button href="/components">Browse</Button>);
    expect(click(screen.getByRole("link", { name: "Browse" })).defaultPrevented).toBe(false);
  });

  it("Button keeps external links native even inside a provider", () => {
    const navigate = renderWithRouter(<Button href="https://example.com">Out</Button>);
    expect(click(screen.getByRole("link", { name: "Out" })).defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("Link navigates through the provider", () => {
    const navigate = renderWithRouter(<Link href="/guard">Guard</Link>);
    click(screen.getByRole("link", { name: "Guard" }));
    expect(navigate).toHaveBeenCalledWith("/guard");
  });

  it("List Item navigational rows navigate through the provider", () => {
    const navigate = renderWithRouter(
      <ul>
        <ListItem title="Row" href="/row" />
      </ul>,
    );
    fireEvent.click(screen.getByRole("link", { name: /Row/ }));
    expect(navigate).toHaveBeenCalledWith("/row");
  });

  it("Pagination page and previous/next links navigate through the provider", () => {
    const navigate = renderWithRouter(
      <Pagination
        items={[
          { type: "previous", href: "/p/1" },
          { type: "page", page: 2, href: "/p/2", current: true },
          { type: "next", href: "/p/3" },
        ]}
      />,
    );
    click(screen.getByRole("link", { name: /Previous/i }));
    click(screen.getByRole("link", { name: /Next/i }));
    expect(navigate).toHaveBeenNthCalledWith(1, "/p/1");
    expect(navigate).toHaveBeenNthCalledWith(2, "/p/3");
  });
});
