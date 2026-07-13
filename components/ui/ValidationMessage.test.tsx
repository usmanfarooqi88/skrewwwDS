import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ValidationMessage } from "@/components/ui/ValidationMessage";

describe("ValidationMessage", () => {
  it("hides decorative icons from assistive technology", () => {
    const { container } = render(
      <ValidationMessage type="error" announce="off">
        Error text
      </ValidationMessage>,
    );
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not live-announce static messages by default", () => {
    render(
      <ValidationMessage type="error" announce="off">
        Static error
      </ValidationMessage>,
    );
    expect(screen.getByText("Static error")).not.toHaveAttribute("role", "alert");
  });

  it("can announce dynamic errors assertively", () => {
    render(
      <ValidationMessage type="error" announce="assertive">
        Live error
      </ValidationMessage>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Live error");
  });
});
