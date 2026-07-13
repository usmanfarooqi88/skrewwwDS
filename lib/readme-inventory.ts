import {
  getImplementedComponentCount,
  getImplementedRegistryEntries,
} from "@/lib/component-registry";

/** Display order for README implemented-component table rows. */
export const README_CATEGORY_ORDER = [
  "Actions",
  "Containers & Overlays",
  "Content & Data",
  "Forms",
  "Feedback",
  "Navigation",
] as const;

export type ReadmeInventoryRow = {
  category: string;
  components: string[];
};

export function getReadmeImplementedInventory(): ReadmeInventoryRow[] {
  const entries = getImplementedRegistryEntries();
  const grouped = new Map<string, string[]>();

  for (const entry of entries) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry.name);
    grouped.set(entry.category, list);
  }

  for (const names of Array.from(grouped.values())) {
    names.sort((left: string, right: string) => left.localeCompare(right));
  }

  return README_CATEGORY_ORDER.filter((category) => grouped.has(category)).map((category) => ({
    category,
    components: grouped.get(category) ?? [],
  }));
}

export function formatReadmeImplementedTable(): string {
  const rows = getReadmeImplementedInventory();
  const lines = [
    "| Category | Components |",
    "|----------|------------|",
    ...rows.map(
      (row) => `| ${row.category} | ${row.components.join(", ")} |`,
    ),
  ];
  return lines.join("\n");
}

export function parseReadmeImplementedTable(markdown: string): ReadmeInventoryRow[] {
  const tableStart = markdown.indexOf("| Category | Components |");
  if (tableStart === -1) {
    throw new Error("README is missing the implemented-component table header.");
  }

  const tableSection = markdown.slice(tableStart);
  const lines = tableSection.split("\n").slice(2);
  const rows: ReadmeInventoryRow[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) break;
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (cells.length !== 2) continue;
    rows.push({
      category: cells[0],
      components: cells[1].split(",").map((name) => name.trim()).filter(Boolean),
    });
  }

  return rows;
}

export function compareReadmeInventory(actual: ReadmeInventoryRow[]): string[] {
  const expected = getReadmeImplementedInventory();
  const errors: string[] = [];

  if (actual.length !== expected.length) {
    errors.push(
      `README table has ${actual.length} category rows; registry expects ${expected.length}.`,
    );
  }

  const expectedCount = getImplementedComponentCount();
  const actualCount = actual.reduce((sum, row) => sum + row.components.length, 0);
  if (actualCount !== expectedCount) {
    errors.push(
      `README lists ${actualCount} implemented components; registry reports ${expectedCount}.`,
    );
  }

  for (const expectedRow of expected) {
    const actualRow = actual.find((row) => row.category === expectedRow.category);
    if (!actualRow) {
      errors.push(`Missing README category row: ${expectedRow.category}.`);
      continue;
    }

    for (const name of expectedRow.components) {
      if (!actualRow.components.includes(name)) {
        errors.push(`Missing implemented component in README: ${name} (${expectedRow.category}).`);
      }
    }

    for (const name of actualRow.components) {
      if (!expectedRow.components.includes(name)) {
        errors.push(`Extra README component not in registry: ${name} (${expectedRow.category}).`);
      }
    }

    const duplicates = actualRow.components.filter(
      (name, index) => actualRow.components.indexOf(name) !== index,
    );
    if (duplicates.length) {
      errors.push(`Duplicate README component entries: ${duplicates.join(", ")}.`);
    }
  }

  return errors;
}
