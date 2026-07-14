# File Upload — discovery and implementation gate

Last updated: **2026-07-15** (Figma live inspection confirms single-file anatomy; multi-file list anatomy confirmed absent — see note below)

> **Figma live inspection results (2026-07-15).** The Forms/File Upload
> component set (node `2024:2649`) has been directly inspected: **5 state
> variants** — Empty, Dragging, Error, Disabled, Filled — and one text
> property, **File Name**. The Filled variant's anatomy is exactly one row:
> **File Icon + File Name text + Remove Icon**. There is no list container,
> no repeated-row structure, and no way to represent more than one attached
> file anywhere in the Figma file. This is a confirmed absence, not an
> unaudited gap (see `lib/file-upload-figma-metadata.ts`,
> `FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS = "confirmed-absent"`).
>
> Net effect on parity, precisely: the **single-file trigger/state anatomy**
> (Empty/Dragging/Error/Disabled/Filled, File Name property) is now
> **Figma-confirmed**. The **multi-file list** — React's `multiple` prop,
> `maxFiles` cap, and independently-removable file-list items (all present
> and working in `components/ui/FileUpload.tsx` today) — has **no Figma
> reference to match**. That capability is **React-first with Figma parity
> pending**, specifically for the list anatomy — not a gap in the component
> as a whole, and not something to redesign or remove from the React
> implementation. Everything else below this note is the original
> pre-implementation discovery record and is left as written for audit
> traceability; see `docs/project-status.md` for current registry/test
> counts.

## Final decision

**IMPLEMENTATION APPROVED — React-first MVP (2026-07-13)**

Figma MCP remained unavailable, but the project approved a React-first File Upload MVP using documented content inventory, durable accessibility policy, and explicit non-goals. Implementation shipped as `FileUpload` with native multipart submission, replacement selection semantics, drag-and-drop enhancement, advisory validation, selected-file removal, and polite status announcements.

**Figma live verification remains pending.** Component-set node ID is still null; temporary tokens must not be treated as Figma-verified.

### Historical gate (2026-07-13 earlier pass)

**IMPLEMENTATION BLOCKED** — Initial discovery pass blocked implementation when MCP failed and no React component existed. That history is preserved below for audit traceability.

See also: [`source-of-truth.md`](source-of-truth.md)

---

## 1. Figma MCP result

| Item | Result |
|------|--------|
| Date | 2026-07-13 |
| Connectors attempted | `plugin-figma-figma`, `user-figma-console` |
| Authentication | **Failed** — `mcp_auth` on `plugin-figma-figma` timed out after 30 seconds |
| Connector used | **None** (both servers reported error state at tool discovery) |
| File read | **Not performed** |
| Pages inspected | **None** |
| Nodes inspected | **None** |
| Component-set node IDs | **None** |
| Variable collection IDs | **None** |
| Relevant variables | **None verified** |

Starting URL from brief: [Skrewww — Design System](https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365) (`2002:2365`)

Metadata constants: `lib/file-upload-figma-metadata.ts`

---

## 2. Codebase discovery (repository source of truth)

### Search terms

Searched repository (excluding `node_modules`) for: File Upload, Upload, Dropzone, File Input, Attachment, File Item, File List, Upload Progress, Browse, Drag and Drop.

| Location | Finding |
|----------|---------|
| `content/forms.ts` | **File Upload** documented (`slug: file-upload`) |
| `lib/component-registry*.ts` | **No registry entry** |
| `components/ui/` | **No FileUpload component** |
| `components/previews/` | **No preview** |
| `e2e/` | **No browser tests** |
| `styles/tokens.css` | **No file-upload-specific tokens** |
| `content/feedback.ts` | Progress Bar purpose mentions upload percentage (generic, not File Upload anatomy) |

### No duplicate public routes found

No separate documentation slugs for Upload, Dropzone, File Input, Attachment Picker, File List, or File Item.

---

## 3. Canonical naming (from content inventory — MCP unverified)

| Field | Value | Verification |
|-------|-------|--------------|
| Public name | **File Upload** | Content inventory |
| Slug | **`file-upload`** | Content inventory |
| Route | **`/components/file-upload`** | Existing static doc page |
| Category | **Forms** | Content inventory |

Dropzone, File Item, and File List are **not** separate public components in the content inventory. Treat as internal composition or states unless Figma MCP defines standalone sets.

---

## 4. Figma component-set node ID

**Unresolved (null).** MCP did not inspect the file.

---

## 5. Figma variants (content inventory only — not MCP-verified)

From `content/forms.ts` (historical Figma-derived prose):

- **State variants (claimed):** Empty, Dragging, Filled, Error, Disabled — 5 variants
- **Properties (claimed):** State as variants; File Name text (meaningful on Filled only)

**Cannot confirm** variant naming, boolean/text/instance-swap properties, nested instances, or prototype notes without MCP.

---

## 6. Confirmed vs unresolved states

| State | Content inventory | MCP | Gate impact |
|-------|-------------------|-----|-------------|
| Empty | Mentioned | Unverified | Blocking |
| Dragging / drag-active | Mentioned | Unverified | Blocking (drag-and-drop scope) |
| Filled / files selected | Mentioned | Unverified | Blocking |
| Error | Mentioned | Unverified | Blocking |
| Disabled | Mentioned | Unverified | Blocking |
| Uploading / progress | Not in forms content | Unverified | Blocking |
| Success / retry / remove | Not specified | Unverified | Blocking |
| Rejected file (validation) | Not specified | Unverified | Blocking |

---

## 7. Confirmed anatomy

**None verified by MCP.**

Content inventory describes a **dropzone** pattern with lifecycle states. It does **not** confirm:

- Separate file list vs inline single-file display
- Remove control placement
- Browse trigger vs whole-zone activation
- Thumbnail / preview region
- Progress bar per file vs global
- Compound subcomponents (FileUploadItem, etc.)

---

## 8. Confirmed tokens

Content inventory lists (MCP **unverified**):

- `semantic/border/default`
- `semantic/action/primary`
- `semantic/action/danger`
- `semantic/surface/elevated`

No `--file-upload-*` tokens exist in `styles/tokens.css`. No variable collection IDs were read.

---

## 9. Interaction model (proposed — not approved)

Pending MCP confirmation:

| Topic | Proposal | Status |
|-------|----------|--------|
| Native `<input type="file">` | Required under custom trigger / dropzone | **Confirmed by project a11y policy**; Figma layout unverified |
| Drag-and-drop | Enhancement only; keyboard path required | Content says yes; **MCP unverified** |
| Single vs multiple | Content says "one or more files" | **Unresolved** — need `multiple` prop and max-files policy |
| Networking | Consumer-owned | **Confirmed by this pass** (explicit non-goal) |
| Progress | Consumer-supplied state + Progress Bar | **Unresolved** — not in forms content |
| Preview / thumbnails | Only if Figma confirms | **Deferred** |
| Form submission | Native multipart vs JS-managed model | **Blocking** — depends on controlled-file mirroring |

---

## 10. Accessibility model (durable requirements — implementation prerequisites)

These apply when implementation is approved; none were validated against Figma visuals:

- Visible label associated with native file input
- Supporting text via `aria-describedby` (FormField)
- Error via FormField / ValidationMessage; `aria-invalid` when invalid
- Required and disabled exposed on native input
- Selected files in semantic list markup
- Remove buttons: `"Remove {filename}"`
- Polite live region for selection/rejection status (not per drag event)
- Progress must not steal focus; no focus trap
- Compose FormField, Button, Progress Bar, Alert, List Item — do not duplicate

---

## 11. Browser and platform constraints

- Playwright will use `setInputFiles` — not OS file chooser UI
- Controlled `File[]` cannot be written back to native input value — document submission model explicitly
- Same-file reselection after removal requires input value reset technique
- Touch devices rely on native file trigger (no drag-only path)
- `accept` is a client hint only — server validation required
- Object URLs for image preview must be revoked (if preview confirmed)

---

## 12. React architecture proposal (for approved gate only)

**Preferred pattern:** single public `FileUpload` composing FormField + hidden/native file input + optional dropzone surface + file list.

**Internal (not public unless Figma confirms compound API):**

- `components/ui/internal/file-upload-validation.ts`
- `components/ui/internal/file-upload-keys.ts` (stable item identity)
- Optional drag-depth handler module

**Composition lineage:**

- FormField — label, description, error, required
- ValidationMessage — inline errors
- Button — browse trigger and/or remove actions
- Progress Bar — per-file progress if confirmed
- Alert — immediate attention for batch rejection if confirmed
- List Item — optional file row layout if Figma matches

**Do not export** networking helpers or internal utilities.

---

## 13. MVP scope (when gate opens)

Minimum deliverables after MCP confirms gate criteria:

1. Native file input with accessible label
2. Custom trigger activating input
3. Drag-and-drop dropzone **if Figma confirms**
4. Single or multi selection **as confirmed**
5. Client-side type/size/count validation **as confirmed**
6. Selected file list + remove
7. Controlled/uncontrolled `File[]` with documented identity policy
8. FormField integration (required, disabled, error)
9. Polite status announcements
10. Tokens from verified Figma variables (temporary aliases documented)
11. Preview, unit tests, Playwright tests, registry, llms propagation

---

## 14. Deferred behavior (explicit non-goals)

- Network upload, presigned URLs, multipart clients, server endpoints
- Chunked/resumable/background uploads
- Folder upload, clipboard paste, camera capture
- Image editor/cropper, OCR, virus scan
- Auto-upload on selection
- `capture` attribute unless Figma confirms
- Multi-select Combobox, Command Menu, Context Menu, Data Table, Tree View, Charts, Timeline

---

## 15. Open questions (blocking)

1. **Component-set node ID** for File Upload in Figma
2. **Single vs multiple** file selection — content says "one or more" but no max count, chip list, or list anatomy
3. **Dropzone vs trigger-only** — is the entire zone clickable? Separate Browse button?
4. **File list anatomy** — inline name vs list rows vs chips
5. **Remove and retry** — icon button? text link? retry on failed upload presentation state?
6. **Progress ownership** — internal Progress Bar per file or external consumer only?
7. **Upload presentation states** — pending/uploading/success/error in Figma or consumer-only?
8. **Thumbnail preview** — images only? size? fallback icon?
9. **Error variants** — field-level vs per-file vs both
10. **Token bindings** — dashed border drag-active, min-height, icon sizes
11. **Shape/Surface** — container-radius caps for large dropzones in Pill mode
12. **Form submission model** — native multipart vs controlled-only (document one coherent model)
13. **Duplicate file policy** — allow same file twice or reject?
14. **Mixed valid/invalid batch** — accept valid files while rejecting others?

---

## 16. Parity table

| Area | Figma evidence | Existing system support | Decision | Status |
|------|----------------|-------------------------|----------|--------|
| Canonical name | Content: File Upload | `content/forms.ts` slug `file-upload` | Use File Upload / file-upload | Confirmed (content) |
| Component-set node | None (MCP failed) | `FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID = null` | Block until MCP | **Blocking** |
| Category | Content: Forms | Forms category page exists | Forms | Confirmed (content) |
| State variants (5) | Content prose only | No React | Match when MCP verifies | Unresolved |
| Single vs multi | Content: "one or more" | No API | Confirm `multiple` + maxFiles | **Blocking** |
| Native file input | Content a11y note | Project policy requires it | Required | Confirmed (policy) |
| Drag-and-drop | Content purpose | No implementation | Implement if MCP confirms zone | Unresolved |
| Dropzone separate component | Not in content | N/A | Subpart of File Upload | Deferred |
| File Item / File List | Not separate slugs | List Item exists | Compose internally if needed | Unresolved |
| Remove action | Not specified | Button exists | Confirm control type | **Blocking** |
| Progress | Not in forms content | Progress Bar implemented | Consumer-owned unless Figma shows internal | Unresolved |
| Error state | Content variant | FormField + ValidationMessage | Compose existing | Temporary |
| Disabled | Content variant | Native disabled | Compose existing | Temporary |
| Thumbnails | Not specified | — | Defer until MCP | Deferred |
| Validation (type/size/count) | Not specified | — | Client advisory + docs | React extension |
| Networking | N/A | Explicitly out of scope | Consumer owns | Confirmed |
| Tokens listed in content | Unverified names | Partial semantic tokens exist | Map after MCP | Unresolved |
| Registry entry | N/A | None | Add only when implemented | Deferred |
| Live preview | N/A | None | Add only when implemented | Deferred |
| Unit / Playwright tests | N/A | None | Add only when implemented | Deferred |

---

## 17. Upload responsibility boundary

**File Upload owns (when implemented):**

- Native file selection
- Drag-and-drop input (if confirmed)
- Selected-file validation (type, size, count)
- Selected-file list presentation
- Remove action (if confirmed)
- Accessible status messages
- Controlled/uncontrolled selected files
- Visual upload **presentation** states supplied by the consumer

**Consumer owns:**

- Network request, URL, auth, retry API, server response, storage, virus scan, backend validation

File Upload must **not** auto-upload after selection unless Figma and product architecture explicitly require it (not confirmed).

---

## 18. Public API sketch (not approved — for next pass)

Smallest API if Figma confirms data-driven list anatomy:

```tsx
<FileUpload
  label="Upload documents"
  name="documents"
  accept={["image/png", "image/jpeg"]}
  multiple
  maxFiles={5}
  maxSize={5_000_000}
  files={files}
  defaultFiles={defaultFiles}
  onFilesChange={setFiles}
  onRejectedFiles={handleRejected}
  required
  disabled
  error={error}
  supportingText="PNG or JPG up to 5 MB"
/>
```

Optional per-file presentation (only if Figma confirms progress/status UI):

```ts
type FileUploadItemData = {
  id: string;
  file: File;
  status?: "pending" | "uploading" | "success" | "error";
  progress?: number;
  errorMessage?: string;
};
```

**No** `uploadUrl`, `headers`, `token`, or `autoUpload` props.

---

## 19. Security documentation (for implementation pass)

When implemented, documentation must state:

- `accept` is a client-side hint; MIME types can be spoofed
- Extensions are not security validation
- Server-side validation and scanning are required
- Escape file names before display/persistence
- Do not execute uploaded content
- Revoke object URLs
- Skrewww File Upload does not provide backend security

---

## 20. Next steps

1. Restore Figma MCP connectivity (`plugin-figma-figma` or `user-figma-console`)
2. Inspect Forms page and search nodes: File Upload, Dropzone, File Item, Upload Progress
3. Record component-set node ID, variants, properties, token bindings
4. Re-run implementation gate checklist (Part 4 of pass brief)
5. If approved → implement MVP, tests, registry, preview, llms propagation
6. If still blocked → update this document only; keep `hasImplementation: false` (no registry entry)

**Recommended next development batch:** Figma MCP re-audit focused on File Upload component-set, then File Upload MVP implementation — not another component category.
