import { allComponents } from "@/lib/data";
import {
  componentRegistry,
  getImplementedRegistryEntries,
  type ComponentRegistryEntry,
} from "@/lib/component-registry";
import { getCategoryPageHref, type CategoryName } from "@/lib/category-content";
import { CHART_COMPONENT_SLUGS } from "@/lib/global-nav";
import { REDIRECTED_COMPONENT_SLUGS, getComponentHref } from "@/lib/routes";
import { categories } from "@/lib/types";
import type { ComponentDoc } from "@/lib/types";

export type DirectoryStatus = "stable" | "beta" | "docs-only";

export type ComponentDirectoryEntry = {
  slug: string;
  name: string;
  href: string;
  category: CategoryName;
  status: DirectoryStatus;
  implemented: boolean;
};

export type ComponentDirectoryGroup = {
  category: CategoryName;
  href: string;
  entries: ComponentDirectoryEntry[];
};

const chartSlugs = new Set<string>(CHART_COMPONENT_SLUGS);
const redirectedSlugs = new Set<string>(REDIRECTED_COMPONENT_SLUGS);
const registryBySlug = new Map(componentRegistry.map((entry) => [entry.slug, entry]));

function directoryStatus(entry: ComponentRegistryEntry | undefined): DirectoryStatus {
  if (!entry?.hasImplementation) return "docs-only";
  if (entry.status === "stable" || entry.status === "beta") return entry.status;
  throw new Error(
    `Implemented directory entry "${entry.slug}" has unsupported maturity "${entry.status}"`,
  );
}

function compareByName(a: ComponentDirectoryEntry, b: ComponentDirectoryEntry): number {
  return a.name.localeCompare(b.name, "en");
}

function toDirectoryEntry(doc: ComponentDoc): ComponentDirectoryEntry | null {
  if (redirectedSlugs.has(doc.slug) || doc.industry) return null;
  const registryEntry = registryBySlug.get(doc.slug);

  return {
    slug: doc.slug,
    name: doc.name,
    href: getComponentHref(doc.slug),
    category: doc.category as CategoryName,
    status: directoryStatus(registryEntry),
    implemented: Boolean(registryEntry?.hasImplementation),
  };
}

const genericEntries = allComponents
  .map(toDirectoryEntry)
  .filter((entry): entry is ComponentDirectoryEntry => entry !== null);

export function getComponentDirectoryGroups({
  includeCharts = false,
}: {
  includeCharts?: boolean;
} = {}): ComponentDirectoryGroup[] {
  return categories.map((category) => ({
    category,
    href: getCategoryPageHref(category),
    entries: genericEntries
      .filter(
        (entry) => entry.category === category && (includeCharts || !chartSlugs.has(entry.slug)),
      )
      .toSorted(compareByName),
  }));
}

export function getCategoryDirectoryEntries(category: CategoryName): ComponentDirectoryEntry[] {
  return getComponentDirectoryGroups({ includeCharts: true }).find(
    (group) => group.category === category,
  )?.entries ?? [];
}

export function getComponentDirectoryStats() {
  const implemented = getImplementedRegistryEntries();
  const stable = implemented.filter((entry) => entry.status === "stable").length;
  const beta = implemented.filter((entry) => entry.status === "beta").length;
  const docsOnly = genericEntries.filter((entry) => !entry.implemented).length;
  const industries = implemented.filter((entry) => entry.industry).length;

  return {
    implemented: implemented.length,
    stable,
    beta,
    docsOnly,
    charts: CHART_COMPONENT_SLUGS.length,
    industries,
  };
}
