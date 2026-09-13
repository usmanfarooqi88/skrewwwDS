import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileUpload } from "@/components/ui/FileUpload";
import { getImplementedComponentCount, getRegistryEntry } from "@/lib/component-registry";
import {
  assignFilesToInput,
  clearNativeFileInput,
  supportsDataTransferFileAssignment,
} from "@/components/ui/internal/file-upload-file-list";

function createFile(name: string, type: string, size = 4): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("FileUpload semantics", () => {
  it("renders a native file input with label, accept, multiple, required, and disabled", () => {
    render(
      <FileUpload
        label="Documents"
        name="documents"
        accept="image/png"
        multiple
        required
        disabled
        supportingText="Upload one or more PNG files."
      />,
    );

    const input = screen.getByLabelText(/Documents/i) as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.name).toBe("documents");
    expect(input.accept).toBe("image/png");
    expect(input.multiple).toBe(true);
    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
    expect(input).not.toHaveAttribute("hidden");
    expect(document.querySelectorAll('input[type="file"][name="documents"]')).toHaveLength(1);
  });

  it("associates consumer error through FormField", () => {
    render(
      <FileUpload
        label="Invoice"
        name="invoice"
        error="The server could not process these files."
      />,
    );

    const input = screen.getByLabelText(/Invoice/i);
    expect(screen.getByText("The server could not process these files.")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("associates supporting text when no error is present", () => {
    render(<FileUpload label="Invoice" name="invoice" supportingText="PDF only." />);
    expect(screen.getByText("PDF only.")).toBeInTheDocument();
  });
});

describe("FileUpload selection", () => {
  it("selects a single file and fires onFilesChange once", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <FileUpload label="Attachment" name="attachment" accept="image/png" onFilesChange={handleChange} />,
    );

    const input = screen.getByLabelText(/Attachment/i);
    const file = createFile("photo.png", "image/png");
    await user.upload(input, file);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0]?.[0]).toHaveLength(1);
    expect(handleChange.mock.calls[0]?.[0][0]?.name).toBe("photo.png");
    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 file selected.");
  });

  it("replaces the previous batch on a new picker selection", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <FileUpload label="Attachment" name="attachment" multiple onFilesChange={handleChange} />,
    );

    const input = screen.getByLabelText(/Attachment/i);
    await user.upload(input, createFile("first.png", "image/png"));
    await user.upload(input, [createFile("second.png", "image/png"), createFile("third.png", "image/png")]);

    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange.mock.lastCall?.[0]).toHaveLength(2);
    expect(screen.getByText("second.png")).toBeInTheDocument();
    expect(screen.queryByText("first.png")).not.toBeInTheDocument();
  });

  it("rejects invalid files and keeps valid files in mixed batches", () => {
    const handleRejected = vi.fn();
    render(
      <FileUpload
        label="Images"
        name="images"
        accept="image/png"
        multiple
        onRejectedFiles={handleRejected}
      />,
    );

    const input = screen.getByLabelText(/Images/i) as HTMLInputElement;
    const good = createFile("good.png", "image/png");
    const bad = createFile("bad.exe", "application/octet-stream");
    assignFilesToInput(input, [good, bad]);
    fireEvent.change(input);

    expect(screen.getByText("good.png")).toBeInTheDocument();
    expect(screen.getByText(/bad.exe is not an accepted file type/i)).toBeInTheDocument();
    expect(handleRejected).toHaveBeenCalledTimes(1);
    expect(handleRejected.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it("clears the native input when every file is rejected", async () => {
    const user = userEvent.setup();
    render(<FileUpload label="Images" name="images" accept="image/png" required />);
    const input = screen.getByLabelText(/Images/i) as HTMLInputElement;
    await user.upload(input, createFile("bad.exe", "application/octet-stream"));
    expect(input.files?.length ?? 0).toBe(0);
    expect(screen.queryByRole("list", { name: "Selected files" })).not.toBeInTheDocument();
  });
});

describe("FileUpload list and removal", () => {
  it("renders semantic selected-file list items with remove buttons", async () => {
    const user = userEvent.setup();
    render(<FileUpload label="Docs" name="docs" multiple />);
    const input = screen.getByLabelText(/Docs/i);
    await user.upload(input, [createFile("a.pdf", "application/pdf"), createFile("b.pdf", "application/pdf")]);

    const list = screen.getByRole("list", { name: "Selected files" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Remove a.pdf" })).toBeInTheDocument();
  });

  it("removes one specific duplicate occurrence", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<FileUpload label="Docs" name="docs" multiple onFilesChange={handleChange} />);
    const input = screen.getByLabelText(/Docs/i);
    const duplicate = createFile("same.pdf", "application/pdf");
    await user.upload(input, [duplicate, duplicate]);
    await user.click(screen.getAllByRole("button", { name: "Remove same.pdf" })[0] as HTMLButtonElement);

    expect(screen.getAllByText("same.pdf")).toHaveLength(1);
    expect(handleChange.mock.lastCall?.[0]).toHaveLength(1);
  });

  it("allows same-file reselection after removing the final file", async () => {
    const user = userEvent.setup();
    render(<FileUpload label="Docs" name="docs" />);
    const input = screen.getByLabelText(/Docs/i) as HTMLInputElement;
    const file = createFile("again.pdf", "application/pdf");
    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: "Remove again.pdf" }));
    expect(input.value).toBe("");
    await user.upload(input, file);
    expect(screen.getByText("again.pdf")).toBeInTheDocument();
  });
});

describe("FileUpload form integration", () => {
  it("submits selected files through native FormData", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="upload-form">
        <FileUpload label="Invoice" name="invoice" />
      </form>,
    );

    const input = screen.getByLabelText(/Invoice/i) as HTMLInputElement;
    await user.upload(input, createFile("invoice.pdf", "application/pdf"));

    expect(input.files?.[0]?.name).toBe("invoice.pdf");

    const form = screen.getByTestId("upload-form") as HTMLFormElement;
    const data = new FormData(form);
    expect(data.has("invoice")).toBe(true);
    expect(input.files?.[0]).toBeInstanceOf(File);
  });

  it("clears visible files on native form reset", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <FileUpload label="Invoice" name="invoice" />
        <button type="reset">Reset</button>
      </form>,
    );

    await user.upload(screen.getByLabelText(/Invoice/i), createFile("invoice.pdf", "application/pdf"));
    expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => {
      expect(screen.queryByText("invoice.pdf")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("status")).toHaveTextContent("Selection cleared.");
  });
});

describe("FileUpload native FileList helpers", () => {
  it("assigns and clears native file lists when DataTransfer is supported", () => {
    if (!supportsDataTransferFileAssignment()) {
      expect(true).toBe(true);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    const files = [createFile("one.pdf", "application/pdf"), createFile("two.pdf", "application/pdf")];
    expect(assignFilesToInput(input, files)).toBe(true);
    expect(input.files).toHaveLength(2);
    clearNativeFileInput(input);
    expect(input.value).toBe("");
  });
});

describe("FileUpload registry", () => {
  it("registers File Upload as the canonical implemented component", () => {
    expect(getRegistryEntry("file-upload")?.hasImplementation).toBe(true);
    expect(getImplementedComponentCount()).toBe(50);
    expect(getRegistryEntry("dropzone")).toBeUndefined();
  });
});

describe("FileUpload danger-text contract", () => {
  it("binds default title to text-secondary and keeps error icon/text/border on distinct danger tokens", () => {
    const css = readFileSync(
      resolve(process.cwd(), "components/ui/file-upload.module.css"),
      "utf8",
    );
    const tokens = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");

    expect(tokens).toMatch(/--file-upload-title-text:\s*var\(--semantic-text-secondary\)/);
    expect(css).toMatch(/\.title\s*\{[^}]*var\(--file-upload-title-text\)/);
    expect(css).toMatch(/\.dropzoneError \.title\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(css).toMatch(/\.dropzoneError \.icon\s*\{[^}]*var\(--semantic-icon-danger\)/);
    expect(css).toMatch(/\.dropzoneError\s*\{[^}]*var\(--file-upload-border-error\)/);
    expect(css).toMatch(/\.rejectionList\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(css).not.toMatch(/\.rejectionList\s*\{[^}]*var\(--semantic-action-danger\)/);
    expect(css).not.toMatch(/\.dropzoneError \.title\s*\{[^}]*var\(--file-upload-border-error\)/);
    expect(css).not.toMatch(/\.dropzoneError \.icon\s*\{[^}]*var\(--semantic-text-danger\)/);
    expect(css).not.toMatch(
      /\.dropzoneError \.icon,\s*\.dropzoneError \.title\s*\{[^}]*var\(--file-upload-border-error\)/,
    );
    expect(tokens).toMatch(/--file-upload-border-error:\s*var\(--semantic-action-danger\)/);
    expect(tokens).toMatch(
      /--semantic-text-danger:\s*var\(--primitive-color-danger-600\)/,
    );
    expect(tokens).toMatch(
      /--semantic-icon-danger:\s*var\(--primitive-color-danger-500\)/,
    );
    expect(tokens).toMatch(/--semantic-action-danger:\s*var\(--primitive-color-danger-500\)/);
    expect(tokens).toMatch(/--primitive-color-danger-500:\s*#e5484d/i);
    expect(tokens).toMatch(/--primitive-color-danger-600:\s*#cc3b37/i);
  });

  it("does not retarget non-Error dropzone icon paths onto semantic-icon-danger", () => {
    const css = readFileSync(
      resolve(process.cwd(), "components/ui/file-upload.module.css"),
      "utf8",
    );
    expect(css).toMatch(/\.icon\s*\{[^}]*var\(--file-upload-icon\)/);
    expect(css).toMatch(/\.dropzoneDragging \.icon\s*\{[^}]*var\(--semantic-action-primary\)/);
    expect(css).not.toMatch(/\.dropzoneDragging \.icon\s*\{[^}]*var\(--semantic-icon-danger\)/);
    expect(css).not.toMatch(/\.dropzoneDisabled[^{]*\{[^}]*var\(--semantic-icon-danger\)/);
    expect(css).not.toMatch(/\.removeIcon\s*\{[^}]*var\(--semantic-icon-danger\)/);
    // Only one semantic-icon-danger reference, on the Error icon rule
    expect(css.match(/var\(--semantic-icon-danger\)/g)).toEqual(["var(--semantic-icon-danger)"]);
  });
});
