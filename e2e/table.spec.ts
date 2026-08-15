import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function bringTableControlIntoView(control: Locator) {
  await control.evaluate((el) => {
    const scrollParent = el.closest("[data-table-scroll]") as HTMLElement | null;
    if (scrollParent) {
      const buttonRect = el.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      if (buttonRect.right > parentRect.right) {
        scrollParent.scrollLeft += buttonRect.right - parentRect.right + 12;
      }
      if (buttonRect.left < parentRect.left) {
        scrollParent.scrollLeft -= parentRect.left - buttonRect.left + 12;
      }
    }
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

async function openMenuFromControl(page: Page, control: Locator, menuName: string) {
  await bringTableControlIntoView(control);
  await control.focus();
  await expect(control).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu", { name: menuName })).toBeVisible();
}

test.describe("Table browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/table");
  });

  test("exposes a native table with caption and headers", async ({ page }) => {
    const table = page.getByRole("table", { name: "Active projects" });
    await expect(table).toBeVisible();
    await expect(table).toHaveJSProperty("tagName", "TABLE");
    await expect(page.getByRole("columnheader", { name: "Project" }).first()).toBeVisible();
    await expect(page.getByRole("rowheader", { name: "Atlas" }).first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Actions" }).first()).toBeAttached();
    await expect(page.getByRole("grid")).toHaveCount(0);
  });

  test("matches the canonical Flat and Rounded Table visual contract", async ({ page }) => {
    const styles = await page.getByTestId("table-sr-caption").evaluate((table) => {
      const shell = table.closest("[data-table-scroll]") as HTMLElement;
      const header = table.querySelector("thead") as HTMLElement;
      const headerCell = table.querySelector("thead th") as HTMLElement;
      const body = table.querySelector("tbody") as HTMLElement;
      const firstBodyCell = table.querySelector("tbody tr:first-child td") as HTMLElement;
      const rowHeader = table.querySelector("tbody tr:first-child th") as HTMLElement;
      const lastBodyCell = table.querySelector("tbody tr:last-child td") as HTMLElement;
      const read = (node: HTMLElement) => {
        const computed = getComputedStyle(node);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          borderBottom: computed.borderBottom,
          borderBottomWidth: computed.borderBottomWidth,
          borderRadius: computed.borderRadius,
          paddingBlock: computed.paddingBlock,
          paddingInline: computed.paddingInline,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          lineHeight: computed.lineHeight,
          overflowWrap: computed.overflowWrap,
          overflowX: computed.overflowX,
          overflowY: computed.overflowY,
          backdropFilter: computed.backdropFilter,
          boxShadow: computed.boxShadow,
        };
      };

      return {
        shell: read(shell),
        header: read(header),
        headerCell: read(headerCell),
        body: read(body),
        firstBodyCell: read(firstBodyCell),
        rowHeader: read(rowHeader),
        lastBodyCell: read(lastBodyCell),
      };
    });

    expect(styles.shell).toMatchObject({
      backgroundColor: "rgb(255, 255, 255)",
      borderRadius: "12px",
      overflowX: "auto",
      overflowY: "hidden",
      backdropFilter: "none",
      boxShadow: "none",
    });
    expect(styles.shell.borderBottom).toBe("1px solid rgb(223, 224, 228)");
    expect(styles.header.backgroundColor).toBe("rgb(247, 247, 248)");
    expect(styles.headerCell).toMatchObject({
      color: "rgb(91, 95, 104)",
      paddingBlock: "12px",
      paddingInline: "16px",
      fontSize: "14px",
      fontWeight: "700",
      lineHeight: "16.8px",
      overflowWrap: "anywhere",
    });
    expect(styles.headerCell.borderBottom).toBe("1px solid rgb(223, 224, 228)");
    expect(styles.body.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(styles.firstBodyCell).toMatchObject({
      color: "rgb(23, 24, 27)",
      paddingBlock: "12px",
      paddingInline: "16px",
      fontSize: "14px",
      fontWeight: "400",
      lineHeight: "16.8px",
      overflowWrap: "anywhere",
    });
    expect(styles.rowHeader.color).toBe("rgb(23, 24, 27)");
    expect(styles.rowHeader).toMatchObject({
      color: "rgb(23, 24, 27)",
      fontWeight: "400",
    });
    expect(
      await page.getByTestId("table-interactive").locator("thead th").evaluateAll((cells) =>
        cells.map((cell) => getComputedStyle(cell).color),
      ),
    ).toEqual([
      "rgb(91, 95, 104)",
      "rgb(91, 95, 104)",
      "rgb(91, 95, 104)",
      "rgb(91, 95, 104)",
    ]);
    expect(styles.firstBodyCell.borderBottom).toBe("1px solid rgb(223, 224, 228)");
    expect(styles.lastBodyCell.borderBottomWidth).toBe("0px");
  });

  test("stays Flat in every parent Surface context", async ({ page }) => {
    const table = page.getByRole("table", { name: "Glass surface sample" });
    const surfaceHost = table.locator("xpath=ancestor::*[@data-skrewww-surface][1]");

    for (const mode of ["flat", "gradient", "glass"]) {
      await surfaceHost.evaluate((node, value) => {
        (node as HTMLElement).dataset.skrewwwSurface = value;
      }, mode);

      const computed = await table.evaluate((node) => {
        const shell = node.closest("[data-table-scroll]") as HTMLElement;
        const header = node.querySelector("thead") as HTMLElement;
        const headerCell = node.querySelector("thead th") as HTMLElement;
        const shellStyle = getComputedStyle(shell);
        return {
          backgroundColor: shellStyle.backgroundColor,
          borderColor: shellStyle.borderColor,
          backdropFilter: shellStyle.backdropFilter,
          boxShadow: shellStyle.boxShadow,
          headerBackground: getComputedStyle(header).backgroundColor,
          headerColor: getComputedStyle(headerCell).color,
        };
      });

      expect(computed).toEqual({
        backgroundColor: "rgb(255, 255, 255)",
        borderColor: "rgb(223, 224, 228)",
        backdropFilter: "none",
        boxShadow: "none",
        headerBackground: "rgb(247, 247, 248)",
        headerColor: "rgb(91, 95, 104)",
      });
    }
  });

  test("keeps radius/lg in every parent Shape context", async ({ page }) => {
    const table = page.getByRole("table", { name: "Pill container sample" });
    const shapeHost = table.locator("xpath=ancestor::*[@data-skrewww-shape][1]");

    for (const mode of ["sharp", "rounded", "pill", "squircle"]) {
      await shapeHost.evaluate((node, value) => {
        (node as HTMLElement).dataset.skrewwwShape = value;
      }, mode);

      const computed = await table.evaluate((node) => {
        const shell = node.closest("[data-table-scroll]") as HTMLElement;
        const style = getComputedStyle(shell);
        return {
          borderRadius: style.borderRadius,
          clipPath: style.clipPath,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
        };
      });
      expect(computed).toEqual({
        borderRadius: "12px",
        clipPath: "none",
        overflowX: "auto",
        overflowY: "hidden",
      });
    }
  });

  test("does not add a row hover or selected treatment", async ({ page }) => {
    const row = page.getByRole("table", { name: "Active projects" }).locator("tbody tr").first();
    const before = await row.evaluate((node) => getComputedStyle(node as HTMLElement).backgroundColor);
    await row.hover();
    const after = await row.evaluate((node) => getComputedStyle(node as HTMLElement).backgroundColor);
    expect(before).toBe("rgba(0, 0, 0, 0)");
    expect(after).toBe(before);
    await expect(row).not.toHaveAttribute("aria-selected");
  });

  test("keeps project links and action menus keyboard operable", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Atlas" }).first()).toBeVisible();
    await openMenuFromControl(
      page,
      page.getByRole("button", { name: "Actions for Atlas" }).first(),
      "Actions for Atlas",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu", { name: "Actions for Atlas" })).toHaveCount(0);
  });

  test("tabs only to interactive descendants", async ({ page }) => {
    await page.getByRole("link", { name: "Atlas" }).first().focus();
    await expect(page.getByRole("link", { name: "Atlas" }).first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Actions for Atlas" }).first()).toBeFocused();
  });

  test("does not intercept arrow keys on the table", async ({ page }) => {
    const link = page.getByRole("link", { name: "Atlas" }).first();
    await link.focus();
    await page.keyboard.press("ArrowDown");
    await expect(link).toBeFocused();
  });

  test("keeps project metadata and numeric columns readable through schema-owned sizing", async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1280, height: 1000 },
      { width: 375, height: 812 },
    ]) {
      await page.setViewportSize(viewport);
      const table = page.getByTestId("table-projects");
      const result = await table.evaluate((node) => {
        const shell = node.closest("[data-table-scroll]") as HTMLElement;
        const headerCells = Array.from(node.querySelectorAll("thead th"));
        const bodyCells = Array.from(node.querySelectorAll("tbody tr:first-child > th, tbody tr:first-child > td"));
        const footerCells = Array.from(node.querySelectorAll("tfoot tr > th, tfoot tr > td"));
        const read = (cell: Element) => {
          const rect = cell.getBoundingClientRect();
          const style = getComputedStyle(cell);
          return {
            left: rect.left,
            right: rect.right,
            width: rect.width,
            whiteSpace: style.whiteSpace,
            textAlign: style.textAlign,
            fontVariantNumeric: style.fontVariantNumeric,
          };
        };
        return {
          tableWidth: node.getBoundingClientRect().width,
          shellClientWidth: shell.clientWidth,
          shellScrollWidth: shell.scrollWidth,
          header: headerCells.map(read),
          body: bodyCells.map(read),
          footer: footerCells.map(read),
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
        };
      });

      expect(result.tableWidth).toBe(768);
      expect(result.header.map((cell) => cell.width)).toEqual([192, 144, 112, 128, 112, 80]);
      for (const column of [1, 2, 3, 4, 5]) {
        expect(result.header[column].whiteSpace).toBe("nowrap");
        expect(result.body[column].whiteSpace).toBe("nowrap");
      }
      expect(result.body[4]).toMatchObject({
        textAlign: "end",
        fontVariantNumeric: "tabular-nums",
      });
      expect(result.footer[2].left).toBe(result.body[4].left);
      expect(result.footer[2].right).toBe(result.body[4].right);
      expect(result.shellScrollWidth).toBe(result.tableWidth);
      expect(result.documentWidth).toBe(result.viewportWidth);
      if (viewport.width === 375) {
        expect(result.shellClientWidth).toBeLessThan(result.shellScrollWidth);
      }
    }
  });

  test("keeps Interactive Cells compact, accessible, and locally scrollable", async ({ page }) => {
    const checkbox = page.getByRole("checkbox", { name: "Select Atlas for review", exact: true });
    await expect(checkbox).toBeVisible();
    await expect(page.getByText("Select Atlas for review", { exact: true })).toHaveCount(0);

    const checkboxGeometry = await checkbox.evaluate((input) => {
      const control = input.closest("label") as HTMLElement;
      const labelText = control.querySelector("span") as HTMLElement;
      return {
        inputWidth: input.getBoundingClientRect().width,
        controlWidth: control.getBoundingClientRect().width,
        labelText: labelText.textContent,
        labelDisplay: getComputedStyle(labelText).display,
        labelWidth: labelText.getBoundingClientRect().width,
      };
    });
    expect(checkboxGeometry).toEqual({
      inputWidth: 16,
      controlWidth: 16,
      labelText: "",
      labelDisplay: "none",
      labelWidth: 0,
    });

    await checkbox.focus();
    await expect(checkbox).toBeFocused();
    expect(await checkbox.evaluate((input) => getComputedStyle(input).outlineWidth)).toBe("2px");
    await page.keyboard.press(" ");
    await expect(checkbox).toBeChecked();
    await page.keyboard.press(" ");
    await expect(checkbox).not.toBeChecked();

    await page.setViewportSize({ width: 1280, height: 1000 });
    const table = page.getByTestId("table-interactive");
    expect(
      await table.locator("thead th").evaluateAll((cells) =>
        cells.map((cell) => cell.getBoundingClientRect().width),
      ),
    ).toEqual([64, 316, 160, 80]);

    await page.setViewportSize({ width: 375, height: 812 });
    const region = page.getByRole("region", { name: "Scrollable review queue table" });
    const mobile = await region.evaluate((node) => {
      const area = node as HTMLElement;
      const table = area.querySelector("table") as HTMLTableElement;
      return {
        tableWidth: table.getBoundingClientRect().width,
        clientWidth: area.clientWidth,
        scrollWidth: area.scrollWidth,
        columns: Array.from(table.querySelectorAll("thead th")).map(
          (cell) => cell.getBoundingClientRect().width,
        ),
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    expect(mobile.tableWidth).toBe(576);
    expect(mobile.columns).toEqual([64, 272, 160, 80]);
    expect(mobile.scrollWidth).toBeGreaterThan(mobile.clientWidth);
    expect(mobile.documentWidth).toBe(mobile.viewportWidth);
    await expect(region).toHaveAttribute("tabindex", "0");

    await region.evaluate((node) => {
      (node as HTMLElement).scrollLeft = (node as HTMLElement).scrollWidth;
    });
    await expect(page.getByRole("button", { name: "Actions for Atlas review" })).toBeVisible();
  });

  test("owns horizontal overflow on narrow viewports and reaches the final column", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await expect(page.getByRole("heading", { level: 1, name: "Table" })).toBeVisible();
    const region = page.getByRole("region", { name: "Scrollable projects table" });
    await expect(region).toBeVisible();
    const metrics = await region.evaluate((node) => {
      const el = node as HTMLElement;
      const before = window.scrollX;
      window.scrollTo(2000, window.scrollY);
      const scrolled = window.scrollX > before + 1;
      window.scrollTo(before, window.scrollY);
      return {
        scrollable: el.scrollWidth > el.clientWidth,
        regionFitsViewport: el.clientWidth <= document.documentElement.clientWidth + 1,
        pageCanScrollHorizontally: scrolled,
        bodyScrollWidth: document.body.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    expect(metrics.scrollable).toBe(true);
    expect(metrics.regionFitsViewport).toBe(true);
    expect(metrics.pageCanScrollHorizontally).toBe(false);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);

    const action = page.getByRole("button", { name: "Actions for Atlas" }).first();
    await region.evaluate((node) => {
      const el = node as HTMLElement;
      el.scrollLeft = el.scrollWidth;
    });
    await bringTableControlIntoView(action);
    const reachable = await action.evaluate((el) => {
      const scrollParent = el.closest("[data-table-scroll]") as HTMLElement | null;
      if (!scrollParent) return false;
      const buttonRect = el.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      return buttonRect.left >= parentRect.left - 1 && buttonRect.right <= parentRect.right + 1;
    });
    expect(reachable).toBe(true);
    await openMenuFromControl(page, action, "Actions for Atlas");
    await page.keyboard.press("Escape");
  });

  test("owns horizontal overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const region = page.getByRole("region", { name: "Scrollable projects table" });
    const metrics = await region.evaluate((node) => {
      const area = node as HTMLElement;
      const computed = getComputedStyle(area);
      return {
        scrollable: area.scrollWidth > area.clientWidth,
        clientWidth: area.clientWidth,
        scrollWidth: area.scrollWidth,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        edgeFadeLayers: computed.backgroundImage.match(/linear-gradient/g)?.length ?? 0,
        backgroundAttachment: computed.backgroundAttachment,
      };
    });
    expect(metrics.scrollable).toBe(true);
    expect(metrics.clientWidth).toBeLessThan(metrics.scrollWidth);
    expect(metrics.documentScrollWidth).toBe(metrics.documentClientWidth);
    expect(metrics.edgeFadeLayers).toBe(4);
    expect(metrics.backgroundAttachment).toBe("local, local, scroll, scroll");

    await region.evaluate((node) => {
      const area = node as HTMLElement;
      area.scrollLeft = area.scrollWidth;
    });
    const finalColumn = page.getByRole("button", { name: "Actions for Atlas" }).first();
    await bringTableControlIntoView(finalColumn);
    await expect(finalColumn).toBeVisible();
  });

  test("keeps scroll-area focus policy consumer-controlled", async ({ page }) => {
    const region = page.getByRole("region", { name: "Scrollable projects table" });
    await expect(region).toHaveAttribute("tabindex", "0");
    await region.focus();
    await expect(region).toBeFocused();

    const plain = page
      .getByTestId("table-sr-caption")
      .locator("xpath=ancestor::div[@data-table-scroll][1]");
    await expect(plain).not.toHaveAttribute("tabindex");
  });

  test("keeps screen-reader captions accessible", async ({ page }) => {
    await expect(page.getByRole("table", { name: "Quarterly budget summary" })).toBeVisible();
  });

  test("exposes multi-level headers and composition examples", async ({ page }) => {
    await expect(page.getByRole("table", { name: "Project spend versus budget" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Financials" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Archived projects" })).toBeVisible();
    await expect(page.getByText("No archived projects")).toBeVisible();
    await expect(page.getByRole("table", { name: "Loading project inventory" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(page.getByRole("table", { name: "Last known projects" })).toBeVisible();
  });

  test("supports RTL horizontal behavior", async ({ page }) => {
    const host = page.getByTestId("table-rtl-host");
    await expect(host).toHaveAttribute("dir", "rtl");
    const region = page.getByRole("region", { name: "Scrollable RTL sample table" });
    await expect(region).toBeVisible();
    await expect(page.getByRole("table", { name: "مشاريع نشطة" })).toBeVisible();
    const endAligned = page.getByTestId("table-rtl").getByRole("cell", { name: "$24,000" });
    await expect(endAligned).toHaveAttribute("data-align", "end");
    await openMenuFromControl(
      page,
      page.getByRole("button", { name: "Actions for Atlas RTL" }),
      "Actions for Atlas RTL",
    );
    await page.keyboard.press("Escape");
  });

  test("short viewport still exposes the projects table", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 400 });
    await expect(page.getByRole("table", { name: "Active projects" })).toBeVisible();
  });

  test("print media does not clip the scroll area", async ({ page }) => {
    await page.emulateMedia({ media: "print" });
    const region = page.getByRole("region", { name: "Scrollable projects table" });
    const overflow = await region.evaluate((node) => getComputedStyle(node as HTMLElement).overflowX);
    expect(overflow).toBe("visible");
  });

  test("shape and surface samples remain readable", async ({ page }) => {
    await expect(page.getByRole("table", { name: "Pill container sample" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Glass surface sample" })).toBeVisible();
  });

  test("loads without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/components/table");
    await expect(page.getByRole("heading", { level: 1, name: "Table" })).toBeVisible();
    expect(
      errors.filter(
        (entry) =>
          !entry.includes("favicon") && !entry.includes("Failed to fetch RSC payload"),
      ),
    ).toEqual([]);
  });
});
