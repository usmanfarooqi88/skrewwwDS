import { describe, expect, it } from "vitest";
import { getReferenceRequestById } from "@/lib/reference-app/fixtures";
import {
  areRequestFormValuesEqual,
  createNewRequestFormValues,
  isRequestFormDirty,
  normalizeRequestFormValues,
  requestToFormValues,
  toggleRequestLabel,
  validateRequestForm,
} from "@/lib/reference-app/request-form";

describe("request form helpers", () => {
  it("creates empty New defaults", () => {
    expect(createNewRequestFormValues()).toMatchObject({
      title: "",
      status: "open",
      ownerId: "",
      priority: "medium",
      notifyWatchers: false,
      labelIds: [],
    });
  });

  it("maps a fixture into Edit values", () => {
    const request = getReferenceRequestById("req_001");
    expect(request).toBeDefined();
    const values = requestToFormValues(request!);
    expect(values.title).toBe("Reset SSO session for finance team");
    expect(values.ownerId).toBe("usr_001");
    expect(values.labelIds).toEqual(["lbl_access"]);
    expect(values.notifyWatchers).toBe(false);
  });

  it("validates required title and owner", () => {
    expect(validateRequestForm(createNewRequestFormValues())).toEqual({
      title: "Enter a request title.",
      ownerId: "Choose an owner.",
    });
    expect(
      validateRequestForm({
        ...createNewRequestFormValues(),
        title: "  Hello ",
        ownerId: "usr_001",
      }),
    ).toEqual({});
  });

  it("detects dirty state after normalize", () => {
    const initial = requestToFormValues(getReferenceRequestById("req_001")!);
    expect(isRequestFormDirty(initial, initial)).toBe(false);
    expect(isRequestFormDirty({ ...initial, title: `${initial.title} ` }, initial)).toBe(false);
    expect(isRequestFormDirty({ ...initial, title: "Changed" }, initial)).toBe(true);
  });

  it("normalizes and compares label sets", () => {
    const left = normalizeRequestFormValues({
      ...createNewRequestFormValues(),
      title: "A",
      ownerId: "usr_001",
      labelIds: ["lbl_ux", "lbl_access"],
    });
    const right = normalizeRequestFormValues({
      ...createNewRequestFormValues(),
      title: "A",
      ownerId: "usr_001",
      labelIds: ["lbl_access", "lbl_ux"],
    });
    expect(areRequestFormValuesEqual(left, right)).toBe(true);
  });

  it("toggles labels without mutating the input array", () => {
    const start = ["lbl_access"];
    const next = toggleRequestLabel(start, "lbl_ux");
    expect(next).toEqual(["lbl_access", "lbl_ux"]);
    expect(start).toEqual(["lbl_access"]);
    expect(toggleRequestLabel(next, "lbl_access")).toEqual(["lbl_ux"]);
  });
});
