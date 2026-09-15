"use client";

import { DotsThree, Funnel, MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RequestFiltersForm } from "@/components/reference-app/RequestFiltersForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DataTableSortHeader,
  EmptyState,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Pagination,
  SearchField,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
  Tag,
  buildPaginationItems,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui";
import {
  getReferenceOwnerById,
  REFERENCE_OWNERS,
  REFERENCE_REQUESTS,
} from "@/lib/reference-app/fixtures";
import {
  countActiveRequestFilters,
  EMPTY_REQUEST_FILTERS,
  hasActiveRequestFilters,
  queryReferenceRequests,
  REQUEST_PAGE_SIZE,
  type RequestFilters,
  type RequestSortColumn,
} from "@/lib/reference-app/query-requests";
import type { RequestPriority, RequestStatus } from "@/lib/reference-app/types";
import { useDataTableSort } from "@/lib/use-data-table-sort";

function statusBadgeVariant(
  status: RequestStatus,
): "warning" | "info" | "success" | "neutral" {
  if (status === "open") return "warning";
  if (status === "in_progress") return "info";
  if (status === "resolved") return "success";
  return "neutral";
}

function priorityBadgeVariant(
  priority: RequestPriority,
): "neutral" | "info" | "warning" | "error" {
  if (priority === "high") return "error";
  if (priority === "medium") return "warning";
  return "neutral";
}

function formatStatus(status: RequestStatus): string {
  return status.replace("_", " ");
}

function formatDueDate(dueDate: string): string {
  return dueDate;
}

function formatUpdatedAt(updatedAt: string): string {
  return updatedAt.slice(0, 10);
}

function ownerLabel(ownerId: string): string {
  return getReferenceOwnerById(ownerId)?.name ?? ownerId;
}

export function RequestsDataView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<RequestFilters>(EMPTY_REQUEST_FILTERS);
  const [draftFilters, setDraftFilters] = useState<RequestFilters>(EMPTY_REQUEST_FILTERS);
  const [page, setPage] = useState(1);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const mobileFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const { sortState, getSortDirection, toggleSort } = useDataTableSort<RequestSortColumn>();

  const result = useMemo(
    () =>
      queryReferenceRequests({
        requests: REFERENCE_REQUESTS,
        owners: REFERENCE_OWNERS,
        search,
        filters,
        sortState,
        page,
      }),
    [filters, page, search, sortState],
  );

  const activeFilterCount = countActiveRequestFilters(filters);
  const showingFrom = result.total === 0 ? 0 : (result.page - 1) * REQUEST_PAGE_SIZE + 1;
  const showingTo = Math.min(result.page * REQUEST_PAGE_SIZE, result.total);

  function resetPage() {
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPage();
  }

  function handleSort(column: RequestSortColumn) {
    toggleSort(column);
    resetPage();
  }

  function handleLiveFiltersChange(next: RequestFilters) {
    setFilters(next);
    setDraftFilters(next);
    resetPage();
  }

  function openMobileFilters() {
    setDraftFilters(filters);
    setMobileFiltersOpen(true);
  }

  function applyMobileFilters(next: RequestFilters) {
    setFilters(next);
    setMobileFiltersOpen(false);
    resetPage();
    queueMicrotask(() => mobileFilterTriggerRef.current?.focus());
  }

  function clearAllQuery() {
    setSearch("");
    setFilters(EMPTY_REQUEST_FILTERS);
    setDraftFilters(EMPTY_REQUEST_FILTERS);
    resetPage();
  }

  function removeFilter(key: keyof RequestFilters) {
    const next = { ...filters, [key]: "" };
    setFilters(next);
    setDraftFilters(next);
    resetPage();
  }

  return (
    <div className="min-w-0 space-y-4 px-4 py-6 md:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 lg:max-w-md">
          <SearchField
            label="Search requests"
            hideLabel
            placeholder="Search by title, ID, or owner"
            value={search}
            onValueChange={handleSearchChange}
            showClear
            aria-label="Search requests"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden md:block">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leadingIcon={<Funnel size={16} aria-hidden="true" />}
              aria-expanded={desktopFiltersOpen}
              aria-controls="reference-desktop-filters"
              aria-label={
                activeFilterCount > 0 ? `Filters, ${activeFilterCount} applied` : "Filters"
              }
              onClick={() => setDesktopFiltersOpen((open) => !open)}
            >
              Filters
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </div>

          <div className="md:hidden">
            <Drawer
              open={mobileFiltersOpen}
              onOpenChange={(open) => {
                if (open) openMobileFilters();
                else setMobileFiltersOpen(false);
              }}
            >
              <DrawerTrigger>
                <Button
                  ref={mobileFilterTriggerRef}
                  type="button"
                  variant="secondary"
                  size="sm"
                  leadingIcon={<Funnel size={16} aria-hidden="true" />}
                  aria-label={
                    activeFilterCount > 0
                      ? `Filters, ${activeFilterCount} applied`
                      : "Open filters"
                  }
                >
                  Filters
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </Button>
              </DrawerTrigger>
              <DrawerContent aria-label="Request filters">
                <DrawerHeader>
                  <DrawerTitle>Filters</DrawerTitle>
                  <DrawerClose />
                </DrawerHeader>
                <DrawerBody>
                  <RequestFiltersForm value={draftFilters} onChange={setDraftFilters} />
                </DrawerBody>
                <DrawerFooter className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setDraftFilters(EMPTY_REQUEST_FILTERS)}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => applyMobileFilters(draftFilters)}
                  >
                    Apply
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      {/*
        Desktop: live filters in an inline panel (not Popover).
        Select/Combobox/DatePicker already use Popover; nesting them inside a
        filter Popover caused parent dismiss / click-through closure (G0).
        Mobile: Drawer + Apply, per RA-0 plan.
      */}
      {desktopFiltersOpen ? (
        <section
          id="reference-desktop-filters"
          className="hidden space-y-4 rounded-lg border border-ink-200 bg-white p-4 md:block"
          aria-label="Request filters"
        >
          <RequestFiltersForm value={filters} onChange={handleLiveFiltersChange} />
        </section>
      ) : null}

      {(hasActiveRequestFilters(filters) || search.trim()) && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active query">
          {search.trim() ? (
            <Tag removable onRemove={() => handleSearchChange("")}>
              {`Search: ${search.trim()}`}
            </Tag>
          ) : null}
          {filters.status ? (
            <Tag removable onRemove={() => removeFilter("status")}>
              {`Status: ${formatStatus(filters.status)}`}
            </Tag>
          ) : null}
          {filters.ownerId ? (
            <Tag removable onRemove={() => removeFilter("ownerId")}>
              {`Owner: ${ownerLabel(filters.ownerId)}`}
            </Tag>
          ) : null}
          {filters.priority ? (
            <Tag removable onRemove={() => removeFilter("priority")}>
              {`Priority: ${filters.priority}`}
            </Tag>
          ) : null}
          {filters.dueOnOrBefore ? (
            <Tag removable onRemove={() => removeFilter("dueOnOrBefore")}>
              {`Due by: ${filters.dueOnOrBefore}`}
            </Tag>
          ) : null}
          <Button type="button" variant="secondary" size="sm" onClick={clearAllQuery}>
            Clear all
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-ink-600" data-testid="requests-result-count">
          {result.total === 0
            ? "0 requests"
            : `Showing ${showingFrom}–${showingTo} of ${result.total}`}
        </p>
      </div>

      {result.total === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass size={28} aria-hidden="true" />}
          title="No matching requests"
          description="Try a different search or clear filters to see the full queue."
          primaryAction={{ label: "Clear filters", onClick: clearAllQuery }}
        />
      ) : (
        <>
          {/*
            Grid containment keeps wide table min-width from inflating page
            scrollWidth while TableScrollArea owns horizontal scrolling (G0).
          */}
          <div className="grid min-w-0 max-w-full">
            <TableScrollArea
              accessibleLabel="Scrollable requests table"
              tabIndex={0}
              data-testid="requests-table-scroll"
            >
            <Table data-testid="requests-table">
              <TableCaption>Ops requests</TableCaption>
              <TableHeader>
                <TableRow>
                  <DataTableSortHeader
                    scope="col"
                    sortDirection={getSortDirection("title")}
                    onSort={() => handleSort("title")}
                  >
                    Request
                  </DataTableSortHeader>
                  <DataTableSortHeader
                    scope="col"
                    sortDirection={getSortDirection("status")}
                    onSort={() => handleSort("status")}
                  >
                    Status
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
                    sortDirection={getSortDirection("priority")}
                    onSort={() => handleSort("priority")}
                  >
                    Priority
                  </DataTableSortHeader>
                  <DataTableSortHeader
                    scope="col"
                    sortDirection={getSortDirection("dueDate")}
                    onSort={() => handleSort("dueDate")}
                  >
                    Due
                  </DataTableSortHeader>
                  <DataTableSortHeader
                    scope="col"
                    sortDirection={getSortDirection("updatedAt")}
                    onSort={() => handleSort("updatedAt")}
                  >
                    Updated
                  </DataTableSortHeader>
                  <TableHead scope="col" className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((request) => (
                  <TableRow key={request.id} data-request-id={request.id}>
                    <TableCell>
                      <div className="min-w-[14rem]">
                        <p className="font-medium text-ink-900">{request.title}</p>
                        <p className="text-xs text-ink-500">{request.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(request.status)}>
                        {formatStatus(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{ownerLabel(request.ownerId)}</TableCell>
                    <TableCell>
                      <Badge variant={priorityBadgeVariant(request.priority)}>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDueDate(request.dueDate)}</TableCell>
                    <TableCell>{formatUpdatedAt(request.updatedAt)}</TableCell>
                    <TableCell>
                      <Menu>
                        <MenuTrigger>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            aria-label={`Actions for ${request.id}`}
                          >
                            <DotsThree size={18} weight="bold" aria-hidden="true" />
                          </Button>
                        </MenuTrigger>
                        <MenuContent aria-label={`Actions for ${request.id}`}>
                          <MenuItem
                            onSelect={() => router.push(`/reference/edit/${request.id}`)}
                          >
                            View / Edit
                          </MenuItem>
                          <MenuItem disabled>Archive (later)</MenuItem>
                        </MenuContent>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScrollArea>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-500">
              Page {result.page} of {result.totalPages}
            </p>
            <div className="w-fit max-w-full">
              <Pagination
                aria-label="Requests pagination"
                items={buildPaginationItems({
                  currentPage: result.page,
                  totalPages: result.totalPages,
                })}
                onPageChange={setPage}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
