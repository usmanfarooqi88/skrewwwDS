"use client";

import { DotsThree } from "@phosphor-icons/react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link } from "@/components/ui/Link";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/Menu";
import { Skeleton } from "@/components/ui/Skeleton";
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
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const projects = [
  {
    id: "atlas",
    name: "Atlas",
    href: "/components/table#atlas",
    owner: "Usman Farooqi",
    status: "Active" as const,
    updated: "11 Jul 2026",
    budget: "$24,000",
  },
  {
    id: "north-star",
    name: "North Star",
    href: "/components/table#north-star",
    owner: "Maya Chen",
    status: "Beta" as const,
    updated: "8 Jul 2026",
    budget: "$18,500",
  },
  {
    id: "harbor",
    name: "Harbor Analytics with a long project title for overflow",
    href: "/components/table#harbor",
    owner: "Jordan Lee",
    status: "Paused" as const,
    updated: "2 Jul 2026",
    budget: "$9,250",
  },
];

function statusBadge(status: "Active" | "Beta" | "Paused") {
  if (status === "Active") return <Badge variant="success">{status}</Badge>;
  if (status === "Beta") return <Badge variant="info">{status}</Badge>;
  return <Badge variant="warning">{status}</Badge>;
}

function RowActions({ projectName }: { projectName: string }) {
  return (
    <Menu>
      <MenuTrigger>
        <Button type="button" size="sm" variant="secondary" aria-label={`Actions for ${projectName}`}>
          <DotsThree size={18} weight="bold" aria-hidden="true" />
        </Button>
      </MenuTrigger>
      <MenuContent aria-label={`Actions for ${projectName}`}>
        <MenuItem>View details</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem destructive>Archive</MenuItem>
      </MenuContent>
    </Menu>
  );
}

export function TablePreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Table is a native HTML foundation. It does not sort, select, paginate, or fetch data — compose those patterns separately, or wait for Data Table (sorting-only MVP scope approved, not yet implemented)."
      >
        <PreviewGroup label="Projects">
          <TableScrollArea
            accessibleLabel="Scrollable projects table"
            tabIndex={0}
          >
            <Table data-testid="table-projects">
              <TableCaption>Active projects</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Project</TableHead>
                  <TableHead scope="col">Owner</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Updated</TableHead>
                  <TableHead scope="col" align="end">
                    Budget
                  </TableHead>
                  <TableHead scope="col">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableHead scope="row">
                      <Link href={project.href}>{project.name}</Link>
                    </TableHead>
                    <TableCell>{project.owner}</TableCell>
                    <TableCell>{statusBadge(project.status)}</TableCell>
                    <TableCell>{project.updated}</TableCell>
                    <TableCell align="end">{project.budget}</TableCell>
                    <TableCell data-table-wrap="nowrap">
                      <RowActions projectName={project.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableHead scope="row">Total</TableHead>
                  <TableCell colSpan={3} />
                  <TableCell align="end">$51,750</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </TableScrollArea>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Screen-reader caption"
        description="Keep a native caption even when it is visually hidden. Prefer caption over duplicating the same text as aria-label on the table."
      >
        <PreviewGroup label="Visually hidden caption remains accessible">
          <TableScrollArea>
            <Table data-testid="table-sr-caption">
              <TableCaption visibility="screen-reader">Quarterly budget summary</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Category</TableHead>
                  <TableHead scope="col" align="end">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableHead scope="row">Design systems</TableHead>
                  <TableCell align="end">$12,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead scope="row">Documentation</TableHead>
                  <TableCell align="end">$4,500</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableScrollArea>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Multi-level headers"
        description="Native colSpan, rowSpan, id, and headers attributes pass through — no column-definition API on Table."
      >
        <PreviewGroup label="Grouped metrics">
          <TableScrollArea accessibleLabel="Scrollable metrics comparison">
            <Table data-testid="table-multilevel">
              <TableCaption>Project spend versus budget</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" rowSpan={2}>
                    Project
                  </TableHead>
                  <TableHead scope="colgroup" colSpan={2}>
                    Financials
                  </TableHead>
                  <TableHead scope="col" rowSpan={2}>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead scope="col" id="col-budget" align="end">
                    Budget
                  </TableHead>
                  <TableHead scope="col" id="col-spend" align="end">
                    Spend
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableHead scope="row" id="row-atlas">
                    Atlas
                  </TableHead>
                  <TableCell align="end" headers="row-atlas col-budget">
                    $24,000
                  </TableCell>
                  <TableCell align="end" headers="row-atlas col-spend">
                    $19,400
                  </TableCell>
                  <TableCell data-table-wrap="nowrap">
                    <RowActions projectName="Atlas" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableScrollArea>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Interactive cells"
        description="Compose Checkbox, Link, Badge, and Menu inside cells. The row stays a non-interactive tr."
      >
        <PreviewGroup label="Review queue">
          <Table data-testid="table-interactive">
            <TableCaption>Items awaiting review</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">
                  <span className="sr-only">Select</span>
                </TableHead>
                <TableHead scope="col">Item</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell data-table-wrap="nowrap">
                  <Checkbox label="Select Atlas for review" />
                </TableCell>
                <TableHead scope="row">
                  <Link href="/components/table#atlas">Atlas</Link>
                </TableHead>
                <TableCell>
                  <Badge variant="info">Needs review</Badge>
                </TableCell>
                <TableCell data-table-wrap="nowrap">
                  <RowActions projectName="Atlas review" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Empty, loading, and error composition"
        description="Table has no empty, loading, or error props. Compose Empty State, Skeleton, and Alert with full-width cells and keep headers when useful."
      >
        <PreviewGroup label="Empty">
          <Table data-testid="table-empty">
            <TableCaption>Archived projects</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Project</TableHead>
                <TableHead scope="col">Owner</TableHead>
                <TableHead scope="col" align="end">
                  Budget
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={3}>
                  <EmptyState
                    title="No archived projects"
                    description="Archived work will appear here once a project is moved out of the active set."
                    primaryAction={{ label: "View active projects", href: "/components/table" }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </PreviewGroup>

        <PreviewGroup label="Loading">
          <Table data-testid="table-loading" aria-busy="true">
            <TableCaption>Loading project inventory</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Project</TableHead>
                <TableHead scope="col">Owner</TableHead>
                <TableHead scope="col" align="end">
                  Budget
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Skeleton shape="text" width="8rem" />
                </TableCell>
                <TableCell>
                  <Skeleton shape="text" width="6rem" />
                </TableCell>
                <TableCell align="end">
                  <Skeleton shape="text" width="4rem" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Skeleton shape="text" width="10rem" />
                </TableCell>
                <TableCell>
                  <Skeleton shape="text" width="5rem" />
                </TableCell>
                <TableCell align="end">
                  <Skeleton shape="text" width="4rem" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </PreviewGroup>

        <PreviewGroup label="Error">
          <div className="space-y-3">
            <Alert
              type="error"
              title="Could not refresh projects"
              description="The table below shows the last successful snapshot. Retry remains consumer-owned."
            />
            <Table data-testid="table-error">
              <TableCaption>Last known projects</TableCaption>
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
            </Table>
          </div>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="RTL sample"
        description="Alignment uses logical start/end. Horizontal overflow and edge fades follow writing direction."
      >
        <PreviewGroup label="dir=rtl">
          <div dir="rtl" className="min-w-0 w-full" data-testid="table-rtl-host">
            <TableScrollArea accessibleLabel="Scrollable RTL sample table" tabIndex={0}>
              <Table data-testid="table-rtl">
                <TableCaption>مشاريع نشطة</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">المشروع</TableHead>
                    <TableHead scope="col" align="end">
                      الميزانية
                    </TableHead>
                    <TableHead scope="col">
                      <span className="sr-only">الإجراءات</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableHead scope="row">Atlas</TableHead>
                    <TableCell align="end">$24,000</TableCell>
                    <TableCell data-table-wrap="nowrap">
                      <RowActions projectName="Atlas RTL" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableScrollArea>
          </div>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Shape and surface smoke">
        <PreviewGroup label="Container radius follows shape tokens">
          <div className="grid min-w-0 gap-4" data-skrewww-shape="pill" data-skrewww-surface="flat">
            <TableScrollArea accessibleLabel="Pill shape sample">
              <Table>
                <TableCaption>Pill container sample</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Token</TableHead>
                    <TableHead scope="col">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableHead scope="row">Radius</TableHead>
                    <TableCell>Container-capped — not a capsule</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableScrollArea>
          </div>
        </PreviewGroup>
        <PreviewGroup label="Glass surface">
          <div className="min-w-0" data-skrewww-surface="glass">
            <TableScrollArea accessibleLabel="Glass surface sample">
              <Table>
                <TableCaption>Glass surface sample</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Surface</TableHead>
                    <TableHead scope="col">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableHead scope="row">Glass</TableHead>
                    <TableCell>Header and footer remain distinct</TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableHead scope="row">Footer</TableHead>
                    <TableCell>Uses footer surface alias</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableScrollArea>
          </div>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
