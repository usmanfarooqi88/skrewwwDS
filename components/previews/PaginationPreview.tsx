"use client";

import { useState } from "react";
import {
  Pagination,
  buildPaginationItems,
} from "@/components/ui/Pagination";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function PaginationPreview() {
  const [page, setPage] = useState(3);

  return (
    <div className="space-y-8">
      <ComponentPreview title="Live preview" description="Link-based pagination for URL-addressable pages.">
        <PreviewGroup label="Href builder">
          <Pagination
            items={buildPaginationItems({
              currentPage: 3,
              totalPages: 12,
              hrefBuilder: (nextPage) => `/results?page=${nextPage}`,
            })}
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Button-based client state">
        <Pagination
          items={buildPaginationItems({
            currentPage: page,
            totalPages: 12,
          })}
          onPageChange={setPage}
        />
        <p className="mt-4 text-sm text-ink-600">
          Current preview page: {page}. Ellipsis items are non-interactive and include hidden
          &quot;More pages&quot; text.
        </p>
      </ComponentPreview>
    </div>
  );
}
