"use client";

import { useMemo, useState } from "react";
import {
  DataTableSortHeader,
  Pagination,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
  TableScrollArea,
  buildPaginationItems,
} from "@/components/ui";
import { useDataTableSort } from "@/lib/use-data-table-sort";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

type Project = {
  id: string;
  name: string;
  owner: string;
  budget: number;
};

const allProjects: Project[] = [
  { id: "atlas", name: "Atlas", owner: "Usman Farooqi", budget: 24000 },
  { id: "north-star", name: "North Star", owner: "Maya Chen", budget: 18500 },
  { id: "harbor", name: "Harbor Analytics", owner: "Jordan Lee", budget: 9250 },
  { id: "beacon", name: "Beacon", owner: "Priya Nair", budget: 31200 },
  { id: "compass", name: "Compass", owner: "Diego Alvarez", budget: 14700 },
  { id: "summit", name: "Summit", owner: "Aisha Bello", budget: 22800 },
  { id: "meridian", name: "Meridian", owner: "Sofia Rossi", budget: 6400 },
  { id: "lighthouse", name: "Lighthouse", owner: "Tom Baker", budget: 27650 },
  { id: "voyager", name: "Voyager", owner: "Lena Petrova", budget: 11300 },
  { id: "anchor", name: "Anchor", owner: "Kwame Asante", budget: 19900 },
];

const PAGE_SIZE = 4;
type SortColumn = "name" | "owner" | "budget";

export function DataTablePreview() {
  const { sortState, getSortDirection, toggleSort } = useDataTableSort<SortColumn>();
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortState.column) return allProjects;
    const column = sortState.column;
    const factor = sortState.direction === "ascending" ? 1 : -1;
    return [...allProjects].sort((a, b) => {
      const left = a[column];
      const right = b[column];
      if (left < right) return -1 * factor;
      if (left > right) return 1 * factor;
      return 0;
    });
  }, [sortState]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(column: SortColumn) {
    toggleSort(column);
    setPage(1);
  }

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Sort + external Pagination"
        description="DataTableSortHeader replaces TableHead on sortable columns. useDataTableSort tracks which column and direction; Pagination composes separately, driven by the same page state the consumer already owns."
      >
        <PreviewGroup label="Projects (client-side sorted and paginated)">
          <div className="w-full space-y-4">
            <TableScrollArea accessibleLabel="Scrollable sortable projects table" tabIndex={0}>
              <Table data-testid="data-table-preview">
                <TableCaption>Projects</TableCaption>
                <TableHeader>
                  <TableRow>
                    <DataTableSortHeader
                      scope="col"
                      sortDirection={getSortDirection("name")}
                      onSort={() => handleSort("name")}
                    >
                      Project
                    </DataTableSortHeader>
                    <DataTableSortHeader
                      scope="col"
                      sortDirection={getSortDirection("owner")}
                      onSort={() => handleSort("owner")}
                    >
                      Owner
                    </DataTableSortHeader>
                    <DataTableSortHeader
                      scope="col"
                      align="end"
                      sortDirection={getSortDirection("budget")}
                      onSort={() => handleSort("budget")}
                    >
                      Budget
                    </DataTableSortHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.owner}</TableCell>
                      <TableCell align="end">${project.budget.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollArea>
            <Pagination
              aria-label="Projects pagination"
              items={buildPaginationItems({ currentPage, totalPages })}
              onPageChange={setPage}
            />
          </div>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
