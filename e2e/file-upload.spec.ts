import { expect, test } from "@playwright/test";

function documentsInput(page: import("@playwright/test").Page) {
  return page.locator('input[type="file"][name="attachments"]');
}

function selectedFilesList(page: import("@playwright/test").Page) {
  return page.getByRole("list", { name: "Selected files" });
}

test.describe("File Upload browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/file-upload");
  });

  test("exposes keyboard focus on the native file input with visible dropzone focus", async ({ page }) => {
    const input = documentsInput(page);
    await input.focus();
    await expect(input).toBeFocused();
    await expect(page.locator('[class*="dropzone"]:focus-within')).toBeVisible();
  });

  test("selects a single file with setInputFiles", async ({ page }) => {
    await page.locator('input[type="file"][name="profile-photo"]').setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from("png"),
    });
    await expect(selectedFilesList(page).getByText("avatar.png")).toBeVisible();
  });

  test("selects multiple files and renders the list", async ({ page }) => {
    await documentsInput(page).setInputFiles([
      { name: "one.pdf", mimeType: "application/pdf", buffer: Buffer.from("1") },
      { name: "two.pdf", mimeType: "application/pdf", buffer: Buffer.from("2") },
    ]);
    await expect(selectedFilesList(page)).toBeVisible();
    await expect(selectedFilesList(page).getByText("one.pdf")).toBeVisible();
    await expect(selectedFilesList(page).getByText("two.pdf")).toBeVisible();
  });

  test("removes one file and the final file", async ({ page }) => {
    await documentsInput(page).setInputFiles([
      { name: "keep.pdf", mimeType: "application/pdf", buffer: Buffer.from("1") },
      { name: "remove.pdf", mimeType: "application/pdf", buffer: Buffer.from("2") },
    ]);
    await page.getByRole("button", { name: "Remove remove.pdf" }).click();
    await expect(selectedFilesList(page).getByText("remove.pdf")).toHaveCount(0);
    await page.getByRole("button", { name: "Remove keep.pdf" }).click();
    await expect(selectedFilesList(page)).toHaveCount(0);
  });

  test("rejects invalid type and oversized files", async ({ page }) => {
    await page.locator('input[type="file"][name="profile-photo"]').setInputFiles({
      name: "bad.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("bad"),
    });
    await expect(page.getByText(/not an accepted file type/i)).toBeVisible();

    await documentsInput(page).setInputFiles({
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(6_000_000),
    });
    await expect(page.getByText(/exceeds the/i)).toBeVisible();
  });

  test("supports drag and drop replacement", async ({ page }) => {
    await page.evaluate(() => {
      const input = document.querySelector('input[name="attachments"]') as HTMLInputElement | null;
      const zone = input?.parentElement;
      if (!input || !zone) throw new Error("Missing file upload dropzone");
      const transfer = new DataTransfer();
      transfer.items.add(new File(["hello"], "dropped.png", { type: "image/png" }));
      zone.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: transfer }));
      zone.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer: transfer }));
      zone.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
    });
    await expect(selectedFilesList(page).getByText("dropped.png")).toBeVisible();
  });

  test("submits native FormData and resets the field", async ({ page }) => {
    const form = page.getByTestId("file-upload-form");
    await form.locator('input[type="file"][name="invoice"]').setInputFiles({
      name: "invoice.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("pdf"),
    });

    const submitted = await form.evaluate((element) => {
      const data = new FormData(element as HTMLFormElement);
      const value = data.get("invoice");
      return value instanceof File ? value.name : null;
    });
    expect(submitted).toBe("invoice.pdf");

    await form.getByRole("button", { name: "Reset form" }).click();
    await expect(selectedFilesList(page).getByText("invoice.pdf")).toHaveCount(0);
  });

  test("works at mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await expect(page.getByRole("heading", { level: 1, name: "File Upload" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(overflow).toBe(true);
  });

  test("loads without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "File Upload" })).toBeVisible();
    expect(errors.filter((entry) => !entry.includes("favicon"))).toEqual([]);
  });
});
