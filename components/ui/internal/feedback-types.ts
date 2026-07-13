export type FeedbackStatus = "info" | "success" | "warning" | "error";

export type FeedbackAnnounce = "off" | "polite" | "assertive";

export function resolveFeedbackLiveRegion(
  announce: FeedbackAnnounce,
  status: FeedbackStatus,
): { role?: "alert" | "status"; ariaLive?: "polite" | "assertive" } {
  if (announce === "off") {
    return {};
  }

  if (announce === "assertive" && status === "error") {
    return { role: "alert", ariaLive: "assertive" };
  }

  return { role: "status", ariaLive: announce === "assertive" ? "assertive" : "polite" };
}
