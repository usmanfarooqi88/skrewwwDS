import { describe, expect, it } from "vitest";
import { getActiveComponentSlug, isSidebarNavLinkActive } from "@/lib/sidebar-nav";

describe("getActiveComponentSlug", () => {
  it("returns the slug for component detail pages", () => {
    expect(getActiveComponentSlug("/components/button-group")).toBe("button-group");
  });

  it("canonicalizes redirected slugs", () => {
    expect(getActiveComponentSlug("/components/form-field-wrapper")).toBe("form-field");
  });

  it("returns null for non-component routes", () => {
    expect(getActiveComponentSlug("/foundations")).toBeNull();
    expect(getActiveComponentSlug("/components/category/actions")).toBeNull();
  });
});

describe("isSidebarNavLinkActive", () => {
  it("marks foundations as active on its route", () => {
    expect(
      isSidebarNavLinkActive("/foundations", {
        href: "/foundations",
        match: "foundations",
      }),
    ).toBe(true);
  });

  it("marks the matching component as active", () => {
    expect(
      isSidebarNavLinkActive("/components/button-group", {
        href: "/components/button-group",
        match: "component",
        slug: "button-group",
      }),
    ).toBe(true);
  });

  it("matches canonical slugs for redirected component pages", () => {
    expect(
      isSidebarNavLinkActive("/components/form-field", {
        href: "/components/form-field",
        match: "component",
        slug: "form-field-wrapper",
      }),
    ).toBe(true);
  });

  it("does not mark unrelated links as active", () => {
    expect(
      isSidebarNavLinkActive("/components/button", {
        href: "/components/button-group",
        match: "component",
        slug: "button-group",
      }),
    ).toBe(false);
  });
});
