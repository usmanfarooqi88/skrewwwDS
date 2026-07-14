import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/Table";
import { DataTableSortHeader } from "@/components/ui/DataTableSortHeader";
import type { DataTableSortColumnState } from "@/lib/use-data-table-sort";

function renderHeader(sortDirection: DataTableSortColumnState, onSort = vi.fn()) {
  render(
    <Table>
      <TableHeader>
        <TableRow>
          <DataTableSortHeader scope="col" sortDirection={sortDirection} onSort={onSort}>
            Name
          </DataTableSortHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Atlas</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  return onSort;
}

describe("DataTableSortHeader", () => {
  it("sets aria-sort=none on a sortable but currently-unsorted column", () => {
    renderHeader("none");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "aria-sort",
      "none",
    );
  });

  it("sets aria-sort=ascending when this column is the active ascending sort", () => {
    renderHeader("ascending");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("sets aria-sort=descending when this column is the active descending sort", () => {
    renderHeader("descending");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  it("renders a real button as the click target", () => {
    renderHeader("none");
    expect(screen.getByRole("button", { name: "Name" })).toBeInTheDocument();
  });

  it("calls onSort when clicked", async () => {
    const user = userEvent.setup();
    const onSort = renderHeader("none");
    await user.click(screen.getByRole("button", { name: "Name" }));
    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it("calls onSort on Enter and Space (native button semantics)", async () => {
    const user = userEvent.setup();
    const onSort = renderHeader("none");
    const button = screen.getByRole("button", { name: "Name" });
    button.focus();
    await user.keyboard("{Enter}");
    expect(onSort).toHaveBeenCalledTimes(1);
    await user.keyboard(" ");
    expect(onSort).toHaveBeenCalledTimes(2);
  });

  it("does not call onSort when disabled", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <DataTableSortHeader scope="col" sortDirection="none" onSort={onSort} disabled>
              Name
            </DataTableSortHeader>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    await user.click(screen.getByRole("button", { name: "Name" }));
    expect(onSort).not.toHaveBeenCalled();
  });

  it("forwards TableHead props such as scope", () => {
    renderHeader("none");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("scope", "col");
  });
});
