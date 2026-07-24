import { createRef } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/Table";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";
import {
  TABLE_FIGMA_COMPONENT_SET_NODE_ID,
  TABLE_FIGMA_VERIFICATION,
  TABLE_IMPLEMENTATION_ORIGIN,
  TABLE_USABILITY_AUDIT_STATUS,
} from "@/lib/table-figma-metadata";
import { DATA_TABLE_IMPLEMENTATION_GATE } from "@/lib/data-table-figma-metadata";
import { buildLlmsTxt, buildLlmsFullTxt } from "@/lib/llms-content";

function SampleTable() {
  return (
    <TableScrollArea accessibleLabel="Scrollable projects table">
      <Table data-testid="sample-table">
        <TableCaption>Active projects</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Project</TableHead>
            <TableHead scope="col" align="end">
              Budget
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Atlas</TableHead>
            <TableCell align="end">$24,000</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableHead scope="row">Total</TableHead>
            <TableCell align="end">$24,000</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableScrollArea>
  );
}

describe("Table native semantics", () => {
  it("renders matching native elements without role=grid", () => {
    render(<SampleTable />);
    const table = screen.getByRole("table", { name: "Active projects" });
    expect(table.tagName).toBe("TABLE");
    expect(table).not.toHaveAttribute("role");
    expect(screen.getByText("Active projects").tagName).toBe("CAPTION");
    expect(table.querySelector("thead")).not.toBeNull();
    expect(table.querySelector("tbody")).not.toBeNull();
    expect(table.querySelector("tfoot")).not.toBeNull();
    expect(screen.getAllByRole("row").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("rowheader").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("documents valid nesting for caption, header, body, and footer", () => {
    render(<SampleTable />);
    const table = screen.getByTestId("sample-table");
    const caption = table.querySelector("caption");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    const tfoot = table.querySelector("tfoot");
    expect(caption?.parentElement).toBe(table);
    expect(thead?.parentElement).toBe(table);
    expect(tbody?.parentElement).toBe(table);
    expect(tfoot?.parentElement).toBe(table);
    expect(thead?.querySelector("tr th")?.getAttribute("scope")).toBe("col");
    expect(tbody?.querySelector("tr th")?.getAttribute("scope")).toBe("row");
  });

  it("supports screen-reader captions", () => {
    render(
      <Table>
        <TableCaption visibility="screen-reader">Hidden title</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const caption = screen.getByText("Hidden title");
    expect(screen.getByRole("table", { name: "Hidden title" })).toBeInTheDocument();
    expect(caption).toHaveAttribute("data-visibility", "screen-reader");
  });

  it("keeps caption and scroll-region names distinct when both are present", () => {
    render(<SampleTable />);
    expect(screen.getByRole("table", { name: "Active projects" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Scrollable projects table" })).toBeInTheDocument();
  });

  it("maps alignment without deprecated HTML align attributes", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead scope="row" align="center" data-testid="head">
              Name
            </TableHead>
            <TableCell align="end" data-testid="cell">
              12
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByTestId("head")).toHaveAttribute("data-align", "center");
    expect(screen.getByTestId("cell")).toHaveAttribute("data-align", "end");
    expect(screen.getByTestId("head")).not.toHaveAttribute("align");
    expect(screen.getByTestId("cell")).not.toHaveAttribute("align");
  });

  it("preserves multi-level native attributes", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" rowSpan={2} id="project">
              Project
            </TableHead>
            <TableHead scope="colgroup" colSpan={2}>
              Metrics
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead scope="col" id="budget" abbr="Bud.">
              Budget
            </TableHead>
            <TableHead scope="col" id="spend">
              Spend
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row" id="atlas">
              Atlas
            </TableHead>
            <TableCell headers="atlas budget" aria-describedby="spend" data-testid="span-cell">
              $24,000
            </TableCell>
            <TableCell headers="atlas spend">$19,400</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cell = screen.getByTestId("span-cell");
    expect(cell).toHaveAttribute("headers", "atlas budget");
    expect(cell).toHaveAttribute("aria-describedby", "spend");
    expect(screen.getByRole("columnheader", { name: "Budget" })).toHaveAttribute("abbr", "Bud.");
    expect(cell).not.toHaveAttribute("tabindex");
  });

  it("supports nowrap wrapping hooks without truncating by default", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell data-testid="wrap-default">long token_name_that_should_wrap</TableCell>
            <TableCell data-table-wrap="nowrap" data-testid="wrap-none">
              Actions
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByTestId("wrap-none")).toHaveAttribute("data-table-wrap", "nowrap");
    expect(screen.getByTestId("wrap-default")).not.toHaveAttribute("data-table-wrap");
  });
});

describe("Table refs and props", () => {
  it("forwards refs to native elements", () => {
    const tableRef = createRef<HTMLTableElement>();
    const captionRef = createRef<HTMLTableCaptionElement>();
    const headerRef = createRef<HTMLTableSectionElement>();
    const bodyRef = createRef<HTMLTableSectionElement>();
    const footerRef = createRef<HTMLTableSectionElement>();
    const rowRef = createRef<HTMLTableRowElement>();
    const headRef = createRef<HTMLTableCellElement>();
    const cellRef = createRef<HTMLTableCellElement>();
    const scrollRef = createRef<HTMLDivElement>();

    render(
      <TableScrollArea ref={scrollRef}>
        <Table ref={tableRef}>
          <TableCaption ref={captionRef}>Caption</TableCaption>
          <TableHeader ref={headerRef}>
            <TableRow>
              <TableHead scope="col">H</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={bodyRef}>
            <TableRow ref={rowRef}>
              <TableHead ref={headRef} scope="row">
                Row
              </TableHead>
              <TableCell ref={cellRef}>Cell</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter ref={footerRef}>
            <TableRow>
              <TableCell>Foot</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableScrollArea>,
    );

    expect(tableRef.current?.tagName).toBe("TABLE");
    expect(captionRef.current?.tagName).toBe("CAPTION");
    expect(headerRef.current?.tagName).toBe("THEAD");
    expect(bodyRef.current?.tagName).toBe("TBODY");
    expect(footerRef.current?.tagName).toBe("TFOOT");
    expect(rowRef.current?.tagName).toBe("TR");
    expect(headRef.current?.tagName).toBe("TH");
    expect(cellRef.current?.tagName).toBe("TD");
    expect(scrollRef.current?.tagName).toBe("DIV");
  });

  it("merges className and preserves handlers and data attributes", () => {
    const onClick = vi.fn();
    render(
      <Table className="extra" data-demo="yes" onClick={onClick}>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = screen.getByRole("table");
    expect(table.className).toContain("extra");
    expect(table).toHaveAttribute("data-demo", "yes");
    fireEvent.click(table);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("TableScrollArea", () => {
  it("uses a labelled region only when an accessible name is provided", () => {
    const { rerender } = render(
      <TableScrollArea accessibleLabel="Invoices">
        <Table>
          <TableCaption>Invoice list</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>One</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableScrollArea>,
    );
    expect(screen.getByRole("region", { name: "Invoices" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Invoice list" })).toBeInTheDocument();

    rerender(
      <TableScrollArea data-testid="plain-scroll">
        <Table>
          <TableCaption>Plain</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>One</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableScrollArea>,
    );
    expect(screen.getByTestId("plain-scroll")).not.toHaveAttribute("role");
    expect(screen.getByTestId("plain-scroll")).not.toHaveAttribute("tabindex");
  });

  it("keeps tabIndex consumer-controlled", () => {
    render(
      <TableScrollArea accessibleLabel="Wide table" tabIndex={0} data-testid="focusable-scroll">
        <Table>
          <TableCaption>Wide</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>One</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableScrollArea>,
    );
    expect(screen.getByTestId("focusable-scroll")).toHaveAttribute("tabindex", "0");
    expect(screen.getByTestId("focusable-scroll")).toHaveAttribute("data-table-scroll");
  });
});

describe("Table interactive content and composition", () => {
  it("keeps links and buttons interactive without making the row a control", () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="row">
            <TableHead scope="row">
              <a href="/components/table">Atlas</a>
            </TableHead>
            <TableCell>
              <button type="button">Open</button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("link", { name: "Atlas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByTestId("row").tagName).toBe("TR");
    expect(screen.getByTestId("row")).not.toHaveAttribute("tabindex");
  });

  it("supports manual empty-state composition with colSpan", () => {
    render(
      <Table>
        <TableCaption>Archived projects</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Project</TableHead>
            <TableHead scope="col">Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2}>
              <EmptyState title="No archived projects" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("table", { name: "Archived projects" })).toBeInTheDocument();
    expect(screen.getByText("No archived projects")).toBeInTheDocument();
    expect(screen.getByText("No archived projects").closest("td")).toHaveAttribute("colspan", "2");
  });

  it("supports loading composition with aria-busy", () => {
    render(
      <Table aria-busy="true">
        <TableCaption>Loading inventory</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Skeleton placeholder</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("table", { name: "Loading inventory" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("supports footer totals with row headers", () => {
    render(
      <Table>
        <TableCaption>Totals</TableCaption>
        <TableFooter>
          <TableRow>
            <TableHead scope="row">Total</TableHead>
            <TableCell align="end">$51,750</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    expect(screen.getByRole("rowheader", { name: "Total" })).toBeInTheDocument();
    expect(screen.getByText("$51,750")).toHaveAttribute("data-align", "end");
  });
});

describe("Table architecture and registry", () => {
  it("registers Table and Data Table without a data-grid or subcomponent registry entry", () => {
    const entry = getRegistryEntry("table");
    expect(entry?.hasImplementation).toBe(true);
    expect(entry?.figmaAvailability).toBe("unavailable");
    expect(entry?.summary).toMatch(/not the interactive data table pattern/i);
    expect(entry?.keyboardBehavior).toMatch(/tabIndex is consumer-controlled/i);

    const dataTableEntry = getRegistryEntry("data-table");
    expect(dataTableEntry?.hasImplementation).toBe(true);
    expect(dataTableEntry?.figmaAvailability).toBe("unavailable");
    expect(dataTableEntry?.summary).toMatch(/no columns-config prop/i);

    expect(getRegistryEntry("data-grid")).toBeUndefined();
    expect(getRegistryEntry("table-row")).toBeUndefined();
    expect(getImplementedComponentCount()).toBe(44);
    expect(DATA_TABLE_IMPLEMENTATION_GATE).toBe("implemented-react-first");
    expect(TABLE_IMPLEMENTATION_ORIGIN).toBe("react-first");
    expect(TABLE_FIGMA_VERIFICATION).toBe("pending");
    expect(TABLE_FIGMA_COMPONENT_SET_NODE_ID).toBeNull();
    expect(TABLE_USABILITY_AUDIT_STATUS).toBe("completed-2026-07-13");
  });

  it("does not expose sorting or selection props on the sample markup", () => {
    render(<SampleTable />);
    const table = screen.getByTestId("sample-table");
    expect(table).not.toHaveAttribute("data-sortable");
    expect(within(table).queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("documents Table and Data Table audit details in LLM indexes", () => {
    const index = buildLlmsTxt();
    const full = buildLlmsFullTxt();
    expect(index).toMatch(/Table is the native HTML tabular foundation/);
    expect(full).toMatch(/Data Table composes Table/);
    expect(full).toMatch(/Data Table is implemented/);
    expect(full).not.toMatch(/Data Grid/);
  });
});
