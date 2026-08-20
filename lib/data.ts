import { actionsComponents } from "@/content/actions";
import { formsComponents } from "@/content/forms";
import { navigationComponents } from "@/content/navigation";
import { feedbackComponents } from "@/content/feedback";
import { containersComponents } from "@/content/containers";
import { contentDataComponents } from "@/content/content-data";
import { ComponentDoc, categories } from "@/lib/types";

export const allComponents: ComponentDoc[] = [
  ...actionsComponents,
  ...formsComponents,
  ...navigationComponents,
  ...feedbackComponents,
  ...containersComponents,
  ...contentDataComponents,
];

export function getComponentBySlug(slug: string): ComponentDoc | undefined {
  return allComponents.find((c) => c.slug === slug);
}

export function getCategoryCounts(): { category: string; count: number }[] {
  return categories.map((category) => ({
    category,
    count: allComponents.filter((c) => c.category === category).length,
  }));
}

// A small representative set of resolved token colors, for the token-pill
// signature element — matches the real values from the Figma file's
// Primitive/Semantic collections (Light mode).
export const tokenColorMap: Record<string, string> = {
  "semantic/action/primary": "#6C4CF2",
  "semantic/action/danger": "#D92D3E",
  "semantic/text/primary": "#17181B",
  "semantic/text/secondary": "#5B5F68",
  "semantic/text/inverse": "#FFFFFF",
  "semantic/text/disabled": "#A0A3AC",
  "semantic/text/danger": "#CC3B37",
  "semantic/surface/default": "#FFFFFF",
  "semantic/surface/elevated": "#F7F7F8",
  "semantic/border/default": "#DFE0E4",
  "semantic/border/strong": "#A0A3AC",
  "semantic/focus-ring": "#6C4CF2",
  "semantic/icon/muted": "#A0A3AC",
  "semantic/feedback/success": "#1A8B4C",
  "semantic/feedback/warning": "#B36A00",
  "semantic/feedback/info": "#2563C7",
  "color/brand/100": "#E4DEFD",
  "color/brand/600": "#5738C7",
  "color/brand/700": "#42299C",
  "color/neutral/300": "#C5C6CC",
  "color/neutral/900": "#17181B",
  "radius/full": "",
  "radius/xs": "",
  "component/radius/control": "",
  "component/radius/container": "",
  "shadow-blur/3": "",
  "shadow-blur/4": "",
  "shadow-blur/5": "",
  "shadow-color/3": "",
  "shadow-color/4": "",
  "shadow-color/5": "",
  "opacity/disabled": "",
};
